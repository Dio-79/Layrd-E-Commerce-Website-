// npm run seed:real
// Copies the catalog from lib/catelog/data.ts into the REAL project's
// "products" collection (same IDs are overwritten, others are left alone).
// It creates no accounts and touches no orders.
import { db, projectId } from "./real-firebase.mjs";
import { products } from "../lib/catelog/data";

const batch = db.batch();
for (const p of products) {
  const doc: Partial<typeof p> = { ...p };
  delete doc.priceRange; // worked out from the price in the browser
  batch.set(db.collection("products").doc(String(p.productID)), doc);
}
await batch.commit();
console.log(`${products.length} products saved to ${projectId}/products`);
