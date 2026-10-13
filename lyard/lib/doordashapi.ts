/**
 * DoorDash API — DUMMY DATA.
 *
 * Nothing here calls DoorDash. Quotes and deliveries are generated locally so the
 * checkout flow works end to end. To go live, keep these function signatures and
 * replace the bodies with fetch() calls to your own server routes (for example
 * /api/doordash/quote and /api/doordash/deliveries). DoorDash Drive requires signed
 * requests, so the real calls must run on the server, never in the browser.
 */

export interface DeliveryAddress {
  street: string;
  city: string;
  province: string;
  postal: string;
}

export interface DoorDashQuote {
  quoteId: string;
  fee: number;
  currency: "CAD";
  etaMinutes: number;
  expiresAt: string;
}

export interface DoorDashDelivery {
  deliveryId: string;
  status: "created" | "courier_assigned" | "picked_up" | "delivered";
  fee: number;
  etaMinutes: number;
  courier: { name: string; vehicle: string };
}

export const PICKUP_LOCATION = {
  name: "LÄYRD",
  address: "123 St. NE, Calgary, AB",
};

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

const FEES = [4.99, 5.99, 6.99, 7.99, 8.99];

const COURIERS = [
  { name: "Alex M.", vehicle: "Toyota Corolla" },
  { name: "Priya S.", vehicle: "Honda Civic" },
  { name: "Jordan T.", vehicle: "Electric bike" },
  { name: "Sam K.", vehicle: "Hyundai Elantra" },
];

/** Dummy quote: the fee and ETA are derived from the postal code, so they stay stable. */
export async function getDeliveryQuote(address: DeliveryAddress): Promise<DoorDashQuote> {
  await wait(500);

  const postal = address.postal.replace(/[\s-]/g, "").toUpperCase();
  if (postal.length < 5) {
    throw new Error("Enter a valid postal code to get a delivery quote.");
  }

  const h = hashString(postal);
  return {
    quoteId: `dd_quote_${h.toString(36)}`,
    fee: FEES[h % FEES.length],
    currency: "CAD",
    etaMinutes: 30 + (h % 4) * 5,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  };
}

/** Dummy "accept quote": returns a fake delivery with a courier. */
export async function createDelivery(
  quote: DoorDashQuote,
  address: DeliveryAddress,
  contact: { name: string; phone: string }
): Promise<DoorDashDelivery> {
  await wait(600);

  if (new Date(quote.expiresAt).getTime() < Date.now()) {
    throw new Error("Your delivery quote expired. Please re-enter your address to refresh it.");
  }
  if (!contact.name.trim() || !address.street.trim()) {
    throw new Error("Name and street address are required for delivery.");
  }

  const seed = hashString(`${quote.quoteId}|${contact.phone}|${address.street}`);
  return {
    deliveryId: `DD-${seed.toString(36).toUpperCase().padStart(7, "0").slice(0, 7)}`,
    status: "courier_assigned",
    fee: quote.fee,
    etaMinutes: quote.etaMinutes,
    courier: COURIERS[seed % COURIERS.length],
  };
}