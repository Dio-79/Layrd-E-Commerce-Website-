"use client";

import { useProducts } from "@/app/context/productcontext";
import { FilterState } from "@/app/types/models";
import styles from "./sidebar.module.css";

export default function Sidebar() {
  // Grab filters and setFilters directly from context
  const { filters, setFilters } = useProducts();

  // Filter static options matching UI requirements
  const categoryOptions = ["Cakes", "Coffee", "Bundles", "Limited"];
  const priceOptions = [
    { id: "under-5", label: "Under $5" },
    { id: "6-15", label: "$6-15" },
    { id: "15-plus", label: "$15+" },
  ];
  const sizeOptions = ["150ml", "100ml", "50ml", "4-Pack", "6+ Pack"];
  const flavorOptions = ["Fruity", "Cookie", "Chocolatey", "Classic", "Creamy"];

  const handleToggle = (key: keyof FilterState, value: string) => {
    const currentList = filters[key] as string[];
    const updatedList = currentList.includes(value)
      ? currentList.filter((item) => item !== value)
      : [...currentList, value];

    setFilters({
      ...filters,
      [key]: updatedList,
    });
  };

  const handlePriceInputChange = (field: "minPrice" | "maxPrice", val: string) => {
    setFilters({
      ...filters,
      [field]: val,
    });
  };

  return (
    <div className={styles.sidebar}>
      {/* Category Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Categories</h3>
        <div className={styles.optionsGroup}>
          {categoryOptions.map((cat) => (
            <label key={cat} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={filters.categories.includes(cat)}
                onChange={() => handleToggle("categories", cat)}
              />
              <span>{cat}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Price</h3>
        <div className={styles.optionsGroup}>
          {priceOptions.map((opt) => (
            <label key={opt.id} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={filters.priceRanges.includes(opt.id)}
                onChange={() => handleToggle("priceRanges", opt.id)}
              />
              <span>{opt.label}</span>
            </label>
          ))}

          {/* Custom Min / Max Price Inputs */}
          <div className={styles.priceInputs}>
            <input
              type="number"
              className={styles.priceInput}
              placeholder="Min"
              aria-label="Minimum price"
              value={filters.minPrice}
              onChange={(e) => handlePriceInputChange("minPrice", e.target.value)}
            />
            <span className={styles.priceDivider}>-</span>
            <input
              type="number"
              className={styles.priceInput}
              placeholder="Max"
              aria-label="Maximum price"
              value={filters.maxPrice}
              onChange={(e) => handlePriceInputChange("maxPrice", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Size Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Size</h3>
        <div className={styles.optionsGroup}>
          {sizeOptions.map((sz) => (
            <label key={sz} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={filters.sizes.includes(sz)}
                onChange={() => handleToggle("sizes", sz)}
              />
              <span>{sz}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Flavor Profile Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Flavor Profile</h3>
        <div className={styles.optionsGroup}>
          {flavorOptions.map((flavor) => (
            <label key={flavor} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={filters.flavorProfiles.includes(flavor)}
                onChange={() => handleToggle("flavorProfiles", flavor)}
              />
              <span>{flavor}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}