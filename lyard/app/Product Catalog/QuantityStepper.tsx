"use client";

import { useId } from "react";
import Icon from "@/app/components/Icon";

type QuantityStepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
};

const stepButton =
  "grid h-full place-items-center text-foreground focus-visible:shadow-focus focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40";

export default function QuantityStepper({ value, onChange, min = 1, max = 99, label = "Qty" }: QuantityStepperProps) {
  const labelId = useId();
  const set = (next: number) => onChange(Math.min(max, Math.max(min, next)));

  return (
    <div>
      <span id={labelId} className="mb-1 block text-label-sm uppercase text-foreground">
        {label}
      </span>
      <div
        role="group"
        aria-labelledby={labelId}
        className="grid h-14 w-33 grid-cols-[1fr_auto_1fr] items-center border border-line bg-background"
      >
        <button type="button" aria-label="Decrease quantity" disabled={value <= min} onClick={() => set(value - 1)} className={stepButton}>
          <Icon name="minus" size={20} />
        </button>
        <output aria-live="polite" className="min-w-[2ch] text-center text-base">
          {value}
        </output>
        <button type="button" aria-label="Increase quantity" disabled={value >= max} onClick={() => set(value + 1)} className={stepButton}>
          <Icon name="plus" size={20} />
        </button>
      </div>
    </div>
  );
}
