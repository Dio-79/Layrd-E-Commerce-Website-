"use client";

import { useProducts } from "@/app/context/productcontext"; // 1. Import the hook
import "./sorting.css";

export default function CatalogHeader() {
  const { sortBy, setSortBy, filteredAndSortedProducts } = useProducts(); // 2. Grab context values

  return (
    <div className="container">
      <div className="headerBar">
        {/* Dynamic count reflecting active filters */}
        <span className="itemCount">Showing {filteredAndSortedProducts.length} items</span>

        <div className="sortGroup">
          <label htmlFor="sort-select" className="sortLabel">
            SORT BY:{" "}
          </label>
          <select
            id="sort-select"
            className="sortSelect"
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
    </div>
  );
}