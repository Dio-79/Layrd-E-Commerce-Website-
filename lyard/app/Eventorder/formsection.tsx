"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useEventOrder } from "@/app/context/EventOrdercontext";
import styles from "./event.module.css";

type EventDetails = {
  number?: number | string;
  Starttime?: string;
  type?: string;
  Flavor?: string;
  [key: string]: unknown;
};

const FLAVOR_OPTIONS = [
  "Vanilla",
  "Chocolate",
  "Strawberry",
  "Red Velvet",
  "Cookies & Cream",
];

export default function Selections() {
  const eventOrder = useEventOrder() as ReturnType<typeof useEventOrder> & {
    details?: Partial<EventDetails>;
    updateDetails?: (values: Partial<EventDetails>) => void;
    registerValidator?: (
      name: string,
      validator: () => Promise<boolean> | boolean | void,
    ) => void;
  };
  const { details, registerValidator, updateDetails } = eventOrder;

  const {
    register,
    control,
    trigger,
    formState: { errors },
  } = useForm<EventDetails>({ mode: "onBlur", defaultValues: details });
  const watchedValues = useWatch({ control });

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (updateDetails) {
      updateDetails((watchedValues ?? {}) as Partial<EventDetails>);
    }
  }, [watchedValues, updateDetails]);

  useEffect(() => {
    if (registerValidator) {
      registerValidator("selection", () => trigger());
    }
  }, [registerValidator, trigger]);

  return (
    <form id="selection-form" className={styles.fields} onSubmit={(e) => e.preventDefault()}>
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
          aria-invalid={!!errors.Starttime}
          {...register("Starttime", {
            required: "Enter the date of your event",
            validate: (v) => {
              if (!v) return true;
              return v >= today || "The date can't be in the past";
            },
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
          {FLAVOR_OPTIONS.map((flavor: string) => (
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