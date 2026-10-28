// GET /api/products -> { products: [...] } from Firestore (collection "products").
// Seed it with `npm run seed` (scripts/seed-firebase.ts).
import { NextResponse } from "next/server";
import { adminDb, COLLECTIONS } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snap = await adminDb.collection(COLLECTIONS.products).orderBy("productID").get();
    return NextResponse.json({ products: snap.docs.map((d) => d.data()) });
  } catch (err) {
    console.error("products GET failed:", err);
    return NextResponse.json({ error: "Couldn't load products from Firebase." }, { status: 503 });
  }
}
