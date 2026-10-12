"use client";

import Footer from "../components/Footer";
import Header from "../components/Header";
import styles from "./mainpage.module.css";
import Sidebar from "./sidebar";
import CatalogHeader from "./sorting";
import { ProductProvider, useProducts } from "@/app/context/productcontext";

function CatalogContent() {
  const { filteredAndSortedProducts, selectedProduct, setSelectedProduct } = useProducts();

  return (
    <div className={styles.container}>
      <header className={styles.headerBar}>
        <h1 className={styles.mainTitle}>OUR COLLECTION</h1>
        <div className={styles.headerMeta}>
          <CatalogHeader />
        </div>
      </header>

      <aside>
        <Sidebar />
      </aside>

      <div className={styles.grid}>
        {filteredAndSortedProducts.map((product) => (
          <div key={product.name} onClick={() => setSelectedProduct(product)} className={styles.card}>
            <h3>{product.name}</h3>
            <p>${product.price}</p>
          </div>
        ))}
      </div>
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