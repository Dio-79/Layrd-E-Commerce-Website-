"use client";

import { useId, useRef, type KeyboardEvent } from "react";

type SizeSelectorProps = {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
};

export default function SizeSelector({ options, value, onChange, label = "Size" }: SizeSelectorProps) {
  const labelId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  // Radio-group keyboard pattern: arrow keys move and select.
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step =
      event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (index + step + options.length) % options.length;
    onChange(options[next]);
    refs.current[next]?.focus();
  }

  return (
    <div>
      <span id={labelId} className="mb-4 block text-label uppercase text-foreground">
        {label}
      </span>
      <div role="radiogroup" aria-labelledby={labelId} className="grid auto-cols-fr grid-flow-col gap-6 max-md:gap-3">
        {options.map((option, i) => {
          const selected = option === value;
          return (
            <button
              key={option}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(option)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`min-h-11 border border-black px-2 text-button uppercase focus-visible:shadow-focus focus-visible:outline-none max-md:text-base max-md:tracking-[0.08em] ${
                selected ? "bg-black text-on-dark" : "bg-background text-foreground hover:bg-black hover:text-on-dark"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
