// /api/reviews - product reviews and ratings (MVP story 5).
//   GET ?productId=3            that product's reviews (newest first), average and count, and the caller's own review
//   GET ?all=1                  admins: every review, to moderate
//   GET                         { summaries: { "3": { average, count } } } for the product cards
//   POST { productId, rating, comment }   signed-in customers rate a product (saving again edits their review)
//   DELETE ?productId=3         remove your own review
//   DELETE ?id=3_uid            admins remove any review
// Anyone, guests included, can read reviews. "Verified purchase" is set on the
// server when the reviewer has an order with that product.
import { NextResponse, type NextRequest } from "next/server";
import { adminDb, COLLECTIONS } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/server/session";
import { fail, readJson, text } from "@/lib/server/forms";
import { cleanRating, MAX_COMMENT, publicName, reviewId, summarize, type RatingSummary, type Review } from "@/lib/reviews/reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const col = () => adminDb.collection(COLLECTIONS.reviews);

function productIdFrom(value: unknown): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 && n < 1_000_000 ? n : null;
}

/** True if this user has a non-cancelled order containing the product. */
async function hasBought(userId: string, productId: number): Promise<boolean> {
  const snap = await adminDb.collection(COLLECTIONS.orders).where("userId", "==", userId).get();
  return snap.docs.some((d) => {
    const o = d.data();
    return o.status !== "cancelled" && Array.isArray(o.lines) && o.lines.some((l: { productId?: unknown }) => Number(l.productId) === productId);
  });
}

export async function GET(req: NextRequest) {
  try {
    if (req.nextUrl.searchParams.get("all") === "1") {
      const user = await getSessionUser(req);
      if (user?.role !== "admin") return fail("Admins only.", 403);
      const reviews = (await col().get()).docs.map((d) => d.data() as Review).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return NextResponse.json({ reviews });
    }

    const raw = req.nextUrl.searchParams.get("productId");
    if (raw === null) {
      const all = (await col().get()).docs.map((d) => d.data() as Review);
      const byProduct = new Map<number, number[]>();
      for (const r of all) byProduct.set(r.productId, [...(byProduct.get(r.productId) ?? []), r.rating]);
      const summaries: Record<string, RatingSummary> = {};
      for (const [id, ratings] of byProduct) summaries[String(id)] = summarize(ratings);
      return NextResponse.json({ summaries });
    }

    const productId = productIdFrom(raw);
    if (!productId) return fail("Which product?");
    const reviews = (await col().where("productId", "==", productId).get()).docs
      .map((d) => d.data() as Review)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const user = await getSessionUser(req);
    const mine = user ? (reviews.find((r) => r.userId === user.id) ?? null) : null;
    // userId stays on the server; the page only needs to know which one is yours
    const shown = reviews.map(({ userId, ...r }) => ({ ...r, mine: user ? userId === user.id : false }));
    return NextResponse.json({ reviews: shown, ...summarize(reviews.map((r) => r.rating)), mine: mine ? { rating: mine.rating, comment: mine.comment } : null });
  } catch (err) {
    console.error("reviews GET failed:", err);
    return fail("Couldn't load reviews.", 503);
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role === "guest") return fail("Log in to leave a review.", 401);

  const body = await readJson(req);
  const productId = productIdFrom(body?.productId);
  const rating = cleanRating(body?.rating);
  const comment = text(body?.comment, MAX_COMMENT);
  if (!productId) return fail("Which product?");
  if (rating === null) return fail("Choose a rating from 1 to 5 stars.");

  try {
    const product = await adminDb.collection(COLLECTIONS.products).doc(String(productId)).get();
    if (!product.exists || product.data()?.hidden === true) return fail("That product isn't in the shop.", 404);

    const ref = col().doc(reviewId(productId, user.id));
    const existing = await ref.get();
    const now = new Date().toISOString();
    const review: Review = {
      id: ref.id,
      productId,
      userId: user.id,
      name: publicName(user.name),
      rating,
      comment,
      verified: await hasBought(user.id, productId),
      createdAt: existing.exists ? String(existing.data()?.createdAt ?? now) : now,
      ...(existing.exists ? { updatedAt: now } : {}),
    };
    await ref.set(review);
    return NextResponse.json({ ok: true, edited: existing.exists }, { status: existing.exists ? 200 : 201 });
  } catch (err) {
    console.error("review POST failed:", err);
    return fail("Couldn't save your review. Please try again.", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return fail("Log in first.", 401);
  const q = req.nextUrl.searchParams;

  let id: string;
  if (q.get("id")) {
    if (user.role !== "admin") return fail("Only admins can remove other people's reviews.", 403);
    id = String(q.get("id")).slice(0, 200);
  } else {
    const productId = productIdFrom(q.get("productId"));
    if (!productId) return fail("Which product?");
    id = reviewId(productId, user.id);
  }
  const ref = col().doc(id);
  if (!(await ref.get()).exists) return fail("Review not found.", 404);
  await ref.delete();
  return NextResponse.json({ ok: true });
}
