'use client';

import { useState } from 'react';
import { products, type CatalogProduct } from "@/lib/catelog/data";
import CustomizeModal from "@/app/components/Customizemodal";
import { toCustomizable } from "@/app/components/toCustomizable";
import styles from "./ProductGrid.module.css";

/** How many products the home screen shows. */
const FEATURED_COUNT = 3;

interface ProductCardProps {
  product: CatalogProduct;
  onCustomize: (product: CatalogProduct) => void;
}

function ProductCard({ product, onCustomize }: ProductCardProps) {
  return (
    <div className={styles.card}>
      {/* Image & Badge Wrapper */}
      <div className={styles.imageWrapper}>
        {product.tag && (
          <div className={styles.tagBadge}>
            <span>{product.tag}</span>
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.imageUrl} alt={product.name} className={styles.productImage} />
      </div>

      {/* Text Content */}
      <div className={styles.content}>
        <h3 className={styles.productName}>{product.name}</h3>
        <p className={styles.description}>{product.description}</p>
      </div>

      {/* Pricing & Action Footer */}
      <div className={styles.footerRow}>
        <div className={styles.priceBlock}>
          <span className={styles.fromLabel}>FROM</span>
          <span className={styles.priceValue}>${product.price}</span>
        </div>

        <button type="button" className={styles.customizeBtn} onClick={() => onCustomize(product)}>
          Customize
        </button>
      </div>
    </div>
  );
}

export default function ProductRow() {
  const [selected, setSelected] = useState<CatalogProduct | null>(null);

  return (
    <div className={styles.container}>
      {/* Product Grid */}
      <div className={styles.grid}>
        {products.slice(0, FEATURED_COUNT).map((product) => (
          <ProductCard key={product.productID} product={product} onCustomize={setSelected} />
        ))}
      </div>

      {/* Same customize popup as the other pages: size, quantity, add to bag */}
      {selected && (
        <CustomizeModal product={toCustomizable(selected)} breadcrumb="Featured" onClose={() => setSelected(null)} />
      )}
    </div>
  );
}