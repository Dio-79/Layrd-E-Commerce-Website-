"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { products } from "@/lib/data";
import { getSizes } from "@/lib/dataSize";

export type Product = (typeof products)[number];

export interface BundleItem {
  id: string;
  productId: number;
  selectedSize: string;
  quantity: number;
}

interface BundleContextType {
  items: BundleItem[];
  addItem: (product: Product) => void;
  updateItem: (
    id: string,
    field: "selectedSize" | "quantity",
    value: string | number
  ) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
}

const BundleContext = createContext<BundleContextType | undefined>(undefined);

export function BundleProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BundleItem[]>([]);

  function addItem(product: Product) {
    const productId = "id" in product ? Number(product.id) : 0;
    const availableSizes = getSizes(productId) ?? [];
    const defaultSize =
      availableSizes.length > 0 ? String(availableSizes[0]) : "Standard";

    const newItem: BundleItem = {
      id: crypto.randomUUID(),
      productId,
      selectedSize: defaultSize,
      quantity: 1,
    };

    setItems((prev) => [...prev, newItem]);
  }

  function updateItem(
    id: string,
    field: "selectedSize" | "quantity",
    value: string | number
  ) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function clearAll() {
    setItems([]);
  }

  return (
    <BundleContext.Provider
      value={{ items, addItem, updateItem, removeItem, clearAll }}
    >
      {children}
    </BundleContext.Provider>
  );
}

export function useBundle() {
  const context = useContext(BundleContext);
  if (!context) throw new Error("useBundle must be used inside a BundleProvider");
  return context;
}