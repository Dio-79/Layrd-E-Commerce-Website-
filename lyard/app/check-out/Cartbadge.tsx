"use client";

import Link from "next/link";
import { useCart } from "@/app/context/CartContext";
import { useCheckout, useHydrated } from "@/lib/checkoutStore";
import styles from "./CartBadge.module.css";

/** Number of units in the bag: cart items, plus pending event-order items by default. */
export function useBagCount(includeEventOrders = true) {
  const { itemCount, hydrated: cartReady } = useCart();
  const { eventLines } = useCheckout();
  const storeReady = useHydrated();

  if (!cartReady || !storeReady) return 0;
  const eventCount = includeEventOrders ? eventLines.reduce((sum, l) => sum + l.quantity, 0) : 0;
  return itemCount + eventCount;
}

/**
 * Small count bubble. Put it inside the bag icon's wrapper, which needs `position: relative`.
 * Renders nothing when the bag is empty.
 */
export default function CartBadge({ includeEventOrders = true }: { includeEventOrders?: boolean }) {
  const count = useBagCount(includeEventOrders);
  if (count === 0) return null;

  return (
    <span
      key={count} /* remounts on change so the pop animation replays */
      className={styles.badge}
      role="status"
      aria-label={`${count} ${count === 1 ? "item" : "items"} in your bag`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

/** Ready-made bag icon with the badge, if you want to replace the one in your Header. */
export function BagIconLink({ href = "/cart" }: { href?: string }) {
  return (
    <Link href={href} className={styles.bagLink} aria-label="Shopping bag">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M5 8h14l-1 12H6L5 8Z M9 8V6a3 3 0 0 1 6 0v2"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <CartBadge />
    </Link>
  );
}