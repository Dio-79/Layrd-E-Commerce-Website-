"use client";

// /live/products - the catalog straight from Firestore, updated the moment a
// product changes (price, stock, name...). No reload needed.
import { useEffect, useRef, useState } from "react";
import styles from "../live.module.css";
import { LiveShell } from "../LiveShell";
import { LiveStatus } from "../LiveStatus";
import { useLiveStream } from "../useLiveStream";

interface LiveProduct {
  id: string;
  productID: number;
  name: string;
  price: number;
  stock?: number;
  tag?: string;
  imageUrl?: string;
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

function ProductCard({ product, flash }: { product: LiveProduct; flash: boolean }) {
  return (
    <div className={`${styles.card} ${flash ? styles.flash : ""}`}>
      <div className={styles.imageWrapper}>
        {product.tag && <span className={styles.tagBadge}>{product.tag}</span>}
        {product.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className={styles.image} />
        )}
      </div>
      <div className={styles.cardBody}>
        <h3 className={styles.productName}>{product.name}</h3>
        <p className={styles.meta}>
          {[product.section, product.sizes?.join(" · ")].filter(Boolean).join(" — ") || " "}
        </p>
      </div>
      <div className={styles.cardFooter}>
        <span className={styles.price}>{money(product.price)}</span>
        {typeof product.stock === "number" && <span className={styles.stock}>{product.stock} in stock</span>}
      </div>
    </div>
  );
}

export default function LiveProductsPage() {
  const { docs: products, state, updatedAt } = useLiveStream<LiveProduct>("/api/live/products");
  const changed = useChangedIds(products);

  return (
    <LiveShell
      title="LIVE PRODUCTS"
      subtitle="Straight from Firestore. A change in the Firebase console shows up here within a second."
      aside={<LiveStatus state={state} updatedAt={updatedAt} />}
    >
      {!products && <p className={styles.message}>Connecting to Firebase…</p>}
      {products?.length === 0 && <p className={styles.message}>No products in Firestore yet.</p>}
      {products && products.length > 0 && (
        <div className={styles.grid}>
          {products.map((p) => {
            const flash = changed.ids.has(p.id);
            return <ProductCard key={`${p.id}-${flash ? changed.at : 0}`} product={p} flash={flash} />;
          })}
        </div>
      )}
    </LiveShell>
  );
}
