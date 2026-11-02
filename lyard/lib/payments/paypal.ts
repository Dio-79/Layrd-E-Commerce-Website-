// PayPal Orders API v2 (server only). Square doesn't take PayPal, so it has its own route.
// https://developer.paypal.com/docs/api/orders/v2/
import { CURRENCY } from "./config";

const baseUrl = () =>
  process.env.PAYPAL_ENVIRONMENT === "production" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

async function accessToken(): Promise<string> {
  const id = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error("NEXT_PUBLIC_PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET are not set in .env.local.");

  const res = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = (await res.json()) as { access_token?: string };
  if (!res.ok || !data.access_token) throw new Error(`PayPal sign-in failed (${res.status}).`);
  return data.access_token;
}

async function call<T>(path: string, body: unknown, requestId: string): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": requestId, // makes retries safe
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T & { name?: string; message?: string };
  if (!res.ok) throw new Error(`PayPal ${path} failed (${res.status}): ${data.name ?? ""} ${data.message ?? ""}`);
  return data;
}

const dollars = (cents: number) => (cents / 100).toFixed(2);

/** Creates the PayPal order the buyer approves in the PayPal popup. */
export async function createPayPalOrder(input: { amountCents: number; orderNumber: string }): Promise<string> {
  const { id } = await call<{ id: string }>(
    "/v2/checkout/orders",
    {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: input.orderNumber,
          custom_id: input.orderNumber,
          description: `Läyrd order ${input.orderNumber}`,
          amount: { currency_code: CURRENCY, value: dollars(input.amountCents) },
        },
      ],
    },
    `create-${input.orderNumber}`
  );
  return id;
}

export interface PayPalCapture {
  captureId: string;
  amountCents: number;
  currency: string;
  orderNumber: string;
  payerEmail?: string;
}

/** Takes the money once the buyer approved. Returns what PayPal actually captured. */
export async function capturePayPalOrder(paypalOrderId: string): Promise<PayPalCapture> {
  type CaptureResponse = {
    status: string;
    payer?: { email_address?: string };
    purchase_units: {
      custom_id?: string;
      payments?: { captures?: { id: string; status: string; custom_id?: string; amount: { value: string; currency_code: string } }[] };
    }[];
  };
  const data = await call<CaptureResponse>(
    `/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`,
    {},
    `capture-${paypalOrderId}`
  );
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
  if (data.status !== "COMPLETED" || !capture || capture.status !== "COMPLETED") {
    throw new Error(`PayPal capture not completed (${data.status}).`);
  }
  return {
    captureId: capture.id,
    amountCents: Math.round(Number(capture.amount.value) * 100),
    currency: capture.amount.currency_code,
    orderNumber: capture.custom_id ?? data.purchase_units[0].custom_id ?? "",
    payerEmail: data.payer?.email_address,
  };
}
