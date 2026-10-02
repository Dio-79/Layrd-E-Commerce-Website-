import { products } from "@/lib/data";

"use client";

import React, { useState } from "react";

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
    <div>
      <button
        type="button"
        onClick={() => {
          const product = products[0];
          if (product) handleAddMore(product);
        }}
      >
        AddMore
      </button>
      <ul>
        {items.map((item) => (
          <li key={item.id}>AddMore {item.productId}</li>
        ))}
      </ul>
      <button type="button" onClick={handleCancel}>
        Cancel
      </button>
    </div>
  );
}