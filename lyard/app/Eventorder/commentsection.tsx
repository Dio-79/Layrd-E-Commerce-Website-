"use client";

import { useEventOrder } from "@/app/context/EventOrdercontext";

// Shows what the context holds after the Submit button is pressed.
export default function OrderSummary() {
  const { order, eventOrder } = useEventOrder() as {
    order?: unknown;
    eventOrder?: unknown;
  };

  const currentOrder = order ?? eventOrder;

  if (!currentOrder) return null;

  return (
    <section>
      <h2>Order submitted</h2>
      <pre>{JSON.stringify(currentOrder, null, 2)}</pre>
    </section>
  );
}


