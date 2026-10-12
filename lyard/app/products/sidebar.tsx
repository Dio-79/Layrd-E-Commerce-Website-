"use client";

import { useProducts } from "@/app/context/productcontext";
import { FilterState } from "@/app/types/models";
import React from "react";
import sidebar from '@/app/products/sorting.css'
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
    <aside>
      {/* Category Section */}
      <div>
        <h3>Categories</h3>
        <div>
          {categoryOptions.map((cat) => (
            <label key={cat}>
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
      <div>
        <h3>Price</h3>
        <div>
          {priceOptions.map((opt) => (
            <label key={opt.id}>
              <input
                type="checkbox"
                checked={filters.priceRanges.includes(opt.id)}
                onChange={() => handleToggle("priceRanges", opt.id)}
              />
              <span>{opt.label}</span>
            </label>
          ))}

          {/* Custom Min / Max Price Inputs */}
          <div>
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice}
              onChange={(e) => handlePriceInputChange("minPrice", e.target.value)}
            />
            <span>-</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice}
              onChange={(e) => handlePriceInputChange("maxPrice", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Size Section */}
      <div>
        <h3>Size</h3>
        <div>
          {sizeOptions.map((sz) => (
            <label key={sz}>
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
      <div>
        <h3>Flavor Profile</h3>
        <div>
          {flavorOptions.map((flavor) => (
            <label key={flavor}>
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
    </aside>
  );
}