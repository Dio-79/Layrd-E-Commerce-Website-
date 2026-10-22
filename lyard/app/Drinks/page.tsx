"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/app/types/models";
import { useCart } from "@/app/context/CartContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
// Reuses the Cake in a Can page's styles so both pages look identical.
import styles from "../Mainpage/mainpage.module.css";
import {
  availableOptions,
  EMPTY_FILTERS,
  filterProducts,
  getProductsBySection,
  type CatalogProduct,
  type Filters,
} from "@/lib/catelog/data";
import { getSizes, getPrice } from "@/lib/catelog/dataSize";
import { getAllergenInfo, ALLERGY_DISCLAIMER } from "@/lib/catelog/dataAllergens";

/* ------------------------------------------------------------------ */
/* Sorting                                                             */
/* ------------------------------------------------------------------ */

const SORTS = ["Newest", "Price: Low to High", "Price: High to Low", "Name: A to Z", "Popular"] as const;
type SortOption = (typeof SORTS)[number];

function sortProducts(list: CatalogProduct[], sortBy: SortOption): CatalogProduct[] {
  const out = [...list];
  switch (sortBy) {
    case "Price: Low to High":
      return out.sort((a, b) => a.price - b.price);
    case "Price: High to Low":
      return out.sort((a, b) => b.price - a.price);
    case "Name: A to Z":
      return out.sort((a, b) => a.name.localeCompare(b.name));
    case "Popular":
      // Items tagged POPULAR first, everything else keeps its order
      return out.sort((a, b) => Number(b.tag === "POPULAR") - Number(a.tag === "POPULAR"));
    default:
      return out.sort((a, b) => b.productID - a.productID);
  }
}

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

export default function DrinksPage() {
  const { addItem } = useCart();

  const drinks = useMemo(() => getProductsBySection("drinks"), []);
  const options = useMemo(() => availableOptions(drinks), [drinks]);

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("Newest");

  const visible = useMemo(() => {
    const min = minPrice === "" ? -Infinity : Number(minPrice);
    const max = maxPrice === "" ? Infinity : Number(maxPrice);
    const filtered = filterProducts(drinks, filters).filter((p) => p.price >= min && p.price <= max);
    return sortProducts(filtered, sortBy);
  }, [drinks, filters, minPrice, maxPrice, sortBy]);

  const toggle = (key: keyof Filters, value: string) =>
    setFilters((f) => {
      const list = f[key] as string[];
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      return { ...f, [key]: next };
    });

  /* ----------------------------- Modal ----------------------------- */
  const [selected, setSelected] = useState<CatalogProduct | null>(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);

  // Real sizes (with prices) when we have them, otherwise the single size from the product
  const sizeChoices = useMemo(() => {
    if (!selected) return [];
    return getSizes(selected.productID) ?? selected.sizes.map((label) => ({ label, price: selected.price }));
  }, [selected]);

  const openModal = (p: CatalogProduct) => {
    const sizes = getSizes(p.productID);
    const fallback = sizes?.find((s) => s.label.toLowerCase() === "medium") ?? sizes?.[0];
    setSelectedSize(fallback?.label ?? p.sizes[0] ?? "");
    setQuantity(1);
    setSelected(p);
  };

  const closeModal = () => setSelected(null);

  const unitPrice = selected ? getPrice(selected, selectedSize) : 0;
  const allergenInfo = selected ? getAllergenInfo(selected.productID) : null;

  const handleAddToCart = () => {
    if (!selected) return;
    const cartProduct = {
      productID: selected.productID,
      name: selected.name,
      price: unitPrice, // the chosen size's price
      imageUrl: selected.imageUrl,
    } as Product;

    // addItem adds 1 per call
    for (let i = 0; i < quantity; i++) addItem(cartProduct);
    closeModal();
  };

  /* ------------------------ Filter sidebar groups ------------------------ */
  const groups: { title: string; key: keyof Filters; items: { value: string; label: string }[] }[] = [
    { title: "Categories", key: "categories", items: options.categories.map((c) => ({ value: c, label: c })) },
    { title: "Price", key: "prices", items: options.prices.map((r) => ({ value: r.id, label: r.label })) },
    { title: "Size", key: "sizes", items: options.sizes.map((s) => ({ value: s, label: s })) },
    { title: "Flavor Profile", key: "flavors", items: options.flavors.map((f) => ({ value: f, label: f })) },
  ];

  return (
    <>
      <Header />

      <div className={styles.container}>
        {/* Header bar: title + count + sort */}
        <header className={styles.headerBar}>
          <h1 className={styles.mainTitle}>DRINKS</h1>
          <div className={styles.headerMeta}>
            <span style={{ fontSize: "0.85rem", color: "#666" }}>Showing {visible.length} items</span>
            <label htmlFor="drink-sort" style={{ fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.5px" }}>
              SORT BY:{" "}
            </label>
            <select
              id="drink-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              style={{ padding: "0.4rem 0.8rem", border: "1px solid #ccc", borderRadius: 4, background: "#fff" }}
            >
              {SORTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* Filter sidebar (same markup as the main page sidebar, drinks options only) */}
        <aside className={styles.sidebarSection}>
          <aside>
            {groups.map(
              (g) =>
                g.items.length > 0 && (
                  <div key={g.key}>
                    <h3>{g.title}</h3>
                    <div>
                      {g.items.map((item) => (
                        <label key={item.value}>
                          <input
                            type="checkbox"
                            checked={(filters[g.key] as string[]).includes(item.value)}
                            onChange={() => toggle(g.key, item.value)}
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}

                      {g.key === "prices" && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <input
                            type="number"
                            placeholder="Min"
                            min={0}
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                            style={{ width: "100%", padding: "0.4rem 0.6rem", border: "1px solid #ccc", borderRadius: 4 }}
                          />
                          <span>-</span>
                          <input
                            type="number"
                            placeholder="Max"
                            min={0}
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            style={{ width: "100%", padding: "0.4rem 0.6rem", border: "1px solid #ccc", borderRadius: 4 }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )
            )}
          </aside>
        </aside>

        {/* Product grid */}
        <div className={styles.grid}>
          {visible.length === 0 ? (
            <p>No drinks match those filters.</p>
          ) : (
            visible.map((item) => <ProductCard key={item.productID} product={item} onCustomize={openModal} />)
          )}
        </div>

        {/* Customize modal */}
        {selected && (
          <div className={styles.modalBackdrop} onClick={closeModal}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <button type="button" className={styles.closeModalX} onClick={closeModal} aria-label="Close">
                ✕
              </button>

              <div className={styles.modalGallery}>
                <div className={styles.modalMainImageWrapper}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selected.imageUrl} alt={selected.name} className={styles.modalMainImage} />
                </div>
              </div>

              <div className={styles.modalDetails}>
                <div className={styles.breadcrumb}>Drinks &gt; {selected.name}</div>
                <h2 className={styles.modalHeading}>{selected.name}</h2>
                <p className={styles.modalSubtitle}>{selected.description}</p>
                <div className={styles.modalPrice}>${unitPrice.toFixed(2)}</div>

                <hr className={styles.modalDivider} />

                <div className={styles.optionGroup}>
                  <span className={styles.optionLabel}>SIZE</span>
                  <div className={styles.sizeButtons}>
                    {sizeChoices.map((size) => (
                      <button
                        key={size.label}
                        type="button"
                        className={`${styles.sizeBtn} ${selectedSize === size.label ? styles.selectedSize : ""}`}
                        onClick={() => setSelectedSize(size.label)}
                      >
                        {size.label.toUpperCase()} · ${size.price}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.actionRow}>
                  <div className={styles.qtyContainer}>
                    <span className={styles.qtyLabel}>QTY</span>
                    <div className={styles.qtyControls}>
                      <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                        -
                      </button>
                      <span>{quantity}</span>
                      <button type="button" onClick={() => setQuantity(quantity + 1)}>
                        +
                      </button>
                    </div>
                  </div>

                  <button type="button" className={styles.addToBagBtn} onClick={handleAddToCart}>
                    ADD TO BAG →
                  </button>
                </div>

                <hr className={styles.modalDivider} />

                <div className={styles.productMetaNotes}>
                  {allergenInfo && allergenInfo.allergens.length > 0 && (
                    <div className={styles.noteItem}>
                      <span>ℹ️</span>
                      <span>Contains: {allergenInfo.allergens.join(", ")}.</span>
                    </div>
                  )}
                  <div className={styles.noteItem}>
                    <span>⚠️</span>
                    <span>{ALLERGY_DISCLAIMER}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}