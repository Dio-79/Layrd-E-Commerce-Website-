// /api/admin/users - customers and wholesale accounts (FR-18).
//   GET                                   every account with order count, total spent and newsletter status
//   PATCH { id, role }                    change an account's role (customer / wholesale / admin)
//   PATCH { id, wholesale: "approved" | "denied" }   decide a wholesale application
//   PATCH { id, active: false }           deactivate an account (it can't log in until reactivated)
import { NextResponse, type NextRequest } from "next/server";
import { adminAuth, adminDb, COLLECTIONS } from "@/lib/firebase/admin";
import { readJson } from "@/lib/server/forms";
import { AdminError, adminFail, bool, requireAdmin, str } from "@/lib/server/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROLES = ["customer", "wholesale", "admin", "user"];

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const [users, orders, newsletter] = await Promise.all([
      adminDb.collection(COLLECTIONS.users).get(),
      adminDb.collection(COLLECTIONS.orders).get(),
      adminDb.collection(COLLECTIONS.newsletter).get(),
    ]);
    const spend = new Map<string, { orders: number; spent: number; last: string }>();
    for (const d of orders.docs) {
      const o = d.data();
      if (!o.userId || o.status === "cancelled") continue;
      const s = spend.get(o.userId) ?? { orders: 0, spent: 0, last: "" };
      s.orders += 1;
      s.spent += Number(o.totals?.total ?? 0);
      const when = String(o.placedAt ?? o.savedAt ?? "");
      if (when > s.last) s.last = when;
      spend.set(o.userId, s);
    }
    const subscribers = new Set(newsletter.docs.map((d) => String(d.data().email ?? d.id).toLowerCase()));
    const list = users.docs.map((d) => {
      const u = d.data();
      const s = spend.get(d.id) ?? { orders: 0, spent: 0, last: "" };
      return {
        id: d.id,
        email: u.email ?? "",
        name: u.name ?? "",
        role: u.role ?? "customer",
        active: u.active !== false,
        createdAt: u.createdAt ?? "",
        wholesaleApplication: u.wholesaleApplication ?? null,
        newsletter: subscribers.has(String(u.email ?? "").toLowerCase()),
        orders: s.orders,
        spent: Math.round(s.spent * 100) / 100,
        lastOrderAt: s.last,
      };
    });
    list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return NextResponse.json({ users: list, newsletterSubscribers: subscribers.size });
  } catch (err) {
    return adminFail(err, "load the customers");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = (await readJson(req)) ?? {};
    const id = str(body.id, 128);
    if (!id) throw new AdminError("Which account?");
    const ref = adminDb.collection(COLLECTIONS.users).doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new AdminError("Account not found.", 404);
    const now = new Date().toISOString();

    if (id === admin.id && (body.role !== undefined || body.active === false)) {
      throw new AdminError("You can't change or deactivate your own admin account here.");
    }

    if (body.wholesale === "approved" || body.wholesale === "denied") {
      const app = snap.data()?.wholesaleApplication ?? {};
      await ref.update({
        wholesaleApplication: { ...app, status: body.wholesale, decidedAt: now, decidedBy: admin.email },
        ...(body.wholesale === "approved" ? { role: "wholesale" } : {}),
      });
      return NextResponse.json({ ok: true });
    }

    const role = str(body.role, 20);
    if (role !== undefined) {
      if (!ROLES.includes(role)) throw new AdminError("That isn't a role.");
      await ref.update({ role, roleChangedAt: now });
      return NextResponse.json({ ok: true });
    }

    const active = bool(body.active);
    if (active !== undefined) {
      await ref.update({ active, activeChangedAt: now });
      // Ends their sessions straight away, and stops new sign-ins while deactivated.
      await adminAuth.updateUser(id, { disabled: !active }).catch(() => undefined);
      if (!active) await adminAuth.revokeRefreshTokens(id).catch(() => undefined);
      return NextResponse.json({ ok: true });
    }

    throw new AdminError("Nothing to change.");
  } catch (err) {
    return adminFail(err, "update the account");
  }
}
