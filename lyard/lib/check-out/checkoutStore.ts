import { useMemo, useSyncExternalStore } from "react";
import type { Totals } from "./CheckoutPricing";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export interface OrderLine {
  /** Unique id of the line */
  id: string;
  /** Where the line came from: the cart (bag) or an event order */
  source: "bag" | "event";
  /** Set for event lines: the event order they belong to */
  eventId?: string;
  productId: number | string;
  name: string;
  image?: string | null;
  size?: string;
  flavor?: string;
  quantity: number;
  /** Price the customer pays per unit */
  unitPrice: number;
  /** Regular price per unit, when the item is on sale */
  originalUnitPrice?: number;
  /** Shown with the line, e.g. "Custom bundle" */
  group?: string;
}

export type NewLine = Omit<OrderLine, "source" | "eventId">;

export interface EventDetails {
  pickupDate: string;
  eventType: string;
  headcount: string;
  comment: string;
  fileName: string | null;
}

export interface EventOrderEntry {
  id: string;
  details: EventDetails;
  lines: OrderLine[];
}

export interface CustomerInfo {
  email: string;
  phone: string;
  fullName: string;
}

export interface DeliveryInfo {
  method: "ship" | "pickup";
  address?: { street: string; city: string; province: string; postal: string };
  carrier?: "DoorDash";
  deliveryId?: string;
  etaMinutes?: number;
  courierName?: string;
  trackingUrl?: string;
  pickupLocation?: string;
}

export type PaymentMethod = "card" | "apple" | "google" | "paypal" | "etransfer";

export interface PaymentInfo {
  method: PaymentMethod;
  provider: "square" | "paypal" | "etransfer";
  /**
   * "paid" once the money is taken; "authorized" if Square approved it but completing
   * failed (staff complete it in the Square dashboard); e-Transfers wait for an admin.
   */
  status: "paid" | "authorized" | "awaiting_etransfer";
  amount: number;
  currency: string;
  /** Square payment id or PayPal capture id */
  paymentId?: string;
  receiptUrl?: string;
  /** e.g. "VISA •••• 1111" */
  label?: string;
  /** Where to send an e-Transfer */
  etransferEmail?: string;
}

export interface PlacedOrder {
  orderNumber: string;
  placedAt: string;
  customer: CustomerInfo;
  delivery: DeliveryInfo;
  lines: OrderLine[];
  events: EventDetails[];
  promoCode: string | null;
  totals: Totals;
  payment?: PaymentInfo;
}

/**
 * The regular bag lives in CartContext (useCart). This store only keeps
 * event orders and the last placed order, so they survive page changes.
 */
interface State {
  events: EventOrderEntry[];
  /** Promo code applied in the cart or checkout, kept so both pages agree */
  promoCode: string | null;
  lastOrder: PlacedOrder | null;
}

/* ------------------------------------------------------------------ */
/* Tiny localStorage-backed store (works across pages and tabs)       */
/* ------------------------------------------------------------------ */

const KEY = "layrd:checkout:v2";
const EMPTY: State = { events: [], promoCode: null, lastOrder: null };

const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined = undefined;
let cached: State = EMPTY;

function read(): State {
  if (typeof window === "undefined") return EMPTY;

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    /* storage blocked: fall through with empty state */
  }

  if (raw === cachedRaw) return cached;

  cachedRaw = raw;
  try {
    cached = raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<State>) } : EMPTY;
  } catch {
    cached = EMPTY;
  }
  return cached;
}

function commit(next: State) {
  const raw = JSON.stringify(next);
  try {
    window.localStorage.setItem(KEY, raw);
  } catch {
    /* ignore quota / private-mode errors */
  }
  cachedRaw = raw;
  cached = next;
  listeners.forEach((listener) => listener());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === null) callback();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

/* ------------------------------------------------------------------ */
/* Hooks                                                              */
/* ------------------------------------------------------------------ */

export function useCheckout() {
  const state = useSyncExternalStore(subscribe, read, () => EMPTY);
  const eventLines = useMemo(() => state.events.flatMap((e) => e.lines), [state.events]);
  return { ...state, eventLines };
}

/** false on the server and during hydration, true afterwards */
export function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

/* ------------------------------------------------------------------ */
/* Actions (plain functions: call them from any client component)     */
/* ------------------------------------------------------------------ */

/** The event order page calls this when the Submit button is pressed. */
export function addEventOrder(input: { id?: string; details: EventDetails; lines: NewLine[] }): string {
  const state = read();
  const id = input.id ?? crypto.randomUUID();
  const entry: EventOrderEntry = {
    id,
    details: input.details,
    lines: input.lines.map((l) => ({
      ...l,
      id: `${id}:${l.id}`,
      source: "event",
      eventId: id,
    })),
  };
  const others = state.events.filter((e) => e.id !== id);
  commit({ ...state, events: [...others, entry] });
  return id;
}

/** Saves (or clears, with null) the promo code so the cart and checkout show the same discount. */
export function setPromoCode(code: string | null) {
  const state = read();
  if (state.promoCode === code) return;
  commit({ ...state, promoCode: code });
}

export function removeEventOrder(eventId: string) {
  const state = read();
  commit({ ...state, events: state.events.filter((e) => e.id !== eventId) });
}

export function makeOrderNumber() {
  const time = Date.now().toString(36).toUpperCase().slice(-6);
  const rand = Math.floor(Math.random() * 90 + 10);
  return `LYD-${time}${rand}`;
}

/** The order as it will be sent for payment (event lines from this store are included). */
export function draftOrder(input: {
  orderNumber: string;
  customer: CustomerInfo;
  delivery: DeliveryInfo;
  promoCode: string | null;
  totals: Totals;
  bagLines: OrderLine[];
}): PlacedOrder {
  const state = read();
  const { bagLines, ...rest } = input;
  return {
    placedAt: new Date().toISOString(),
    ...rest,
    lines: [...bagLines, ...state.events.flatMap((e) => e.lines)],
    events: state.events.map((e) => e.details),
  };
}

/** Keeps the order the server saved (with its prices and payment) for the confirmation page. */
export function rememberOrder(order: PlacedOrder) {
  commit({ events: [], promoCode: null, lastOrder: order });
}

/**
 * Saves the finished order and empties the event orders.
 * Pass the cart lines in as bagLines, then call clearCart() from useCart().
 */
export function placeOrder(input: {
  customer: CustomerInfo;
  delivery: DeliveryInfo;
  promoCode: string | null;
  totals: Totals;
  bagLines: OrderLine[];
}): PlacedOrder {
  const state = read();
  const { bagLines, ...rest } = input;
  const order: PlacedOrder = {
    orderNumber: makeOrderNumber(),
    placedAt: new Date().toISOString(),
    ...rest,
    lines: [...bagLines, ...state.events.flatMap((e) => e.lines)],
    events: state.events.map((e) => e.details),
  };
  commit({ events: [], promoCode: null, lastOrder: order });
  return order;
}

export function clearLastOrder() {
  const state = read();
  commit({ ...state, lastOrder: null });
}