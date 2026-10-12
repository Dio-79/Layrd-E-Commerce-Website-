"use client";

import React from "react";
import { products } from "@/lib/data";
import { useBundle } from "@/app/context/Bundlecontext";
import styles from "./button.module.css";

export default function Button() {
  const { items, addItem, clearAll } = useBundle();

  return (
    <div className={styles.addMoreWrap}>
      <button
        type="button"
        className={styles.addBtn}
        onClick={() => {
          const product = products[0];
          if (product) addItem(product);
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
        <button type="button" className={styles.cancelBtn} onClick={clearAll}>
          Cancel Slots
        </button>
      )}
    </div>
  );
}