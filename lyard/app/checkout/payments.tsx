"use client";

// Payment widgets for the checkout page.
// Card, Apple Pay and Google Pay use Square's Web Payments SDK: card details go
// straight to Square, and we only get a one-time token to charge on the server.
// PayPal uses PayPal's own buttons. https://developer.squareup.com/docs/web-payments/overview
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { COUNTRY, CURRENCY, enabled, etransferEmail, paypal as paypalConfig, square, squareScriptUrl } from "@/lib/payments/config";
import { formatMoney } from "@/lib/check-out/CheckoutPricing";
import styles from "./checkout.module.css";

/* ------------------------------------------------------------------ */
/* Script loading                                                     */
/* ------------------------------------------------------------------ */

const loading = new Map<string, Promise<void>>();

function loadScript(src: string): Promise<void> {
  if (!loading.has(src)) {
    loading.set(
      src,
      new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => {
          loading.delete(src);
          reject(new Error(`Couldn't load ${new URL(src).host}`));
        };
        document.head.appendChild(script);
      })
    );
  }
  return loading.get(src)!;
}

/* ------------------------------------------------------------------ */
/* Square SDK (only the parts we use)                                 */
/* ------------------------------------------------------------------ */

interface TokenResult {
  status: string;
  token?: string;
  errors?: { message: string }[];
}
interface SquarePaymentMethod {
  attach(selector: string | HTMLElement): Promise<void>;
  tokenize(details?: unknown): Promise<TokenResult>;
  destroy(): Promise<void>;
}
interface SquarePaymentRequest {
  update(options: { total: { amount: string; label: string } }): void;
}
interface SquarePayments {
  card(): Promise<SquarePaymentMethod>;
  applePay(request: SquarePaymentRequest): Promise<SquarePaymentMethod>;
  googlePay(request: SquarePaymentRequest): Promise<SquarePaymentMethod>;
  paymentRequest(options: unknown): SquarePaymentRequest;
}
declare global {
  interface Window {
    Square?: { payments(applicationId: string, locationId: string): SquarePayments };
    paypal?: {
      Buttons(options: unknown): { render(el: HTMLElement): Promise<void>; isEligible(): boolean; close(): Promise<void> };
    };
  }
}

let squarePayments: Promise<SquarePayments> | null = null;
function getSquare(): Promise<SquarePayments> {
  squarePayments ??= loadScript(squareScriptUrl).then(() => {
    if (!window.Square) throw new Error("Square didn't load.");
    return window.Square.payments(square.applicationId, square.locationId);
  });
  squarePayments.catch(() => (squarePayments = null));
  return squarePayments;
}

const amountString = (total: number) => total.toFixed(2);

function paymentRequest(payments: SquarePayments, total: number) {
  return payments.paymentRequest({
    countryCode: COUNTRY,
    currencyCode: CURRENCY,
    total: { amount: amountString(total), label: "Läyrd" },
  });
}

function tokenOrThrow(result: TokenResult): string {
  if (result.status === "OK" && result.token) return result.token;
  if (result.status === "Cancel") throw new Error("Payment cancelled.");
  throw new Error(result.errors?.[0]?.message ?? "Check your payment details and try again.");
}

/** What Square needs for the bank's extra check (3-D Secure) on a card payment. */
export interface Buyer {
  fullName: string;
  email: string;
  phone: string;
  postal?: string;
  city?: string;
}

function verification(total: number, buyer: Buyer) {
  const [givenName, ...rest] = buyer.fullName.trim().split(/\s+/);
  return {
    amount: amountString(total),
    currencyCode: CURRENCY,
    intent: "CHARGE",
    customerInitiated: true,
    sellerKeyedIn: false,
    billingContact: {
      givenName,
      familyName: rest.join(" "),
      email: buyer.email,
      phone: buyer.phone,
      city: buyer.city,
      postalCode: buyer.postal,
      countryCode: COUNTRY,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Card                                                               */
/* ------------------------------------------------------------------ */

export interface SquareCardHandle {
  /** Returns a one-time Square token for the card entered. */
  tokenize(total: number, buyer: Buyer): Promise<string>;
}

export const SquareCard = forwardRef<SquareCardHandle>(function SquareCard(_, ref) {
  const container = useRef<HTMLDivElement>(null);
  const card = useRef<SquarePaymentMethod | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let instance: SquarePaymentMethod | null = null;
    getSquare()
      .then((payments) => payments.card())
      .then(async (c) => {
        instance = c;
        if (cancelled || !container.current) return;
        await c.attach(container.current);
        card.current = c;
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : "Couldn't load the card form."));
    return () => {
      cancelled = true;
      card.current = null;
      void instance?.destroy().catch(() => undefined);
    };
  }, []);

  useImperativeHandle(ref, () => ({
    async tokenize(total, buyer) {
      if (!card.current) throw new Error("The card form is still loading.");
      return tokenOrThrow(await card.current.tokenize(verification(total, buyer)));
    },
  }));

  return (
    <div className={styles.cardInputs}>
      <div ref={container} className={styles.squareCard} />
      {error && (
        <span className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* Apple Pay / Google Pay (through Square)                            */
/* ------------------------------------------------------------------ */

export function WalletButton({
  wallet,
  total,
  disabled,
  onToken,
  onError,
}: {
  wallet: "apple" | "google";
  total: number;
  disabled: boolean;
  /** Called with the Square token after the buyer approves in the wallet sheet. */
  onToken: (token: string) => void;
  onError: (message: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const method = useRef<SquarePaymentMethod | null>(null);
  const request = useRef<SquarePaymentRequest | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "unavailable">("loading");
  const totalRef = useRef(total);

  useEffect(() => {
    totalRef.current = total;
    request.current?.update({ total: { amount: amountString(total), label: "Läyrd" } });
  }, [total]);

  useEffect(() => {
    let cancelled = false;
    let instance: SquarePaymentMethod | null = null;
    getSquare()
      .then(async (payments) => {
        request.current = paymentRequest(payments, totalRef.current);
        instance = wallet === "apple" ? await payments.applePay(request.current) : await payments.googlePay(request.current);
        if (cancelled) return;
        // Google Pay draws its own button; Apple Pay uses ours (below).
        if (wallet === "google" && container.current) await instance.attach(container.current);
        method.current = instance;
        setState("ready");
      })
      .catch(() => !cancelled && setState("unavailable"));
    return () => {
      cancelled = true;
      method.current = null;
      void instance?.destroy().catch(() => undefined);
    };
  }, [wallet]);

  // Apple requires tokenize() to start straight from the click, so it runs first
  // and the form is checked afterwards (an unused token is never charged).
  const pay = async () => {
    if (!method.current || disabled) return;
    try {
      onToken(tokenOrThrow(await method.current.tokenize()));
    } catch (err) {
      onError(err instanceof Error ? err.message : "Payment failed — please try again.");
    }
  };

  const name = wallet === "apple" ? "Apple Pay" : "Google Pay";
  if (state === "unavailable") {
    return (
      <p className={styles.note}>
        {name} isn&apos;t available on this device or browser.
        {wallet === "apple" ? " Use Safari on an Apple device with a card in Wallet." : ""}
      </p>
    );
  }

  return (
    <div className={styles.walletWrap} aria-busy={state === "loading"}>
      {wallet === "apple" ? (
        <button
          type="button"
          className={styles.applePayButton}
          disabled={disabled || state !== "ready"}
          onClick={pay}
          aria-label="Pay with Apple Pay"
        >
          Pay with  Pay
        </button>
      ) : (
        <div
          ref={container}
          className={styles.googlePayButton}
          onClickCapture={(e) => {
            e.preventDefault();
            void pay();
          }}
        />
      )}
      {state === "loading" && <p className={styles.note}>Loading {name}…</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* PayPal                                                             */
/* ------------------------------------------------------------------ */

export function PayPalButton({
  disabled,
  createOrder,
  onApprove,
  onError,
}: {
  disabled: boolean;
  /** Checks the form and returns the PayPal order id from our server */
  createOrder: () => Promise<string>;
  onApprove: (paypalOrderId: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const handlers = useRef({ createOrder, onApprove, onError });
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    handlers.current = { createOrder, onApprove, onError };
  });

  useEffect(() => {
    let cancelled = false;
    let buttons: ReturnType<NonNullable<Window["paypal"]>["Buttons"]> | null = null;
    const src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(paypalConfig.clientId)}&currency=${CURRENCY}&intent=capture&components=buttons`;
    loadScript(src)
      .then(async () => {
        if (cancelled || !window.paypal || !container.current) return;
        buttons = window.paypal.Buttons({
          style: { layout: "horizontal", color: "gold", shape: "rect", label: "paypal", tagline: false },
          createOrder: () => handlers.current.createOrder(),
          onApprove: (data: { orderID: string }) => handlers.current.onApprove(data.orderID),
          onError: (err: unknown) => {
            console.error("PayPal error:", err);
            handlers.current.onError("PayPal couldn't finish the payment — please try again.");
          },
        });
        await buttons.render(container.current);
        if (!cancelled) setState("ready");
      })
      .catch(() => !cancelled && setState("failed"));
    return () => {
      cancelled = true;
      void buttons?.close().catch(() => undefined);
    };
  }, []);

  return (
    <div className={styles.walletWrap} aria-disabled={disabled}>
      <div ref={container} className={disabled ? styles.disabledButtons : undefined} />
      {state === "loading" && <p className={styles.note}>Loading PayPal…</p>}
      {state === "failed" && <p className={styles.error}>PayPal couldn&apos;t load. Try another payment method.</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* e-Transfer                                                         */
/* ------------------------------------------------------------------ */

export function ETransferNote({ total }: { total: number }) {
  return (
    <p className={styles.note}>
      After you place the order, send an Interac e-Transfer of <strong>{formatMoney(total)}</strong> to{" "}
      <strong>{etransferEmail}</strong> with your order number in the message. We start preparing your order once
      it arrives.
    </p>
  );
}

export { enabled as paymentsEnabled };
