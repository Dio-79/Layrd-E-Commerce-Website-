import type { OrderLine } from "./checkoutStore";

/** Alberta GST. Change this if you charge a different rate. */
export const TAX_RATE = 0.05;

export interface PromoCode {
  code: string;
  label: string;
  type: "percent" | "amount";
  value: number;
}

/** Dummy promo codes. Replace with a lookup against your backend. */
export const PROMO_CODES: PromoCode[] = [
  { code: "LAYRD10", label: "10% off", type: "percent", value: 10 },
  { code: "WELCOME5", label: "$5 off", type: "amount", value: 5 },
];

export function findPromo(code: string): PromoCode | null {
  const clean = code.trim().toUpperCase();
  return PROMO_CODES.find((p) => p.code === clean) ?? null;
}

const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export const formatMoney = (n: number) => `$${n.toFixed(2)}`;

export function formatDate(isoDate: string): string {
  if (!isoDate) return "";
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export interface Totals {
  itemCount: number;
  /** Subtotal at regular (non-sale) prices */
  originalSubtotal: number;
  /** Subtotal at the prices the customer actually pays */
  subtotal: number;
  discount: number;
  /** null = not calculated yet (delivery chosen, address not entered) */
  shipping: number | null;
  tax: number;
  total: number;
}

export function calculateTotals(
  lines: OrderLine[],
  shipping: number | null,
  promo: PromoCode | null
): Totals {
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  const originalSubtotal = round(
    lines.reduce((sum, l) => sum + (l.originalUnitPrice ?? l.unitPrice) * l.quantity, 0)
  );
  const subtotal = round(lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0));

  let discount = 0;
  if (promo) {
    discount =
      promo.type === "percent" ? round((subtotal * promo.value) / 100) : Math.min(promo.value, subtotal);
  }

  const ship = shipping ?? 0;
  // Tax applies to the discounted subtotal plus the delivery fee.
  const tax = round((subtotal - discount + ship) * TAX_RATE);
  const total = round(subtotal - discount + ship + tax);

  return { itemCount, originalSubtotal, subtotal, discount, shipping, tax, total };
}