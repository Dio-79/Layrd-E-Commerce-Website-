"use client";
// Small fetch helpers for the admin pages. Every call goes to an /api route that
// checks the admin session on the server.
import { useCallback, useEffect, useState } from "react";

export async function api<T = Record<string, unknown>>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    cache: "no-store",
    ...init,
    headers: init?.body ? { "Content-Type": "application/json", ...init.headers } : init?.headers,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof body.error === "string" ? body.error : `Request failed (${res.status}).`);
  return body as T;
}

export const send = (url: string, method: string, data?: unknown) =>
  api(url, { method, body: data === undefined ? undefined : JSON.stringify(data) });

/** Loads `url` once, with reload(). */
export function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let live = true;
    api<T>(url)
      .then((d) => {
        if (live) {
          setData(d);
          setError(null);
        }
      })
      .catch((e: Error) => live && setError(e.message))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [url, tick]);

  return { data, error, loading, reload };
}

/** A product as stored in Firestore, with the admin-only fields. */
export interface AdminProduct {
  productID: number;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  tag?: string;
  section?: string;
  categories?: string[];
  flavors?: string[];
  allergens?: string[];
  tags?: string[];
  sweetness?: number;
  shelf?: string;
  stock?: number;
  lowStockAt?: number;
  trackStock?: boolean;
  hidden?: boolean;
  featured?: boolean;
  limited?: boolean;
  limitedUntil?: string;
  /** Bundles: the regular price shown struck through */
  compareAt?: number;
  /** Bundles: what's inside */
  contents?: { productID: number; name: string; quantity: number }[];
}

export interface AdminCategory {
  name: string;
  visible: boolean;
}

export type StockStatus = "In Stock" | "Low Stock" | "Out of Stock" | "Draft";

/** Hidden = Draft; otherwise from the stock count (products that don't track stock are In Stock). */
export function stockStatus(p: AdminProduct): StockStatus {
  if (p.hidden) return "Draft";
  if (typeof p.stock !== "number" || p.trackStock === false) return "In Stock";
  if (p.stock <= 0) return "Out of Stock";
  if (p.stock <= (p.lowStockAt ?? 10)) return "Low Stock";
  return "In Stock";
}

export const money = (n: number | undefined) =>
  typeof n === "number" && Number.isFinite(n)
    ? new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n)
    : "—";

export const shortDate = (value?: string) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : new Intl.DateTimeFormat("en-CA", { dateStyle: "medium" }).format(d);
};
