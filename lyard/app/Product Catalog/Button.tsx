import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** primary = black fill (Add to bag); outline = black border on white. */
  variant?: "primary" | "outline";
  /** Appends a → after the label. */
  arrow?: boolean;
};

const base =
  "inline-flex min-h-14 items-center justify-center gap-3 whitespace-nowrap border border-black px-8 text-button uppercase " +
  "focus-visible:shadow-focus focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40";

const variants = {
  primary: "bg-black text-on-dark",
  outline: "bg-background text-foreground hover:bg-black hover:text-on-dark",
};

export default function Button({
  variant = "primary",
  arrow = false,
  type = "button",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
      {arrow ? (
        <span aria-hidden="true" className="-mr-[0.18em]">
          →
        </span>
      ) : null}
    </button>
  );
}
