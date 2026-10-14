"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/app/context/CartContext";
import type { Product } from "@/app/types/models";
import styles from "./AddToBagButton.module.css";

/**
 * Drop this on the main page, product pages and bundle cards.
 * It adds the product to CartContext, which is saved, so the cart,
 * the bag badge and the checkout all see it.
 */
export default function AddToBagButton({
  product,
  label = "Add to Bag",
  className,
}: {
  product: Product;
  label?: string;
  className?: string;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const handleClick = () => {
    addItem(product);
    setAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1500);
  };

  return (
    <button
      type="button"
      className={`${styles.button} ${className ?? ""}`}
      onClick={handleClick}
      aria-live="polite"
    >
      {added ? "Added ✓" : label}
    </button>
  );
}