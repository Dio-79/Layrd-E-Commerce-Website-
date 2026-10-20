// lib/eventCheckoutStore.ts
import type { OrderStatus } from "./eventRules";

export interface EventOrderLine {
  id: string;
  productId: number;
  name: string;
  image: string | null;
  size: string;
  flavor: string;
  quantity: number;
  unitPrice: number;
}

export interface EventOrderDraft {
  details: {
    pickupDate: string; // YYYY-MM-DD
    eventType: string;
    headcount: string;
    comment: string;
    fileName: string | null;
  };
  lines: EventOrderLine[];
}

export interface PreorderRecord {
  reference: string;
  status: OrderStatus;
  createdAt: string; // ISO
  pickupDate: string; // YYYY-MM-DD
  pickupTime: string; // HH:MM
  customer: { name: string; email: string; phone: string };
  pickupPerson: string;
  details: EventOrderDraft["details"];
  lines: EventOrderLine[];
  units: number;
  subtotal: number;
  tax: number;
  total: number;
  deposit: number;
  balance: number; // due at pickup
  paymentMethod: string;
  policyAcceptedAt: string; // ISO
}

const DRAFT_KEY = "event-checkout-draft";
const LAST_KEY = "event-last-order";
const canUse = () => typeof window !== "undefined";

export function saveEventDraft(draft: EventOrderDraft) {
  if (canUse()) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}
export function loadEventDraft(): EventOrderDraft | null {
  if (!canUse()) return null;
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as EventOrderDraft) : null;
  } catch {
    return null;
  }
}
export function clearEventDraft() {
  if (canUse()) sessionStorage.removeItem(DRAFT_KEY);
}

export function saveLastOrder(record: PreorderRecord) {
  if (canUse()) sessionStorage.setItem(LAST_KEY, JSON.stringify(record));
}
export function loadLastOrder(): PreorderRecord | null {
  if (!canUse()) return null;
  try {
    const raw = sessionStorage.getItem(LAST_KEY);
    return raw ? (JSON.parse(raw) as PreorderRecord) : null;
  } catch {
    return null;
  }
}