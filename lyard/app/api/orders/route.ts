// /api/orders - regular (bag) checkout orders, stored in Firestore "orders".
//   POST  { ...PlacedOrder }   saves an order (called by app/checkout/checkout.tsx)
//   GET                        the signed-in user's orders; admins get every order
import { NextRequest, NextResponse } from "next/server";
import { adminDb, COLLECTIONS } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/server/session";
import { OrderError, requireBuyer } from "@/lib/server/orders";
import type { PlacedOrder } from "@/lib/check-out/checkoutStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: NextRequest) {
  const user = await requireBuyer(req).catch((err: OrderError) => err);
  if (user instanceof OrderError) return fail(user.message, user.status);
  const order = (await req.json().catch(() => null)) as PlacedOrder | null;
  if (!order || typeof order.orderNumber !== "string" || !/^LYD-[A-Z0-9]+$/.test(order.orderNumber)) {
    return fail("Invalid order.");
  }
  if (!Array.isArray(order.lines) || order.lines.length === 0) return fail("The order has no items.");
  if (!/^\S+@\S+\.\S+$/.test(order.customer?.email ?? "")) return fail("Enter a valid email.");

  // Online payments go through /api/payments/*, which re-price on the server.
  const ref = adminDb.collection(COLLECTIONS.orders).doc(order.orderNumber);

  try {
    await adminDb.runTransaction(async (tx) => {
      if ((await tx.get(ref)).exists) throw new Error("duplicate");
      tx.set(ref, {
        ...order,
        status: "placed",
        userId: user?.id ?? null,
        savedAt: new Date().toISOString(),
      });
    });
    return NextResponse.json({ orderNumber: order.orderNumber }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "duplicate") return fail("That order was already saved.", 409);
    console.error("orders POST failed:", err);
    return fail("Couldn't save the order to Firebase. Please try again.", 500);
  }
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return fail("Not signed in", 401);

  const col = adminDb.collection(COLLECTIONS.orders);
  const query = user.role === "admin" ? col : col.where("userId", "==", user.id);
  const snap = await query.get();
  const orders = snap.docs
    .map((d) => d.data())
    .sort((a, b) => String(b.placedAt).localeCompare(String(a.placedAt)));
  return NextResponse.json({ orders });
}
