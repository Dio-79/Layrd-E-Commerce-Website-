// Payments: Square (card / Apple Pay / Google Pay), PayPal and e-Transfer routes.
// Square and PayPal themselves are replaced with test doubles; Firestore is the emulator.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminDb } from "@/lib/firebase/admin";
import { request, resetEmulators, sampleOrder, signedInUser } from "./helpers";

const square = vi.hoisted(() => ({
  createPayment: vi.fn(),
  completePayment: vi.fn(),
  cancelPayment: vi.fn(),
}));
vi.mock("@/lib/payments/square", async (original) => ({
  ...(await original<typeof import("@/lib/payments/square")>()),
  ...square,
}));

const paypal = vi.hoisted(() => ({ createPayPalOrder: vi.fn(), capturePayPalOrder: vi.fn() }));
vi.mock("@/lib/payments/paypal", () => paypal);

const { POST: paySquare } = await import("@/app/api/payments/square/route");
const { POST: payPayPal } = await import("@/app/api/payments/paypal/route");
const { POST: payETransfer } = await import("@/app/api/payments/etransfer/route");
const { POST: confirmETransfer } = await import("@/app/api/payments/etransfer/confirm/route");
const { PaymentDeclined } = await import("@/lib/payments/square");

// Strawberry Matcha really costs $9; the browser claims $7 (sampleOrder).
// 2 x $9 = $18.00 + 5% GST = $18.90
const SERVER_TOTAL_CENTS = 1890;

beforeEach(async () => {
  await resetEmulators();
  vi.clearAllMocks();
  await adminDb.collection("products").doc("1").set({ productID: 1, name: "Strawberry Matcha", price: 9 });
  square.createPayment.mockResolvedValue({ id: "sq-pay-1", status: "APPROVED", amount_money: { amount: SERVER_TOTAL_CENTS, currency: "CAD" } });
  square.completePayment.mockResolvedValue({
    id: "sq-pay-1",
    status: "COMPLETED",
    receipt_url: "https://squareup.com/receipt/preview/sq-pay-1",
    card_details: { card: { card_brand: "VISA", last_4: "1111" } },
  });
  square.cancelPayment.mockResolvedValue(undefined);
});

const post = (handler: (req: ReturnType<typeof request>) => Promise<Response>, path: string, body: unknown, cookie?: string) =>
  handler(request(path, { method: "POST", body, cookie }));
const savedOrder = async (n: string) => (await adminDb.collection("orders").doc(n).get()).data();

describe("Square (card, Apple Pay, Google Pay)", () => {
  it("charges the server price, saves the order, then completes the payment", async () => {
    const res = await post(paySquare, "/api/payments/square", { order: sampleOrder("LYD-SQ1"), sourceId: "cnon:card-nonce-ok", method: "card" });
    expect(res.status).toBe(201);

    expect(square.createPayment).toHaveBeenCalledWith(
      expect.objectContaining({ sourceId: "cnon:card-nonce-ok", amountCents: SERVER_TOTAL_CENTS, orderNumber: "LYD-SQ1" })
    );
    expect(square.completePayment).toHaveBeenCalledWith("sq-pay-1");

    const saved = await savedOrder("LYD-SQ1");
    expect(saved).toMatchObject({
      status: "confirmed",
      totals: { total: 18.9 },
      payment: { provider: "square", method: "card", status: "paid", paymentId: "sq-pay-1", label: "VISA •••• 1111" },
    });
    expect(saved?.lines[0].unitPrice).toBe(9);
  });

  it("records Apple Pay / Google Pay as the method", async () => {
    await post(paySquare, "/api/payments/square", { order: sampleOrder("LYD-SQ2"), sourceId: "wallet-token", method: "google" });
    expect((await savedOrder("LYD-SQ2"))?.payment.method).toBe("google");
  });

  it("shows 'Payment declined' and saves nothing when the card is declined", async () => {
    square.createPayment.mockRejectedValue(new PaymentDeclined("Payment declined. Try another card or payment method.", "GENERIC_DECLINE"));
    const res = await post(paySquare, "/api/payments/square", { order: sampleOrder("LYD-SQ3"), sourceId: "bad" });
    expect(res.status).toBe(402);
    expect((await res.json()).error).toMatch(/Payment declined/);
    expect(await savedOrder("LYD-SQ3")).toBeUndefined();
    expect(square.completePayment).not.toHaveBeenCalled();
  });

  it("cancels the payment if the order can't be saved", async () => {
    // Another request saves the same order number while this payment is being authorized.
    square.createPayment.mockImplementation(async () => {
      await adminDb.collection("orders").doc("LYD-SQ4").set({ orderNumber: "LYD-SQ4" });
      return { id: "sq-pay-4", status: "APPROVED" };
    });
    const res = await post(paySquare, "/api/payments/square", { order: sampleOrder("LYD-SQ4"), sourceId: "tok" });
    expect(res.status).toBe(409);
    expect(square.cancelPayment).toHaveBeenCalledWith("sq-pay-4");
    expect(square.completePayment).not.toHaveBeenCalled();
  });

  it("rejects unknown products, bad promo codes and orders already paid", async () => {
    const unknown = { ...sampleOrder("LYD-SQ5"), lines: [{ ...sampleOrder("x").lines[0], productId: 999 }] };
    expect((await post(paySquare, "/api/payments/square", { order: unknown, sourceId: "tok" })).status).toBe(400);
    expect((await post(paySquare, "/api/payments/square", { order: { ...sampleOrder("LYD-SQ6"), promoCode: "FREE100" }, sourceId: "tok" })).status).toBe(400);

    await post(paySquare, "/api/payments/square", { order: sampleOrder("LYD-SQ7"), sourceId: "tok" });
    expect((await post(paySquare, "/api/payments/square", { order: sampleOrder("LYD-SQ7"), sourceId: "tok" })).status).toBe(409);
    expect(square.createPayment).toHaveBeenCalledTimes(1);
  });

  it("applies valid promo codes on the server", async () => {
    await post(paySquare, "/api/payments/square", { order: { ...sampleOrder("LYD-SQ8"), promoCode: "layrd10" }, sourceId: "tok" });
    // $18 - 10% = $16.20 + 5% GST = $17.01
    expect(square.createPayment).toHaveBeenCalledWith(expect.objectContaining({ amountCents: 1701 }));
  });

  it("links the order to the signed-in customer", async () => {
    const alice = await signedInUser("alice@layrd.test");
    await post(paySquare, "/api/payments/square", { order: sampleOrder("LYD-SQ9"), sourceId: "tok" }, alice.cookie);
    expect((await savedOrder("LYD-SQ9"))?.userId).toBe(alice.uid);
  });
});

describe("PayPal", () => {
  it("creates the PayPal order for the server total", async () => {
    paypal.createPayPalOrder.mockResolvedValue("PP-ORDER-1");
    const res = await post(payPayPal, "/api/payments/paypal", { action: "create", order: sampleOrder("LYD-PP1") });
    expect(await res.json()).toEqual({ paypalOrderId: "PP-ORDER-1" });
    expect(paypal.createPayPalOrder).toHaveBeenCalledWith({ amountCents: SERVER_TOTAL_CENTS, orderNumber: "LYD-PP1" });
  });

  it("saves the order after capture", async () => {
    paypal.capturePayPalOrder.mockResolvedValue({ captureId: "CAP-1", amountCents: SERVER_TOTAL_CENTS, currency: "CAD", orderNumber: "LYD-PP2" });
    const res = await post(payPayPal, "/api/payments/paypal", { action: "capture", order: sampleOrder("LYD-PP2"), paypalOrderId: "PP-ORDER-2" });
    expect(res.status).toBe(201);
    expect(await savedOrder("LYD-PP2")).toMatchObject({ status: "confirmed", payment: { provider: "paypal", status: "paid", paymentId: "CAP-1" } });
  });

  it("refuses a capture that doesn't match the order", async () => {
    paypal.capturePayPalOrder.mockResolvedValue({ captureId: "CAP-3", amountCents: 100, currency: "CAD", orderNumber: "LYD-PP3" });
    const res = await post(payPayPal, "/api/payments/paypal", { action: "capture", order: sampleOrder("LYD-PP3"), paypalOrderId: "PP-ORDER-3" });
    expect(res.status).toBe(409);
    expect(await savedOrder("LYD-PP3")).toBeUndefined();
  });
});

describe("Interac e-Transfer", () => {
  it("saves the order as waiting for an e-Transfer, and only admins can mark it paid", async () => {
    const res = await post(payETransfer, "/api/payments/etransfer", { order: sampleOrder("LYD-ET1") });
    expect(res.status).toBe(201);
    expect(await savedOrder("LYD-ET1")).toMatchObject({
      status: "awaiting_payment",
      payment: { method: "etransfer", status: "awaiting_etransfer", amount: 18.9, etransferEmail: "pay@layrd.test" },
    });

    expect((await post(confirmETransfer, "/api/payments/etransfer/confirm", { orderNumber: "LYD-ET1" })).status).toBe(401);
    const customer = await signedInUser("bob@layrd.test");
    expect((await post(confirmETransfer, "/api/payments/etransfer/confirm", { orderNumber: "LYD-ET1" }, customer.cookie)).status).toBe(403);

    const admin = await signedInUser("admin@layrd.test");
    await adminDb.collection("users").doc(admin.uid).update({ role: "admin" });
    expect((await post(confirmETransfer, "/api/payments/etransfer/confirm", { orderNumber: "LYD-ET1" }, admin.cookie)).status).toBe(200);
    expect(await savedOrder("LYD-ET1")).toMatchObject({ status: "confirmed", payment: { status: "paid", confirmedBy: "admin@layrd.test" } });

    expect((await post(confirmETransfer, "/api/payments/etransfer/confirm", { orderNumber: "LYD-ET1" }, admin.cookie)).status).toBe(409);
  });
});
