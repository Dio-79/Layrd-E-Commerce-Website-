"use client";

import type { availableOptions, Filters } from "@/lib/catelog/data";
import styles from "./sidebar.module.css";

type Options = ReturnType<typeof availableOptions>;

type Props = {
  /** Only the filter options that exist in the product data */
  options: Options;
  filters: Filters;
  minPrice: string;
  maxPrice: string;
  onToggle: (key: keyof Filters, value: string) => void;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
};

export default function Sidebar({
  options,
  filters,
  minPrice,
  maxPrice,
  onToggle,
  onMinPriceChange,
  onMaxPriceChange,
}: Props) {
  const groups: { title: string; key: keyof Filters; items: { value: string; label: string }[] }[] = [
    { title: "Categories", key: "categories", items: options.categories.map((c) => ({ value: c, label: c })) },
    { title: "Price", key: "prices", items: options.prices.map((r) => ({ value: r.id, label: r.label })) },
    { title: "Size", key: "sizes", items: options.sizes.map((s) => ({ value: s, label: s })) },
    { title: "Flavor Profile", key: "flavors", items: options.flavors.map((f) => ({ value: f, label: f })) },
  ];

  return (
    <div className={styles.sidebar}>
      {groups.map(
        (g) =>
          g.items.length > 0 && (
            <div key={g.key} className={styles.section}>
              <h3 className={styles.sectionTitle}>{g.title}</h3>
              <div className={styles.optionsGroup}>
                {g.items.map((item) => (
                  <label key={item.value} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={(filters[g.key] as string[]).includes(item.value)}
                      onChange={() => onToggle(g.key, item.value)}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}

                {/* Custom Min / Max Price Inputs */}
                {g.key === "prices" && (
                  <div className={styles.priceInputs}>
                    <input
                      type="number"
                      className={styles.priceInput}
                      placeholder="Min"
                      aria-label="Minimum price"
                      min={0}
                      value={minPrice}
                      onChange={(e) => onMinPriceChange(e.target.value)}
                    />
                    <span className={styles.priceDivider}>-</span>
                    <input
                      type="number"
                      className={styles.priceInput}
                      placeholder="Max"
                      aria-label="Maximum price"
                      min={0}
                      value={maxPrice}
                      onChange={(e) => onMaxPriceChange(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          )
      )}
    </div>
  );
}