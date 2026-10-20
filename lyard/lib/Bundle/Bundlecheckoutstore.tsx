// lib/bundle/bundleCheckoutStore.ts
// Keeps the bundle draft and the last placed order in the browser between pages.
import type { BundleDraft, BundleRecord } from "./bundlerules";

export type { BundleDraft, BundleRecord };

const DRAFT_KEY = "layrd-bundle-draft";
const LAST_KEY = "layrd-bundle-last-order";

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: the checkout page will show "nothing to check out" */
  }
}

export function saveBundleDraft(draft: BundleDraft) {
  write(DRAFT_KEY, draft);
}

export function loadBundleDraft(): BundleDraft | null {
  return read<BundleDraft>(DRAFT_KEY);
}

export function clearBundleDraft() {
  try {
    window.sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

export function saveLastOrder(record: BundleRecord) {
  write(LAST_KEY, record);
}

export function loadLastOrder(): BundleRecord | null {
  return read<BundleRecord>(LAST_KEY);
}