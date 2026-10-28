// GET /api/live/orders - orders as a live stream (Server-Sent Events).
// Same access as GET /api/orders: admins get every order, everyone else only
// their own, signed out gets 401. The browser still can't read orders directly.
import { NextResponse, type NextRequest } from "next/server";
import { adminDb, COLLECTIONS } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/server/session";
import { streamQuery } from "@/lib/server/live";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const col = adminDb.collection(COLLECTIONS.orders);
  const query = user.role === "admin" ? col : col.where("userId", "==", user.id);
  return streamQuery(req.signal, query);
}
