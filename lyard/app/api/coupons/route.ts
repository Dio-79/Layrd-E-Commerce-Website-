// GET /api/coupons?code=LAYRD10&subtotal=24.50  -> { promo } or 404 { error }
//   Checks a code typed in at the cart or checkout (FR-19).
// GET /api/coupons?events=1                       -> { events: [...] }
//   Limited-time events running today, for the home page banner.
import { NextResponse, type NextRequest } from "next/server";
import { adminDb, COLLECTIONS } from "@/lib/firebase/admin";
import { couponProblem, getCoupon, toPromo, type Coupon } from "@/lib/server/coupons";
import { findPromo } from "@/lib/check-out/CheckoutPricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  try {
    if (q.get("events")) {
      const snap = await adminDb.collection(COLLECTIONS.coupons).where("kind", "==", "event").get();
      const events = snap.docs
        .map((d) => d.data() as Coupon)
        .filter((c) => !couponProblem(c, null))
        .map((c) => ({ ...toPromo(c), expiresAt: c.expiresAt, minOrder: c.minOrder }));
      return NextResponse.json({ events });
    }

    const code = q.get("code") ?? "";
    const subtotalRaw = q.get("subtotal");
    const subtotal = subtotalRaw === null ? null : Number(subtotalRaw);
    const coupon = await getCoupon(code);
    if (coupon) {
      const problem = couponProblem(coupon, Number.isFinite(subtotal) ? subtotal : null);
      if (problem) return NextResponse.json({ error: problem }, { status: 404 });
      return NextResponse.json({ promo: toPromo(coupon) });
    }
    const builtIn = findPromo(code);
    if (builtIn) return NextResponse.json({ promo: builtIn });
    return NextResponse.json({ error: "That promo code isn't valid." }, { status: 404 });
  } catch (err) {
    console.error("coupon lookup failed:", err);
    return NextResponse.json({ error: "Couldn't check that code. Please try again." }, { status: 503 });
  }
}
