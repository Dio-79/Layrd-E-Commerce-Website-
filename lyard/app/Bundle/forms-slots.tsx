"use client";

import { useForm } from "react-hook-form";
import { useBundle } from "@/app/context/Bundlecontext";
import styles from "./formslot.module.css";

export const FORM_ID = "flavor-form";

interface FormValues {
  flavorSlot: string;
}

interface SelectionFormsProps {
  onValid: () => void; // runs only when validation passes
}

export default function SelectionForms({ onValid }: SelectionFormsProps) {
  const { flavorOption, setFlavorOption } = useBundle();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    values: { flavorSlot: flavorOption }, // stays in sync with the context (e.g. after reset)
  });

  return (
    <form id={FORM_ID} onSubmit={handleSubmit(onValid)} className={styles.formContainer}>
      <label htmlFor="flavor-slot" className={styles.fieldLabel}>
        Select Flavors per Slot
      </label>
      <select
        id="flavor-slot"
        className={styles.styledSelect}
        {...register("flavorSlot", {
          required: "Please select a flavor",
          onChange: (e) => setFlavorOption(e.target.value),
        })}
      >
        <option value="">Select</option>
        <option value="Black">Black</option>
        <option value="Sugar">Sugar</option>
        <option value="Stevia">Stevia</option>
        <option value="Brown-Sugar">Brown-Sugar</option>
      </select>
      {errors.flavorSlot && (
        <span className={styles.errorMessage}>{String(errors.flavorSlot.message)}</span>
      )}
    </form>
  );
}