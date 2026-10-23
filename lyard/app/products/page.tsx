"use client";

import { useCallback, useMemo } from "react";
import type { ProductItem } from "@/app/types/models";
import { ProductProvider, useProducts } from "@/app/context/productcontext";
import CustomizeModal, { type CustomizableProduct } from "@/app/components/Customizemodal";
import styles from "./mainpage.module.css";
import Sidebar from "./sidebar";
import CatalogHeader from "./sorting";
import Header from "../components/Header";
import Footer from "../components/Footer";

type ProductWithDetails = ProductItem & {
  productID?: number | string;
  id?: number | string;
  image?: string;
  images?: string[];
  sizes?: string[];
};

// Converts a catalog item into what the customize popup needs (same ids the cart already uses)
function toCustomizable(item: ProductItem): CustomizableProduct {
  const p = item as ProductWithDetails;
  const images = p.images?.length ? p.images : undefined;

  return {
    productID: Number(p.productID ?? p.id ?? 0) as unknown as CustomizableProduct["productID"],
    name: item.name,
    description: item.description,
    price: Number(item.price),
    imageUrl: images?.[0] || p.imageUrl || p.image || "",
    sizes: p.sizes ?? [],
  };
}

interface ProductCardProps {
  product: ProductItem;
  onCustomize: (product: ProductItem) => void;
}

function ProductCard({ product, onCustomize }: ProductCardProps) {
  const prod = product as ProductWithDetails;
  const productImage = prod.image || prod.imageUrl;

  return (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        {product.tag && (
          <div className={styles.tagBadge}>
            <span>{product.tag}</span>
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={productImage} alt={product.name} className={styles.productImage} />
      </div>

      <div className={styles.content}>
        <h3 className={styles.productName}>{product.name}</h3>
        <p className={styles.description}>{product.description}</p>
      </div>

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

function CatalogContent() {
  const { filteredAndSortedProducts, selectedProduct, setSelectedProduct } = useProducts();

  const selected = useMemo(
    () => (selectedProduct ? toCustomizable(selectedProduct) : null),
    [selectedProduct]
  );
  const closeModal = useCallback(() => setSelectedProduct(null), [setSelectedProduct]);

  return (
    <div className={styles.container}>
      {/* Title + count + sort */}
      <header className={styles.headerBar}>
        <h1 className={styles.mainTitle}>OUR COLLECTION</h1>
        <div className={styles.headerMeta}>
          <CatalogHeader />
        </div>
      </header>

      {/* Filters */}
      <aside className={styles.sidebarSection} aria-label="Filters">
        <Sidebar />
      </aside>

      {/* Product grid */}
      <div className={styles.grid}>
        {filteredAndSortedProducts.length === 0 ? (
          <p className={styles.emptyMsg}>No products match those filters.</p>
        ) : (
          filteredAndSortedProducts.map((item) => (
            <ProductCard
              key={`${item.name}-${item.category}`}
              product={item}
              onCustomize={setSelectedProduct}
            />
          ))
        )}
      </div>

      {/* Same customize popup as every other page: real sizes, prices, quantity, allergens */}
      {selected && selectedProduct && (
        <CustomizeModal product={selected} breadcrumb={selectedProduct.category} onClose={closeModal} />
      )}
    </div>
  );
}

export default function ProductGrid() {
  return (
    <ProductProvider>
      <Header />
      <CatalogContent />
      <Footer />
    </ProductProvider>
  );
}