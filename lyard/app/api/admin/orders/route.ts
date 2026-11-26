// /api/admin/orders - the admin's order hub (FR-15).
//   GET                                     every order, bundle and event preorder, and refund request
//   PATCH { kind: "order", id, status }     move a shop order along (customers see it on /orders)
//   PATCH { kind: "refund", id, status, note }  approve or deny a refund request
// Bundle and event preorder statuses change through their own PATCH endpoints.
import { NextResponse, type NextRequest } from "next/server";
import { adminDb, COLLECTIONS } from "@/lib/firebase/admin";
import { readJson } from "@/lib/server/forms";
import { AdminError, adminFail, requireAdmin, str } from "@/lib/server/admin";
import { ORDER_STATUSES } from "@/lib/Order/statuses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REFUND_STATUSES = ["pending", "approved", "denied"];

const newestFirst = (field: string) => (a: Record<string, unknown>, b: Record<string, unknown>) =>
  String(b[field] ?? "").localeCompare(String(a[field] ?? ""));

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const [orders, bundles, events, refunds] = await Promise.all(
      [COLLECTIONS.orders, COLLECTIONS.bundlePreorders, COLLECTIONS.eventPreorders, COLLECTIONS.refundRequests].map((c) =>
        adminDb.collection(c).get()
      )
    );
    const data = (s: FirebaseFirestore.QuerySnapshot) => s.docs.map((d) => ({ id: d.id, ...d.data() }) as Record<string, unknown>);
    return NextResponse.json({
      orders: data(orders).sort(newestFirst("placedAt")),
      bundlePreorders: data(bundles).sort(newestFirst("createdAt")),
      eventPreorders: data(events).sort(newestFirst("createdAt")),
      refunds: data(refunds).sort(newestFirst("createdAt")),
    });
  } catch (err) {
    return adminFail(err, "load the orders");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = (await readJson(req)) ?? {};
    const id = str(body.id, 60);
    const status = str(body.status, 30) ?? "";
    if (!id) throw new AdminError("Which order?");
    const now = new Date().toISOString();

    if (body.kind === "refund") {
      if (!REFUND_STATUSES.includes(status)) throw new AdminError("Choose approve or deny.");
      const ref = adminDb.collection(COLLECTIONS.refundRequests).doc(id);
      if (!(await ref.get()).exists) throw new AdminError("Refund request not found.", 404);
      await ref.update({ status, note: str(body.note, 500) ?? "", decidedAt: now, decidedBy: admin.email });
      // Mark the order too, so the customer sees it on their order.
      const order = adminDb.collection(COLLECTIONS.orders).doc(id);
      if ((await order.get()).exists) await order.update({ refundStatus: status });
      return NextResponse.json({ ok: true });
    }

    if (!(ORDER_STATUSES as readonly string[]).includes(status)) throw new AdminError("That isn't an order status.");
    const ref = adminDb.collection(COLLECTIONS.orders).doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new AdminError("Order not found.", 404);
    const history = Array.isArray(snap.data()?.statusHistory) ? snap.data()?.statusHistory : [];
    await ref.update({ status, updatedAt: now, statusHistory: [...history, { status, at: now }].slice(-20) });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return adminFail(err, "update the order");
  }
}
