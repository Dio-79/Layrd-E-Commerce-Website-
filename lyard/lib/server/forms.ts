// Small helpers for the site's forms (newsletter, contact, refunds).
import { NextResponse } from "next/server";

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

/** Trimmed string, or "" if it isn't one. Cut to `max` characters. */
export function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  const body = await req.json().catch(() => null);
  return body && typeof body === "object" ? (body as Record<string, unknown>) : null;
}
