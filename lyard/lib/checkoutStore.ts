import { useMemo, useSyncExternalStore } from "react";
import type { Totals } from "./checkoutPricing";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export interface OrderLine {
  /** Unique id of the line */
  id: string;
  /** Where the line came from: the regular bag or an event order */
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
  pickupLocation?: string;
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
}

interface State {
  bag: OrderLine[];
  events: EventOrderEntry[];
  lastOrder: PlacedOrder | null;
}

/* ------------------------------------------------------------------ */
/* Tiny localStorage-backed store (works across pages and tabs)       */
/* ------------------------------------------------------------------ */

const KEY = "layrd:checkout:v1";
const EMPTY: State = { bag: [], events: [], lastOrder: null };

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
  const lines = useMemo(
    () => [...state.bag, ...state.events.flatMap((e) => e.lines)],
    [state]
  );
  return { ...state, lines };
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

/** The cart page calls this whenever its items change. The bag is replaced, not appended. */
export function setBagLines(lines: NewLine[]) {
  const state = read();
  const bag: OrderLine[] = lines.map((l) => ({ ...l, source: "bag" }));
  if (JSON.stringify(bag) === JSON.stringify(state.bag)) return;
  commit({ ...state, bag });
}

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

export function removeEventOrder(eventId: string) {
  const state = read();
  commit({ ...state, events: state.events.filter((e) => e.id !== eventId) });
}

function makeOrderNumber() {
  const time = Date.now().toString(36).toUpperCase().slice(-6);
  const rand = Math.floor(Math.random() * 90 + 10);
  return `LYD-${time}${rand}`;
}

/** Saves the finished order and empties the bag and event orders. */
export function placeOrder(input: {
  customer: CustomerInfo;
  delivery: DeliveryInfo;
  promoCode: string | null;
  totals: Totals;
}): PlacedOrder {
  const state = read();
  const order: PlacedOrder = {
    orderNumber: makeOrderNumber(),
    placedAt: new Date().toISOString(),
    ...input,
    lines: [...state.bag, ...state.events.flatMap((e) => e.lines)],
    events: state.events.map((e) => e.details),
  };
  commit({ bag: [], events: [], lastOrder: order });
  return order;
}

export function clearLastOrder() {
  const state = read();
  commit({ ...state, lastOrder: null });
}