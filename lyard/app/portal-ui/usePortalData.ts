"use client";

import { useCallback, useEffect, useState } from "react";

export interface PortalProduct {
  productID: number;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  section?: string;
  tag?: string;
  stock?: number;
}

export interface PortalOrder {
  orderNumber: string;
  placedAt?: string;
  savedAt?: string;
  status?: string;
  customer?: { email?: string; fullName?: string };
  totals?: { total?: number };
  lines?: { name: string; quantity: number }[];
  delivery?: { trackingUrl?: string; method?: string };
}

/** Uses existing APIs; never silently substitutes made-up production data. */
export function usePortalList<T>(url: string, key: "products" | "orders") {
  const [items, setItems] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const reload = useCallback(() => setRefreshCount((c) => c + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(url, {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || `Request failed (${response.status}).`);
        if (!Array.isArray(payload[key])) throw new Error("Unexpected API response format.");
        if (!controller.signal.aborted) setItems(payload[key] as T[]);
      } catch (cause) {
        if (!controller.signal.aborted) {
          setItems(null);
          setError(cause instanceof Error ? cause.message : "Unable to load data.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [url, key, refreshCount]);

  return { items, loading, error, reload };
}

export const currency = (value: number | undefined) =>
  typeof value === "number" && Number.isFinite(value)
    ? new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(value)
    : "—";

export const shortDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en-CA", { dateStyle: "medium" }).format(date);
};
