// POST /api/auth/session  { idToken, name? }
// Called right after Firebase sign-up or login in the browser.
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { ensureProfile, startSession } from "@/lib/server/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { idToken?: unknown; name?: unknown };
  if (typeof body.idToken !== "string" || !body.idToken) {
    return NextResponse.json({ error: "Missing sign-in token." }, { status: 400 });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(body.idToken);
    const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : String(decoded.name ?? "");
    const user = await ensureProfile(decoded.uid, decoded.email ?? "", name);

    const res = NextResponse.json({ user });
    await startSession(res, body.idToken);
    return res;
  } catch (err) {
    console.error("session start failed:", err);
    return NextResponse.json({ error: "Couldn't sign you in. Please try again." }, { status: 401 });
  }
}
