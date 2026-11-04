// POST /api/wholesale/orders - a wholesale partner places a bulk order (FR-17).
//   { lines: [{ productId, quantity }], recurringWeeks: 0|1|2|4, method: "pickup"|"ship", address?, notes? }
// Prices come from Firestore, the tier discount from lib/wholesale/tiers.ts, so
// the browser can't change what's charged. Saved in "orders" with type
// "wholesale"; paid by invoice. Shows up on /admin/orders and /orders.
import { NextResponse, type NextRequest } from "next/server";
import { adminDb, COLLECTIONS } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/server/session";
import { fail, readJson, text } from "@/lib/server/forms";
import { takeStock } from "@/lib/server/stock";
import { MIN_WHOLESALE_UNITS, RECURRING_OPTIONS, wholesaleTotals } from "@/lib/wholesale/tiers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return fail("Log in with your wholesale account.", 401);
  if (user.role !== "wholesale" && user.role !== "admin") return fail("Only wholesale accounts can place bulk orders.", 403);

  const body = await readJson(req);
  const raw = Array.isArray(body?.lines) ? (body.lines as { productId?: unknown; quantity?: unknown }[]) : [];
  const wanted = new Map<number, number>();
  for (const l of raw) {
    const id = Number(l.productId);
    const qty = Math.floor(Number(l.quantity));
    if (!Number.isInteger(id) || !Number.isFinite(qty) || qty <= 0) continue;
    if (qty > 2000) return fail("Up to 2,000 units per product.");
    wanted.set(id, (wanted.get(id) ?? 0) + qty);
  }
  if (wanted.size === 0) return fail("Add at least one product.");

  const snaps = await adminDb.getAll(...[...wanted.keys()].map((id) => adminDb.collection(COLLECTIONS.products).doc(String(id))));
  const lines = [];
  for (const snap of snaps) {
    const p = snap.data();
    if (!snap.exists || typeof p?.price !== "number" || p.hidden === true) return fail("One of the products isn't available any more. Refresh and try again.", 409);
    lines.push({ productId: Number(snap.id), name: String(p.name), quantity: wanted.get(Number(snap.id)) ?? 0, unitPrice: p.price });
  }

  const totals = wholesaleTotals(lines);
  if (totals.units < MIN_WHOLESALE_UNITS) return fail(`Wholesale orders start at ${MIN_WHOLESALE_UNITS} units.`);

  const recurringWeeks = Number(body?.recurringWeeks ?? 0);
  if (!RECURRING_OPTIONS.some((o) => o.weeks === recurringWeeks)) return fail("Choose how often to repeat the order.");
  const method = body?.method === "ship" ? "ship" : "pickup";
  const address = text(body?.address, 300);
  if (method === "ship" && address.length < 8) return fail("Enter the delivery address.");

  const now = new Date();
  const orderNumber = `LYD-W${now.getTime().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
  const next = recurringWeeks ? new Date(now.getTime() + recurringWeeks * 7 * 864e5).toISOString().slice(0, 10) : null;

  const order = {
    orderNumber,
    type: "wholesale",
    userId: user.id,
    customer: { email: user.email, fullName: user.name },
    lines,
    totals: { itemCount: totals.units, originalSubtotal: totals.subtotal, subtotal: totals.subtotal, discount: totals.discount, shipping: 0, tax: totals.tax, total: totals.total },
    discountRate: totals.discountRate,
    delivery: { method, address: method === "ship" ? address : "" },
    notes: text(body?.notes, 1000),
    recurring: recurringWeeks ? { everyWeeks: recurringWeeks, nextDate: next, active: true } : null,
    payment: { method: "invoice", status: "unpaid" },
    status: "placed",
    placedAt: now.toISOString(),
    savedAt: now.toISOString(),
    statusHistory: [{ status: "placed", at: now.toISOString() }],
  };

  try {
    await adminDb.collection(COLLECTIONS.orders).doc(orderNumber).create(order);
    await takeStock(lines);
    return NextResponse.json({ orderNumber, totals: order.totals }, { status: 201 });
  } catch (err) {
    console.error("wholesale order failed:", err);
    return fail("Couldn't save the order. Please try again.", 500);
  }
}
