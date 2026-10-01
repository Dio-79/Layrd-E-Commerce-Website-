"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { CartItem, Product } from "@/types/models";

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productID: number) => void;
  increaseQuantity: (productID: number) => void;
  decreaseQuantity: (productID: number) => void;
  getTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  function addItem(product: Product) {
    setItems((prevItems) => {
      const existing = prevItems.find((i) => i.product.productID === product.productID);

      if (existing) {
        return prevItems.map((i) =>
          i.product.productID === product.productID
            ? { ...i, quantity: i.quantity + 1 }
            : i
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
        .map((i) =>
          i.product.productID === productID ? { ...i, quantity: i.quantity - 1 } : i
        )
        .filter((i) => i.quantity > 0)
    );
  }

  function getTotal(): number {
    return items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  }

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, increaseQuantity, decreaseQuantity, getTotal }}
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