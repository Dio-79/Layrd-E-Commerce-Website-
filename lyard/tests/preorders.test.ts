// Bundle and event preorders (/Bundle/checkout, /Eventorder/Checkout): saved to Firestore.
import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import * as bundleApi from "@/app/api/bundle-preorders/route";
import * as eventApi from "@/app/api/event-preorders/route";
import { PICKUP_TIMES as BUNDLE_TIMES, earliestBundleDate, MAX_UNITS_PER_DAY as BUNDLE_MAX } from "@/lib/Bundle/bundleRules";
import { PICKUP_TIMES as EVENT_TIMES, earliestEventDate } from "@/lib/event/eventRules";
import { request, resetEmulators, signedInUser } from "./helpers";

let cookie = "";
beforeEach(async () => {
  await resetEmulators();
  await adminDb.collection("products").doc("3").set({ productID: 3, name: "Oreo Cheesecake", price: 8 });
  await adminDb.collection("products").doc("15").set({ productID: 15, name: "Mango Lemonade", price: 6 });
  cookie = (await signedInUser("cara@layrd.test")).cookie;
});

const post = (handler: (r: NextRequest) => Promise<Response>, path: string, body: unknown, c = cookie) =>
  handler(request(path, { method: "POST", body, cookie: c }));
const get = (handler: (r: NextRequest) => Promise<Response>, path: string) => handler(request(path));
const customer = { name: "Cara Customer", email: "cara@layrd.test", phone: "4035550100" };

// 4-can Oreo ($30) + 2 Mango Lemonade ($6) = $42
const bundleLines = [
  { id: "0-3-4 cans", productId: 3, name: "Oreo Cheesecake", size: "4 cans", flavor: "", quantity: 1, unitPrice: 30, image: "" },
  { id: "1-15-150ml", productId: 15, name: "Mango Lemonade", size: "150ml", flavor: "", quantity: 2, unitPrice: 6, image: "" },
];
const bundleBody = (over: Record<string, unknown> = {}) => ({
  customer,
  fulfillment: "pickup",
  pickupDate: earliestBundleDate(3),
  pickupTime: BUNDLE_TIMES[0].value,
  lines: bundleLines,
  paymentMethod: "in_store",
  acceptedPolicy: true,
  ...over,
});

describe("bundle preorders", () => {
  it("guests can't order", async () => {
    expect((await post(bundleApi.POST, "/api/bundle-preorders", bundleBody(), "")).status).toBe(401);
  });

  it("saves a pay-at-pickup bundle to Firestore at catalog prices", async () => {
    const res = await post(bundleApi.POST, "/api/bundle-preorders", bundleBody());
    expect(res.status).toBe(201);
    const { record } = await res.json();
    expect(record.reference).toMatch(/^BN-/);
    const saved = (await adminDb.collection("bundlePreorders").doc(record.reference).get()).data();
    // $42 + 5% GST = $44.10
    expect(saved).toMatchObject({ status: "requested", subtotal: 42, total: 44.1, units: 3, payment: { method: "in_store", status: "pay_at_pickup" } });
    expect(saved?.userId).toBeTruthy();

    const found = await get(bundleApi.GET, `/api/bundle-preorders?reference=${record.reference}&email=CARA@layrd.test`);
    expect(found.status).toBe(200);
    expect((await get(bundleApi.GET, `/api/bundle-preorders?reference=${record.reference}&email=someone@else.test`)).status).toBe(404);
    const day = await (await get(bundleApi.GET, `/api/bundle-preorders?date=${record.pickupDate}`)).json();
    expect(day.booked).toBe(3);
  });

  it("refuses changed prices, pay-at-pickup for delivery, and full days", async () => {
    const cheap = bundleLines.map((l) => ({ ...l, unitPrice: 1 }));
    expect((await post(bundleApi.POST, "/api/bundle-preorders", bundleBody({ lines: cheap }))).status).toBe(409);

    const delivery = bundleBody({
      fulfillment: "delivery",
      delivery: { address: { street: "1 Main St", city: "Calgary", province: "AB", postal: "T2P 1J9" }, fee: 8, deliveryId: "dd-1" },
    });
    const res = await post(bundleApi.POST, "/api/bundle-preorders", delivery);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/only for pickup/);

    const date = earliestBundleDate(3);
    await adminDb.collection("bundlePreorders").doc("BN-FULL").set({ reference: "BN-FULL", pickupDate: date, units: BUNDLE_MAX, status: "requested", customer });
    const full = await post(bundleApi.POST, "/api/bundle-preorders", bundleBody({ pickupDate: date }));
    expect(full.status).toBe(409);
    expect((await full.json()).error).toMatch(/fully booked/);
  });
});

describe("event preorders", () => {
  const eventBody = (over: Record<string, unknown> = {}) => ({
    customer,
    pickupDate: earliestEventDate(40),
    pickupTime: EVENT_TIMES[0].value,
    details: { eventType: "Birthday party", headcount: "40", comment: "Gold ribbons" },
    // 40 x Mango Lemonade = $240
    lines: [{ id: "e1", productId: 15, name: "Mango Lemonade", image: null, size: "", flavor: "", quantity: 40, unitPrice: 6 }],
    paymentMethod: "etransfer",
    acceptedPolicy: true,
    ...over,
  });

  it("saves an e-Transfer event order with the 30% deposit due now", async () => {
    const res = await post(eventApi.POST, "/api/event-preorders", eventBody());
    expect(res.status).toBe(201);
    const { record } = await res.json();
    const saved = (await adminDb.collection("eventPreorders").doc(record.reference).get()).data();
    // $240 + 5% = $252; deposit 30% = $75.60
    expect(saved).toMatchObject({
      total: 252,
      deposit: 75.6,
      details: { eventType: "Birthday party" },
      payment: { method: "etransfer", status: "awaiting_etransfer", amountDueNow: 75.6, etransferEmail: "pay@layrd.test" },
    });
  });

  it("guests can't order, and dates need enough notice", async () => {
    expect((await post(eventApi.POST, "/api/event-preorders", eventBody(), "")).status).toBe(401);
    const tooSoon = await post(eventApi.POST, "/api/event-preorders", eventBody({ pickupDate: new Date().toISOString().slice(0, 10) }));
    expect(tooSoon.status).toBe(400);
    expect((await tooSoon.json()).error).toMatch(/notice/);
  });

  it("staff can change the status (admin account or admin key)", async () => {
    const { record } = await (await post(eventApi.POST, "/api/event-preorders", eventBody({ paymentMethod: "in_store" }))).json();
    const patch = (headers: Record<string, string>, c?: string) =>
      eventApi.PATCH(request("/api/event-preorders", { method: "PATCH", body: { reference: record.reference, status: "confirmed" }, cookie: c, headers }));

    expect((await patch({}, cookie)).status).toBe(403);
    expect((await patch({ "x-admin-key": "test-admin-key" })).status).toBe(200);
    const admin = await signedInUser("admin@layrd.test");
    await adminDb.collection("users").doc(admin.uid).update({ role: "admin" });
    expect((await patch({}, admin.cookie)).status).toBe(200);
    expect((await adminDb.collection("eventPreorders").doc(record.reference).get()).data()?.status).toBe("confirmed");
  });
});
