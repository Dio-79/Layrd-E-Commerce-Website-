"use client";

import { useEventOrder } from "@/app/context/EventOrdercontext";
import styles from "./event.module.css";

export default function SubmitButton() {
  const eventOrder = useEventOrder() as {
    submitOrder?: () => void;
    submit?: () => void;
    status?: "idle" | "submitting" | "success" | "error";
    submitError?: string | null;
  };

  const submitOrder = eventOrder.submitOrder ?? eventOrder.submit ?? (() => {});
  const status = eventOrder.status ?? "idle";
  const submitError = eventOrder.submitError ?? "";

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
      {status === "success" && <p role="status">Order sent. Well confirm by email.</p>}
    </div>
  );
}