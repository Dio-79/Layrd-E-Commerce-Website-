// Stock counts on products (FR-14). Only products where an admin turned on
// "Track Quantity" (a numeric `stock` field in Firestore) are counted.
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, COLLECTIONS } from "@/lib/firebase/admin";

/** Takes the ordered quantities off each tracked product. Never throws: a stock miss must not lose an order. */
export async function takeStock(lines: { productId: number | string; quantity: number }[]) {
  const col = adminDb.collection(COLLECTIONS.products);
  const perProduct = new Map<string, number>();
  for (const l of lines) {
    const id = String(l.productId);
    perProduct.set(id, (perProduct.get(id) ?? 0) + Math.abs(Number(l.quantity) || 0));
  }
  await Promise.all(
    [...perProduct].map(async ([id, qty]) => {
      try {
        const ref = col.doc(id);
        const snap = await ref.get();
        if (typeof snap.data()?.stock === "number" && snap.data()?.trackStock !== false) {
          await ref.update({ stock: FieldValue.increment(-qty) });
        }
      } catch (err) {
        console.error(`stock update for product ${id} failed:`, err);
      }
    })
  );
}
