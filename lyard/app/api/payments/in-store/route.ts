// POST /api/payments/in-store  { order }
// "Pay at pickup": no online payment. The order is saved to Firestore (re-priced on
// the server) as waiting for payment, and staff mark it paid when it's picked up.
import { NextResponse, type NextRequest } from "next/server";
import { checkOrder, OrderError, priceOrder, requireBuyer, saveOrder } from "@/lib/server/orders";
import { CURRENCY } from "@/lib/payments/config";
import type { PaymentInfo, PlacedOrder } from "@/lib/check-out/checkoutStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: NextRequest) {
  const user = await requireBuyer(req).catch((err: OrderError) => err);
  if (user instanceof OrderError) return fail(user.message, user.status);
  const body = (await req.json().catch(() => null)) as { order?: PlacedOrder } | null;

  try {
    checkOrder(body?.order ?? null);
    if (body!.order!.delivery?.method !== "pickup") throw new OrderError("Pay at pickup is only for pickup orders.");
    const order = await priceOrder(body!.order!);
    const payment: PaymentInfo = {
      method: "in_store",
      provider: "in_store",
      status: "pay_at_pickup",
      amount: order.totals.total,
      currency: CURRENCY,
    };
    await saveOrder(order, { status: "awaiting_payment", userId: user.id, payment });
    return NextResponse.json({ order: { ...order, payment } }, { status: 201 });
  } catch (err) {
    return err instanceof OrderError ? fail(err.message, err.status) : fail("Couldn't place the order.", 500);
  }
}
