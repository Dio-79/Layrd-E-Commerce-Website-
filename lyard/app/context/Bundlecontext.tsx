"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { products } from "@/lib/data";
import { getSizes, getPrice } from "@/lib/dataSize";

export type Product = (typeof products)[number];

export const SLOT_COUNT = 6;
export const FLAVORS = ["Black", "Sugar", "Stevia", "Brown-Sugar"] as const;

// Only used when a product has no sizes in dataSize
export const FALLBACK_SIZES = ["Small", "Regular", "Large"];
const FALLBACK_MULTIPLIER: Record<string, number> = {
  small: 1,
  regular: 1.25,
  large: 1.5,
};

export interface SlotData {
  productId: number;
  flavor: string; // "" until the customer picks one
  size: string;
  quantity: number;
}

// ---- helpers (adjust field names to match your data) ----
export const getProductId = (p: Product) => {
  const x = p as any;
  const id = x.id ?? x.productID ?? x.productId;
  return id !== undefined ? Number(id) : products.indexOf(p) + 1;
};
export const getProductName = (p: Product) => ("name" in p ? String(p.name) : "Item");
export const getBasePrice = (p: Product) => ("price" in p ? Number(p.price) : 0);
export const getProductImage = (p: Product) => {
  const x = p as any;
  return x.imageUrl || x.image || x.images?.[0] || "";
};
export const findProduct = (id: number | null | undefined) =>
  id == null ? undefined : products.find((p) => getProductId(p) === id);

// Sizes this product actually supports (from your dataSize file)
export const getProductSizes = (p: Product): string[] => {
  const sizes = getSizes(getProductId(p)) ?? [];
  return sizes.length > 0 ? sizes.map((s) => String(s)) : [...FALLBACK_SIZES];
};

// Price of ONE unit at a given size
export const getUnitPrice = (p: Product, size: string) => {
  const sized = Number(getPrice(p, size));
  if (Number.isFinite(sized) && sized > 0) return sized;
  // getPrice had nothing for this size: scale the base price
  return getBasePrice(p) * (FALLBACK_MULTIPLIER[size.toLowerCase()] ?? 1);
};

interface BundleContextType {
  slots: (SlotData | null)[];
  quantity: number;          // how many of the whole bundle
  activeSlot: number | null; // slot whose picker modal is open
  unitPrice: number;         // price of ONE bundle (all filled slots)
  total: number;             // unitPrice * quantity
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

  // Fills the active slot. On Change, keeps flavor/qty and keeps size if the new product supports it.
  const selectProduct = (productId: number) => {
    if (activeSlot === null) return;
    const product = findProduct(productId);
    const sizes = product ? getProductSizes(product) : FALLBACK_SIZES;

    setSlots((prev) =>
      prev.map((s, i) => {
        if (i !== activeSlot) return s;
        const keepSize = s && sizes.includes(s.size) ? s.size : sizes[0];
        return {
          flavor: s?.flavor ?? "",
          quantity: s?.quantity ?? 1,
          size: keepSize,
          productId,
        };
      })
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