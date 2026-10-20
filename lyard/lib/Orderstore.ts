// lib/orderStore.ts
export interface RegularOrderLine {
  id: string;
  name: string;
  image: string | null;
  meta: string;
  quantity: number;
  unitPrice: number;
}

export interface RegularOrder {
  reference: string;
  createdAt: string;
  method: "delivery" | "pickup";
  estimate: string; // e.g. "Today, 9:15 - 9:55 PM" or "Pickup at 123 St. NE"
  email: string;
  trackingUrl?: string; // shown as "Track on DoorDash" when present
  lines: RegularOrderLine[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

const KEY = "last-regular-order";

export function saveRegularOrder(order: RegularOrder) {
  if (typeof window !== "undefined") sessionStorage.setItem(KEY, JSON.stringify(order));
}

export function loadRegularOrder(): RegularOrder | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RegularOrder) : null;
  } catch {
    return null;
  }
}