/**
 * Customer profile: types, rules and the storage adapter.
 *
 * Nothing here is hard-coded customer data. The starting values come from the
 * signed-in account (AuthContext) and anything the customer saves is stored per account.
 */

/* ------------------------------------------------------------------ */
/* Types and config                                                   */
/* ------------------------------------------------------------------ */

/** The notification switches shown on the page. Add a row here and it appears automatically. */
export const NOTIFICATION_OPTIONS = [
  { key: "orderStatus", label: "Order status updates", defaultOn: true },
  // Marketing messages start OFF: Canadian anti-spam law (CASL) needs the customer's consent.
  { key: "wholesaleOffers", label: "New wholesale pricing & offers", defaultOn: false },
  { key: "deliveryReminders", label: "Delivery reminders", defaultOn: true },
] as const;

export type NotificationKey = (typeof NOTIFICATION_OPTIONS)[number]["key"];

export interface Address {
  street: string;
  city: string;
  province: string;
  postal: string;
}

export type CardBrand = "Visa" | "Mastercard" | "Amex" | "Card";

/** Only non-sensitive card details are kept: never the full number or the security code. */
export interface SavedCard {
  id: string;
  brand: CardBrand;
  last4: string;
  expMonth: number;
  expYear: number;
}

export interface CustomerProfile {
  name: string;
  email: string;
  phone: string;
  address: Address;
  notifications: Record<NotificationKey, boolean>;
  paymentMethods: SavedCard[];
}

/** The parts of your signed-in user this feature reads. All optional, so any AuthContext user fits. */
export interface AuthUserLike {
  id?: string | number;
  email?: string;
  name?: string;
  phone?: string;
}

/** Key that identifies the customer's saved data. */
export function identityOf(user: AuthUserLike | null | undefined): string {
  if (!user) return "";
  return String(user.id ?? user.email ?? "");
}

export function defaultNotifications(): Record<NotificationKey, boolean> {
  return Object.fromEntries(NOTIFICATION_OPTIONS.map((o) => [o.key, o.defaultOn])) as Record<
    NotificationKey,
    boolean
  >;
}

/** Sign-in details are the starting point; anything the customer saved wins. */
export function buildProfile(
  user: AuthUserLike | null | undefined,
  saved: Partial<CustomerProfile> | null
): CustomerProfile {
  return {
    name: saved?.name || user?.name || "",
    email: saved?.email || user?.email || "",
    phone: saved?.phone ?? user?.phone ?? "",
    address: { street: "", city: "", province: "", postal: "", ...saved?.address },
    notifications: { ...defaultNotifications(), ...saved?.notifications },
    paymentMethods: saved?.paymentMethods ?? [],
  };
}

/* ------------------------------------------------------------------ */
/* Validation                                                         */
/* ------------------------------------------------------------------ */

export type ProfileErrors = Partial<
  Record<"name" | "email" | "phone" | "street" | "city" | "province" | "postal", string>
>;

export function validateProfile(p: CustomerProfile): ProfileErrors {
  const errors: ProfileErrors = {};

  if (!p.name.trim()) errors.name = "Name is required";

  if (!p.email.trim()) errors.email = "Email is required";
  else if (!/^\S+@\S+\.\S+$/.test(p.email.trim())) errors.email = "Enter a valid email";

  if (p.phone.trim() && p.phone.replace(/\D/g, "").length < 10) {
    errors.phone = "Enter a valid phone number";
  }

  // An address is optional, but a half-filled one can't be delivered to
  const anyAddress = Object.values(p.address).some((v) => v.trim());
  if (anyAddress) {
    if (!p.address.street.trim()) errors.street = "Street address is required";
    if (!p.address.city.trim()) errors.city = "City is required";
    if (!p.address.province.trim()) errors.province = "Province is required";
    if (!p.address.postal.trim()) errors.postal = "Postal code is required";
  }

  return errors;
}

/* ------------------------------------------------------------------ */
/* Cards (only used to describe a card, never to charge it)           */
/* ------------------------------------------------------------------ */

export function detectBrand(number: string): CardBrand {
  const d = number.replace(/\D/g, "");
  if (/^4/.test(d)) return "Visa";
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(d)) return "Mastercard";
  if (/^3[47]/.test(d)) return "Amex";
  return "Card";
}

/** Luhn check: catches mistyped card numbers. */
export function passesLuhn(number: string): boolean {
  const digits = number.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

/** "08/27" -> { month: 8, year: 2027 } */
export function parseExpiry(value: string): { month: number; year: number } | null {
  const m = /^(0[1-9]|1[0-2])\s*\/\s*(\d{2})$/.exec(value.trim());
  if (!m) return null;
  return { month: Number(m[1]), year: 2000 + Number(m[2]) };
}

export function isExpired(month: number, year: number, now = new Date()): boolean {
  const thisYear = now.getFullYear();
  return year < thisYear || (year === thisYear && month < now.getMonth() + 1);
}

/* ------------------------------------------------------------------ */
/* Storage adapter                                                    */
/* ------------------------------------------------------------------ */

export interface ProfileStore {
  load(identity: string): Promise<Partial<CustomerProfile> | null>;
  save(identity: string, profile: CustomerProfile): Promise<void>;
}

const keyFor = (identity: string) => `layrd:profile:${identity}`;

/**
 * Saves in this browser, per account. To use your own backend, replace the two
 * functions below with fetch() calls (for example GET and PUT /api/account/profile).
 * The rest of the page does not change.
 */
export const profileStore: ProfileStore = {
  async load(identity) {
    try {
      const raw = window.localStorage.getItem(keyFor(identity));
      return raw ? (JSON.parse(raw) as Partial<CustomerProfile>) : null;
    } catch {
      return null;
    }
  },
  async save(identity, profile) {
    try {
      window.localStorage.setItem(keyFor(identity), JSON.stringify(profile));
    } catch {
      throw new Error("We couldn't save your changes in this browser.");
    }
  },
};