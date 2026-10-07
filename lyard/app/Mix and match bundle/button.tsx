"use client";

import React, { useState } from "react";
import { products } from "@/lib/data";
import styles from "./button.module.css";

type Product = (typeof products)[number];

interface AddingItems {
  id: string;
  productId: number;
}

export default function Button() {
  const [items, setItems] = useState<AddingItems[]>([]);

  function handleAddMore(product: Product) {
    const productId = "id" in product ? Number(product.id) : 0;
    const newItem = { id: crypto.randomUUID(), productId };
    setItems((currentItems) => [...currentItems, newItem]);
  }

  function handleCancel() {
    setItems([]);
  }

  return (
    <div className={styles.addMoreWrap}>
      <button
        type="button"
        className={styles.addBtn}
        onClick={() => {
          const product = products[0];
          if (product) handleAddMore(product);
        }}
      >
        + Add More
      </button>

      {items.length > 0 && (
        <ul className={styles.itemList}>
          {items.map((item) => (
            <li key={item.id} className={styles.itemRow}>
              Slot Item #{item.productId}
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <button type="button" className={styles.cancelBtn} onClick={handleCancel}>
          Cancel Slots
        </button>
      )}
    </div>
  );
}