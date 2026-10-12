"use client";

import { createContext, useContext, useState, useMemo } from "react";
import { ProductItem, FilterState } from "@/app/types/models";
import { products } from "@/lib/data";

interface ProductContextType {
  filteredAndSortedProducts: ProductItem[];
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  sortBy: string;
  setSortBy: (sort: string) => void;
  selectedProduct: ProductItem | null;
  setSelectedProduct: (product: ProductItem | null) => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [sortBy, setSortBy] = useState<string>("Newest");
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceRanges: [],
    minPrice: "",
    maxPrice: "",
    sizes: [],
    flavorProfiles: [],
  });

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...(products as unknown as ProductItem[])];

    if (filters.categories.length > 0) {
      result = result.filter((p) => filters.categories.includes(p.category));
    }
    if (filters.minPrice !== "") {
      result = result.filter((p) => p.price >= Number(filters.minPrice));
    }
    if (filters.maxPrice !== "") {
      result = result.filter((p) => p.price <= Number(filters.maxPrice));
    }

    switch (sortBy) {
      case "Price: Low to High":
        return result.sort((a, b) => a.price - b.price);
      case "Price: High to Low":
        return result.sort((a, b) => b.price - a.price);
      case "Name: A to Z":
        return result.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return result;
    }
  }, [filters, sortBy]);

  return (
    <ProductContext.Provider
      value={{
        filteredAndSortedProducts,
        filters,
        setFilters,
        sortBy,
        setSortBy,
        selectedProduct,
        setSelectedProduct,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) throw new Error("useProducts must be used within a ProductProvider");
  return context;
}