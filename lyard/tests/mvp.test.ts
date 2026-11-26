// Remaining MVP stories: 3 (sales and ingredient cost reports), 5 (product
// reviews and ratings) and 8 (custom bulk quotes and tax exemption documents).
import { beforeEach, describe, expect, it } from "vitest";
import { adminDb } from "@/lib/firebase/admin";
import * as adminProducts from "@/app/api/admin/products/route";
import * as publicProducts from "@/app/api/products/route";
import * as reports from "@/app/api/admin/reports/route";
import * as reviews from "@/app/api/reviews/route";
import * as quotes from "@/app/api/wholesale/quotes/route";
import * as taxDocs from "@/app/api/wholesale/tax-exemption/route";
import * as wholesaleOrders from "@/app/api/wholesale/orders/route";
import { costReport, csvCell, ordersInRange, reportTotals } from "@/lib/reports/salesReport";
import { publicName, summarize } from "@/lib/reviews/reviews";
import { checkTaxDoc, isExpired, quoteSummary } from "@/lib/wholesale/quotes";
import { request, resetEmulators, signedInUser } from "./helpers";

beforeEach(resetEmulators);

const json = async (res: Response) => ({ status: res.status, body: await res.json() });
const day = (offset: number) => new Date(Date.now() + offset * 864e5).toISOString().slice(0, 10);

async function withRole(email: string, role: string, name = "Test User") {
  const u = await signedInUser(email, name);
  await adminDb.collection("users").doc(u.uid).update({ role });
  return u;
}

async function seed(id: number, extra: Record<string, unknown> = {}) {
  await adminDb.collection("products").doc(String(id)).set({ productID: id, name: `Cake ${id}`, price: 8, categories: ["Cakes"], section: "cake-in-a-can", ...extra });
}

async function order(id: string, extra: Record<string, unknown>) {
  await adminDb.collection("orders").doc(id).set({ orderNumber: id, status: "placed", placedAt: new Date().toISOString(), customer: { email: "a@b.c", fullName: "A B" }, ...extra });
}

const PDF = Buffer.from("%PDF-1.4\n% test exemption certificate\n").toString("base64");

/* ------------------------------------------------------------------ */
/* Story 3                                                             */
/* ------------------------------------------------------------------ */

describe("story 3: sales and ingredient cost reports", () => {
  it("works out revenue, ingredient cost, profit and margin per product", () => {
    const rows = costReport(
      [
        { id: "1", lines: [{ productId: 1, name: "Cake 1", quantity: 2, unitPrice: 10 }, { productId: 2, name: "Cake 2", quantity: 1, unitPrice: 5 }] },
        // wholesale: 10% tier discount is shared across its lines
        { id: "2", type: "wholesale", lines: [{ productId: 1, name: "Cake 1", quantity: 10, unitPrice: 10 }], totals: { discount: 10 } },
      ],
      [{ productID: 1, name: "Cake 1", ingredientCost: 3 }, { productID: 2, name: "Cake 2" }]
    );
    expect(rows[0]).toMatchObject({ productId: "1", units: 12, revenue: 110, unitCost: 3, ingredientCost: 36, profit: 74, margin: 67.27 });
    expect(rows[1]).toMatchObject({ productId: "2", revenue: 5, ingredientCost: 0, profit: 5 });
    const t = reportTotals(rows);
    expect(t).toMatchObject({ units: 13, revenue: 115, ingredientCost: 36, profit: 79 });
    expect(t.missingCost).toEqual(["Cake 2"]);
  });

  it("leaves out cancelled orders and orders outside the dates", () => {
    const list = [
      { id: "a", placedAt: "2026-11-01T10:00:00Z" },
      { id: "b", placedAt: "2026-11-15T10:00:00Z" },
      { id: "c", placedAt: "2026-11-15T10:00:00Z", status: "cancelled" },
      { id: "d", placedAt: "2026-12-01T10:00:00Z" },
    ];
    expect(ordersInRange(list, "2026-11-10", "2026-11-30").map((o) => o.id)).toEqual(["b"]);
    expect(ordersInRange(list).map((o) => o.id)).toEqual(["a", "b", "d"]);
  });

  it("escapes CSV cells and stops spreadsheet formulas", () => {
    expect(csvCell('Say "hi", ok')).toBe('"Say ""hi"", ok"');
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell("-12.50")).toBe("-12.50");
  });

  it("admins export CSVs; everyone else is refused", async () => {
    const customer = await signedInUser("cust@layrd.test");
    expect((await reports.GET(request("/api/admin/reports?type=sales"))).status).toBe(401);
    expect((await reports.GET(request("/api/admin/reports?type=sales", { cookie: customer.cookie }))).status).toBe(403);

    const admin = await withRole("boss@layrd.test", "admin");
    await seed(1, { ingredientCost: 2.5 });
    await order("LYD-A", { lines: [{ productId: 1, name: "Cake 1", quantity: 4, unitPrice: 8 }], totals: { subtotal: 32, discount: 0, tax: 1.6, total: 33.6 } });
    await order("LYD-B", { status: "cancelled", lines: [{ productId: 1, name: "Cake 1", quantity: 100, unitPrice: 8 }], totals: { total: 840 } });

    const sales = await reports.GET(request("/api/admin/reports?type=sales", { cookie: admin.cookie }));
    expect(sales.status).toBe(200);
    expect(sales.headers.get("content-type")).toContain("text/csv");
    expect(sales.headers.get("content-disposition")).toContain("layrd-sales-all-time.csv");
    const salesText = await sales.text();
    expect(salesText).toContain("LYD-A");
    expect(salesText).not.toContain("LYD-B");
    expect(salesText).toContain("TOTAL,1 orders");

    const costs = await (await reports.GET(request("/api/admin/reports?type=costs", { cookie: admin.cookie }))).text();
    expect(costs.split("\r\n")[1]).toBe("1,Cake 1,4,32.00,2.50,10.00,22.00,68.8%");

    const summary = await json(await reports.GET(request("/api/admin/reports?type=summary", { cookie: admin.cookie })));
    expect(summary.body.totals).toMatchObject({ revenue: 32, ingredientCost: 10, profit: 22 });

    expect((await reports.GET(request("/api/admin/reports?type=sales&from=2026-12-01&to=2026-11-01", { cookie: admin.cookie }))).status).toBe(400);
    expect((await reports.GET(request("/api/admin/reports?type=sales&from=yesterday", { cookie: admin.cookie }))).status).toBe(400);
  });

  it("admins set an ingredient cost; the shop never sees it", async () => {
    const admin = await withRole("boss@layrd.test", "admin");
    await seed(1);
    await adminProducts.PATCH(request("/api/admin/products", { method: "PATCH", cookie: admin.cookie, body: { productID: 1, ingredientCost: 2.75 } }));
    expect((await adminDb.collection("products").doc("1").get()).data()?.ingredientCost).toBe(2.75);
    const shop = (await json(await publicProducts.GET(request("/api/products")))).body.products;
    expect(shop[0].name).toBe("Cake 1");
    expect(shop[0].ingredientCost).toBeUndefined();
    const adminList = (await json(await publicProducts.GET(request("/api/products?all=1", { cookie: admin.cookie })))).body.products;
    expect(adminList[0].ingredientCost).toBe(2.75);
  });
});

/* ------------------------------------------------------------------ */
/* Story 5                                                             */
/* ------------------------------------------------------------------ */

describe("story 5: product reviews and ratings", () => {
  it("helpers: average and public names", () => {
    expect(summarize([5, 4, 4])).toEqual({ average: 4.3, count: 3 });
    expect(summarize([])).toEqual({ average: 0, count: 0 });
    expect(publicName("Abel Fekadu")).toBe("Abel F.");
    expect(publicName("  ")).toBe("Customer");
  });

  it("customers rate and edit; guests read; verified purchase is checked on the server", async () => {
    await seed(1);
    await seed(2);
    expect((await reviews.POST(request("/api/reviews", { method: "POST", body: { productId: 1, rating: 5 } }))).status).toBe(401);

    const ann = await signedInUser("ann@layrd.test", "Ann Lee");
    await order("LYD-ANN", { userId: ann.uid, lines: [{ productId: 1, name: "Cake 1", quantity: 1, unitPrice: 8 }] });
    expect((await reviews.POST(request("/api/reviews", { method: "POST", cookie: ann.cookie, body: { productId: 1, rating: 6 } }))).status).toBe(400);
    expect((await reviews.POST(request("/api/reviews", { method: "POST", cookie: ann.cookie, body: { productId: 99, rating: 4 } }))).status).toBe(404);

    const first = await reviews.POST(request("/api/reviews", { method: "POST", cookie: ann.cookie, body: { productId: 1, rating: 4, comment: "  Lovely  ", verified: false } }));
    expect(first.status).toBe(201);
    const edit = await json(await reviews.POST(request("/api/reviews", { method: "POST", cookie: ann.cookie, body: { productId: 1, rating: 5, comment: "Even better" } })));
    expect(edit).toMatchObject({ status: 200, body: { edited: true } });

    const bob = await signedInUser("bob@layrd.test", "Bob");
    await reviews.POST(request("/api/reviews", { method: "POST", cookie: bob.cookie, body: { productId: 1, rating: 2, verified: true } }));

    const guest = await json(await reviews.GET(request("/api/reviews?productId=1")));
    expect(guest.body).toMatchObject({ average: 3.5, count: 2, mine: null });
    const annReview = guest.body.reviews.find((r: { name: string }) => r.name === "Ann L.");
    expect(annReview).toMatchObject({ rating: 5, comment: "Even better", verified: true, mine: false });
    expect(annReview.userId).toBeUndefined();
    expect(guest.body.reviews.find((r: { name: string }) => r.name === "Bob").verified).toBe(false);

    const asAnn = await json(await reviews.GET(request("/api/reviews?productId=1", { cookie: ann.cookie })));
    expect(asAnn.body.mine).toEqual({ rating: 5, comment: "Even better" });

    const summaries = (await json(await reviews.GET(request("/api/reviews")))).body.summaries;
    expect(summaries).toEqual({ "1": { average: 3.5, count: 2 } });
  });

  it("customers remove their own review; only admins remove other people's", async () => {
    await seed(1);
    const ann = await signedInUser("ann@layrd.test", "Ann");
    const bob = await signedInUser("bob@layrd.test", "Bob");
    await reviews.POST(request("/api/reviews", { method: "POST", cookie: ann.cookie, body: { productId: 1, rating: 1, comment: "spam" } }));
    await reviews.POST(request("/api/reviews", { method: "POST", cookie: bob.cookie, body: { productId: 1, rating: 4 } }));

    expect((await reviews.DELETE(request(`/api/reviews?id=1_${ann.uid}`, { method: "DELETE", cookie: bob.cookie }))).status).toBe(403);
    expect((await reviews.GET(request("/api/reviews?all=1", { cookie: bob.cookie }))).status).toBe(403);
    expect((await reviews.DELETE(request("/api/reviews?productId=1", { method: "DELETE", cookie: bob.cookie }))).status).toBe(200);

    const admin = await withRole("boss@layrd.test", "admin");
    expect((await json(await reviews.GET(request("/api/reviews?all=1", { cookie: admin.cookie })))).body.reviews).toHaveLength(1);
    expect((await reviews.DELETE(request(`/api/reviews?id=1_${ann.uid}`, { method: "DELETE", cookie: admin.cookie }))).status).toBe(200);
    expect((await json(await reviews.GET(request("/api/reviews?productId=1")))).body.count).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/* Story 8                                                             */
/* ------------------------------------------------------------------ */

describe("story 8: tax exemption documents", () => {
  it("checks the file type, size and that it really is a PDF or image", () => {
    expect(checkTaxDoc("application/pdf", PDF)).toHaveProperty("bytes");
    expect(checkTaxDoc("text/html", PDF)).toHaveProperty("error");
    expect(checkTaxDoc("application/pdf", Buffer.from("<html>nope</html>").toString("base64"))).toHaveProperty("error");
    expect(checkTaxDoc("image/png", Buffer.alloc(800 * 1024, 1).toString("base64"))).toHaveProperty("error");
    expect(checkTaxDoc("image/jpeg", "not base64!")).toHaveProperty("error");
  });

  it("buyers upload; GST stays until an admin approves; then wholesale orders are GST free", async () => {
    await seed(1, { price: 2 });
    const customer = await signedInUser("cust@layrd.test");
    const upload = { fileName: "exempt.pdf", contentType: "application/pdf", data: PDF, certificateNumber: "BN-12345" };
    expect((await taxDocs.POST(request("/api/wholesale/tax-exemption", { method: "POST", cookie: customer.cookie, body: upload }))).status).toBe(403);

    const buyer = await withRole("cafe@layrd.test", "wholesale", "Cafe Owner");
    expect((await taxDocs.POST(request("/api/wholesale/tax-exemption", { method: "POST", cookie: buyer.cookie, body: { ...upload, certificateNumber: "" } }))).status).toBe(400);
    expect((await taxDocs.POST(request("/api/wholesale/tax-exemption", { method: "POST", cookie: buyer.cookie, body: { ...upload, expiresOn: "2020-01-01" } }))).status).toBe(400);
    const sent = await json(await taxDocs.POST(request("/api/wholesale/tax-exemption", { method: "POST", cookie: buyer.cookie, body: upload })));
    expect(sent.status).toBe(201);
    expect(sent.body.taxExemption.status).toBe("pending");

    const body = { lines: [{ productId: 1, quantity: 100 }], recurringWeeks: 0, method: "pickup" };
    const taxed = await json(await wholesaleOrders.POST(request("/api/wholesale/orders", { method: "POST", cookie: buyer.cookie, body })));
    expect(taxed.body.totals.tax).toBeGreaterThan(0);

    // Only admins (and the owner) can see the file, or decide
    const other = await withRole("other@layrd.test", "wholesale");
    expect((await taxDocs.GET(request(`/api/wholesale/tax-exemption?file=${buyer.uid}`, { cookie: other.cookie }))).status).toBe(403);
    expect((await taxDocs.GET(request("/api/wholesale/tax-exemption?file=me", { cookie: buyer.cookie }))).status).toBe(200);
    expect((await taxDocs.PATCH(request("/api/wholesale/tax-exemption", { method: "PATCH", cookie: buyer.cookie, body: { userId: buyer.uid, status: "approved" } }))).status).toBe(403);

    const admin = await withRole("boss@layrd.test", "admin");
    const list = (await json(await taxDocs.GET(request("/api/wholesale/tax-exemption?all=1", { cookie: admin.cookie })))).body.exemptions;
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ userId: buyer.uid, certificateNumber: "BN-12345", status: "pending" });
    expect(list[0].data).toBeUndefined();
    const file = await taxDocs.GET(request(`/api/wholesale/tax-exemption?file=${buyer.uid}`, { cookie: admin.cookie }));
    expect(file.headers.get("content-type")).toBe("application/pdf");
    expect(Buffer.from(await file.arrayBuffer()).subarray(0, 4).toString()).toBe("%PDF");

    expect((await taxDocs.PATCH(request("/api/wholesale/tax-exemption", { method: "PATCH", cookie: admin.cookie, body: { userId: buyer.uid, status: "approved" } }))).status).toBe(200);
    const exempt = await json(await wholesaleOrders.POST(request("/api/wholesale/orders", { method: "POST", cookie: buyer.cookie, body })));
    expect(exempt.body.totals.tax).toBe(0);
    expect(exempt.body.totals.total).toBe(exempt.body.totals.subtotal - exempt.body.totals.discount);
  });

  it("an expired exemption no longer counts", async () => {
    await seed(1, { price: 2 });
    const buyer = await withRole("cafe@layrd.test", "wholesale");
    await adminDb.collection("users").doc(buyer.uid).set({ taxExemption: { status: "approved", expiresOn: day(-1) } }, { merge: true });
    const res = await json(await wholesaleOrders.POST(request("/api/wholesale/orders", { method: "POST", cookie: buyer.cookie, body: { lines: [{ productId: 1, quantity: 60 }], recurringWeeks: 0, method: "pickup" } })));
    expect(res.body.totals.tax).toBeGreaterThan(0);
  });
});

describe("story 8: custom bulk quotes", () => {
  it("helpers: summary and expiry", () => {
    const s = quoteSummary([{ productId: 1, name: "A", quantity: 100, listPrice: 8, quotedPrice: 6 }]);
    expect(s).toMatchObject({ units: 100, listTotal: 800, quotedTotal: 600, saving: 200, savingPct: 25 });
    expect(quoteSummary([{ productId: 1, name: "A", quantity: 1, listPrice: 8 }]).quotedTotal).toBeNull();
    expect(isExpired({ status: "quoted", validUntil: "2026-01-01" }, "2026-01-02")).toBe(true);
    expect(isExpired({ status: "quoted", validUntil: "2026-01-02" }, "2026-01-02")).toBe(false);
  });

  it("request, price, accept: becomes a wholesale order at the agreed prices", async () => {
    await seed(1, { price: 8 });
    await seed(2, { price: 5 });
    const customer = await signedInUser("cust@layrd.test");
    const ask = { lines: [{ productId: 1, quantity: 80 }, { productId: 2, quantity: 40 }], neededBy: day(10), targetBudget: 700, message: "Custom labels for our grand opening" };
    expect((await quotes.POST(request("/api/wholesale/quotes", { method: "POST", cookie: customer.cookie, body: ask }))).status).toBe(403);

    const buyer = await withRole("cafe@layrd.test", "wholesale", "Cafe Owner");
    expect((await quotes.POST(request("/api/wholesale/quotes", { method: "POST", cookie: buyer.cookie, body: { ...ask, lines: [{ productId: 1, quantity: 10 }] } }))).status).toBe(400);
    expect((await quotes.POST(request("/api/wholesale/quotes", { method: "POST", cookie: buyer.cookie, body: { ...ask, neededBy: day(0) } }))).status).toBe(400);
    const created = await json(await quotes.POST(request("/api/wholesale/quotes", { method: "POST", cookie: buyer.cookie, body: ask })));
    expect(created.status).toBe(201);
    const id = created.body.id;
    expect(created.body.quote).toMatchObject({ status: "requested", targetBudget: 700, lines: [{ productId: 1, quantity: 80, listPrice: 8 }, { productId: 2, quantity: 40, listPrice: 5 }] });

    // Can't accept before a price is sent; buyers can't set prices
    expect((await quotes.PATCH(request("/api/wholesale/quotes", { method: "PATCH", cookie: buyer.cookie, body: { id, action: "accept" } }))).status).toBe(409);
    expect((await quotes.PATCH(request("/api/wholesale/quotes", { method: "PATCH", cookie: buyer.cookie, body: { id, action: "quote", prices: { 1: 0.01, 2: 0.01 } } }))).status).toBe(403);

    const admin = await withRole("boss@layrd.test", "admin");
    const all = (await json(await quotes.GET(request("/api/wholesale/quotes?all=1", { cookie: admin.cookie })))).body.quotes;
    expect(all.map((q: { id: string }) => q.id)).toEqual([id]);
    expect((await quotes.PATCH(request("/api/wholesale/quotes", { method: "PATCH", cookie: admin.cookie, body: { id, action: "quote", prices: { 1: 6.5 } } }))).status).toBe(400);
    expect((await quotes.PATCH(request("/api/wholesale/quotes", { method: "PATCH", cookie: admin.cookie, body: { id, action: "quote", prices: { 1: 6.5, 2: 4 }, message: "Labels included" } }))).status).toBe(200);

    const mine = (await json(await quotes.GET(request("/api/wholesale/quotes", { cookie: buyer.cookie })))).body.quotes[0];
    expect(mine).toMatchObject({ status: "quoted", adminMessage: "Labels included" });
    expect(mine.validUntil).toBe(day(14));

    const other = await withRole("other@layrd.test", "wholesale");
    expect((await quotes.PATCH(request("/api/wholesale/quotes", { method: "PATCH", cookie: other.cookie, body: { id, action: "accept" } }))).status).toBe(403);

    const accepted = await json(await quotes.PATCH(request("/api/wholesale/quotes", { method: "PATCH", cookie: buyer.cookie, body: { id, action: "accept" } })));
    expect(accepted.status).toBe(201);
    // 80 x 6.50 + 40 x 4 = 680, + 5% GST, no tier discount on agreed prices
    expect(accepted.body.totals).toMatchObject({ subtotal: 680, discount: 0, tax: 34, total: 714 });
    const saved = (await adminDb.collection("orders").doc(accepted.body.orderNumber).get()).data();
    expect(saved).toMatchObject({ type: "wholesale", quoteId: id, userId: buyer.uid, payment: { method: "invoice" } });
    expect(saved?.lines[0]).toMatchObject({ productId: 1, quantity: 80, unitPrice: 6.5 });

    expect((await quotes.PATCH(request("/api/wholesale/quotes", { method: "PATCH", cookie: buyer.cookie, body: { id, action: "accept" } }))).status).toBe(409);
    expect((await adminDb.collection("quoteRequests").doc(id).get()).data()).toMatchObject({ status: "accepted", orderNumber: accepted.body.orderNumber });
  });

  it("expired prices can't be accepted; buyers can decline; admins can turn a request down", async () => {
    await seed(1, { price: 8 });
    const buyer = await withRole("cafe@layrd.test", "wholesale");
    const admin = await withRole("boss@layrd.test", "admin");
    const make = async () => (await json(await quotes.POST(request("/api/wholesale/quotes", { method: "POST", cookie: buyer.cookie, body: { lines: [{ productId: 1, quantity: 60 }], neededBy: day(5) } })))).body.id;

    const old = await make();
    await adminDb.collection("quoteRequests").doc(old).update({ status: "quoted", validUntil: day(-1), lines: [{ productId: 1, name: "Cake 1", quantity: 60, listPrice: 8, quotedPrice: 7 }] });
    expect((await json(await quotes.GET(request("/api/wholesale/quotes", { cookie: buyer.cookie })))).body.quotes.find((q: { id: string }) => q.id === old).status).toBe("expired");
    expect((await quotes.PATCH(request("/api/wholesale/quotes", { method: "PATCH", cookie: buyer.cookie, body: { id: old, action: "accept" } }))).status).toBe(409);

    const second = await make();
    expect((await quotes.PATCH(request("/api/wholesale/quotes", { method: "PATCH", cookie: buyer.cookie, body: { id: second, action: "decline" } }))).status).toBe(200);
    expect((await quotes.PATCH(request("/api/wholesale/quotes", { method: "PATCH", cookie: admin.cookie, body: { id: second, action: "quote", prices: { 1: 7 } } }))).status).toBe(409);

    const third = await make();
    expect((await quotes.PATCH(request("/api/wholesale/quotes", { method: "PATCH", cookie: admin.cookie, body: { id: third, action: "reject", message: "Sold out that week" } }))).status).toBe(200);
    expect((await adminDb.collection("quoteRequests").doc(third).get()).data()).toMatchObject({ status: "declined", adminMessage: "Sold out that week" });
  });
});
