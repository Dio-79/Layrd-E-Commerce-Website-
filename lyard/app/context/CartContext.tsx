"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { CartItem, Product } from "@/app/types/models";

const STORAGE_KEY = "layrd:cart:v1";

interface CartContextType {
  items: CartItem[];
  /** false until the saved cart has been loaded in the browser */
  hydrated: boolean;
  /** total number of units in the bag (used for the bag icon badge) */
  itemCount: number;
  addItem: (product: Product) => void;
  removeItem: (productID: number) => void;
  increaseQuantity: (productID: number) => void;
  decreaseQuantity: (productID: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];

      const saved = JSON.parse(raw);
      return Array.isArray(saved) ? (saved as CartItem[]) : [];
    } catch {
      /* ignore unreadable or blocked storage */
      return [];
    }
  });

  const hydrated = typeof window !== "undefined";

  // Save the cart whenever it changes (after the first load)
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore quota / private-mode errors */
    }
  }, [items, hydrated]);

  function addItem(product: Product) {
    setItems((prevItems) => {
      const existing = prevItems.find((i) => i.product.productID === product.productID);

      if (existing) {
        return prevItems.map((i) =>
          i.product.productID === product.productID ? { ...i, quantity: i.quantity + 1 } : i
        );
      }

      return [...prevItems, { product, quantity: 1 }];
    });
  }

  function removeItem(productID: number) {
    setItems((prevItems) => prevItems.filter((i) => i.product.productID !== productID));
  }

  function increaseQuantity(productID: number) {
    setItems((prevItems) =>
      prevItems.map((i) =>
        i.product.productID === productID ? { ...i, quantity: i.quantity + 1 } : i
      )
    );
  }

  function decreaseQuantity(productID: number) {
    setItems((prevItems) =>
      prevItems
        .map((i) => (i.product.productID === productID ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0)
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