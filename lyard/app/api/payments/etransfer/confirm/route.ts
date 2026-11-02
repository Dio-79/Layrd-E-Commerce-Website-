// POST /api/payments/etransfer/confirm  { orderNumber }  (admins only)
// Marks an e-Transfer or pay-at-pickup order as paid once the money has arrived.
import { NextResponse, type NextRequest } from "next/server";
import { adminDb, COLLECTIONS } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return fail("Not signed in", 401);
  if (user.role !== "admin") return fail("Admins only", 403);

  const body = (await req.json().catch(() => null)) as { orderNumber?: unknown } | null;
  if (typeof body?.orderNumber !== "string") return fail("Missing order number.");

  const ref = adminDb.collection(COLLECTIONS.orders).doc(body.orderNumber);
  try {
    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("missing");
      if (!["awaiting_etransfer", "pay_at_pickup"].includes(snap.data()?.payment?.status)) throw new Error("not-waiting");
      tx.update(ref, {
        status: "confirmed",
        "payment.status": "paid",
        "payment.confirmedBy": user.email,
        "payment.confirmedAt": new Date().toISOString(),
      });
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : "";
    if (reason === "missing") return fail("No such order.", 404);
    if (reason === "not-waiting") return fail("That order isn't waiting for payment.", 409);
    console.error("etransfer confirm failed:", err);
    return fail("Couldn't update the order.", 500);
  }
  return NextResponse.json({ ok: true });
}
