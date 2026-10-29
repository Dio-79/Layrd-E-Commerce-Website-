// POST /api/auth/logout -> clears the session cookie
import { NextResponse } from "next/server";
import { endSession } from "@/lib/server/session";

export const runtime = "nodejs";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  endSession(res);
  return res;
}
