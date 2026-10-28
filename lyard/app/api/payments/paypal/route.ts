// POST /api/payments/paypal
//   { action: "create", order }                  -> { paypalOrderId }  (buyer then approves in PayPal)
//   { action: "capture", order, paypalOrderId }  -> { order }          (money taken, order saved)
import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/server/session";
import { checkOrder, OrderError, priceOrder, saveOrder, toCents } from "@/lib/server/orders";
import { adminDb, COLLECTIONS } from "@/lib/firebase/admin";
import { capturePayPalOrder, createPayPalOrder } from "@/lib/payments/paypal";
import { CURRENCY } from "@/lib/payments/config";
import type { PaymentInfo, PlacedOrder } from "@/lib/check-out/checkoutStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    action?: "create" | "capture";
    order?: PlacedOrder;
    paypalOrderId?: string;
  } | null;

  let order: PlacedOrder;
  try {
    checkOrder(body?.order ?? null);
    order = await priceOrder(body!.order!);
  } catch (err) {
    return err instanceof OrderError ? fail(err.message, err.status) : fail("Invalid order.");
  }
  const amountCents = toCents(order.totals.total);

  if (body?.action === "create") {
    if ((await adminDb.collection(COLLECTIONS.orders).doc(order.orderNumber).get()).exists) {
      return fail("That order was already saved.", 409);
    }
    try {
      return NextResponse.json({ paypalOrderId: await createPayPalOrder({ amountCents, orderNumber: order.orderNumber }) });
    } catch (err) {
      console.error("paypal create failed:", err);
      return fail("Couldn't start PayPal — please try again.", 502);
    }
  }

  if (body?.action !== "capture" || typeof body.paypalOrderId !== "string") return fail("Unknown PayPal action.");

  let capture;
  try {
    capture = await capturePayPalOrder(body.paypalOrderId);
  } catch (err) {
    console.error("paypal capture failed:", err);
    return fail("Payment failed — please try again.", 402);
  }

  // The captured payment must be for this order and this amount.
  if (capture.orderNumber !== order.orderNumber || capture.amountCents !== amountCents || capture.currency !== CURRENCY) {
    console.error("paypal capture does not match the order:", capture, order.orderNumber, amountCents);
    return fail("The PayPal payment doesn't match this order. Please contact us.", 409);
  }

  const user = await getSessionUser(req);
  const payment: PaymentInfo = {
    method: "paypal",
    provider: "paypal",
    status: "paid",
    amount: order.totals.total,
    currency: CURRENCY,
    paymentId: capture.captureId,
    label: capture.payerEmail ? `PayPal (${capture.payerEmail})` : "PayPal",
  };

  try {
    await saveOrder(order, { status: "confirmed", userId: user?.id ?? null, payment });
  } catch (err) {
    // The money is already captured, so keep a record for staff to refund or fix.
    console.error("paypal order not saved after capture:", order.orderNumber, capture.captureId, err);
    return err instanceof OrderError && err.status === 409
      ? fail("That order was already saved.", 409)
      : fail("Your PayPal payment went through but we couldn't save the order. Please contact us.", 500);
  }

  return NextResponse.json({ order: { ...order, payment } }, { status: 201 });
}
