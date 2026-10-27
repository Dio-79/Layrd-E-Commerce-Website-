"use client";

import styles from "./sorting.module.css";
import { SORT_OPTIONS, type SortOption } from "./sortProducts";

type Props = {
  count: number;
  sortBy: SortOption;
  onSortChange: (sortBy: SortOption) => void;
};

export default function CatalogHeader({ count, sortBy, onSortChange }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.headerBar}>
        <span className={styles.itemCount}>
          Showing {count} {count === 1 ? "item" : "items"}
        </span>

        <div className={styles.sortGroup}>
          <label htmlFor="sort-select" className={styles.sortLabel}>
            SORT BY:{" "}
          </label>
          <select
            id="sort-select"
            className={styles.sortSelect}
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}