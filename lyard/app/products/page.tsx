"use client";

import { useMemo, useState } from "react";
import { Montserrat } from "next/font/google";
import {
  availableOptions,
  EMPTY_FILTERS,
  filterProducts,
  products,
  SECTIONS,
  type CatalogProduct,
  type Filters,
} from "@/lib/catelog/data";
import CustomizeModal from "@/app/components/Customizemodal";
import { toCustomizable } from "@/app/components/toCustomizable";
import Header from "../components/Header";
import Footer from "../components/Footer";
import styles from "./mainpage.module.css";
import Sidebar from "./sidebar";
import CatalogHeader from "./sorting";
import { sortProducts, type SortOption } from "./sortProducts";

// Loads the Montserrat font and exposes it as --font-montserrat (the CSS reads that variable)
// Drinks first, then cakes
const SECTION_ORDER = [...SECTIONS].sort((a, b) => (a.id === "drinks" ? -1 : b.id === "drinks" ? 1 : 0));

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

/* ------------------------------------------------------------------ */
/* Product card                                                        */
/* ------------------------------------------------------------------ */

function ProductCard({ product, onCustomize }: { product: CatalogProduct; onCustomize: (p: CatalogProduct) => void }) {
  return (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        {product.tag && (
          <div className={styles.tagBadge}>
            <span>{product.tag}</span>
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.imageUrl} alt={product.name} className={styles.productImage} />
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

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function ProductsPage() {
  // Only the filter options that actually exist in the product data
  const options = useMemo(() => availableOptions(products), []);

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("Newest");
  const [selected, setSelected] = useState<CatalogProduct | null>(null);

  const visible = useMemo(() => {
    const min = minPrice === "" ? -Infinity : Number(minPrice);
    const max = maxPrice === "" ? Infinity : Number(maxPrice);
    const filtered = filterProducts(products, filters).filter((p) => p.price >= min && p.price <= max);
    return sortProducts(filtered, sortBy);
  }, [filters, minPrice, maxPrice, sortBy]);

  const toggle = (key: keyof Filters, value: string) =>
    setFilters((f) => {
      const list = f[key] as string[];
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      return { ...f, [key]: next };
    });

  const modalProduct = useMemo(() => (selected ? toCustomizable(selected) : null), [selected]);
  const breadcrumb = selected ? (SECTIONS.find((s) => s.id === selected.section)?.label ?? "Shop") : "Shop";

  return (
    <div className={montserrat.variable}>
      <Header />

      <div className={styles.container}>
        {/* Title + count + sort */}
        <header className={styles.headerBar}>
          <h1 className={styles.mainTitle}>OUR COLLECTION</h1>
          <div className={styles.headerMeta}>
            <CatalogHeader count={visible.length} sortBy={sortBy} onSortChange={setSortBy} />
          </div>
        </header>

        {/* Filters */}
        <aside className={styles.sidebarSection} aria-label="Filters">
          <Sidebar
            options={options}
            filters={filters}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onToggle={toggle}
            onMinPriceChange={setMinPrice}
            onMaxPriceChange={setMaxPrice}
          />
        </aside>

        {/* Product grid: drinks first, then cakes, each under its own heading */}
        <div className={styles.grid}>
          {visible.length === 0 ? (
            <p className={styles.emptyMsg}>No products match those filters.</p>
          ) : (
            SECTION_ORDER.map((section) => {
              const items = visible.filter((p) => p.section === section.id);
              if (items.length === 0) return null;
              return (
                <section key={section.id} id={section.id} className={styles.sectionGroup} aria-labelledby={`h-${section.id}`}>
                  <h2 id={`h-${section.id}`} className={styles.sectionTitle}>
                    {section.label.toUpperCase()}
                  </h2>
                  <div className={styles.sectionGrid}>
                    {items.map((item) => (
                      <ProductCard key={item.productID} product={item} onCustomize={setSelected} />
                    ))}
                  </div>
                </section>
              );
            })
          )}
        </div>

        {/* Same customize popup as every other page: real sizes, prices, quantity, allergens */}
        {modalProduct && (
          <CustomizeModal product={modalProduct} breadcrumb={breadcrumb} onClose={() => setSelected(null)} />
        )}
      </div>

      <Footer />
    </div>
  );
}