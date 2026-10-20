// lib/bundle/bundleRules.ts
// Business rules + shared types for custom bundle preorders.

export const TAX_RATE = 0.08;
export const MAX_UNITS_PER_DAY = 150; // drinks per pickup day
export const CANCEL_HOURS = 12;
export const PICKUP_LOCATION = "Pickup at 123 St. NE";
export const SMALL_ORDER_UNITS = 12; // up to this many drinks = short notice

export type OrderStatus =
  | "requested"
  | "confirmed"
  | "in_production"
  | "ready"
  | "picked_up"
  | "cancelled";

export const STATUSES: OrderStatus[] = [
  "requested",
  "confirmed",
  "in_production",
  "ready",
  "picked_up",
  "cancelled",
];

export const STATUS_STEPS: { key: OrderStatus; label: string }[] = [
  { key: "requested", label: "Requested" },
  { key: "confirmed", label: "Confirmed" },
  { key: "in_production", label: "Being made" },
  { key: "ready", label: "Ready" },
  { key: "picked_up", label: "Picked up" },
];

export interface BundleLine {
  id: string;
  name: string;
  size: string;
  flavor: string;
  quantity: number; // total drinks for this line (slot qty x bundle qty)
  unitPrice: number;
  image: string;
}

export interface BundleDraft {
  lines: BundleLine[];
}

export interface BundleRecord {
  reference: string;
  status: OrderStatus;
  createdAt: string;
  pickupDate: string; // YYYY-MM-DD
  pickupTime: string; // HH:MM
  customer: { name: string; email: string; phone: string };
  pickupPerson: string;
  notes: string;
  lines: BundleLine[];
  units: number;
  subtotal: number;
  tax: number;
  total: number;
  policyAcceptedAt: string;
}

// 9:00 AM - 5:30 PM, every 30 minutes
export const PICKUP_TIMES = Array.from({ length: 18 }, (_, i) => {
  const mins = 9 * 60 + i * 30;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  return { value, label: timeLabel(value) };
});

export function timeLabel(value: string): string {
  const [h, m] = value.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function leadDaysFor(units: number): number {
  return units <= SMALL_ORDER_UNITS ? 1 : 2;
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function earliestBundleDate(units: number): string {
  const t = new Date();
  const d = new Date(t.getFullYear(), t.getMonth(), t.getDate() + leadDaysFor(units));
  return toISODate(d);
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function priceOrder(subtotal: number) {
  const sub = round2(subtotal);
  const tax = round2(sub * TAX_RATE);
  return { subtotal: sub, tax, total: round2(sub + tax) };
}