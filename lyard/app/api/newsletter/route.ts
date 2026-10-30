// POST /api/newsletter  { email }  -> saves the address to Firestore "newsletter".
// One document per address, so signing up twice is harmless.
import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, COLLECTIONS } from "@/lib/firebase/admin";
import { EMAIL, fail, readJson, text } from "@/lib/server/forms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const email = text((await readJson(req))?.email, 254).toLowerCase();
  if (!EMAIL.test(email)) return fail("Enter a valid email address.");

  const ref = adminDb.collection(COLLECTIONS.newsletter).doc(email);
  try {
    const already = (await ref.get()).exists;
    if (!already) await ref.set({ email, subscribedAt: FieldValue.serverTimestamp(), source: "footer" });
    return NextResponse.json({ ok: true, already });
  } catch (err) {
    console.error("newsletter signup failed:", err);
    return fail("Couldn't sign you up right now. Please try again.", 500);
  }
}
