// /api/admin/coupons - admins manage coupon codes and limited-time events (FR-19).
//   GET                          every coupon and event
//   PUT  { code, kind, ... }     create or replace one (uses are kept)
//   DELETE ?code=LAYRD10         remove one
import { NextResponse, type NextRequest } from "next/server";
import { adminDb, COLLECTIONS } from "@/lib/firebase/admin";
import { readJson } from "@/lib/server/forms";
import { AdminError, adminFail, bool, date, num, requireAdmin, str } from "@/lib/server/admin";
import { normalizeCode, type Coupon } from "@/lib/server/coupons";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const snap = await adminDb.collection(COLLECTIONS.coupons).get();
    const coupons = snap.docs.map((d) => d.data()).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return NextResponse.json({ coupons });
  } catch (err) {
    return adminFail(err, "load the coupons");
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = (await readJson(req)) ?? {};
    const code = normalizeCode(String(body.code ?? ""));
    if (code.length < 3) throw new AdminError("Codes need at least 3 letters or numbers.");
    const type = body.type === "amount" ? "amount" : "percent";
    const value = num(body.value, 0.01, type === "percent" ? 100 : 10_000);
    if (value === undefined) throw new AdminError(type === "percent" ? "Enter a percentage from 1 to 100." : "Enter a dollar amount.");
    const startsAt = date(body.startsAt) ?? "";
    const expiresAt = date(body.expiresAt) ?? "";
    if (startsAt && expiresAt && expiresAt < startsAt) throw new AdminError("The end date is before the start date.");

    const ref = adminDb.collection(COLLECTIONS.coupons).doc(code);
    const existing = (await ref.get()).data() as Coupon | undefined;
    const coupon: Coupon = {
      code,
      kind: body.kind === "event" ? "event" : "coupon",
      title: str(body.title, 80) ?? "",
      type,
      value,
      active: bool(body.active) ?? true,
      minOrder: num(body.minOrder, 0, 100_000) ?? 0,
      usageLimit: Math.floor(num(body.usageLimit, 0, 1_000_000) ?? 0),
      uses: existing?.uses ?? 0,
      startsAt,
      expiresAt,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    await ref.set(coupon);
    return NextResponse.json({ coupon });
  } catch (err) {
    return adminFail(err, "save the coupon");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin(req);
    const code = normalizeCode(req.nextUrl.searchParams.get("code") ?? "");
    if (!code) throw new AdminError("Which code?");
    await adminDb.collection(COLLECTIONS.coupons).doc(code).delete();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return adminFail(err, "remove the coupon");
  }
}
