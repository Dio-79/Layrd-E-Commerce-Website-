// POST /api/contact  { name, email, subject?, message, orderNumber? }
// Saves a "Contact us" message to Firestore "contactMessages" for staff to answer.
import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, COLLECTIONS } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/server/session";
import { EMAIL, fail, readJson, text } from "@/lib/server/forms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await readJson(req);
  const name = text(body?.name, 100);
  const email = text(body?.email, 254).toLowerCase();
  const subject = text(body?.subject, 120) || "General question";
  const message = text(body?.message, 3000);
  const orderNumber = text(body?.orderNumber, 40) || null;

  if (!name) return fail("Enter your name.");
  if (!EMAIL.test(email)) return fail("Enter a valid email address.");
  if (message.length < 10) return fail("Write a message of at least 10 characters.");

  try {
    const user = await getSessionUser(req);
    const ref = await adminDb.collection(COLLECTIONS.contactMessages).add({
      name,
      email,
      subject,
      message,
      orderNumber,
      userId: user?.id ?? null,
      status: "new",
      createdAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true, id: ref.id }, { status: 201 });
  } catch (err) {
    console.error("contact message failed:", err);
    return fail("Couldn't send your message right now. Please try again.", 500);
  }
}
