'use client';

import { useState } from 'react';
import type { ProductItem } from "@/app/types/models";
import { products } from "@/lib/catelog/data";
import { getProductId, getProductImage } from "@/app/context/EventOrdercontext";
import CustomizeModal, { type CustomizableProduct } from "@/app/components/Customizemodal";
import styles from "./ProductGrid.module.css";

/** One entry of the catalog data, exactly as it is stored. */
type RawProduct = (typeof products)[number];

type ProductWithImage = ProductItem & {
  image?: string;
};

/** How many products the home screen shows. */
const FEATURED_COUNT = 3;

/** Turns a catalog entry into what the customize modal needs (same ids/images as the other pages use). */
function toCustomizable(raw: RawProduct): CustomizableProduct {
  const item = raw as unknown as ProductWithImage;
  return {
    productID: getProductId(raw) as unknown as CustomizableProduct["productID"],
    name: item.name,
    description: item.description,
    price: Number(item.price),
    imageUrl: getProductImage(raw) ?? item.image ?? item.imageUrl,
    sizes: (item as { sizes?: string[] }).sizes ?? [],
  };
}

interface ProductCardProps {
  product: ProductItem;
  onCustomize: () => void;
}

function ProductCard({ product, onCustomize }: ProductCardProps) {
  const productImage = (product as ProductWithImage).image || product.imageUrl;

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
        <img
          src={productImage}
          alt={`${product.name} ${product.tag}`}
          className={styles.productImage}
        />
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

        <button type="button" className={styles.customizeBtn} onClick={onCustomize}>
          Customize
        </button>
      </div>
    </div>
  );
}

export default function ProductRow() {
  const [selected, setSelected] = useState<CustomizableProduct | null>(null);

  return (
    <div className={styles.container}>
      {/* Product Grid */}
      <div className={styles.grid}>
        {products.slice(0, FEATURED_COUNT).map((raw) => {
          const product = raw as unknown as ProductItem;
          return (
            <ProductCard
              key={`${product.name}-${product.category}`}
              product={product}
              onCustomize={() => setSelected(toCustomizable(raw))}
            />
          );
        })}
      </div>

      {/* Same customize popup as the other pages: size, quantity, add to bag */}
      {selected && (
        <CustomizeModal product={selected} breadcrumb="Featured" onClose={() => setSelected(null)} />
      )}
    </div>
  );
}