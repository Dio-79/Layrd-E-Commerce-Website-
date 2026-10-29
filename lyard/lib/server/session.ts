// Server-side session helpers. The browser signs in with Firebase Auth and
// sends its ID token to /api/auth/session, which stores a Firebase session
// cookie (httpOnly, so page scripts can't read or change it).
import type { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb, COLLECTIONS } from "@/lib/firebase/admin";
import type { Role } from "@/lib/Auth/Permission";

// Kept here (not imported from lib/Auth/Roles) because two role files are
// client components, which server code can't read.
const ROLE_NAMES: readonly Role[] = ["guest", "user", "customer", "wholesale", "admin"];
const isRole = (value: unknown): value is Role => ROLE_NAMES.includes(value as Role);

export const SESSION_COOKIE = "layrd_session";
const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

/** Reads the profile document, or creates it as a "customer" on first sign-in. */
export async function ensureProfile(uid: string, email: string, name: string): Promise<SessionUser> {
  const ref = adminDb.collection(COLLECTIONS.users).doc(uid);
  const snap = await ref.get();
  if (snap.exists) {
    const data = snap.data() ?? {};
    return {
      id: uid,
      email: String(data.email ?? email),
      name: String(data.name ?? name),
      role: isRole(data.role) ? data.role : "customer",
    };
  }
  const profile = { email, name, role: "customer" as Role, createdAt: new Date().toISOString() };
  await ref.set(profile);
  return { id: uid, ...profile };
}

/** Turns a fresh ID token into a session cookie on the response. */
export async function startSession(res: NextResponse, idToken: string) {
  let value = idToken;
  try {
    value = await adminAuth.createSessionCookie(idToken, { expiresIn: FIVE_DAYS_MS });
  } catch {
    // Some emulator versions don't issue session cookies; the ID token works the same way there
  }
  res.cookies.set(SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: FIVE_DAYS_MS / 1000,
  });
}

export function endSession(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

/** The signed-in user for this request, or null. */
export async function getSessionUser(req: NextRequest): Promise<SessionUser | null> {
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (!cookie) return null;

  let decoded;
  try {
    decoded = await adminAuth.verifySessionCookie(cookie, true);
  } catch {
    try {
      decoded = await adminAuth.verifyIdToken(cookie, true);
    } catch {
      return null;
    }
  }
  return ensureProfile(decoded.uid, decoded.email ?? "", String(decoded.name ?? ""));
}
