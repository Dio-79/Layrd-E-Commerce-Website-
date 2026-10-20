"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useEventOrder } from "@/app/context/EventOrdercontext";
import { MIN_LEAD_DAYS, earliestEventDate } from "@/lib/eventDates";
import styles from "./event.module.css";

type EventDetails = {
  number?: number | string;
  Starttime?: string;
  type?: string;
  [key: string]: unknown;
};

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
    handleSubmit,
    formState: { errors },
  } = useForm<EventDetails>({ mode: "onBlur", defaultValues: details });
  const watchedValues = useWatch({ control });

  // Same lead time the checkout page enforces, so a date that passes here
  // never gets rejected one step later[cite: 4].
  const earliest = earliestEventDate();

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
    <form
      id="selection-form"
      className={styles.fields}
      // handleSubmit runs validation and shows the inline messages. The
      // "Continue to checkout" button calls form.requestSubmit() to trigger it[cite: 4].
      onSubmit={handleSubmit(() => undefined)}
      noValidate
    >
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
          min={earliest}
          aria-invalid={!!errors.Starttime}
          {...register("Starttime", {
            required: "Enter the date of your event",
            validate: (v) => {
              if (!v) return true;
              return v >= earliest || `Event orders need at least ${MIN_LEAD_DAYS} days notice`;
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
    </form>
  );
}