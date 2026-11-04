// GET /api/products -> { products: [...] } from Firestore (collection "products").
// Seed it with `npm run seed` (scripts/seed-firebase.ts).
// Hidden products, and products in a hidden category (FR-24), are left out,
// except for admins asking with ?all=1 (the admin catalog).
import { NextResponse, type NextRequest } from "next/server";
import { adminDb, COLLECTIONS } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req?: NextRequest) {
  try {
    const wantsAll = req?.nextUrl?.searchParams.get("all") === "1";
    const isAdmin = wantsAll && req ? (await getSessionUser(req))?.role === "admin" : false;

    const [snap, cats] = await Promise.all([
      adminDb.collection(COLLECTIONS.products).orderBy("productID").get(),
      adminDb.collection(COLLECTIONS.categories).get(),
    ]);
    const all = snap.docs.map((d) => d.data());
    if (isAdmin) return NextResponse.json({ products: all, categories: cats.docs.map((d) => d.data()) });

    const hiddenCats = new Set(cats.docs.map((d) => d.data()).filter((c) => c.visible === false).map((c) => c.name));
    const products = all.filter(
      (p) => p.hidden !== true && !(Array.isArray(p.categories) && p.categories.some((c: string) => hiddenCats.has(c)))
    );
    return NextResponse.json({ products });
  } catch (err) {
    console.error("products GET failed:", err);
    return NextResponse.json({ error: "Couldn't load products from Firebase." }, { status: 503 });
  }
}
