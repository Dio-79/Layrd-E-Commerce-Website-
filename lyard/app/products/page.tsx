"use client";

import { useState } from "react";
import { ProductItem, Product } from "@/app/types/models";
import { ProductProvider, useProducts } from "@/app/context/productcontext";
import { useCart } from "@/app/context/CartContext";
import styles from "./mainpage.module.css";
import Sidebar from "./sidebar";
import CatalogHeader from "./sorting";
import Header from "../components/Header";
import Footer from "../components/Footer";

interface ProductCardProps {
  product: ProductItem;
  onCustomize?: (product: ProductItem) => void;
}

type ProductWithDetails = ProductItem & {
  productID?: number | string;
  image?: string;
  images?: string[];
  shelfLife?: string;
  allergens?: string;
};

// Converts a catalog item (ProductItem) into the shape the cart uses (Product)
function toCartProduct(item: ProductItem): Product {
  const p = item as ProductWithDetails;
  const productId = Number(p.productID ?? p.id ?? 0);

  return {
    productID: productId,
    name: item.name,
    price: item.price,
    imageUrl: p.images?.[0] || p.imageUrl || p.image || "",
  } as Product;
}

// Full Product Card component
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
        <img
          src={productImage}
          alt={product.name}
          className={styles.productImage}
        />
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

function CatalogContent() {
  const { filteredAndSortedProducts, selectedProduct, setSelectedProduct } = useProducts();
  const { addItem } = useCart(); // shared cart state

  // Modal local state for interactivity
  const prod = selectedProduct as ProductWithDetails | null;
  const imagesList = prod?.images?.length ? prod.images : [prod?.imageUrl || prod?.image || ""];
  const [activeImage, setActiveImage] = useState<string>(imagesList[0]);
  const [selectedSize, setSelectedSize] = useState<string>("Small");
  const [quantity, setQuantity] = useState<number>(1);

  // Reset preview when a new product is selected
  const handleOpenModal = (item: ProductItem) => {
    const p = item as ProductWithDetails;
    const initialImg = p.images?.[0] || p.imageUrl || p.image || "";
    setActiveImage(initialImg);
    setSelectedSize("Small");
    setQuantity(1);
    setSelectedProduct(item);
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;

    const cartProduct = toCartProduct(selectedProduct);

    // Your addItem adds 1 per call, so call it once per selected quantity.
    // (Functional setState in the context makes this safe.)
    for (let i = 0; i < quantity; i++) {
      addItem(cartProduct);
    }

    setSelectedProduct(null);
  };

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <header className={styles.headerBar}>
        <h1 className={styles.mainTitle}>OUR COLLECTION</h1>
        <div className={styles.headerMeta}>
          <CatalogHeader />
        </div>
      </header>

      {/* Sidebar Section */}
      <aside className={styles.sidebarSection}>
        <Sidebar />
      </aside>

      {/* Product Grid Section */}
      <div className={styles.grid}>
        {filteredAndSortedProducts.map((item) => (
          <ProductCard
            key={`${item.name}-${item.category}`}
            product={item}
            onCustomize={handleOpenModal}
          />
        ))}
      </div>

      {/* Rich Product Detail / Customization Modal */}
      {selectedProduct && prod && (
        <div className={styles.modalBackdrop} onClick={() => setSelectedProduct(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.closeModalX}
              onClick={() => setSelectedProduct(null)}
            >
              ✕
            </button>

            {/* Left Side: Images */}
            <div className={styles.modalGallery}>
              <div className={styles.modalMainImageWrapper}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeImage || prod.imageUrl}
                  alt={prod.name}
                  className={styles.modalMainImage}
                />
              </div>
              <div className={styles.thumbnailRow}>
                {imagesList.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`${styles.thumbnailBtn} ${activeImage === imgUrl ? styles.activeThumb : ""}`}
                    onClick={() => setActiveImage(imgUrl)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgUrl} alt={`${prod.name} thumbnail ${idx}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Right Side: Product Details & Options */}
            <div className={styles.modalDetails}>
              <div className={styles.breadcrumb}>
                {prod.category} &gt; {prod.name}
              </div>

              <h2 className={styles.modalHeading}>{prod.name}</h2>
              <p className={styles.modalSubtitle}>{prod.description}</p>
              <div className={styles.modalPrice}>${prod.price.toFixed(2)}</div>

              <hr className={styles.modalDivider} />

              <p className={styles.modalExtendedDesc}>{prod.description}</p>

              {/* Size Selector */}
              <div className={styles.optionGroup}>
                <label className={styles.optionLabel}>SIZE</label>
                <div className={styles.sizeButtons}>
                  {["Small", "Regular", "Large"].map((size) => (
                    <button
                      key={size}
                      type="button"
                      className={`${styles.sizeBtn} ${selectedSize === size ? styles.selectedSize : ""}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity & Add to Bag */}
              <div className={styles.actionRow}>
                <div className={styles.qtyContainer}>
                  <span className={styles.qtyLabel}>QTY</span>
                  <div className={styles.qtyControls}>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      -
                    </button>
                    <span>{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.addToBagBtn}
                  onClick={handleAddToCart}
                >
                  ADD TO BAG →
                </button>
              </div>

              <hr className={styles.modalDivider} />

              {/* Footer Notes */}
              <div className={styles.productMetaNotes}>
                <div className={styles.noteItem}>
                  <span>📦</span>
                  <span>{prod.shelfLife || "Shelf-stable for 6 months. Best enjoyed at room temperature."}</span>
                </div>
                <div className={styles.noteItem}>
                  <span>ℹ️</span>
                  <span>{prod.allergens || "Contains: Wheat, Milk, Eggs. Produced in a facility that also processes nuts."}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
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