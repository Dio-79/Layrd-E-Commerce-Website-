// Custom bulk quotes and tax exemption documents for wholesale buyers (MVP story 8).
// Shared by the API routes, the wholesale portal and the admin page.

export const QUOTE_STATUSES = ["requested", "quoted", "accepted", "declined", "expired"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const TAX_STATUSES = ["pending", "approved", "denied"] as const;
export type TaxStatus = (typeof TAX_STATUSES)[number];

/** A quote request needs at least this many units (more than a normal bulk order). */
export const MIN_QUOTE_UNITS = 50;
export const MAX_UNITS_PER_LINE = 10_000;
/** Days a buyer has to accept a price before it expires */
export const QUOTE_VALID_DAYS = 14;

/** Tax exemption files: PDF or a photo, up to 700 KB (stored in Firestore, which caps documents at 1 MB). */
export const TAX_DOC_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;
export const TAX_DOC_MAX_BYTES = 700 * 1024;

export interface QuoteLine {
  productId: number;
  name: string;
  quantity: number;
  /** Regular price per unit when requested */
  listPrice: number;
  /** Price per unit the admin offers (set when quoted) */
  quotedPrice?: number;
}

export interface QuoteRequest {
  id: string;
  userId: string;
  customer: { email: string; fullName: string };
  businessName?: string;
  lines: QuoteLine[];
  neededBy: string;
  targetBudget?: number | null;
  message: string;
  status: QuoteStatus;
  createdAt: string;
  quotedAt?: string;
  validUntil?: string;
  adminMessage?: string;
  quotedBy?: string;
  decidedAt?: string;
  orderNumber?: string;
}

const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Merges repeated products and keeps valid quantities. Returns null for bad input. */
export function cleanQuoteLines(raw: unknown): Map<number, number> | null {
  if (!Array.isArray(raw)) return null;
  const wanted = new Map<number, number>();
  for (const l of raw as { productId?: unknown; quantity?: unknown }[]) {
    const id = Number(l?.productId);
    const qty = Math.floor(Number(l?.quantity));
    if (!Number.isInteger(id) || id <= 0 || !Number.isFinite(qty) || qty <= 0) continue;
    if (qty > MAX_UNITS_PER_LINE) return null;
    wanted.set(id, (wanted.get(id) ?? 0) + qty);
  }
  return wanted;
}

/** List and quoted totals, and the saving, for a quote. */
export function quoteSummary(lines: QuoteLine[]) {
  const units = lines.reduce((s, l) => s + l.quantity, 0);
  const listTotal = round(lines.reduce((s, l) => s + l.listPrice * l.quantity, 0));
  const quoted = lines.every((l) => typeof l.quotedPrice === "number");
  const quotedTotal = quoted ? round(lines.reduce((s, l) => s + (l.quotedPrice ?? 0) * l.quantity, 0)) : null;
  const saving = quotedTotal === null ? null : round(listTotal - quotedTotal);
  return { units, listTotal, quotedTotal, saving, savingPct: saving !== null && listTotal > 0 ? Math.round((saving / listTotal) * 100) : null };
}

/** A quoted price can be accepted until the end of its validUntil day. */
export function isExpired(q: Pick<QuoteRequest, "status" | "validUntil">, today = new Date().toISOString().slice(0, 10)) {
  return q.status === "quoted" && Boolean(q.validUntil) && String(q.validUntil) < today;
}

export function addDays(iso: string, days: number) {
  return new Date(Date.parse(iso) + days * 864e5).toISOString().slice(0, 10);
}

/** Checks an uploaded tax document. Returns the decoded size, or an error message. */
export function checkTaxDoc(contentType: unknown, base64: unknown): { bytes: number } | { error: string } {
  if (typeof contentType !== "string" || !(TAX_DOC_TYPES as readonly string[]).includes(contentType)) {
    return { error: "Upload a PDF, JPG or PNG file." };
  }
  if (typeof base64 !== "string" || base64.length === 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    return { error: "The file didn't upload properly. Please try again." };
  }
  const bytes = Math.floor((base64.length * 3) / 4) - (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
  if (bytes > TAX_DOC_MAX_BYTES) return { error: "That file is too big. Please keep it under 700 KB (a scan or phone photo works)." };
  // Check the file really is what it says (first bytes), so a renamed file can't slip through
  const head = atob(base64.slice(0, 12));
  const isPdf = head.startsWith("%PDF");
  const isPng = head.startsWith("\x89PNG");
  const isJpg = head.charCodeAt(0) === 0xff && head.charCodeAt(1) === 0xd8;
  const ok = contentType === "application/pdf" ? isPdf : contentType === "image/png" ? isPng : isJpg;
  if (!ok) return { error: "That file doesn't look like a real PDF, JPG or PNG." };
  return { bytes };
}
