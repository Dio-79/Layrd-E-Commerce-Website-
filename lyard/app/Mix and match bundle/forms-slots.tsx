"use client";

import { useForm } from "react-hook-form";
import React from "react";
import styles from "./forms-slots.module.css";

export default function SelectionForms() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data: Record<string, unknown>) => console.log(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.formContainer}>
      <label htmlFor="flavor-slot" className={styles.fieldLabel}>
        Select Flavors per Slot
      </label>
      <select
        id="flavor-slot"
        defaultValue=""
        className={styles.styledSelect}
        {...register("flavorSlot", { required: "Please select a flavor" })}
      >
        <option value="">Select</option>
        <option value="vanilla">Vanilla</option>
        <option value="chocolate">Chocolate</option>
        <option value="strawberry">Strawberry</option>
      </select>
      {errors.flavorSlot && (
        <span className={styles.errorMessage}>{String(errors.flavorSlot.message)}</span>
      )}
      <button type="submit" className={styles.submitBtn}>
        Submit
      </button>
    </form>
  );
}