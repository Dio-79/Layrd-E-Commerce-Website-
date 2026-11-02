// Square Payments API (server only). Docs:
// https://developer.squareup.com/reference/square/payments-api/create-payment
// https://developer.squareup.com/reference/square/payments-api/complete-payment
import { CURRENCY, square as publicConfig } from "./config";

const SQUARE_VERSION = "2026-09-16";

const baseUrl = () =>
  publicConfig.sandbox ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";

export interface SquarePayment {
  id: string;
  status: "APPROVED" | "PENDING" | "COMPLETED" | "CANCELED" | "FAILED";
  amount_money: { amount: number; currency: string };
  source_type?: string;
  receipt_url?: string;
  card_details?: { card?: { card_brand?: string; last_4?: string } };
  wallet_details?: { brand?: string };
}

/** A Square error the customer can act on ("Payment declined", ...). */
export class PaymentDeclined extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
  }
}

const DECLINE_MESSAGES: Record<string, string> = {
  GENERIC_DECLINE: "Payment declined. Try another card or payment method.",
  CARD_DECLINED: "Payment declined. Try another card or payment method.",
  INSUFFICIENT_FUNDS: "Payment declined: insufficient funds.",
  CVV_FAILURE: "Payment declined: check the security code.",
  ADDRESS_VERIFICATION_FAILURE: "Payment declined: check the postal code.",
  INVALID_EXPIRATION: "Payment declined: check the expiry date.",
  BAD_EXPIRATION: "Payment declined: check the expiry date.",
  CARD_EXPIRED: "Payment declined: the card has expired.",
  INVALID_CARD: "Payment declined: check the card number.",
  TRANSACTION_LIMIT: "Payment declined: over the card's limit.",
  CARD_DECLINED_VERIFICATION_REQUIRED: "Payment declined: the bank needs extra verification.",
};

async function call<T>(path: string, body: unknown): Promise<T> {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) throw new Error("SQUARE_ACCESS_TOKEN is not set in .env.local.");

  const res = await fetch(`${baseUrl()}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Square-Version": SQUARE_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T & { errors?: { code: string; category: string; detail?: string }[] };
  if (!res.ok || data.errors?.length) {
    const error = data.errors?.[0];
    if (error && (error.category === "PAYMENT_METHOD_ERROR" || DECLINE_MESSAGES[error.code])) {
      throw new PaymentDeclined(DECLINE_MESSAGES[error.code] ?? "Payment declined.", error.code);
    }
    throw new Error(`Square ${path} failed (${res.status}): ${error?.code ?? "unknown"} ${error?.detail ?? ""}`);
  }
  return data;
}

/**
 * Authorizes the payment without taking the money yet (autocomplete: false).
 * The idempotency key is the order number, so a retry never charges twice.
 */
export async function createPayment(input: {
  sourceId: string;
  verificationToken?: string;
  amountCents: number;
  orderNumber: string;
  email: string;
}): Promise<SquarePayment> {
  const { payment } = await call<{ payment: SquarePayment }>("/v2/payments", {
    source_id: input.sourceId,
    verification_token: input.verificationToken,
    idempotency_key: input.orderNumber,
    amount_money: { amount: input.amountCents, currency: CURRENCY },
    autocomplete: false,
    location_id: publicConfig.locationId || undefined,
    reference_id: input.orderNumber,
    buyer_email_address: input.email,
    note: `Läyrd order ${input.orderNumber}`,
  });
  return payment;
}

/** Takes the money for an authorized payment (POST /v2/payments/{id}/complete). */
export async function completePayment(paymentId: string): Promise<SquarePayment> {
  const { payment } = await call<{ payment: SquarePayment }>(`/v2/payments/${encodeURIComponent(paymentId)}/complete`, {});
  return payment;
}

/** Releases an authorized payment that was never completed. */
export async function cancelPayment(paymentId: string): Promise<void> {
  await call(`/v2/payments/${encodeURIComponent(paymentId)}/cancel`, {});
}
