// Wholesale tiered pricing (FR-17), from the Phase 3 design: volume discounts
// on the whole order by total units. Shared by the wholesale pages and the
// server, so the price a partner sees is the price that's saved.
export const MIN_WHOLESALE_UNITS = 50;

export const TIERS = [
  { minUnits: 300, discount: 0.18, label: "300+ cans: 18% off" },
  { minUnits: 150, discount: 0.12, label: "150+ cans: 12% off" },
  { minUnits: 50, discount: 0.05, label: "50+ cans: 5% off" },
] as const;

export const RECURRING_OPTIONS = [
  { weeks: 0, label: "One-time order" },
  { weeks: 1, label: "Every week" },
  { weeks: 2, label: "Every 2 weeks" },
  { weeks: 4, label: "Every 4 weeks" },
] as const;

export const WHOLESALE_TAX_RATE = 0.05;

const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function tierFor(units: number) {
  return TIERS.find((t) => units >= t.minUnits) ?? null;
}

/** The next tier up and how many more units reach it. */
export function nextTier(units: number) {
  const next = [...TIERS].reverse().find((t) => units < t.minUnits);
  return next ? { ...next, unitsToGo: next.minUnits - units } : null;
}

export function wholesaleTotals(lines: { unitPrice: number; quantity: number }[]) {
  const units = lines.reduce((s, l) => s + l.quantity, 0);
  const subtotal = round(lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0));
  const tier = tierFor(units);
  const discount = round(subtotal * (tier?.discount ?? 0));
  const tax = round((subtotal - discount) * WHOLESALE_TAX_RATE);
  const total = round(subtotal - discount + tax);
  return { units, subtotal, discountRate: tier?.discount ?? 0, discount, tax, total };
}
