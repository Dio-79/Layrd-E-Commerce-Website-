// Firestore storage for bundle and event preorders (collections bundlePreorders and
// eventPreorders). Each preorder is one document, keyed by its reference, and the
// daily capacity check runs in the same transaction as the save, so two customers
// can't both take the last spots on a day.
import type { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/server/session";
import { OrderError } from "@/lib/server/orders";
import { CURRENCY, enabled, etransferEmail } from "@/lib/payments/config";

interface Preorder {
  reference: string;
  pickupDate: string;
  units: number;
  status: string;
  customer: { email: string };
}

const active = (r: { status?: string }) => r.status !== "cancelled";

/** Units already booked on a date (cancelled orders don't count). */
export async function bookedUnits(collection: string, date: string): Promise<number> {
  const snap = await adminDb.collection(collection).where("pickupDate", "==", date).get();
  return snap.docs.map((d) => d.data() as Preorder).filter(active).reduce((s, r) => s + (r.units ?? 0), 0);
}

/** Saves the preorder if the day still has room; otherwise throws a 409 that says how much is left. */
export async function savePreorder<T extends Preorder>(collection: string, record: T, maxUnits: number, unitName: string) {
  const col = adminDb.collection(collection);
  await adminDb.runTransaction(async (tx) => {
    const sameDay = await tx.get(col.where("pickupDate", "==", record.pickupDate));
    const booked = sameDay.docs.map((d) => d.data() as Preorder).filter(active).reduce((s, r) => s + (r.units ?? 0), 0);
    if (booked + record.units > maxUnits) {
      const remaining = Math.max(0, maxUnits - booked);
      throw new OrderError(
        remaining === 0
          ? "That date is fully booked. Please choose another date."
          : `Only ${remaining} ${unitName} are left on that date. Reduce the order or choose another date.`,
        409
      );
    }
    tx.create(col.doc(record.reference), record);
  });
}

/** The preorder with this reference, if the email matches (so references can't be guessed). */
export async function findPreorder(collection: string, reference: string, email: string) {
  const snap = await adminDb.collection(collection).doc(reference).get();
  const record = snap.data() as Preorder | undefined;
  return record && record.customer.email.toLowerCase() === email.toLowerCase() ? record : null;
}

/** Staff change a preorder's status: with the admin key from .env.local, or signed in as an admin. */
export async function canManage(req: NextRequest, adminKey: string | undefined) {
  if (adminKey && req.headers.get("x-admin-key") === adminKey) return true;
  return (await getSessionUser(req))?.role === "admin";
}

export async function updatePreorderStatus(collection: string, reference: string, status: string) {
  const ref = adminDb.collection(collection).doc(reference);
  const snap = await ref.get();
  if (!snap.exists) return null;
  await ref.update({ status });
  return { ...snap.data(), status };
}

export const newReference = (prefix: string) =>
  `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

/**
 * How the preorder is paid. These checkouts don't take cards: the customer pays at
 * pickup, or sends an Interac e-Transfer (when NEXT_PUBLIC_ETRANSFER_EMAIL is set).
 */
export function preorderPayment(method: unknown, opts: { pickup: boolean; dueNow: number; total: number }) {
  if (method === "in_store") {
    if (!opts.pickup) throw new OrderError("Pay at pickup is only for pickup orders.");
    return { method: "in_store", status: "pay_at_pickup", amountDueNow: 0, total: opts.total, currency: CURRENCY };
  }
  if (method === "etransfer") {
    if (!enabled.etransfer) throw new OrderError("e-Transfer isn't set up yet. Choose pay at pickup.");
    return {
      method: "etransfer",
      status: "awaiting_etransfer",
      amountDueNow: opts.dueNow,
      total: opts.total,
      currency: CURRENCY,
      etransferEmail,
    };
  }
  throw new OrderError("Choose how you'd like to pay.");
}
