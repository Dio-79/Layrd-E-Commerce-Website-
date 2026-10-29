// Checkout orders: /api/orders saves to Firestore "orders" and lists them per user.
import { beforeEach, describe, expect, it } from "vitest";
import { adminDb } from "@/lib/firebase/admin";
import { GET, POST } from "@/app/api/orders/route";
import { request, resetEmulators, sampleOrder, signedInUser } from "./helpers";

beforeEach(resetEmulators);

const place = (body: unknown, cookie?: string) => POST(request("/api/orders", { method: "POST", body, cookie }));

describe("placing an order", () => {
  it("saves a guest order to Firestore", async () => {
    const res = await place(sampleOrder("LYD-GUEST1"));
    expect(res.status).toBe(201);

    const saved = (await adminDb.collection("orders").doc("LYD-GUEST1").get()).data();
    expect(saved).toMatchObject({ orderNumber: "LYD-GUEST1", status: "placed", userId: null });
    expect(saved?.lines).toHaveLength(1);
  });

  it("links the order to the signed-in customer", async () => {
    const alice = await signedInUser("alice@layrd.test");
    expect((await place(sampleOrder("LYD-ALICE1"), alice.cookie)).status).toBe(201);
    const saved = (await adminDb.collection("orders").doc("LYD-ALICE1").get()).data();
    expect(saved?.userId).toBe(alice.uid);
  });

  it("rejects bad orders", async () => {
    expect((await place({ ...sampleOrder("bad number") })).status).toBe(400);
    expect((await place({ ...sampleOrder("LYD-EMPTY"), lines: [] })).status).toBe(400);
    expect((await place(sampleOrder("LYD-NOEMAIL", "not-an-email"))).status).toBe(400);
    expect((await place(null)).status).toBe(400);
  });

  it("won't save the same order number twice", async () => {
    expect((await place(sampleOrder("LYD-DUP1"))).status).toBe(201);
    expect((await place(sampleOrder("LYD-DUP1"))).status).toBe(409);
  });
});

describe("listing orders", () => {
  it("needs a signed-in user", async () => {
    expect((await GET(request("/api/orders"))).status).toBe(401);
  });

  it("customers only see their own orders; admins see all", async () => {
    const alice = await signedInUser("alice@layrd.test");
    const bob = await signedInUser("bob@layrd.test");
    await place(sampleOrder("LYD-A1"), alice.cookie);
    await place(sampleOrder("LYD-B1"), bob.cookie);

    const aliceOrders = (await (await GET(request("/api/orders", { cookie: alice.cookie }))).json()).orders;
    expect(aliceOrders.map((o: { orderNumber: string }) => o.orderNumber)).toEqual(["LYD-A1"]);

    const admin = await signedInUser("admin@layrd.test");
    await adminDb.collection("users").doc(admin.uid).update({ role: "admin" });
    const all = (await (await GET(request("/api/orders", { cookie: admin.cookie }))).json()).orders;
    expect(all.map((o: { orderNumber: string }) => o.orderNumber).sort()).toEqual(["LYD-A1", "LYD-B1"]);
  });
});
