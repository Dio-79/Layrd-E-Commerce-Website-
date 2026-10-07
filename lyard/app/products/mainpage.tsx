'use client';

import { useState } from 'react';
import { ProductItem } from "@/app/types/models";
import { products } from "@/lib/data";
import styles from "./ProductGrid.module.css";

interface ProductCardProps {
  product: ProductItem;
  onCustomize?: (product: ProductItem) => void;
}

type ProductWithImage = ProductItem & {
  image?: string;
};

function ProductCard({ product, onCustomize }: ProductCardProps) {
  const productImage = (product as ProductWithImage).image ||
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop";

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
          alt={product.name}
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

        <button
          type="button"
          className={styles.customizeBtn}
          onClick={() => onCustomize && onCustomize(product)}
        >
          Customize
        </button>
      </div>
    </div>
  );
}

export default function ProductGrid() {
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  const handleCustomize = (product: ProductItem) => {
    setSelectedProduct(product);
  };

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <header className={styles.headerBar}>
        <h1 className={styles.mainTitle}>OUR COLLECTION</h1>
        <div className={styles.headerMeta}>
          <span>Showing {products.length} Items</span>
          <span>SORT BY: Newest ∨</span>
        </div>
      </header>

      {/* Product Grid */}
      <div className={styles.grid}>
        {(products as unknown as ProductItem[]).map((product) => (
          <ProductCard
            key={`${product.name}-${product.category}`}
            product={product}
            onCustomize={handleCustomize}
          />
        ))}
      </div>

      {/* Customization Dialog / Modal */}
      {selectedProduct && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Customize {selectedProduct.name}</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setSelectedProduct(null)}
              >
                ✕
              </button>
            </div>
            <p className={styles.description}>{selectedProduct.description}</p>
            <div>
              Base Price: <strong className={styles.priceValue}>${selectedProduct.price}</strong>
            </div>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelModalBtn}
                onClick={() => setSelectedProduct(null)}
              >
                Close
              </button>
              <button
                type="button"
                className={styles.addToCartBtn}
                onClick={() => setSelectedProduct(null)}
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}