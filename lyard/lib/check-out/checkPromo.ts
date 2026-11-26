// Asks the server whether a promo code works (codes live in Firestore "coupons",
// managed on /admin/promotions). The server checks the code again when the order is placed.
import type { PromoCode } from "./CheckoutPricing";

export async function checkPromo(code: string, subtotal: number): Promise<{ promo: PromoCode } | { error: string }> {
  const clean = code.trim();
  if (!clean) return { error: "Enter a promo code." };
  try {
    const res = await fetch(`/api/coupons?code=${encodeURIComponent(clean)}&subtotal=${subtotal}`, { cache: "no-store" });
    const body = await res.json().catch(() => ({}));
    if (res.ok && body.promo) return { promo: body.promo as PromoCode };
    return { error: typeof body.error === "string" ? body.error : "That promo code isn't valid." };
  } catch {
    return { error: "Couldn't check that code. Please try again." };
  }
}
