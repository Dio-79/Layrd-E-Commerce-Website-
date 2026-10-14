"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { products } from "@/lib/data";
import { getProductId, getProductImage, useEventOrder } from "@/app/context/EventOrdercontext";
import { addEventOrder } from "@/lib/checkoutStore";
import { ROUTES } from "@/lib/Routes";
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

export default function SubmitButton() {
  const router = useRouter();
  const { totals } = useEventOrder();
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [submitError, setSubmitError] = useState("");

  const fail = (message: string) => {
    setSubmitError(message);
    setStatus("error");
  };

  const submitOrder = () => {
    setSubmitError("");
    setStatus("idle");

    const selection = readForm("selection-form");
    const comment = readForm("comment-form").comment ?? "";
    const items = totals.detailedItems;
    const today = new Date().toISOString().split("T")[0];

    // Let react-hook-form show its inline messages for the details form
    if (!selection.Starttime || !selection.number || !selection.type) {
      (document.getElementById("selection-form") as HTMLFormElement | null)?.requestSubmit();
      return fail("Please complete the event details.");
    }
    if (selection.Starttime < today) {
      return fail("Pick-up date cannot be in the past.");
    }
    if (items.length === 0) {
      return fail("Add at least one item to your event order.");
    }
    const missingFlavor = items.findIndex((item) => !item.selectedFlavor);
    if (missingFlavor !== -1) {
      return fail(`Choose a flavor for slot #${missingFlavor + 1}.`);
    }

    setStatus("submitting");

    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');

    // Save the event order so the cart page, the bag badge and the checkout all see it
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
          flavor: item.selectedFlavor,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        };
      }),
    });

    // Go straight to the cart, where the event order shows up with the rest of the bag
    router.push(ROUTES.cart);
  };

  return (
    <div className={styles.submitWrap}>
      <button
        type="button"
        className={styles.submit}
        onClick={submitOrder}
        disabled={status === "submitting"}
      >
        {status === "submitting" ? "Sending…" : "Submit"}
      </button>
      {status === "error" && (
        <p className={styles.error} role="alert">
          {submitError}
        </p>
      )}
    </div>
  );
}