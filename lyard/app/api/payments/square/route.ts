// POST /api/payments/square  { order, sourceId, verificationToken?, method }
// Card, Apple Pay and Google Pay (the browser turns them into a Square token).
//   1. re-price the order on the server
//   2. authorize the payment (autocomplete: false)
//   3. save the order to Firestore
//   4. complete the payment; if saving failed, cancel it so nobody pays for a missing order
import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/server/session";
import { checkOrder, OrderError, priceOrder, saveOrder, toCents } from "@/lib/server/orders";
import { adminDb, COLLECTIONS } from "@/lib/firebase/admin";
import { cancelPayment, completePayment, createPayment, PaymentDeclined } from "@/lib/payments/square";
import { CURRENCY } from "@/lib/payments/config";
import type { PaymentInfo, PaymentMethod, PlacedOrder } from "@/lib/check-out/checkoutStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });
const SQUARE_METHODS: PaymentMethod[] = ["card", "apple", "google"];

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    order?: PlacedOrder;
    sourceId?: string;
    verificationToken?: string;
    method?: PaymentMethod;
  } | null;
  if (typeof body?.sourceId !== "string" || !body.sourceId) return fail("Missing payment details.");
  const method = SQUARE_METHODS.includes(body.method as PaymentMethod) ? (body.method as PaymentMethod) : "card";

  let order: PlacedOrder;
  try {
    checkOrder(body.order ?? null);
    order = await priceOrder(body.order!);
  } catch (err) {
    return err instanceof OrderError ? fail(err.message, err.status) : fail("Invalid order.");
  }

  const existing = await adminDb.collection(COLLECTIONS.orders).doc(order.orderNumber).get();
  if (existing.exists) return fail("That order was already saved.", 409);

  let paymentId: string;
  try {
    const authorized = await createPayment({
      sourceId: body.sourceId,
      verificationToken: body.verificationToken,
      amountCents: toCents(order.totals.total),
      orderNumber: order.orderNumber,
      email: order.customer.email,
    });
    paymentId = authorized.id;
  } catch (err) {
    if (err instanceof PaymentDeclined) return fail(err.message, 402);
    console.error("square create payment failed:", err);
    return fail("Payment failed — please try again.", 502);
  }

  const user = await getSessionUser(req);
  const payment: PaymentInfo = {
    method,
    provider: "square",
    status: "paid",
    amount: order.totals.total,
    currency: CURRENCY,
    paymentId,
  };

  try {
    await saveOrder(order, { status: "confirmed", userId: user?.id ?? null, payment });
  } catch (err) {
    await cancelPayment(paymentId).catch((e) => console.error("square cancel failed:", e));
    return err instanceof OrderError ? fail(err.message, err.status) : fail("Payment failed — please try again.", 500);
  }

  try {
    const completed = await completePayment(paymentId);
    const card = completed.card_details?.card;
    payment.receiptUrl = completed.receipt_url;
    payment.label =
      method === "card" && card?.card_brand ? `${card.card_brand} •••• ${card.last_4 ?? ""}`.trim() : undefined;
    await adminDb
      .collection(COLLECTIONS.orders)
      .doc(order.orderNumber)
      .update({ payment: JSON.parse(JSON.stringify(payment)) });
  } catch (err) {
    // The order is saved and the money is authorized; Square completes it later
    // (delay_action) or staff can complete it from the Square dashboard.
    console.error("square complete payment failed:", err);
    payment.status = "authorized";
    await adminDb
      .collection(COLLECTIONS.orders)
      .doc(order.orderNumber)
      .update({ "payment.status": "authorized" })
      .catch(() => undefined);
  }

  return NextResponse.json({ order: { ...order, payment } }, { status: 201 });
}
