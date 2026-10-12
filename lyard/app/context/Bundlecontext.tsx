"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { products } from "@/lib/data";
import { getPrice } from "@/lib/dataSize";

export type Product = (typeof products)[number];

export const SLOT_COUNT = 6;
export const SIZES = ["Small", "Regular", "Large"] as const;
export const FLAVORS = ["Black", "Sugar", "Stevia", "Brown-Sugar"] as const;

export interface SlotData {
  productId: number;
  flavor: string;   // "" until the customer picks one
  size: string;
  quantity: number;
}

// ---- helpers (adjust field names to match your data) ----
export const getProductId = (p: Product) => ("id" in p ? Number(p.id) : 0);
export const getProductName = (p: Product) => ("name" in p ? String(p.name) : "Item");
export const getBasePrice = (p: Product) => ("price" in p ? Number(p.price) : 0);
export const getProductImage = (p: Product) => {
  const productWithImage = p as Product & {
    imageUrl?: string;
    image?: string;
    images?: string[];
  };

  return productWithImage.imageUrl ?? productWithImage.image ?? productWithImage.images?.[0] ?? "";
};
export const findProduct = (id: number | null | undefined) =>
  id == null ? undefined : products.find((p) => getProductId(p) === id);

export const getUnitPrice = (p: Product, size: string) => {
  const sized = getPrice(p, size);
  return sized && sized > 0 ? Number(sized) : getBasePrice(p);
};

interface BundleContextType {
  slots: (SlotData | null)[];
  quantity: number;              // how many of the whole bundle
  activeSlot: number | null;     // slot whose picker modal is open
  unitPrice: number;             // price of ONE bundle (all slots)
  total: number;                 // unitPrice * quantity
  openPicker: (slotIndex: number) => void;
  closePicker: () => void;
  selectProduct: (productId: number) => void;
  updateSlot: (slotIndex: number, patch: Partial<Omit<SlotData, "productId">>) => void;
  clearSlot: (slotIndex: number) => void;
  setQuantity: (q: number) => void;
  reset: () => void;
}

const BundleContext = createContext<BundleContextType | undefined>(undefined);

export function BundleProvider({ children }: { children: ReactNode }) {
  const [slots, setSlots] = useState<(SlotData | null)[]>(Array(SLOT_COUNT).fill(null));
  const [quantity, setQuantityState] = useState<number>(1);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const openPicker = (i: number) => setActiveSlot(i);
  const closePicker = () => setActiveSlot(null);

  // Fills the active slot. If the slot already had options (Change), keep them.
  const selectProduct = (productId: number) => {
    if (activeSlot === null) return;
    setSlots((prev) =>
      prev.map((s, i) =>
        i === activeSlot
          ? { flavor: "", size: "Small", quantity: 1, ...(s ?? {}), productId }
          : s
      )
    );
    setActiveSlot(null);
  };

  const updateSlot = (
    slotIndex: number,
    patch: Partial<Omit<SlotData, "productId">>
  ) => {
    setSlots((prev) =>
      prev.map((s, i) => {
        if (i !== slotIndex || !s) return s;
        const next = { ...s, ...patch };
        if (patch.quantity !== undefined) next.quantity = Math.max(1, patch.quantity);
        return next;
      })
    );
  };

  const clearSlot = (i: number) =>
    setSlots((prev) => prev.map((s, idx) => (idx === i ? null : s)));

  const setQuantity = (q: number) => setQuantityState(Math.max(1, q));

  const reset = () => {
    setSlots(Array(SLOT_COUNT).fill(null));
    setQuantityState(1);
    setActiveSlot(null);
  };

  const unitPrice = slots.reduce((sum, s) => {
    if (!s) return sum;
    const p = findProduct(s.productId);
    return p ? sum + getUnitPrice(p, s.size) * s.quantity : sum;
  }, 0);

  return (
    <BundleContext.Provider
      value={{
        slots,
        quantity,
        activeSlot,
        unitPrice,
        total: unitPrice * quantity,
        openPicker,
        closePicker,
        selectProduct,
        updateSlot,
        clearSlot,
        setQuantity,
        reset,
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