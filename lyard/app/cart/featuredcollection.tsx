
import { useState } from "react";
import type { Product } from "../types/models";

export default function Collection() {
  const [items, setItems] = useState<Product[]>([]);

  return <div>{items.length}</div>;
}