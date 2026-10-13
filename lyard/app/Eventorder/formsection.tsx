"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useEventOrder } from "@/app/context/EventOrdercontext";
import styles from "./event.module.css";

type EventDetails = {
  number?: number | string;
  Starttime?: string;
  type?: string;
  Flavor?: string;
  [key: string]: unknown;
};

type EventOrderValue = {
  details?: Partial<EventDetails>;
  updateDetails?: (values: Partial<EventDetails>) => void;
  registerValidator?: (
    name: string,
    validator: () => Promise<boolean> | boolean | void
  ) => void;
};

// Event-level flavors (separate from the per-slot flavors in the context)
const EVENT_FLAVORS = ["Vanilla", "Chocolate", "Strawberry", "Red Velvet", "Cookies & Cream"];

// Local date as YYYY-MM-DD (toISOString uses UTC and can be off by a day)
const todayLocal = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export default function Selections() {
  const { details, updateDetails, registerValidator } = useEventOrder() as unknown as EventOrderValue;

  // Keep the latest context functions in refs so effects never re-run because of them
  const updateRef = useRef(updateDetails);
  const registerRef = useRef(registerValidator);
  updateRef.current = updateDetails;
  registerRef.current = registerValidator;

  const {
    register,
    watch,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<EventDetails>({
    mode: "onBlur",
    defaultValues: { number: "", Starttime: "", type: "", Flavor: "", ...details },
  });

  const today = todayLocal();

  // Push values to the context only when a field changes (no render-loop)
  useEffect(() => {
    updateRef.current?.(getValues());
    const subscription = watch((values) => updateRef.current?.(values as Partial<EventDetails>));
    return () => subscription.unsubscribe();
  }, [watch, getValues]);

  // Register the validator once so Submit can run this form's checks
  useEffect(() => {
    registerRef.current?.("selection", () => trigger());
  }, [trigger]);

  return (
    <form id="selection-form" className={styles.fields} onSubmit={(e) => e.preventDefault()} noValidate>
      <label className={styles.field}>
        <span className={styles.label}>Quantity</span>
        <input
          placeholder="500"
          inputMode="numeric"
          aria-invalid={!!errors.number}
          {...register("number", {
            required: "Enter how many you need",
            pattern: { value: /^[1-9]\d*$/, message: "Use a whole number above 0" },
          })}
        />
        {errors.number && <span className={styles.error}>{errors.number.message}</span>}
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Enter Date of Event</span>
        <input
          type="date"
          min={today}
          aria-invalid={!!errors.Starttime}
          {...register("Starttime", {
            required: "Enter the date of your event",
            validate: (v) => !v || v >= today || "The date can't be in the past",
          })}
        />
        {errors.Starttime && <span className={styles.error}>{errors.Starttime.message}</span>}
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Event Type</span>
        <input
          placeholder="Wedding"
          aria-invalid={!!errors.type}
          {...register("type", { required: "Tell us what the event is" })}
        />
        {errors.type && <span className={styles.error}>{errors.type.message}</span>}
      </label>

      <label className={styles.field}>
        <select
          className={styles.select}
          aria-label="Flavors"
          aria-invalid={!!errors.Flavor}
          {...register("Flavor", { required: "Choose a flavor" })}
        >
          <option value="" disabled hidden>
            Flavors
          </option>
          {EVENT_FLAVORS.map((flavor) => (
            <option key={flavor} value={flavor}>
              {flavor}
            </option>
          ))}
        </select>
        {errors.Flavor && <span className={styles.error}>{errors.Flavor.message}</span>}
      </label>
    </form>
  );
}