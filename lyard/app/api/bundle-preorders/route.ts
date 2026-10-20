// app/api/bundle-preorders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
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

/* ---------- storage ----------
   A JSON file works locally. On Vercel and other serverless hosts the disk is
   temporary, so swap readAll/writeAll for a database before deploying. */
const FILE = path.join(process.cwd(), ".data", "bundle-preorders.json");

async function readAll(): Promise<BundleRecord[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as BundleRecord[];
  } catch {
    return [];
  }
}

async function writeAll(rows: BundleRecord[]) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(rows, null, 2));
}

// Runs writes one at a time so two orders can't overwrite each other or oversell a day
let lock: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = lock.then(fn, fn);
  lock = run.catch(() => undefined);
  return run;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

const unitsOn = (rows: BundleRecord[], date: string) =>
  rows
    .filter((r) => r.pickupDate === date && r.status !== "cancelled")
    .reduce((s, r) => s + r.units, 0);

/* ---------- GET: capacity for a date, or look up an order ---------- */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const rows = await readAll();

  const date = q.get("date");
  if (date) {
    if (!DATE_RE.test(date)) return fail("Invalid date");
    const booked = unitsOn(rows, date);
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
    const record = rows.find(
      (r) => r.reference === reference && r.customer.email.toLowerCase() === email
    );
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
  let body: {
    customer?: { name?: string; email?: string; phone?: string };
    pickupPerson?: string;
    fulfillment?: string;
    delivery?: DeliveryInput;
    pickupDate?: string;
    pickupTime?: string;
    notes?: unknown;
    lines?: BundleLine[];
    acceptedPolicy?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return fail("Invalid request");
  }

  const { customer, pickupPerson, delivery, pickupDate, pickupTime, notes, lines, acceptedPolicy } =
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

  // TODO: prices come from the browser. Before taking real money, look each
  // line up in your product catalog here and use the catalog price instead.
  const money = priceOrder(
    lines.reduce<number>((s, l) => s + l.unitPrice * l.quantity, 0),
    deliveryFee
  );

  return withLock(async () => {
    try {
      const rows = await readAll();

      const booked = unitsOn(rows, date);
      if (booked + units > MAX_UNITS_PER_DAY) {
        const remaining = Math.max(0, MAX_UNITS_PER_DAY - booked);
        return fail(
          remaining === 0
            ? "That date is fully booked. Please choose another date."
            : `Only ${remaining} drinks are left on that date. Reduce the order or choose another date.`,
          409
        );
      }

      // TODO: charge the payment here with your payment provider and only continue
      // if it succeeds. Card details never reach this route.

      const reference = `BN-${Date.now().toString(36).toUpperCase()}${Math.random()
        .toString(36)
        .slice(2, 5)
        .toUpperCase()}`;

      const record: BundleRecord = {
        reference,
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
        lines,
        units,
        ...money,
        delivery: deliveryRecord,
        policyAcceptedAt: new Date().toISOString(),
      };

      await writeAll([...rows, record]);
      return NextResponse.json({ record }, { status: 201 });
    } catch (err) {
      console.error("bundle-preorders POST failed:", err);
      return fail(
        err instanceof Error ? `Server error: ${err.message}` : "Server error while saving the order.",
        500
      );
    }
  });
}

/* ---------- PATCH: staff changes an order's status ----------
   Set BUNDLE_ADMIN_KEY in .env.local, then:
   fetch("/api/bundle-preorders", { method: "PATCH",
     headers: { "Content-Type": "application/json", "x-admin-key": "<key>" },
     body: JSON.stringify({ reference: "BN-...", status: "confirmed" }) }) */
export async function PATCH(req: NextRequest) {
  const key = process.env.BUNDLE_ADMIN_KEY;
  if (!key || req.headers.get("x-admin-key") !== key) return fail("Not allowed", 403);

  const { reference, status } = (await req.json().catch(() => ({}))) as {
    reference?: string;
    status?: OrderStatus;
  };
  if (!reference || !status || !STATUSES.includes(status)) return fail("Provide reference and a valid status.");

  return withLock(async () => {
    const rows = await readAll();
    const index = rows.findIndex((r) => r.reference === reference);
    if (index === -1) return fail("Order not found", 404);
    rows[index] = { ...rows[index], status };
    await writeAll(rows);
    return NextResponse.json({ record: rows[index] });
  });
}