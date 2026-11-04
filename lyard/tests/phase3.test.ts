// Phase 3 features: admin product/category/coupon/order/user APIs, stock,
// order tracking statuses, wholesale applications and tiered orders, chat.
import { beforeEach, describe, expect, it } from "vitest";
import { adminDb } from "@/lib/firebase/admin";
import * as adminProducts from "@/app/api/admin/products/route";
import * as adminCategories from "@/app/api/admin/categories/route";
import * as adminCoupons from "@/app/api/admin/coupons/route";
import * as adminOrders from "@/app/api/admin/orders/route";
import * as adminUsers from "@/app/api/admin/users/route";
import * as publicProducts from "@/app/api/products/route";
import * as coupons from "@/app/api/coupons/route";
import * as orders from "@/app/api/orders/route";
import * as apply from "@/app/api/wholesale/apply/route";
import * as wholesaleOrders from "@/app/api/wholesale/orders/route";
import * as chat from "@/app/api/chat/route";
import { lookupPromo } from "@/lib/server/coupons";
import { wholesaleTotals } from "@/lib/wholesale/tiers";
import { request, resetEmulators, sampleOrder, signedInUser } from "./helpers";

beforeEach(resetEmulators);

async function asAdmin() {
  const admin = await signedInUser("boss@layrd.test", "Boss");
  await adminDb.collection("users").doc(admin.uid).update({ role: "admin" });
  return admin;
}

async function seed(id: number, extra: Record<string, unknown> = {}) {
  await adminDb.collection("products").doc(String(id)).set({ productID: id, name: `Cake ${id}`, price: 8, categories: ["Cakes"], section: "cake-in-a-can", ...extra });
}

const json = async (res: Response) => ({ status: res.status, body: await res.json() });

describe("admin APIs refuse everyone but admins", () => {
  it("signed out gets 401, customers get 403", async () => {
    const customer = await signedInUser("cust@layrd.test");
    for (const cookie of [undefined, customer.cookie]) {
      const want = cookie ? 403 : 401;
      expect((await adminProducts.POST(request("/api/admin/products", { method: "POST", body: { name: "x", price: 1 }, cookie }))).status).toBe(want);
      expect((await adminCoupons.GET(request("/api/admin/coupons", { cookie }))).status).toBe(want);
      expect((await adminOrders.GET(request("/api/admin/orders", { cookie }))).status).toBe(want);
      expect((await adminUsers.GET(request("/api/admin/users", { cookie }))).status).toBe(want);
      expect((await adminCategories.PUT(request("/api/admin/categories", { method: "PUT", body: { name: "Merch" }, cookie }))).status).toBe(want);
    }
  });
});

describe("products and categories", () => {
  it("adds, edits, hides and removes a product; the shop only sees visible ones", async () => {
    const { cookie } = await asAdmin();
    await seed(1);
    const created = await json(await adminProducts.POST(request("/api/admin/products", { method: "POST", cookie, body: { name: "New Cake", price: 9.5, category: "Cakes" } })));
    expect(created.status).toBe(201);
    expect(created.body.productID).toBe(2);

    await adminProducts.PATCH(request("/api/admin/products", { method: "PATCH", cookie, body: { productID: 2, price: 11, hidden: true, sweetness: 4, allergens: ["Dairy"] } }));
    const saved = (await adminDb.collection("products").doc("2").get()).data();
    expect(saved).toMatchObject({ price: 11, hidden: true, sweetness: 4, allergens: ["Dairy"] });

    const shop = (await json(await publicProducts.GET(request("/api/products")))).body.products;
    expect(shop.map((p: { productID: number }) => p.productID)).toEqual([1]);
    const adminView = (await json(await publicProducts.GET(request("/api/products?all=1", { cookie })))).body.products;
    expect(adminView).toHaveLength(2);

    expect((await adminProducts.DELETE(request("/api/admin/products?id=2", { method: "DELETE", cookie }))).status).toBe(200);
    expect((await adminDb.collection("products").doc("2").get()).exists).toBe(false);
  });

  it("ignores invalid values instead of saving them", async () => {
    const { cookie } = await asAdmin();
    await seed(1);
    await adminProducts.PATCH(request("/api/admin/products", { method: "PATCH", cookie, body: { productID: 1, price: -5, sweetness: 9, name: "Still Valid" } }));
    expect((await adminDb.collection("products").doc("1").get()).data()).toMatchObject({ price: 8, name: "Still Valid" });
  });

  it("a hidden category hides its products until it's made visible", async () => {
    const { cookie } = await asAdmin();
    await seed(1);
    await seed(2, { categories: ["Merch"] });
    await adminCategories.PUT(request("/api/admin/categories", { method: "PUT", cookie, body: { name: "Merch", visible: false } }));
    let shop = (await json(await publicProducts.GET(request("/api/products")))).body.products;
    expect(shop.map((p: { productID: number }) => p.productID)).toEqual([1]);
    await adminCategories.PUT(request("/api/admin/categories", { method: "PUT", cookie, body: { name: "Merch", visible: true } }));
    shop = (await json(await publicProducts.GET(request("/api/products")))).body.products;
    expect(shop).toHaveLength(2);
  });
});

describe("stock", () => {
  it("orders take units off tracked products only", async () => {
    await seed(1, { stock: 10, lowStockAt: 3 });
    await seed(2);
    const { cookie } = await signedInUser("buyer@layrd.test");
    const order = sampleOrder("LYD-STOCK1");
    order.lines = [
      { id: "1", source: "bag", productId: 1, name: "Cake 1", quantity: 4, unitPrice: 7 },
      { id: "2", source: "bag", productId: 2, name: "Cake 2", quantity: 1, unitPrice: 7 },
    ];
    expect((await orders.POST(request("/api/orders", { method: "POST", body: order, cookie }))).status).toBe(201);
    expect((await adminDb.collection("products").doc("1").get()).data()?.stock).toBe(6);
    expect((await adminDb.collection("products").doc("2").get()).data()?.stock).toBeUndefined();
  });
});

describe("coupons and events", () => {
  it("admin coupons are checked for dates, minimums and usage limits", async () => {
    const { cookie } = await asAdmin();
    const put = (body: Record<string, unknown>) => adminCoupons.PUT(request("/api/admin/coupons", { method: "PUT", cookie, body }));
    expect((await put({ code: "save15", type: "percent", value: 15, minOrder: 20 })).status).toBe(200);
    expect((await put({ code: "OLD", type: "amount", value: 5, expiresAt: "2020-01-01" })).status).toBe(200);
    expect((await put({ code: "ONCE", type: "amount", value: 3, usageLimit: 1 })).status).toBe(200);
    expect((await put({ code: "BAD", type: "percent", value: 150 })).status).toBe(400);

    expect(await lookupPromo("SAVE15", 25)).toMatchObject({ code: "SAVE15", type: "percent", value: 15 });
    expect(await lookupPromo("SAVE15", 10)).toBeNull();
    expect(await lookupPromo("OLD", 50)).toBeNull();
    expect(await lookupPromo("LAYRD10", 50)).toMatchObject({ code: "LAYRD10" }); // built-in demo code still works

    await adminDb.collection("coupons").doc("ONCE").update({ uses: 1 });
    const used = await json(await coupons.GET(request("/api/coupons?code=ONCE&subtotal=10")));
    expect(used.status).toBe(404);
    expect(used.body.error).toMatch(/fully used/);
  });

  it("lists events running today for the home page banner", async () => {
    const { cookie } = await asAdmin();
    await adminCoupons.PUT(request("/api/admin/coupons", { method: "PUT", cookie, body: { code: "SUMMER", kind: "event", title: "Summer sale", type: "percent", value: 20 } }));
    await adminCoupons.PUT(request("/api/admin/coupons", { method: "PUT", cookie, body: { code: "LATER", kind: "event", type: "percent", value: 20, startsAt: "2099-01-01" } }));
    const events = (await json(await coupons.GET(request("/api/coupons?events=1")))).body.events;
    expect(events.map((e: { code: string }) => e.code)).toEqual(["SUMMER"]);
  });
});

describe("admin orders and refunds", () => {
  it("changes an order's status with history, and decides refunds", async () => {
    const { cookie } = await asAdmin();
    const buyer = await signedInUser("buyer@layrd.test");
    await orders.POST(request("/api/orders", { method: "POST", body: sampleOrder("LYD-T1"), cookie: buyer.cookie }));
    await adminDb.collection("refundRequests").doc("LYD-T1").set({ orderNumber: "LYD-T1", status: "pending", reason: "Lid was broken" });

    const patch = (body: Record<string, unknown>) => adminOrders.PATCH(request("/api/admin/orders", { method: "PATCH", cookie, body }));
    expect((await patch({ kind: "order", id: "LYD-T1", status: "ready" })).status).toBe(200);
    expect((await patch({ kind: "order", id: "LYD-T1", status: "lost" })).status).toBe(400);
    expect((await patch({ kind: "refund", id: "LYD-T1", status: "approved" })).status).toBe(200);

    const order = (await adminDb.collection("orders").doc("LYD-T1").get()).data();
    expect(order).toMatchObject({ status: "ready", refundStatus: "approved" });
    expect(order?.statusHistory.at(-1).status).toBe("ready");

    const all = (await json(await adminOrders.GET(request("/api/admin/orders", { cookie })))).body;
    expect(all.orders).toHaveLength(1);
    expect(all.refunds[0].status).toBe("approved");
  });
});

describe("wholesale", () => {
  it("a customer applies and an admin approves; the account becomes wholesale", async () => {
    const shop = await signedInUser("cafe@layrd.test", "Sara");
    const res = await apply.POST(request("/api/wholesale/apply", { method: "POST", cookie: shop.cookie, body: { businessName: "Café Aroma", phone: "403 555 0192" } }));
    expect(res.status).toBe(201);
    expect((await apply.POST(request("/api/wholesale/apply", { method: "POST", cookie: shop.cookie, body: { businessName: "Café Aroma", phone: "403 555 0192" } }))).status).toBe(409);

    const { cookie } = await asAdmin();
    const list = (await json(await adminUsers.GET(request("/api/admin/users", { cookie })))).body.users;
    expect(list.find((u: { email: string }) => u.email === "cafe@layrd.test").wholesaleApplication.status).toBe("pending");

    await adminUsers.PATCH(request("/api/admin/users", { method: "PATCH", cookie, body: { id: shop.uid, wholesale: "approved" } }));
    expect((await adminDb.collection("users").doc(shop.uid).get()).data()?.role).toBe("wholesale");
  });

  it("tier discounts: 5% from 50 units, 12% from 150, 18% from 300", () => {
    expect(wholesaleTotals([{ unitPrice: 2, quantity: 49 }]).discountRate).toBe(0);
    expect(wholesaleTotals([{ unitPrice: 2, quantity: 50 }]).discountRate).toBe(0.05);
    expect(wholesaleTotals([{ unitPrice: 2, quantity: 150 }]).discountRate).toBe(0.12);
    const big = wholesaleTotals([{ unitPrice: 2, quantity: 300 }]);
    expect(big).toMatchObject({ subtotal: 600, discount: 108, tax: 24.6, total: 516.6 });
  });

  it("bulk orders: wholesale only, minimum 50 units, priced on the server", async () => {
    await seed(1, { price: 3, stock: 500 });
    const customer = await signedInUser("cust@layrd.test");
    const body = { lines: [{ productId: 1, quantity: 150 }], recurringWeeks: 2, method: "pickup" };
    expect((await wholesaleOrders.POST(request("/api/wholesale/orders", { method: "POST", cookie: customer.cookie, body }))).status).toBe(403);

    const partner = await signedInUser("partner@layrd.test");
    await adminDb.collection("users").doc(partner.uid).update({ role: "wholesale" });
    const small = await wholesaleOrders.POST(request("/api/wholesale/orders", { method: "POST", cookie: partner.cookie, body: { ...body, lines: [{ productId: 1, quantity: 10 }] } }));
    expect(small.status).toBe(400);

    const ok = await json(await wholesaleOrders.POST(request("/api/wholesale/orders", { method: "POST", cookie: partner.cookie, body: { ...body, lines: [{ productId: 1, quantity: 150, unitPrice: 0.01 }] } })));
    expect(ok.status).toBe(201);
    const saved = (await adminDb.collection("orders").doc(ok.body.orderNumber).get()).data();
    expect(saved).toMatchObject({ type: "wholesale", userId: partner.uid, discountRate: 0.12, recurring: { everyWeeks: 2 } });
    expect(saved?.totals.subtotal).toBe(450); // 150 × $3 from Firestore, not the $0.01 sent
    expect((await adminDb.collection("products").doc("1").get()).data()?.stock).toBe(350);
  });
});

describe("chat assistant", () => {
  const ask = async (message: string) => (await json(await chat.POST(request("/api/chat", { method: "POST", body: { message } })))).body;

  it("answers FAQ questions with a link", async () => {
    expect((await ask("Do you deliver to my house?")).reply).toMatch(/DoorDash/);
    expect((await ask("where is my order?")).link.href).toBe("/orders");
    expect((await ask("can I get a refund")).link.href).toBe("/refund");
  });

  it("answers about a product from Firestore", async () => {
    await seed(3, { name: "Oreo Cheesecake", price: 8, allergens: ["Dairy", "Wheat"] });
    const a = await ask("how much is the oreo cheesecake?");
    expect(a.reply).toMatch(/Oreo Cheesecake is \$8\.00/);
    expect(a.reply).toMatch(/Dairy, Wheat/);
  });

  it("sends anything else to the contact page", async () => {
    expect((await ask("what's the meaning of life")).link.href).toBe("/contact");
  });
});
