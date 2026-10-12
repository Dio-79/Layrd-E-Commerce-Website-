"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { products } from "@/lib/data";
import { getPrice } from "@/lib/dataSize";

export type Product = (typeof products)[number];

export const SLOT_COUNT = 6;
export const SIZES = ["Small", "Regular", "Large"] as const;

// ---- helpers (adjust field names to match your data) ----
export const getProductId = (p: Product) => ("id" in p ? Number(p.id) : 0);
export const getProductName = (p: Product) => ("name" in p ? String(p.name) : "Item");
export const getBasePrice = (p: Product) => ("price" in p ? Number(p.price) : 0);
export const getProductImage = (p: Product) => {
  const record = p as unknown as Record<string, unknown>;
  const imageUrl = typeof record.imageUrl === "string" ? record.imageUrl : undefined;
  const image = typeof record.image === "string" ? record.image : undefined;
  const images = Array.isArray(record.images)
    ? record.images.filter((item): item is string => typeof item === "string")
    : [];

  return imageUrl || image || images[0] || "";
};
export const findProduct = (id: number | null) =>
  id === null ? undefined : products.find((p) => getProductId(p) === id);

export const getUnitPrice = (p: Product, size: string) => {
  const sized = getPrice(p, size);
  return sized && sized > 0 ? Number(sized) : getBasePrice(p);
};

interface BundleContextType {
  slots: (number | null)[];      // productId per slot, null = empty
  size: string;
  quantity: number;
  activeSlot: number | null;     // slot whose picker modal is open
  unitPrice: number;             // price of one bundle at the chosen size
  total: number;                 // unitPrice * quantity
  openPicker: (slotIndex: number) => void;
  closePicker: () => void;
  selectProduct: (productId: number) => void;  // fills the active slot
  fillEmptySlots: (productId: number) => void;
  clearSlot: (slotIndex: number) => void;
  setSize: (size: string) => void;
  setQuantity: (q: number) => void;
  reset: () => void;
}

const BundleContext = createContext<BundleContextType | undefined>(undefined);

export function BundleProvider({ children }: { children: ReactNode }) {
  const [slots, setSlots] = useState<(number | null)[]>(Array(SLOT_COUNT).fill(null));
  const [size, setSize] = useState<string>("Small");
  const [quantity, setQuantityState] = useState<number>(1);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const openPicker = (i: number) => setActiveSlot(i);
  const closePicker = () => setActiveSlot(null);

  const selectProduct = (productId: number) => {
    if (activeSlot === null) return;
    setSlots((prev) => prev.map((s, i) => (i === activeSlot ? productId : s)));
    setActiveSlot(null);
  };

  const fillEmptySlots = (productId: number) =>
    setSlots((prev) => prev.map((s) => (s === null ? productId : s)));

  const clearSlot = (i: number) =>
    setSlots((prev) => prev.map((s, idx) => (idx === i ? null : s)));

  const setQuantity = (q: number) => setQuantityState(Math.max(1, q));

  const reset = () => {
    setSlots(Array(SLOT_COUNT).fill(null));
    setSize("Small");
    setQuantityState(1);
    setActiveSlot(null);
  };

  const unitPrice: number = slots.reduce<number>((sum, id) => {
    const p = findProduct(id);
    return p ? sum + getUnitPrice(p, size) : sum;
  }, 0);

  return (
    <BundleContext.Provider
      value={{
        slots, size, quantity, activeSlot, unitPrice,
        total: unitPrice * quantity,
        openPicker, closePicker, selectProduct, fillEmptySlots,
        clearSlot, setSize, setQuantity, reset,
      }}
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