// The Square and PayPal API clients: the exact requests they send (no network).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("SQUARE_ACCESS_TOKEN", "sq-test-token");
  vi.stubEnv("NEXT_PUBLIC_PAYPAL_CLIENT_ID", "pp-client");
  vi.stubEnv("PAYPAL_CLIENT_SECRET", "pp-secret");
  fetchMock.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
const sent = (call: number) => {
  const [url, init] = fetchMock.mock.calls[call] as [string, RequestInit];
  const raw = init.body ? String(init.body) : undefined;
  const body = raw?.startsWith("{") ? JSON.parse(raw) : raw;
  return { url, headers: init.headers as Record<string, string>, body };
};

describe("Square client", async () => {
  const { cancelPayment, completePayment, createPayment, PaymentDeclined } = await import("@/lib/payments/square");

  it("authorizes without capturing, keyed by the order number", async () => {
    fetchMock.mockResolvedValue(reply(200, { payment: { id: "p1", status: "APPROVED" } }));
    await createPayment({ sourceId: "cnon:ok", amountCents: 1890, orderNumber: "LYD-1", email: "a@b.co" });

    const { url, headers, body } = sent(0);
    expect(url).toBe("https://connect.squareupsandbox.com/v2/payments");
    expect(headers.Authorization).toBe("Bearer sq-test-token");
    expect(headers["Square-Version"]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(body).toMatchObject({
      source_id: "cnon:ok",
      idempotency_key: "LYD-1",
      amount_money: { amount: 1890, currency: "CAD" },
      autocomplete: false,
      reference_id: "LYD-1",
      buyer_email_address: "a@b.co",
    });
  });

  it("completes and cancels through the payment's own endpoints", async () => {
    fetchMock.mockResolvedValue(reply(200, { payment: { id: "p1", status: "COMPLETED" } }));
    await completePayment("p1");
    await cancelPayment("p1");
    expect(sent(0).url).toBe("https://connect.squareupsandbox.com/v2/payments/p1/complete");
    expect(sent(1).url).toBe("https://connect.squareupsandbox.com/v2/payments/p1/cancel");
  });

  it("turns card errors into a friendly decline", async () => {
    fetchMock.mockResolvedValue(reply(400, { errors: [{ code: "INSUFFICIENT_FUNDS", category: "PAYMENT_METHOD_ERROR" }] }));
    const err = await createPayment({ sourceId: "x", amountCents: 1, orderNumber: "LYD-2", email: "a@b.co" }).catch((e) => e);
    expect(err).toBeInstanceOf(PaymentDeclined);
    expect(err.message).toBe("Payment declined: insufficient funds.");
  });

  it("treats other Square errors as failures, not declines", async () => {
    fetchMock.mockResolvedValue(reply(401, { errors: [{ code: "UNAUTHORIZED", category: "AUTHENTICATION_ERROR" }] }));
    const err = await createPayment({ sourceId: "x", amountCents: 1, orderNumber: "LYD-3", email: "a@b.co" }).catch((e) => e);
    expect(err).not.toBeInstanceOf(PaymentDeclined);
    expect(err.message).toMatch(/UNAUTHORIZED/);
  });
});

describe("PayPal client", async () => {
  const { capturePayPalOrder, createPayPalOrder } = await import("@/lib/payments/paypal");

  it("signs in, then creates a CAD order for the amount", async () => {
    fetchMock
      .mockResolvedValueOnce(reply(200, { access_token: "pp-token" }))
      .mockResolvedValueOnce(reply(201, { id: "PP-1" }));
    expect(await createPayPalOrder({ amountCents: 1890, orderNumber: "LYD-1" })).toBe("PP-1");

    expect(sent(0).url).toBe("https://api-m.sandbox.paypal.com/v1/oauth2/token");
    expect(sent(0).headers.Authorization).toBe(`Basic ${Buffer.from("pp-client:pp-secret").toString("base64")}`);
    const order = sent(1);
    expect(order.url).toBe("https://api-m.sandbox.paypal.com/v2/checkout/orders");
    expect(order.headers.Authorization).toBe("Bearer pp-token");
    expect(order.body.purchase_units[0]).toMatchObject({ custom_id: "LYD-1", amount: { currency_code: "CAD", value: "18.90" } });
  });

  it("reads back what was captured", async () => {
    fetchMock.mockResolvedValueOnce(reply(200, { access_token: "pp-token" })).mockResolvedValueOnce(
      reply(201, {
        status: "COMPLETED",
        payer: { email_address: "buyer@example.com" },
        purchase_units: [
          { payments: { captures: [{ id: "CAP-1", status: "COMPLETED", custom_id: "LYD-1", amount: { value: "18.90", currency_code: "CAD" } }] } },
        ],
      })
    );
    expect(await capturePayPalOrder("PP-1")).toEqual({
      captureId: "CAP-1",
      amountCents: 1890,
      currency: "CAD",
      orderNumber: "LYD-1",
      payerEmail: "buyer@example.com",
    });
    expect(sent(1).url).toBe("https://api-m.sandbox.paypal.com/v2/checkout/orders/PP-1/capture");
  });
});
