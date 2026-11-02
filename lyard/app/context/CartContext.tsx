"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { cartKey, type CartItem, type Product } from "@/app/types/models";

const STORAGE_KEY = "layrd:cart:v1";

interface CartContextType {
  items: CartItem[];
  /** false until the saved cart has been loaded in the browser */
  hydrated: boolean;
  /** total number of units in the bag (used for the bag icon badge) */
  itemCount: number;
  /** Adds to the line with the same product, size, flavor and group (or starts a new one). */
  addItem: (product: Product, quantity?: number, options?: LineOptions) => void;
  /** The line functions take the line's key: cartKey(item), or an order line's id without "bag:". */
  removeItem: (key: string) => void;
  increaseQuantity: (key: string) => void;
  decreaseQuantity: (key: string) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export type LineOptions = Pick<CartItem, "size" | "flavor" | "group">;

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  // Start empty so the server and the first browser render match
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load the saved cart once, after the first render
  useEffect(() => {
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        const saved = raw ? JSON.parse(raw) : [];
        if (!cancelled && Array.isArray(saved)) setItems(saved as CartItem[]);
      } catch {
        /* ignore unreadable or blocked storage */
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, []);

  // Save on every change, but only after the saved cart has loaded
  // (otherwise the empty starting cart would overwrite it)
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore quota / private-mode errors */
    }
  }, [items, hydrated]);

  function addItem(product: Product, quantity: number = 1, options: LineOptions = {}) {
    const qty = Math.max(1, Math.floor(quantity));
    const line: CartItem = { product, quantity: qty, ...options };
    const key = cartKey(line);
    setItems((prevItems) => {
      if (prevItems.some((i) => cartKey(i) === key)) {
        return prevItems.map((i) => (cartKey(i) === key ? { ...i, quantity: i.quantity + qty } : i));
      }
      return [...prevItems, line];
    });
  }

  function removeItem(key: string) {
    setItems((prevItems) => prevItems.filter((i) => cartKey(i) !== key));
  }

  function increaseQuantity(key: string) {
    setItems((prevItems) => prevItems.map((i) => (cartKey(i) === key ? { ...i, quantity: i.quantity + 1 } : i)));
  }

  function decreaseQuantity(key: string) {
    setItems((prevItems) =>
      prevItems.map((i) => (cartKey(i) === key ? { ...i, quantity: i.quantity - 1 } : i)).filter((i) => i.quantity > 0)
    );
  }

  function clearCart() {
    setItems([]);
  }

  function getTotal(): number {
    return items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  }

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        hydrated,
        itemCount,
        addItem,
        removeItem,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        getTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside a CartProvider");
  return context;
}