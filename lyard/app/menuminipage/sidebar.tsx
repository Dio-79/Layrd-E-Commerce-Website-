"use client";
import { FilterState } from "@/app/types/models";
import React, { useState } from "react";



interface SidebarProps {
  /** Optional filter state passed down from a parent component */
  filters?: FilterState;
  /** Optional callback function to notify parent when filters change */
  onFilterChange?: (filters: FilterState) => void;
}

export default function Sidebar({ filters: externalFilters, onFilterChange }: SidebarProps) {
  // Internal state used if no external filter state is passed in
  const [internalFilters, setInternalFilters] = useState<FilterState>({
    categories: [],
    priceRanges: [],
    minPrice: "",
    maxPrice: "",
    sizes: [],
    flavorProfiles: [],
  });

  const activeFilters = externalFilters || internalFilters;

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
    const currentList = activeFilters[key] as string[];
    const updatedList = currentList.includes(value)
      ? currentList.filter((item) => item !== value)
      : [...currentList, value];

    const updatedFilters = {
      ...activeFilters,
      [key]: updatedList,
    };

    if (onFilterChange) {
      onFilterChange(updatedFilters);
    } else {
      setInternalFilters(updatedFilters);
    }
  };

  const handlePriceInputChange = (field: "minPrice" | "maxPrice", val: string) => {
    const updatedFilters = {
      ...activeFilters,
      [field]: val,
    };

    if (onFilterChange) {
      onFilterChange(updatedFilters);
    } else {
      setInternalFilters(updatedFilters);
    }
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
                checked={activeFilters.categories.includes(cat)}
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
                checked={activeFilters.priceRanges.includes(opt.id)}
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
              value={activeFilters.minPrice}
              onChange={(e) => handlePriceInputChange("minPrice", e.target.value)}
            />
            <span>-</span>
            <input
              type="number"
              placeholder="Max"
              value={activeFilters.maxPrice}
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
                checked={activeFilters.sizes.includes(sz)}
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
                checked={activeFilters.flavorProfiles.includes(flavor)}
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