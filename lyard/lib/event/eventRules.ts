// lib/eventRules.ts  (no "use client": used by both the browser and the API route)

/* ---------- edit these ---------- */
export const DEPOSIT_RATE = 0.3;        // charged at checkout
export const TAX_RATE = 0.05; // Alberta GST, same as the main checkout
export const MAX_UNITS_PER_DAY = 300;   // kitchen capacity per pickup date
export const CANCEL_HOURS = 72;         // changes/cancellations allowed until this long before pickup
export const PICKUP_LOCATION = "Pickup at 123 St. NE";

// Highest tier first. Notice needed by total number of items.
export const LEAD_TIERS = [
  { minUnits: 250, days: 14 },
  { minUnits: 100, days: 7 },
  { minUnits: 25, days: 4 },
  { minUnits: 0, days: 2 },
];
/* -------------------------------- */

export const MIN_LEAD_DAYS = LEAD_TIERS[LEAD_TIERS.length - 1].days;

export type OrderStatus =
  | "requested"
  | "confirmed"
  | "in_production"
  | "ready"
  | "picked_up"
  | "cancelled";

export const STATUS_STEPS: { key: Exclude<OrderStatus, "cancelled">; label: string }[] = [
  { key: "requested", label: "Requested" },
  { key: "confirmed", label: "Confirmed" },
  { key: "in_production", label: "In production" },
  { key: "ready", label: "Ready for pickup" },
  { key: "picked_up", label: "Picked up" },
];

export const leadDaysFor = (units: number) =>
  (LEAD_TIERS.find((t) => units >= t.minUnits) ?? LEAD_TIERS[LEAD_TIERS.length - 1]).days;

const pad = (n: number) => String(n).padStart(2, "0");
export const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseDate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

// Earliest allowed pickup/event date (YYYY-MM-DD) for an order of `units` items
export function earliestEventDate(units = 0) {
  const t = new Date();
  return toISODate(new Date(t.getFullYear(), t.getMonth(), t.getDate() + leadDaysFor(units)));
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

export function priceOrder(rawSubtotal: number) {
  const subtotal = round2(rawSubtotal);
  const tax = round2(subtotal * TAX_RATE);
  const total = round2(subtotal + tax);
  const deposit = round2(total * DEPOSIT_RATE);
  return { subtotal, tax, total, deposit, balance: round2(total - deposit) };
}

// 9:00 AM to 5:00 PM in 30 minute steps
export const PICKUP_TIMES = Array.from({ length: 17 }, (_, i) => {
  const mins = 9 * 60 + i * 30;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return {
    value: `${pad(h)}:${pad(m)}`,
    label: `${h > 12 ? h - 12 : h}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`,
  };
});

export const timeLabel = (value: string) => PICKUP_TIMES.find((t) => t.value === value)?.label ?? value;