// app/api/bundle-preorders/route.ts
// Bundle orders from /Bundle/checkout, saved to Firestore "bundlePreorders".
//   GET  ?date=YYYY-MM-DD                 how many drinks are still free that day
//   GET  ?reference=BN-...&email=...      look up an order (confirmation page)
//   POST { customer, fulfillment, ... }   place a bundle order (signed-in customers only)
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
  PICKUP_TIMES,
  STATUSES,
  earliestBundleDate,
  leadDaysFor,
  priceOrder,
  type BundleDelivery,
  type BundleLine,
  type BundleRecord,
  type Fulfillment,
  type OrderStatus,
} from "@/lib/Bundle/bundleRules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLLECTION = COLLECTIONS.bundlePreorders;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

/* ---------- GET: capacity for a date, or look up an order ---------- */
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

/* ---------- POST: register a bundle preorder ---------- */
interface DeliveryInput {
  address?: { street?: string; city?: string; province?: string; postal?: string };
  quoteId?: string;
  deliveryId?: string;
  status?: string;
  fee?: number;
  etaMinutes?: number;
  courier?: { name?: string; vehicle?: string };
  trackingUrl?: string;
}

export async function POST(req: NextRequest) {
  const user = await requireBuyer(req).catch((err: OrderError) => err);
  if (user instanceof OrderError) return fail(user.message, user.status);
  let body: {
    customer?: { name?: string; email?: string; phone?: string };
    pickupPerson?: string;
    fulfillment?: string;
    delivery?: DeliveryInput;
    pickupDate?: string;
    pickupTime?: string;
    notes?: unknown;
    lines?: BundleLine[];
    paymentMethod?: unknown;
    acceptedPolicy?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return fail("Invalid request");
  }

  const { customer, pickupPerson, delivery, pickupDate, pickupTime, notes, lines, paymentMethod, acceptedPolicy } =
    body ?? {};
  const fulfillment: Fulfillment = body?.fulfillment === "delivery" ? "delivery" : "pickup";
  const noun = fulfillment === "delivery" ? "delivery" : "pickup";

  if (!customer?.name?.trim()) return fail("Enter your name.");
  if (!/^\S+@\S+\.\S+$/.test(customer?.email ?? "")) return fail("Enter a valid email.");
  if (String(customer?.phone ?? "").replace(/\D/g, "").length < 10) return fail("Enter a valid phone number.");
  if (!DATE_RE.test(pickupDate ?? "")) return fail(`Choose a ${noun} date.`);
  if (!PICKUP_TIMES.some((t) => t.value === pickupTime)) return fail(`Choose a ${noun} time.`);
  if (acceptedPolicy !== true) return fail("Please accept the order policy.");

  if (!Array.isArray(lines) || lines.length === 0) return fail("The order has no items.");
  for (const l of lines) {
    if (!Number.isInteger(l?.quantity) || l.quantity < 1 || l.quantity > 10000) return fail("Invalid item quantity.");
    if (typeof l?.unitPrice !== "number" || !Number.isFinite(l.unitPrice) || l.unitPrice < 0)
      return fail("Invalid item price.");
  }

  // Delivery details (only for delivery orders)
  let deliveryRecord: BundleDelivery | null = null;
  let deliveryFee = 0;
  if (fulfillment === "delivery") {
    const a = delivery?.address;
    if (!a?.street?.trim() || !a?.city?.trim() || !a?.province?.trim()) {
      return fail("Enter your full delivery address.");
    }
    if (String(a.postal ?? "").replace(/[\s-]/g, "").length < 5) return fail("Enter a valid postal code.");

    // TODO: prices come from the browser. When you wire up the real DoorDash Drive API,
    // request the quote and create the delivery here on the server and use ITS fee.
    const fee = delivery?.fee;
    if (typeof fee !== "number" || !Number.isFinite(fee) || fee < 0 || fee > 50) {
      return fail("Invalid delivery fee.");
    }
    if (!delivery?.deliveryId) return fail("The delivery wasn't booked. Please try again.");

    deliveryFee = fee;
    deliveryRecord = {
      address: {
        street: String(a.street).trim(),
        city: String(a.city).trim(),
        province: String(a.province).trim().toUpperCase(),
        postal: String(a.postal).trim(),
      },
      quoteId: String(delivery.quoteId ?? ""),
      deliveryId: String(delivery.deliveryId),
      status: String(delivery.status ?? "created"),
      etaMinutes: Number(delivery.etaMinutes) || 0,
      courierName: String(delivery.courier?.name ?? ""),
      courierVehicle: String(delivery.courier?.vehicle ?? ""),
      trackingUrl: String(delivery.trackingUrl ?? ""),
    };
  }

  const date = pickupDate as string;
  const time = pickupTime as string;
  const units = lines.reduce((s, l) => s + l.quantity, 0);
  const earliest = earliestBundleDate(units);
  if (date < earliest) {
    return fail(`Orders of ${units} drinks need at least ${leadDaysFor(units)} day(s) notice (earliest: ${earliest}).`);
  }

  try {
    // Prices come from the catalog, not the browser.
    const catalog = await repriceLines(lines, 10000);
    assertSamePrices(lines, catalog);

    const money = priceOrder(
      catalog.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
      deliveryFee
    );
    const payment = preorderPayment(paymentMethod, {
      pickup: fulfillment === "pickup",
      dueNow: money.total,
      total: money.total,
    });

    const record: BundleRecord & { userId: string; payment: typeof payment; paymentMethod: string } = {
      reference: newReference("BN"),
      status: "requested",
      createdAt: new Date().toISOString(),
      fulfillment,
      pickupDate: date,
      pickupTime: time,
      customer: {
        name: String(customer.name).trim(),
        email: String(customer.email).trim(),
        phone: String(customer.phone).trim(),
      },
      pickupPerson: String(pickupPerson || customer.name).trim(),
      notes: String(notes ?? ""),
      lines: catalog,
      units,
      ...money,
      delivery: deliveryRecord,
      paymentMethod: payment.method,
      payment,
      userId: user.id,
      policyAcceptedAt: new Date().toISOString(),
    };

    await savePreorder(COLLECTION, record, MAX_UNITS_PER_DAY, "drinks");
    return NextResponse.json({ record }, { status: 201 });
  } catch (err) {
    if (err instanceof OrderError) return fail(err.message, err.status);
    console.error("bundle-preorders POST failed:", err);
    return fail("Couldn't save the order. Please try again.", 500);
  }
}

/* ---------- PATCH: staff changes an order's status ---------- */
export async function PATCH(req: NextRequest) {
  if (!(await canManage(req, process.env.BUNDLE_ADMIN_KEY))) return fail("Not allowed", 403);

  const { reference, status } = (await req.json().catch(() => ({}))) as {
    reference?: string;
    status?: OrderStatus;
  };
  if (!reference || !status || !STATUSES.includes(status)) return fail("Provide reference and a valid status.");

  const record = await updatePreorderStatus(COLLECTION, reference, status);
  return record ? NextResponse.json({ record }) : fail("Order not found", 404);
}
