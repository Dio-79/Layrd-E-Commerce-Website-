// Coupon codes and limited-time events (FR-19), Firestore "coupons", one document
// per code (the document id is the code in capitals). Admins manage them on
// /admin/promotions. The two built-in demo codes still work when Firestore has
// no coupon with that code.
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, COLLECTIONS } from "@/lib/firebase/admin";
import { findPromo, type PromoCode } from "@/lib/check-out/CheckoutPricing";

export interface Coupon {
  code: string;
  /** "coupon" = typed in at checkout; "event" = a limited-time sale shown on the home page */
  kind: "coupon" | "event";
  title: string;
  type: "percent" | "amount";
  value: number;
  active: boolean;
  minOrder: number;
  /** 0 = no limit */
  usageLimit: number;
  uses: number;
  startsAt: string; // YYYY-MM-DD or ""
  expiresAt: string; // YYYY-MM-DD or ""
  createdAt?: string;
}

export const normalizeCode = (code: string) => code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 30);

const today = () => new Date().toISOString().slice(0, 10);

/** Why a coupon can't be used right now, or null if it can. */
export function couponProblem(c: Coupon, subtotal: number | null): string | null {
  if (!c.active) return "That code isn't active.";
  const now = today();
  if (c.startsAt && now < c.startsAt) return "That code hasn't started yet.";
  if (c.expiresAt && now > c.expiresAt) return "That code has expired.";
  if (c.usageLimit > 0 && c.uses >= c.usageLimit) return "That code has been fully used.";
  if (subtotal !== null && c.minOrder > 0 && subtotal < c.minOrder) return `That code needs an order of at least $${c.minOrder.toFixed(2)}.`;
  return null;
}

export function toPromo(c: Coupon): PromoCode {
  const label = c.title || (c.type === "percent" ? `${c.value}% off` : `$${c.value} off`);
  return { code: c.code, label, type: c.type, value: c.value };
}

export async function getCoupon(code: string): Promise<Coupon | null> {
  const clean = normalizeCode(code);
  if (!clean) return null;
  const snap = await adminDb.collection(COLLECTIONS.coupons).doc(clean).get();
  return snap.exists ? (snap.data() as Coupon) : null;
}

/**
 * The discount for this code, or null if it can't be used. Firestore coupons
 * come first; the built-in demo codes are the fallback.
 * Pass the subtotal to check the minimum order (null skips that check).
 */
export async function lookupPromo(code: string, subtotal: number | null): Promise<PromoCode | null> {
  const coupon = await getCoupon(code);
  if (coupon) return couponProblem(coupon, subtotal) ? null : toPromo(coupon);
  return findPromo(code);
}

/** Counts one use after an order is saved. Never throws (the order is already saved). */
export async function countCouponUse(code: string) {
  try {
    const clean = normalizeCode(code);
    const ref = adminDb.collection(COLLECTIONS.coupons).doc(clean);
    if ((await ref.get()).exists) await ref.update({ uses: FieldValue.increment(1) });
  } catch (err) {
    console.error("counting coupon use failed:", err);
  }
}
