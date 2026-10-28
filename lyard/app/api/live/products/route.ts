// GET /api/live/products - the catalog as a live stream (Server-Sent Events).
// Sends every product now, then again whenever one changes in Firestore.
// Public, like GET /api/products.
import type { NextRequest } from "next/server";
import { adminDb, COLLECTIONS } from "@/lib/firebase/admin";
import { streamQuery } from "@/lib/server/live";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  return streamQuery(req.signal, adminDb.collection(COLLECTIONS.products).orderBy("productID"));
}
