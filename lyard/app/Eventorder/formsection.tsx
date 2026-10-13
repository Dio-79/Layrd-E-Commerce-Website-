"use client";

import { useForm } from "react-hook-form";
import { useEventOrder, type EventSelection } from "@/app/context/EventOrdercontext";

export default function Selections() {
  const { selection, setSelection } = useEventOrder();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EventSelection>({
    mode: "onBlur",
    defaultValues: selection ?? undefined,
  });

  const onSubmit = (data: EventSelection) => {
    setSelection(data);
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <form id="selection-form" onSubmit={handleSubmit(onSubmit)}>
      <p>Quantity</p>
      <input
        {...register("number", { required: "Enter a quantity" })}
        placeholder="100"
      />
      {errors.number && <span>{errors.number.message}</span>}

      <input
        type="date"
        {...register("Starttime", {
          required: "Enter date of pick up",
          validate: (v) => v >= today || "Pick-up date cannot be in the past",
        })}
      />
      {errors.Starttime && <span>{errors.Starttime.message}</span>}

      <p>Event Order</p>
      <input
        {...register("type", { required: "Enter the event type" })}
        placeholder="Wedding"
      />
      {errors.type && <span>{errors.type.message}</span>}
    </form>
  );
}