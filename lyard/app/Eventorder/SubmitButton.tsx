"use client";

import { useEventOrder } from "@/app/context/EventOrdercontext";

// Shows what the context holds after the Submit button is pressed.
export default function OrderSummary() {
  const { order, resetOrder } = useEventOrder();

  if (!order) return null;

  return (
    <section>
      <h2>Order submitted</h2>
      <pre>{JSON.stringify(order, null, 2)}</pre>
      <button type="button" onClick={resetOrder}>
        Start a new order
      </button>
    </section>
  );
}