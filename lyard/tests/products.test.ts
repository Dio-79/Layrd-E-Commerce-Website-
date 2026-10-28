// Products: /api/products reads the Firestore "products" collection.
import { beforeEach, describe, expect, it } from "vitest";
import { adminDb } from "@/lib/firebase/admin";
import { GET as listProducts } from "@/app/api/products/route";
import { products as catalog } from "@/lib/catelog/data";
import { resetEmulators } from "./helpers";

beforeEach(resetEmulators);

describe("/api/products", () => {
  it("returns an empty list before the catalog is loaded", async () => {
    const res = await listProducts();
    expect(res.status).toBe(200);
    expect((await res.json()).products).toEqual([]);
  });

  it("returns every product from Firestore, sorted by productID", async () => {
    const batch = adminDb.batch();
    for (const p of [...catalog].reverse()) {
      batch.set(adminDb.collection("products").doc(String(p.productID)), p);
    }
    await batch.commit();

    const { products } = await (await listProducts()).json();
    expect(products).toHaveLength(catalog.length);
    expect(products.map((p: { productID: number }) => p.productID)).toEqual(
      catalog.map((p) => p.productID).sort((a, b) => a - b)
    );
  });

  it("returns the data as stored (a price change in Firestore shows up)", async () => {
    await adminDb.collection("products").doc("1").set({ ...catalog[0], price: 99 });
    const { products } = await (await listProducts()).json();
    expect(products[0].price).toBe(99);
  });
});
