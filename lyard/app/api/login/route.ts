// app/api/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/server/db"; // adjust the path to wherever db.ts lives (e.g. "@/lib/server/db")

export const runtime = "nodejs"; // pg needs Node, not the edge runtime

// Used when the email doesn't exist, so a missing account takes as long to
// reject as a wrong password (stops people from discovering which emails exist)
const DUMMY_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8.dQYk3uK1x0Y1g3b6vQ6Y7m9u1u2W";

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(req: NextRequest) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail("Invalid request", 400);
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) return fail("Email and password are required", 400);

  try {
    // Assumed schema: users(id, email, name, password_hash). Edit to match yours.
    const { rows } = await db.query(
      "SELECT id, email, name, password_hash FROM users WHERE LOWER(email) = $1 LIMIT 1",
      [email]
    );
    const row = rows[0];

    const ok = await bcrypt.compare(password, row?.password_hash ?? DUMMY_HASH);
    if (!row || !ok) return fail("Invalid email or password", 401);

    // Never send the hash back
    return NextResponse.json({ user: { id: row.id, email: row.email, name: row.name } });
  } catch (err) {
    console.error("login failed:", err);
    return fail("Something went wrong. Please try again.", 500);
  }
}