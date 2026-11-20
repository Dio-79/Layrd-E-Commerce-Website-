// /api/wholesale/tax-exemption - wholesale buyers upload a tax exemption document (MVP story 8).
//   GET                                  the caller's exemption status (no file)
//   GET ?all=1                           admins: every buyer who uploaded one
//   GET ?file=<userId>|me                admins (or the owner): view the file
//   POST { fileName, contentType, data (base64), certificateNumber, expiresOn? }
//                                        upload or replace it; it waits for an admin
//   PATCH { userId, status: "approved"|"denied", note? }   admins decide
// Once approved (and not past expiresOn), wholesale orders and accepted quotes skip GST.
// Metadata lives on users/{uid}.taxExemption; the file in taxDocuments/{uid}.
import { NextResponse, type NextRequest } from "next/server";
import { adminDb, COLLECTIONS } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/server/session";
import { fail, readJson, text } from "@/lib/server/forms";
import { checkTaxDoc, TAX_STATUSES } from "@/lib/wholesale/quotes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const users = () => adminDb.collection(COLLECTIONS.users);
const docs = () => adminDb.collection(COLLECTIONS.taxDocuments);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return fail("Log in first.", 401);
  const q = req.nextUrl.searchParams;

  const fileParam = q.get("file");
  if (fileParam) {
    const fileFor = fileParam === "me" ? user.id : fileParam;
    if (user.role !== "admin" && fileFor !== user.id) return fail("Admins only.", 403);
    const snap = await docs().doc(fileFor.slice(0, 128)).get();
    const file = snap.data();
    if (!snap.exists || typeof file?.data !== "string") return fail("No document uploaded.", 404);
    const safeName = String(file.fileName ?? "tax-exemption").replace(/[^\w.-]+/g, "_").slice(0, 80);
    return new Response(Buffer.from(file.data, "base64"), {
      headers: {
        "Content-Type": String(file.contentType),
        "Content-Disposition": `inline; filename="${safeName}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  if (q.get("all") === "1") {
    if (user.role !== "admin") return fail("Admins only.", 403);
    const snap = await users().where("taxExemption.status", "in", [...TAX_STATUSES]).get();
    const list = snap.docs
      .map((d) => ({ userId: d.id, email: d.data().email, name: d.data().name, businessName: d.data().wholesaleApplication?.businessName ?? "", ...d.data().taxExemption }))
      .sort((a, b) => String(b.uploadedAt ?? "").localeCompare(String(a.uploadedAt ?? "")));
    return NextResponse.json({ exemptions: list });
  }

  const snap = await users().doc(user.id).get();
  return NextResponse.json({ taxExemption: snap.data()?.taxExemption ?? null });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return fail("Log in with your wholesale account.", 401);
  const profile = (await users().doc(user.id).get()).data() ?? {};
  const applying = Boolean(profile.wholesaleApplication);
  if (user.role !== "wholesale" && user.role !== "admin" && !applying) {
    return fail("Apply for a wholesale account first.", 403);
  }

  const body = await readJson(req);
  const fileName = text(body?.fileName, 120) || "tax-exemption";
  const certificateNumber = text(body?.certificateNumber, 60);
  const expiresOn = text(body?.expiresOn, 10);
  if (certificateNumber.length < 3) return fail("Enter the exemption or certificate number on the document.");
  if (expiresOn && (!DATE_RE.test(expiresOn) || expiresOn < new Date().toISOString().slice(0, 10))) {
    return fail("The expiry date has to be today or later.");
  }
  const check = checkTaxDoc(body?.contentType, body?.data);
  if ("error" in check) return fail(check.error);

  const now = new Date().toISOString();
  const meta = { status: "pending", fileName, contentType: String(body?.contentType), bytes: check.bytes, certificateNumber, expiresOn: expiresOn || null, uploadedAt: now, note: "" };
  const batch = adminDb.batch();
  batch.set(docs().doc(user.id), { userId: user.id, fileName, contentType: meta.contentType, data: String(body?.data), uploadedAt: now });
  batch.set(users().doc(user.id), { taxExemption: meta }, { merge: true });
  await batch.commit();
  return NextResponse.json({ ok: true, taxExemption: meta }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return fail("Log in first.", 401);
  if (user.role !== "admin") return fail("Admins only.", 403);
  const body = await readJson(req);
  const userId = text(body?.userId, 128);
  const status = text(body?.status, 20);
  if (!userId) return fail("Which buyer?");
  if (status !== "approved" && status !== "denied") return fail("Choose approve or deny.");

  const ref = users().doc(userId);
  const current = (await ref.get()).data()?.taxExemption;
  if (!current) return fail("That buyer hasn't uploaded a document.", 404);
  await ref.set({ taxExemption: { ...current, status, note: text(body?.note, 500), decidedAt: new Date().toISOString(), decidedBy: user.email } }, { merge: true });
  return NextResponse.json({ ok: true });
}
