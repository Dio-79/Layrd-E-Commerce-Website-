// app/api/event-preorders/route.ts
// Event orders from /Eventorder/Checkout, saved to Firestore "eventPreorders".
//   GET  ?date=YYYY-MM-DD                 how many items are still free that day
//   GET  ?reference=EV-...&email=...      look up an order (confirmation page)
//   POST { customer, pickupDate, ... }    place an event order (signed-in customers only)
//   PATCH { reference, status }           staff: x-admin-key header, or signed in as admin
import { NextRequest, NextResponse } from "next/server";
import { assertSamePrices, OrderError, repriceLines, requireBuyer } from "@/lib/server/orders";
import {
  bookedUnits,
  canManage,
  findPreorder,
  newReference,
  preorderPayment,
  savePreorder,
  updatePreorderStatus,
} from "@/lib/server/preorders";
import { COLLECTIONS } from "@/lib/firebase/admin";
import {
  MAX_UNITS_PER_DAY,
  earliestEventDate,
  leadDaysFor,
  priceOrder,
  PICKUP_TIMES,
  type OrderStatus,
} from "@/lib/event/eventRules";
import type { PreorderRecord } from "@/lib/event/eventCheckoutStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLLECTION = COLLECTIONS.eventPreorders;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

/* ---------- GET ---------- */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;

  const date = q.get("date");
  if (date) {
    if (!DATE_RE.test(date)) return fail("Invalid date");
    const booked = await bookedUnits(COLLECTION, date);
    return NextResponse.json({
      date,
      booked,
      capacity: MAX_UNITS_PER_DAY,
      remaining: Math.max(0, MAX_UNITS_PER_DAY - booked),
    });
  }

  const reference = q.get("reference")?.trim().toUpperCase();
  const email = q.get("email")?.trim().toLowerCase();
  if (reference && email) {
    const record = await findPreorder(COLLECTION, reference, email);
    // Same message for "no such order" and "wrong email" so references can't be guessed
    return record ? NextResponse.json({ record }) : fail("We couldn't find that order.", 404);
  }

  return fail("Provide ?date= or ?reference=&email=");
}

/* ---------- POST: register an event order ---------- */
export async function POST(req: NextRequest) {
  const user = await requireBuyer(req).catch((err: OrderError) => err);
  if (user instanceof OrderError) return fail(user.message, user.status);
  let body: {
    customer?: { name?: string; email?: string; phone?: string };
    pickupPerson?: string;
    pickupDate: string;
    pickupTime?: string;
    details?: { eventType?: unknown; headcount?: unknown; comment?: unknown; fileName?: unknown };
    lines?: PreorderRecord["lines"];
    paymentMethod?: unknown;
    acceptedPolicy?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return fail("Invalid request");
  }

  const { customer, pickupPerson, pickupDate, pickupTime, details, lines, paymentMethod, acceptedPolicy } =
    body ?? {};

  if (!customer?.name?.trim()) return fail("Enter your name.");
  if (!/^\S+@\S+\.\S+$/.test(customer?.email ?? "")) return fail("Enter a valid email.");
  if (String(customer?.phone ?? "").replace(/\D/g, "").length < 10) return fail("Enter a valid phone number.");
  if (!DATE_RE.test(pickupDate ?? "")) return fail("Choose a pickup date.");
  if (!PICKUP_TIMES.some((t) => t.value === pickupTime)) return fail("Choose a pickup time.");
  if (acceptedPolicy !== true) return fail("Please accept the order policy.");
  if (!Array.isArray(lines) || lines.length === 0) return fail("The order has no items.");

  try {
    // Prices come from the catalog, not the browser.
    const catalog = await repriceLines(lines, 10000);
    assertSamePrices(lines, catalog);

    const units = catalog.reduce((s, l) => s + l.quantity, 0);
    const earliest = earliestEventDate(units);
    if (pickupDate < earliest) {
      return fail(`Orders of ${units} items need at least ${leadDaysFor(units)} days notice (earliest: ${earliest}).`);
    }

    const money = priceOrder(catalog.reduce((s, l) => s + l.unitPrice * l.quantity, 0));
    const payment = preorderPayment(paymentMethod, { pickup: true, dueNow: money.deposit, total: money.total });

    const record: PreorderRecord & { userId: string; payment: typeof payment } = {
      reference: newReference("EV"),
      status: "requested",
      createdAt: new Date().toISOString(),
      pickupDate,
      pickupTime: pickupTime!,
      customer: {
        name: String(customer.name).trim(),
        email: String(customer.email).trim(),
        phone: String(customer.phone).trim(),
      },
      pickupPerson: String(pickupPerson || customer.name).trim(),
      details: {
        pickupDate,
        eventType: String(details?.eventType ?? ""),
        headcount: String(details?.headcount ?? ""),
        comment: String(details?.comment ?? ""),
        fileName: details?.fileName ? String(details.fileName) : null,
      },
      lines: catalog,
      units,
      ...money,
      paymentMethod: payment.method,
      payment,
      userId: user.id,
      policyAcceptedAt: new Date().toISOString(),
    };

    await savePreorder(COLLECTION, record, MAX_UNITS_PER_DAY, "items");
    return NextResponse.json({ record }, { status: 201 });
  } catch (err) {
    if (err instanceof OrderError) return fail(err.message, err.status);
    console.error("event-preorders POST failed:", err);
    return fail("Couldn't save the order. Please try again.", 500);
  }
}

/* ---------- PATCH: staff changes an order's status ---------- */
const STATUSES: OrderStatus[] = ["requested", "confirmed", "in_production", "ready", "picked_up", "cancelled"];

export async function PATCH(req: NextRequest) {
  if (!(await canManage(req, process.env.EVENT_ADMIN_KEY))) return fail("Not allowed", 403);

  const { reference, status } = (await req.json().catch(() => ({}))) as {
    reference?: string;
    status?: OrderStatus;
  };
  if (!reference || !status || !STATUSES.includes(status)) return fail("Provide reference and a valid status.");

  const record = await updatePreorderStatus(COLLECTION, reference, status);
  return record ? NextResponse.json({ record }) : fail("Order not found", 404);
}
