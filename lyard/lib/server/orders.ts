// Server-side order helpers shared by /api/orders and the payment routes:
// checking what the browser sent, re-pricing it from Firestore, and saving it once.
import type { NextRequest } from "next/server";
import { adminDb, COLLECTIONS } from "@/lib/firebase/admin";
import { getSessionUser, type SessionUser } from "@/lib/server/session";
import { calculateTotals, findPromo, type Totals } from "@/lib/check-out/CheckoutPricing";
import { getSizes } from "@/lib/catelog/dataSize";
import type { OrderLine, PlacedOrder } from "@/lib/check-out/checkoutStore";

export const ORDER_NUMBER = /^LYD-[A-Z0-9]+$/;

/** Highest delivery fee we accept from the browser (the DoorDash quote is still a dummy). */
const MAX_SHIPPING = 50;

export class OrderError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message);
  }
}

/** Guests can browse but not buy: every order needs a signed-in account. */
export async function requireBuyer(req: NextRequest): Promise<SessionUser> {
  const user = await getSessionUser(req);
  if (!user || user.role === "guest") throw new OrderError("Log in or create an account to place an order.", 401);
  return user;
}

/** Throws OrderError when the order is missing something we need. */
export function checkOrder(order: PlacedOrder | null): asserts order is PlacedOrder {
  if (!order || typeof order.orderNumber !== "string" || !ORDER_NUMBER.test(order.orderNumber)) {
    throw new OrderError("Invalid order.");
  }
  if (!Array.isArray(order.lines) || order.lines.length === 0) throw new OrderError("The order has no items.");
  if (!/^\S+@\S+\.\S+$/.test(order.customer?.email ?? "")) throw new OrderError("Enter a valid email.");
}

/**
 * Re-prices every line from Firestore (size prices from the catalog), re-checks
 * the promo code and recalculates the totals, so the browser can't change what
 * is charged. Returns the order with server prices.
 */
export async function priceOrder(order: PlacedOrder): Promise<PlacedOrder> {
  const ids = [...new Set(order.lines.map((l) => Number(l.productId)))];
  if (ids.some((id) => !Number.isInteger(id))) throw new OrderError("The order has an unknown product.");

  const snaps = await adminDb.getAll(...ids.map((id) => adminDb.collection(COLLECTIONS.products).doc(String(id))));
  const basePrice = new Map<number, number>();
  for (const snap of snaps) {
    const price = snap.data()?.price;
    if (typeof price === "number") basePrice.set(Number(snap.id), price);
  }

  const lines: OrderLine[] = order.lines.map((line) => {
    const id = Number(line.productId);
    const base = basePrice.get(id);
    if (base === undefined) throw new OrderError(`"${line.name}" is no longer available.`);
    const quantity = Math.floor(Number(line.quantity));
    if (!(quantity >= 1 && quantity <= 500)) throw new OrderError(`Check the quantity of "${line.name}".`);
    const sized = line.size ? getSizes(id)?.find((s) => s.label === line.size)?.price : undefined;
    return { ...line, quantity, unitPrice: sized ?? base, originalUnitPrice: undefined };
  });

  const delivering = order.delivery?.method === "ship";
  const requested = Number(order.totals?.shipping ?? 0);
  const shipping = delivering ? Math.min(Math.max(requested || 0, 0), MAX_SHIPPING) : 0;
  const promo = order.promoCode ? findPromo(order.promoCode) : null;
  if (order.promoCode && !promo) throw new OrderError("That promo code isn't valid.");

  const totals: Totals = calculateTotals(lines, shipping, promo);
  // Never charge an amount the customer didn't see at checkout.
  if (toCents(totals.total) !== toCents(Number(order.totals?.total))) {
    throw new OrderError(
      `Prices have changed since you opened checkout. Your total is now $${totals.total.toFixed(2)}. Please refresh the page and try again.`,
      409
    );
  }
  return { ...order, lines, promoCode: promo?.code ?? null, totals };
}

/** Amount in cents, as payment providers want it. */
export const toCents = (dollars: number) => Math.round(dollars * 100);

/**
 * Saves the order to Firestore "orders" exactly once (409 if the number is taken).
 * `extra` adds fields such as status, userId and payment.
 */
export async function saveOrder(order: PlacedOrder, extra: Record<string, unknown>) {
  const ref = adminDb.collection(COLLECTIONS.orders).doc(order.orderNumber);
  try {
    await adminDb.runTransaction(async (tx) => {
      if ((await tx.get(ref)).exists) throw new OrderError("That order was already saved.", 409);
      tx.set(ref, { ...order, status: "placed", ...extra, savedAt: new Date().toISOString() });
    });
  } catch (err) {
    if (err instanceof OrderError) throw err;
    console.error("saving order failed:", err);
    throw new OrderError("Couldn't save the order to Firebase. Please try again.", 500);
  }
}
