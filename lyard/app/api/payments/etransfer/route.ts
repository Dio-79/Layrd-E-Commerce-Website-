// POST /api/payments/etransfer  { order }
// Interac e-Transfer: no payment provider, so the order is saved as
// "awaiting_etransfer" and an admin confirms it once the money arrives
// (POST /api/payments/etransfer/confirm).
import { NextResponse, type NextRequest } from "next/server";
import { checkOrder, OrderError, priceOrder, requireBuyer, saveOrder } from "@/lib/server/orders";
import { CURRENCY, enabled, etransferEmail } from "@/lib/payments/config";
import type { PaymentInfo, PlacedOrder } from "@/lib/check-out/checkoutStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: NextRequest) {
  const user = await requireBuyer(req).catch((err: OrderError) => err);
  if (user instanceof OrderError) return fail(user.message, user.status);
  if (!enabled.etransfer) return fail("e-Transfer is not set up.", 503);
  const body = (await req.json().catch(() => null)) as { order?: PlacedOrder } | null;

  try {
    checkOrder(body?.order ?? null);
    const order = await priceOrder(body!.order!);
    const payment: PaymentInfo = {
      method: "etransfer",
      provider: "etransfer",
      status: "awaiting_etransfer",
      amount: order.totals.total,
      currency: CURRENCY,
      etransferEmail,
    };
    await saveOrder(order, { status: "awaiting_payment", userId: user?.id ?? null, payment });
    return NextResponse.json({ order: { ...order, payment } }, { status: 201 });
  } catch (err) {
    return err instanceof OrderError ? fail(err.message, err.status) : fail("Couldn't place the order.", 500);
  }
}
