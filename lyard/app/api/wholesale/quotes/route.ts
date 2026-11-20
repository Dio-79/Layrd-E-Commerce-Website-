// /api/wholesale/quotes - custom bulk quotes (MVP story 8).
//   GET                         the caller's quote requests (admins: ?all=1 for everyone's)
//   POST { lines: [{ productId, quantity }], neededBy, targetBudget?, message }
//                               a wholesale buyer asks for a price on a large or custom order
//   PATCH { id, action: "quote", prices: { [productId]: unitPrice }, message?, validDays? }   admin offers prices
//   PATCH { id, action: "reject", message? }                                                  admin turns it down
//   PATCH { id, action: "accept" }    buyer accepts: becomes a wholesale order at the quoted prices
//   PATCH { id, action: "decline" }   buyer says no thanks
// Prices are read from Firestore and the agreed prices are saved on the server,
// so the browser can't change what's charged. Tax exemption (approved) drops the GST.
import { NextResponse, type NextRequest } from "next/server";
import { adminDb, COLLECTIONS } from "@/lib/firebase/admin";
import { getSessionUser, type SessionUser } from "@/lib/server/session";
import { fail, readJson, text } from "@/lib/server/forms";
import { takeStock } from "@/lib/server/stock";
import { isTaxExempt } from "@/lib/server/taxExempt";
import { wholesaleTotals } from "@/lib/wholesale/tiers";
import {
  addDays,
  cleanQuoteLines,
  isExpired,
  MIN_QUOTE_UNITS,
  QUOTE_VALID_DAYS,
  type QuoteLine,
  type QuoteRequest,
} from "@/lib/wholesale/quotes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const col = () => adminDb.collection(COLLECTIONS.quoteRequests);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const today = () => new Date().toISOString().slice(0, 10);
const canWholesale = (u: SessionUser) => u.role === "wholesale" || u.role === "admin";

/** Shows a quoted price that ran out as "expired". */
const withExpiry = (q: QuoteRequest): QuoteRequest => (isExpired(q, today()) ? { ...q, status: "expired" } : q);

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return fail("Log in with your wholesale account.", 401);
  const all = req.nextUrl.searchParams.get("all") === "1";
  if (all && user.role !== "admin") return fail("Admins only.", 403);
  const snap = all ? await col().get() : await col().where("userId", "==", user.id).get();
  const quotes = snap.docs
    .map((d) => withExpiry(d.data() as QuoteRequest))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ quotes });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return fail("Log in with your wholesale account.", 401);
  if (!canWholesale(user)) return fail("Only wholesale accounts can ask for a custom quote.", 403);

  const body = await readJson(req);
  const wanted = cleanQuoteLines(body?.lines);
  if (!wanted) return fail("Up to 10,000 units per product.");
  if (wanted.size === 0) return fail("Add at least one product.");

  const neededBy = text(body?.neededBy, 10);
  if (!DATE_RE.test(neededBy) || neededBy < addDays(new Date().toISOString(), 2)) {
    return fail("Choose a date at least 2 days from today, so we have time to prepare it.");
  }
  const budgetRaw = body?.targetBudget;
  const targetBudget = budgetRaw === undefined || budgetRaw === null || budgetRaw === "" ? null : Number(budgetRaw);
  if (targetBudget !== null && (!Number.isFinite(targetBudget) || targetBudget < 0 || targetBudget > 1_000_000)) {
    return fail("Enter your budget as a number, or leave it empty.");
  }

  const snaps = await adminDb.getAll(...[...wanted.keys()].map((id) => adminDb.collection(COLLECTIONS.products).doc(String(id))));
  const lines: QuoteLine[] = [];
  for (const snap of snaps) {
    const p = snap.data();
    if (!snap.exists || typeof p?.price !== "number" || p.hidden === true) return fail("One of the products isn't available any more. Refresh and try again.", 409);
    lines.push({ productId: Number(snap.id), name: String(p.name), quantity: wanted.get(Number(snap.id)) ?? 0, listPrice: p.price });
  }
  const units = lines.reduce((s, l) => s + l.quantity, 0);
  if (units < MIN_QUOTE_UNITS) return fail(`Custom quotes start at ${MIN_QUOTE_UNITS} units. For smaller orders use the bulk order builder.`);

  const profile = (await adminDb.collection(COLLECTIONS.users).doc(user.id).get()).data() ?? {};
  const now = new Date();
  const id = `Q-${now.getTime().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
  const quote: QuoteRequest = {
    id,
    userId: user.id,
    customer: { email: user.email, fullName: user.name },
    businessName: String(profile.wholesaleApplication?.businessName ?? ""),
    lines,
    neededBy,
    targetBudget: targetBudget === null ? null : Math.round(targetBudget * 100) / 100,
    message: text(body?.message, 1500),
    status: "requested",
    createdAt: now.toISOString(),
  };
  await col().doc(id).create(quote);
  return NextResponse.json({ id, quote }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return fail("Log in first.", 401);
  const body = await readJson(req);
  const id = text(body?.id, 40);
  const action = text(body?.action, 20);
  if (!id) return fail("Which quote?");
  const ref = col().doc(id);
  const snap = await ref.get();
  if (!snap.exists) return fail("Quote not found.", 404);
  const quote = withExpiry(snap.data() as QuoteRequest);
  const now = new Date().toISOString();

  /* ----- admin side ----- */
  if (action === "quote" || action === "reject") {
    if (user.role !== "admin") return fail("Admins only.", 403);
    if (quote.status !== "requested" && quote.status !== "quoted" && quote.status !== "expired") return fail(`This quote is already ${quote.status}.`, 409);
    const adminMessage = text(body?.message, 1500);
    if (action === "reject") {
      await ref.update({ status: "declined", adminMessage, decidedAt: now, quotedBy: user.email });
      return NextResponse.json({ ok: true });
    }
    const prices = (body?.prices ?? {}) as Record<string, unknown>;
    const lines: QuoteLine[] = [];
    for (const l of quote.lines) {
      const price = Number(prices[String(l.productId)]);
      if (!Number.isFinite(price) || price <= 0 || price > 10_000) return fail(`Enter a price per unit for ${l.name}.`);
      lines.push({ ...l, quotedPrice: Math.round(price * 100) / 100 });
    }
    const days = Math.min(60, Math.max(1, Math.floor(Number(body?.validDays) || QUOTE_VALID_DAYS)));
    await ref.update({ lines, status: "quoted", adminMessage, quotedAt: now, validUntil: addDays(now, days), quotedBy: user.email });
    return NextResponse.json({ ok: true });
  }

  /* ----- buyer side ----- */
  if (action !== "accept" && action !== "decline") return fail("Unknown action.");
  if (quote.userId !== user.id) return fail("That isn't your quote.", 403);

  if (action === "decline") {
    if (quote.status !== "requested" && quote.status !== "quoted") return fail(`This quote is already ${quote.status}.`, 409);
    await ref.update({ status: "declined", decidedAt: now });
    return NextResponse.json({ ok: true });
  }

  if (quote.status === "expired") return fail("This price has expired. Ask us for a new quote.", 409);
  if (quote.status !== "quoted") return fail(quote.status === "requested" ? "We haven't sent a price yet." : `This quote is already ${quote.status}.`, 409);

  const taxExempt = await isTaxExempt(user.id);
  const lines = quote.lines.map((l) => ({ productId: l.productId, name: l.name, quantity: l.quantity, unitPrice: l.quotedPrice ?? l.listPrice }));
  const totals = wholesaleTotals(lines, { taxExempt, noTier: true });
  const orderNumber = `LYD-Q${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
  const order = {
    orderNumber,
    type: "wholesale",
    quoteId: quote.id,
    userId: user.id,
    customer: { email: user.email, fullName: user.name },
    lines,
    totals: { itemCount: totals.units, originalSubtotal: Math.round(quote.lines.reduce((s, l) => s + l.listPrice * l.quantity, 0) * 100) / 100, subtotal: totals.subtotal, discount: 0, shipping: 0, tax: totals.tax, total: totals.total },
    discountRate: 0,
    taxExempt,
    delivery: { method: "pickup", address: "", neededBy: quote.neededBy },
    notes: quote.message,
    recurring: null,
    payment: { method: "invoice", status: "unpaid" },
    status: "placed",
    placedAt: now,
    savedAt: now,
    statusHistory: [{ status: "placed", at: now }],
  };

  try {
    await adminDb.runTransaction(async (tx) => {
      const fresh = await tx.get(ref);
      if (fresh.data()?.status !== "quoted") throw new Error("already decided");
      tx.create(adminDb.collection(COLLECTIONS.orders).doc(orderNumber), order);
      tx.update(ref, { status: "accepted", decidedAt: now, orderNumber });
    });
  } catch (err) {
    if ((err as Error).message === "already decided") return fail("This quote was already accepted or declined.", 409);
    console.error("quote accept failed:", err);
    return fail("Couldn't place the order. Please try again.", 500);
  }
  await takeStock(lines);
  return NextResponse.json({ ok: true, orderNumber, totals: order.totals }, { status: 201 });
}
