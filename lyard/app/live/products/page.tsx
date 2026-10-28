"use client";

// /live/products - the catalog straight from Firestore, updated the moment a
// product changes (price, stock, name...). No reload needed.
import { useEffect, useRef, useState } from "react";
import styles from "../live.module.css";
import { LiveStatus } from "../LiveStatus";
import { useLiveStream } from "../useLiveStream";

interface LiveProduct {
  id: string;
  productID: number;
  name: string;
  price: number;
  stock?: number;
  tag?: string;
  section?: string;
  sizes?: string[];
}

const money = (n: unknown) => (typeof n === "number" ? `$${n.toFixed(2)}` : "-");

/** Ids of products whose data differs from the previous snapshot (for the highlight). */
function useChangedIds(products: LiveProduct[] | null) {
  const previous = useRef<Map<string, string> | null>(null);
  const [changed, setChanged] = useState<{ ids: Set<string>; at: number }>({ ids: new Set(), at: 0 });

  useEffect(() => {
    if (!products) return;
    const next = new Map(products.map((p) => [p.id, JSON.stringify(p)]));
    if (previous.current) {
      const ids = new Set([...next].filter(([id, json]) => previous.current?.get(id) !== json).map(([id]) => id));
      if (ids.size) setChanged({ ids, at: Date.now() });
    }
    previous.current = next;
  }, [products]);

  return changed;
}

export default function LiveProductsPage() {
  const { docs: products, state, updatedAt } = useLiveStream<LiveProduct>("/api/live/products");
  const changed = useChangedIds(products);

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Products (live)</h1>
        <LiveStatus state={state} updatedAt={updatedAt} />
      </div>
      <p className={styles.note}>
        Straight from Firestore. Change a product in the Firebase console and it updates here within a second.
      </p>

      {products && products.length === 0 && <p>No products in Firestore yet.</p>}
      {products && products.length > 0 && (
        <div className={styles.scroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Section</th>
                <th>Sizes</th>
                <th className={styles.num}>Stock</th>
                <th className={styles.num}>Price</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={`${p.id}-${changed.ids.has(p.id) ? changed.at : 0}`} className={changed.ids.has(p.id) ? styles.flash : undefined}>
                  <td>{p.productID}</td>
                  <td>
                    {p.name} {p.tag && <span className={styles.badge}>{p.tag}</span>}
                  </td>
                  <td>{p.section ?? "-"}</td>
                  <td>{p.sizes?.join(", ") ?? "-"}</td>
                  <td className={styles.num}>{p.stock ?? "-"}</td>
                  <td className={styles.num}>{money(p.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
