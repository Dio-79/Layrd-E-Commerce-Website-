"use client";

import { useCart } from "@/app/context/CartContext";

export default function CartBadge() {
  const { items } = useCart();

  const count = (items ?? []).reduce(
    (sum: number, item: { quantity?: number }) => sum + (item.quantity ?? 1),
    0
  );

  if (count === 0) return null;

  return (
    <span
      aria-label={`${count} items in bag`}
      className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-yellow-400 px-1 text-[10px] font-bold text-black"
    >
      {count}
    </span>
  );
}