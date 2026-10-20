"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveEventDraft } from "@/lib/eventCheckoutStore";
import { earliestEventDate, leadDaysFor } from "@/lib/eventRules";
import { products } from "@/api/data";
import { getProductId, getProductImage, useEventOrder } from "@/app/context/EventOrdercontext";
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
  const { totals, file } = useEventOrder();
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
    const units = items.reduce((sum, item) => sum + item.quantity, 0);
    const earliest = earliestEventDate(units);

    // 1. Event details. requestSubmit() makes react-hook-form show its inline
    //    messages under each field (the form's onSubmit runs handleSubmit).
    const detailsOk =
      !!selection.Starttime &&
      !!selection.type?.trim() &&
      /^[1-9]\d*$/.test(selection.number ?? "") &&
      selection.Starttime >= earliest;

    if (!detailsOk) {
      (document.getElementById("selection-form") as HTMLFormElement | null)?.requestSubmit();
      if (selection.Starttime && selection.Starttime < earliest) {
        return fail(`Orders of ${units} items need at least ${leadDaysFor(units)} days notice.`);
      }
      return fail("Please complete the event details above.");
    }

    // 2. The custom order itself
    if (items.length === 0) {
      return fail("Add at least one item to your event order.");
    }
    const missingFlavor = items.findIndex((item) => !item.selectedFlavor);
    if (missingFlavor !== -1) {
      return fail(`Choose a flavor for slot #${missingFlavor + 1}.`);
    }

    setStatus("submitting");

    // Save the event order so the checkout page can pick it up. Only the file
    // name is kept: a File can't be stored in sessionStorage.
    saveEventDraft({
      details: {
        pickupDate: selection.Starttime,
        eventType: selection.type,
        headcount: selection.number,
        comment,
        fileName: file?.name ?? null,
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

router.push("/Eventorder/Checkout");  };

  return (
    <>
      <button
        type="button"
        className={styles.submitButton}
        onClick={submitOrder}
        disabled={status === "submitting"}
      >
        {status === "submitting" ? "Submitting…" : "Continue to checkout"}
      </button>
      {status === "error" && (
        <p role="alert" className={styles.error}>
          {submitError}
        </p>
      )}
    </>
  );
}