"use client";

import { useState, useMemo } from "react";
import { products } from "@/lib/data";
import styles from "./CatalogHeader.module.css";

// Type definition for catalog items
export interface Item {
  id?: string | number;
  name: string;
  price: number;
  popularity?: number;
  dateAdded?: string | Date;
}

export interface CatalogHeaderProps {
  items?: Item[];
}

export default function CatalogHeader({ items = products }: CatalogHeaderProps) {
  const [sortBy, setSortBy] = useState<string>("Newest");

  const sortedItems = useMemo(() => {
    const list = [...items];
    switch (sortBy) {
      case "Price: Low to High":
        return list.sort((a, b) => a.price - b.price);
      case "Price: High to Low":
        return list.sort((a, b) => b.price - a.price);
      case "Name: A to Z":
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case "Popular":
        return list.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
      case "Newest":
      default:
        return list.sort(
          (a, b) =>
            new Date(b.dateAdded ?? 0).getTime() -
            new Date(a.dateAdded ?? 0).getTime()
        );
    }
  }, [items, sortBy]);

  return (
    <div className={styles.container}>
      {/* Header bar showing item count and sort selector */}
      <div className={styles.headerBar}>
        <span className={styles.itemCount}>Showing {sortedItems.length} items</span>

        <div className={styles.sortGroup}>
          <label htmlFor="sort-select" className={styles.sortLabel}>
            SORT BY:{" "}
          </label>
          <select
            id="sort-select"
            className={styles.sortSelect}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="Newest">Newest</option>
            <option value="Price: Low to High">Price: Low to High</option>
            <option value="Price: High to Low">Price: High to Low</option>
            <option value="Name: A to Z">Name: A to Z</option>
            <option value="Popular">Popular</option>
          </select>
        </div>
      </div>

      {/* Output list displaying all items in sorted order */}
      <div>
        <h3 className={styles.sectionTitle}>Product Items</h3>
        <ul className={styles.productList}>
          {sortedItems.map((item: Item) => (
            <li key={item.id ?? item.name} className={styles.productCard}>
              <span className={styles.productName}>{item.name}</span>
              <span className={styles.productPrice}>${item.price.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}