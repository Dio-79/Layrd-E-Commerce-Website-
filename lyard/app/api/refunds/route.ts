// /api/refunds - refund requests (Use Case 8: Apply for Refund), Firestore "refundRequests".
//   GET                         the signed-in user's requests (admins: all)
//   POST { orderNumber, reason }  asks for a refund on one of your orders
// An order can be refunded within REFUND_WINDOW_DAYS of being placed, once.
import { NextResponse, type NextRequest } from "next/server";
import { adminDb, COLLECTIONS } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/server/session";
import { fail, readJson, text } from "@/lib/server/forms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REFUND_WINDOW_DAYS = 14;

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return fail("Log in to see your refund requests.", 401);
  const col = adminDb.collection(COLLECTIONS.refundRequests);
  const snap = await (user.role === "admin" ? col : col.where("userId", "==", user.id)).get();
  const requests = snap.docs
    .map((d) => d.data())
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return NextResponse.json({ requests });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return fail("Log in to request a refund.", 401);

  const body = await readJson(req);
  const orderNumber = text(body?.orderNumber, 40);
  const reason = text(body?.reason, 2000);
  if (!orderNumber) return fail("Choose the order you'd like refunded.");
  if (reason.length < 10) return fail("Tell us what went wrong (at least 10 characters).");

  const orderRef = adminDb.collection(COLLECTIONS.orders).doc(orderNumber);
  const requestRef = adminDb.collection(COLLECTIONS.refundRequests).doc(orderNumber);

  try {
    const saved = await adminDb.runTransaction(async (tx) => {
      const order = await tx.get(orderRef);
      const data = order.data();
      if (!order.exists || data?.userId !== user.id) return "not-found";
      const placed = Date.parse(String(data?.placedAt ?? data?.savedAt ?? ""));
      if (!Number.isFinite(placed) || Date.now() - placed > REFUND_WINDOW_DAYS * 864e5) return "too-late";
      if ((await tx.get(requestRef)).exists) return "duplicate";

      tx.set(requestRef, {
        orderNumber,
        reason,
        userId: user.id,
        email: user.email,
        amount: data?.totals?.total ?? null,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      return "ok";
    });

    if (saved === "not-found") return fail("We couldn't find that order on your account.", 404);
    if (saved === "too-late") return fail(`This order is not eligible for a refund (older than ${REFUND_WINDOW_DAYS} days).`, 409);
    if (saved === "duplicate") return fail("You've already asked for a refund on this order.", 409);
    return NextResponse.json({ ok: true, orderNumber, status: "pending" }, { status: 201 });
  } catch (err) {
    console.error("refund request failed:", err);
    return fail("Couldn't send your request right now. Please try again.", 500);
  }
}
