// /api/wholesale/apply - a signed-in customer asks for a wholesale account (FR-18).
//   GET                                                     the caller's application, if any
//   POST { businessName, contactName, phone, message }      apply (once; again after a denial)
// An admin approves or denies it on /admin/customers.
import { NextResponse, type NextRequest } from "next/server";
import { adminDb, COLLECTIONS } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/server/session";
import { fail, readJson, text } from "@/lib/server/forms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return fail("Log in to apply.", 401);
  const snap = await adminDb.collection(COLLECTIONS.users).doc(user.id).get();
  return NextResponse.json({ role: user.role, application: snap.data()?.wholesaleApplication ?? null });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return fail("Log in to apply.", 401);
  if (user.role === "wholesale" || user.role === "admin") return fail("Your account already has wholesale access.", 409);

  const body = await readJson(req);
  const businessName = text(body?.businessName, 120);
  const contactName = text(body?.contactName, 120);
  const phone = text(body?.phone, 40);
  const message = text(body?.message, 1000);
  if (businessName.length < 2) return fail("Enter your business name.");
  if (!/^[+\d\s().-]{7,}$/.test(phone)) return fail("Enter a phone number we can reach you on.");

  const ref = adminDb.collection(COLLECTIONS.users).doc(user.id);
  const current = (await ref.get()).data()?.wholesaleApplication;
  if (current?.status === "pending") return fail("Your application is already waiting for review.", 409);

  await ref.set(
    { wholesaleApplication: { status: "pending", businessName, contactName: contactName || user.name, phone, message, appliedAt: new Date().toISOString() } },
    { merge: true }
  );
  return NextResponse.json({ ok: true }, { status: 201 });
}
