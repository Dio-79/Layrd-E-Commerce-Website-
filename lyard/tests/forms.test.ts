// Newsletter, contact, refund requests and pay-at-pickup orders: all saved to Firestore.
import { beforeEach, describe, expect, it } from "vitest";
import { adminDb } from "@/lib/firebase/admin";
import { POST as subscribe } from "@/app/api/newsletter/route";
import { POST as contact } from "@/app/api/contact/route";
import { GET as myRefunds, POST as askRefund } from "@/app/api/refunds/route";
import { POST as payInStore } from "@/app/api/payments/in-store/route";
import { POST as markPaid } from "@/app/api/payments/etransfer/confirm/route";
import { request, resetEmulators, sampleOrder, signedInUser } from "./helpers";

beforeEach(async () => {
  await resetEmulators();
  await adminDb.collection("products").doc("1").set({ productID: 1, name: "Strawberry Matcha", price: 9 });
});

const post = (handler: (req: ReturnType<typeof request>) => Promise<Response>, path: string, body: unknown, cookie?: string) =>
  handler(request(path, { method: "POST", body, cookie }));

/** A pickup order at the real price ($9 x 2 + 5% GST = $18.90). */
const pickupOrder = (n: string) => {
  const base = sampleOrder(n);
  return {
    ...base,
    lines: base.lines.map((l) => ({ ...l, unitPrice: 9 })),
    totals: { itemCount: 2, originalSubtotal: 18, subtotal: 18, discount: 0, shipping: 0, tax: 0.9, total: 18.9 },
  };
};

describe("newsletter", () => {
  it("saves the address once and rejects bad ones", async () => {
    const first = await post(subscribe, "/api/newsletter", { email: " Fan@Layrd.Test " });
    expect(await first.json()).toEqual({ ok: true, already: false });
    const again = await post(subscribe, "/api/newsletter", { email: "fan@layrd.test" });
    expect(await again.json()).toEqual({ ok: true, already: true });
    expect((await adminDb.collection("newsletter").doc("fan@layrd.test").get()).data()?.email).toBe("fan@layrd.test");
    expect((await post(subscribe, "/api/newsletter", { email: "not-an-email" })).status).toBe(400);
  });
});

describe("contact us", () => {
  it("saves the message for staff, linked to the account when signed in", async () => {
    const alice = await signedInUser("alice@layrd.test");
    const res = await post(contact, "/api/contact", { name: "Alice", email: "alice@layrd.test", subject: "My order", message: "Can I change my pickup time?" }, alice.cookie);
    expect(res.status).toBe(201);
    const saved = (await adminDb.collection("contactMessages").doc((await res.json()).id).get()).data();
    expect(saved).toMatchObject({ name: "Alice", subject: "My order", status: "new", userId: alice.uid });
  });

  it("checks the fields", async () => {
    expect((await post(contact, "/api/contact", { name: "", email: "a@b.co", message: "Long enough message" })).status).toBe(400);
    expect((await post(contact, "/api/contact", { name: "A", email: "nope", message: "Long enough message" })).status).toBe(400);
    expect((await post(contact, "/api/contact", { name: "A", email: "a@b.co", message: "short" })).status).toBe(400);
  });
});

describe("pay at pickup", () => {
  it("saves a pickup order to Firestore at the server price, waiting for payment", async () => {
    const alice = await signedInUser("alice@layrd.test");
    const res = await post(payInStore, "/api/payments/in-store", { order: pickupOrder("LYD-PICK1") }, alice.cookie);
    expect(res.status).toBe(201);
    expect((await adminDb.collection("orders").doc("LYD-PICK1").get()).data()).toMatchObject({
      status: "awaiting_payment",
      userId: alice.uid,
      totals: { total: 18.9 },
      payment: { method: "in_store", status: "pay_at_pickup" },
    });
  });

  it("is only for pickup, and only for signed-in customers", async () => {
    const alice = await signedInUser("alice@layrd.test");
    const ship = { ...pickupOrder("LYD-SHIP1"), delivery: { method: "ship" } };
    expect((await post(payInStore, "/api/payments/in-store", { order: ship }, alice.cookie)).status).toBe(400);
    expect((await post(payInStore, "/api/payments/in-store", { order: pickupOrder("LYD-GST1") })).status).toBe(401);
  });

  it("staff can mark it paid when it's picked up", async () => {
    const alice = await signedInUser("alice@layrd.test");
    await post(payInStore, "/api/payments/in-store", { order: pickupOrder("LYD-PICK2") }, alice.cookie);
    const admin = await signedInUser("admin@layrd.test");
    await adminDb.collection("users").doc(admin.uid).update({ role: "admin" });
    expect((await post(markPaid, "/api/payments/etransfer/confirm", { orderNumber: "LYD-PICK2" }, admin.cookie)).status).toBe(200);
    expect((await adminDb.collection("orders").doc("LYD-PICK2").get()).data()).toMatchObject({ status: "confirmed", payment: { status: "paid" } });
  });
});

describe("refund requests (Use Case 8)", () => {
  it("lets a customer ask once for a refund on their own recent order", async () => {
    const alice = await signedInUser("alice@layrd.test");
    await post(payInStore, "/api/payments/in-store", { order: pickupOrder("LYD-R1") }, alice.cookie);

    const res = await post(askRefund, "/api/refunds", { orderNumber: "LYD-R1", reason: "The cake arrived damaged." }, alice.cookie);
    expect(res.status).toBe(201);
    expect((await adminDb.collection("refundRequests").doc("LYD-R1").get()).data()).toMatchObject({
      status: "pending",
      userId: alice.uid,
      amount: 18.9,
    });
    const list = await (await myRefunds(request("/api/refunds", { cookie: alice.cookie }))).json();
    expect(list.requests.map((r: { orderNumber: string }) => r.orderNumber)).toEqual(["LYD-R1"]);

    const again = await post(askRefund, "/api/refunds", { orderNumber: "LYD-R1", reason: "Asking a second time." }, alice.cookie);
    expect(again.status).toBe(409);
  });

  it("refuses other people's orders, old orders and guests", async () => {
    const alice = await signedInUser("alice@layrd.test");
    const bob = await signedInUser("bob@layrd.test");
    await post(payInStore, "/api/payments/in-store", { order: pickupOrder("LYD-R2") }, alice.cookie);
    expect((await post(askRefund, "/api/refunds", { orderNumber: "LYD-R2", reason: "Not my order but trying." }, bob.cookie)).status).toBe(404);

    await adminDb.collection("orders").doc("LYD-R2").update({ placedAt: new Date(Date.now() - 30 * 864e5).toISOString() });
    const late = await post(askRefund, "/api/refunds", { orderNumber: "LYD-R2", reason: "A month later, sorry." }, alice.cookie);
    expect(late.status).toBe(409);
    expect((await late.json()).error).toMatch(/not eligible/);

    expect((await post(askRefund, "/api/refunds", { orderNumber: "LYD-R2", reason: "Guest trying here." })).status).toBe(401);
  });
});
