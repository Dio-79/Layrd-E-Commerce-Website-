// Helpers shared by the /api/admin/* routes: who may call them, and safe
// readers for the values an admin form sends.
import type { NextRequest } from "next/server";
import { getSessionUser, type SessionUser } from "@/lib/server/session";

export class AdminError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message);
  }
}

/** Only signed-in admins get past this. */
export async function requireAdmin(req: NextRequest): Promise<SessionUser> {
  const user = await getSessionUser(req);
  if (!user) throw new AdminError("Log in as an admin.", 401);
  if (user.role !== "admin") throw new AdminError("Admins only.", 403);
  return user;
}

/** A finite number within [min, max], or undefined if missing/invalid. */
export function num(value: unknown, min: number, max: number): number | undefined {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) && n >= min && n <= max ? n : undefined;
}

/** A trimmed string (cut to max), or undefined if it isn't a string. */
export function str(value: unknown, max: number): string | undefined {
  return typeof value === "string" ? value.trim().slice(0, max) : undefined;
}

export function bool(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

/** Up to `maxItems` short, unique, non-empty strings. */
export function strList(value: unknown, maxItems = 20, maxLen = 40): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out = [...new Set(value.map((v) => (typeof v === "string" ? v.trim().slice(0, maxLen) : "")).filter(Boolean))];
  return out.slice(0, maxItems);
}

/** YYYY-MM-DD, or "" to clear it. */
export function date(value: unknown): string | undefined {
  if (value === "" || value === null) return "";
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

/** Drops undefined values so a PATCH only changes what was sent. */
export function defined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

export function adminFail(err: unknown, what: string) {
  if (err instanceof AdminError) return Response.json({ error: err.message }, { status: err.status });
  console.error(`${what} failed:`, err);
  return Response.json({ error: `Couldn't ${what}. Please try again.` }, { status: 500 });
}
