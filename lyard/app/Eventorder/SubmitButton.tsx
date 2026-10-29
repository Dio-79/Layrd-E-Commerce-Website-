"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { products } from "@/lib/catelog/data";
import { getProductId, getProductImage, useEventOrder } from "@/app/context/EventOrdercontext";
import { addEventOrder } from "@/lib/check-out/checkoutStore";
import { ROUTES } from "@/lib/Routes/Routes";
import styles from "./event.module.css";

/** Reads the current values of a form by id. Field names come from the register() calls. */
function readForm(id: string): Record<string, string> {
  const form = document.getElementById(id) as HTMLFormElement | null;
  if (!form) return {};
  const out: Record<string, string> = {};
  new FormData(form).forEach((value, key) => {
    if (typeof value === "string") out[key] = value;
  });
  return out;
}

// The Submit button sits outside both forms in the design. It checks the event
// details and slots, saves the event order, and sends the customer to checkout.
export default function SubmitButton() {
  const router = useRouter();
  const { totals } = useEventOrder();
  const [error, setError] = useState("");

  // Hide the message once they start fixing the details
  useEffect(() => {
    const form = document.getElementById("selection-form");
    const clear = () => setError("");
    form?.addEventListener("input", clear);
    return () => form?.removeEventListener("input", clear);
  }, []);

  const handleSubmit = () => {
    setError("");

    const selection = readForm("selection-form");
    const comment = readForm("comment-form").comment ?? "";
    const items = totals.detailedItems;
    const today = new Date().toISOString().split("T")[0];

    // Let react-hook-form show its inline messages for the details form
    if (!selection.Starttime || !selection.number || !selection.type) {
      (document.getElementById("selection-form") as HTMLFormElement | null)?.requestSubmit();
      setError("Please complete the event details.");
      return;
    }
    if (selection.Starttime < today) {
      setError("Pick-up date cannot be in the past.");
      return;
    }
    if (items.length === 0) {
      setError("Add at least one item to your event order.");
      return;
    }

    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');

    addEventOrder({
      details: {
        pickupDate: selection.Starttime,
        eventType: selection.type,
        headcount: selection.number,
        comment,
        fileName: fileInput?.files?.[0]?.name ?? null,
      },
      lines: items.map((item) => {
        const product = products.find((p) => getProductId(p) === item.productId);
        return {
          id: item.id,
          productId: item.productId,
          name: item.productName,
          image: product ? getProductImage(product) ?? null : null,
          size: item.selectedSize,
          flavor: item.selectedFlavor || undefined,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        };
      }),
    });

    router.push(ROUTES.checkout);
  };

  return (
    <>
      <button type="button" className={styles.submit} onClick={handleSubmit}>
        Submit
      </button>
      {error && (
        <span className={styles.error} role="alert">
          {error}
        </span>
      )}
    </>
  );
}