"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import Header from "../components/Header";
import Footer from "../components/Footer";
import styles from "./checkout.module.css";
import { SummaryLine, TotalsList } from "./order";
import {
  ETransferNote,
  PayPalButton,
  paymentsEnabled,
  SquareCard,
  WalletButton,
  type SquareCardHandle,
} from "./payments";
import {
  draftOrder,
  makeOrderNumber,
  rememberOrder,
  removeEventOrder,
  useCheckout,
  useHydrated,
  type DeliveryInfo,
  type OrderLine,
  type PaymentMethod,
  type PlacedOrder,
} from "@/lib/check-out/checkoutStore";
import { useCart } from "@/app/context/CartContext";
import { ROUTES } from "@/lib/Routes/Routes";
import { calculateTotals, findPromo, formatDate, formatMoney, type PromoCode } from "@/lib/check-out/CheckoutPricing";
import {
  createDelivery,
  getDeliveryQuote,
  PICKUP_LOCATION,
  type DoorDashQuote,
} from "@/lib/Intergration/doordashapi";

const CART_PATH = ROUTES.cart;
const CONFIRMATION_PATH = ROUTES.confirmation;

type FormValues = {
  email: string;
  phone: string;
  fullName: string;
  street: string;
  city: string;
  province: string;
  postal: string;
};

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; badge: string; on: boolean }[] = [
  { id: "card", label: "💳 Credit / Debit Card", badge: "VISA ●●", on: paymentsEnabled.square },
  { id: "apple", label: "Apple Pay", badge: "Pay", on: paymentsEnabled.square },
  { id: "google", label: "Google Pay", badge: "G Pay", on: paymentsEnabled.square },
  { id: "paypal", label: "PayPal", badge: "PayPal", on: paymentsEnabled.paypal },
  { id: "etransfer", label: "Interac e-Transfer", badge: "e-Transfer", on: paymentsEnabled.etransfer },
];
const AVAILABLE = PAYMENT_OPTIONS.filter((o) => o.on);

/** Sends the order to a payment route; returns the order the server saved. */
async function postPayment(url: string, body: unknown): Promise<PlacedOrder> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { order?: PlacedOrder; error?: string };
  if (!res.ok || !data.order) throw new Error(data.error ?? "Payment failed — please try again.");
  return data.order;
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.field}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {error && (
        <span className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const hydrated = useHydrated();

  const cart = useCart();
  const bag = useMemo(
    () => (Array.isArray(cart?.items) ? cart.items : []),
    [cart]
  );
  const bagLines = useMemo<OrderLine[]>(
    () =>
      bag.map((item) => ({
        id: `bag:${item.product.productID}`,
        source: "bag",
        productId: item.product.productID,
        name: item.product.name,
        image: item.product.imageUrl ?? null,
        quantity: item.quantity,
        unitPrice: item.product.price,
      })),
    [bag]
  );

  const { events, eventLines } = useCheckout();
  const lines = useMemo(() => [...bagLines, ...eventLines], [bagLines, eventLines]);

  const [deliveryMethod, setDeliveryMethod] = useState<"ship" | "pickup">("ship");
  const [payment, setPayment] = useState<PaymentMethod | null>(AVAILABLE[0]?.id ?? null);
  const cardRef = useRef<SquareCardHandle>(null);
  // Also the payment idempotency key; a new one after each failed attempt.
  const orderNumber = useRef(makeOrderNumber());

  const {
    register,
    handleSubmit,
    control,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    mode: "onBlur",
    defaultValues: {
      email: "",
      phone: "",
      fullName: "",
      street: "",
      city: "",
      province: "",
      postal: "",
    },
  });

  /* ---------------- DoorDash quote (dummy data) ---------------- */

  const [street, city, province, postal] = useWatch({
    control,
    name: ["street", "city", "province", "postal"],
  });
  const addressComplete = [street, city, province, postal].every((v) => (v ?? "").trim().length >= 2);
  const addressKey = deliveryMethod === "ship" && addressComplete ? [street, city, province, postal].join("|") : null;

  const [quoteResult, setQuoteResult] = useState<{
    key: string;
    quote?: DoorDashQuote;
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (!addressKey) return;
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const quote = await getDeliveryQuote({ street, city, province, postal });
        if (!cancelled) setQuoteResult({ key: addressKey, quote });
      } catch (err) {
        if (!cancelled) {
          setQuoteResult({
            key: addressKey,
            error: err instanceof Error ? err.message : "Could not get a delivery quote.",
          });
        }
      }
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [addressKey, street, city, province, postal]);

  const currentResult = quoteResult && quoteResult.key === addressKey ? quoteResult : null;
  const quote = currentResult?.quote ?? null;
  const quoteLoading = addressKey !== null && currentResult === null;
  const quoteError = currentResult?.error ?? "";

  /* ---------------- Promo + totals ---------------- */

  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoMessage, setPromoMessage] = useState("");

  const applyPromo = () => {
    const found = findPromo(promoInput);
    if (found) {
      setAppliedPromo(found);
      setPromoMessage(`${found.code} applied (${found.label})`);
    } else {
      setAppliedPromo(null);
      setPromoMessage(promoInput.trim() ? "That promo code isn't valid." : "Enter a promo code.");
    }
  };

  const shipping = deliveryMethod === "pickup" ? 0 : quote ? quote.fee : null;
  const totals = useMemo(
    () => calculateTotals(lines as OrderLine[], shipping, appliedPromo),
    [lines, shipping, appliedPromo]
  );

  let shippingLabel = "Calculated at Checkout";
  if (deliveryMethod === "pickup") shippingLabel = "Free";
  else if (quote) shippingLabel = formatMoney(quote.fee);
  else if (quoteLoading) shippingLabel = "Calculating…";

  /* ---------------- Submit ---------------- */

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  /** Books the delivery (dummy DoorDash) and builds the order to send for payment. */
  const prepareOrder = async (values: FormValues): Promise<PlacedOrder> => {
    if (lines.length === 0) throw new Error("Your order is empty. Add items to your bag or create an event order first.");

    let delivery: DeliveryInfo;
    if (deliveryMethod === "ship") {
      if (!quote) throw new Error("We couldn't get a DoorDash quote for that address yet.");
      const address = {
        street: values.street.trim(),
        city: values.city.trim(),
        province: values.province.trim(),
        postal: values.postal.trim(),
      };
      const result = await createDelivery(quote, address, {
        name: values.fullName,
        phone: values.phone,
      });
      delivery = {
        method: "ship",
        carrier: "DoorDash",
        address,
        deliveryId: result.deliveryId,
        etaMinutes: result.etaMinutes,
        courierName: result.courier.name,
      };
    } else {
      delivery = { method: "pickup", pickupLocation: PICKUP_LOCATION.address };
    }

    return draftOrder({
      orderNumber: orderNumber.current,
      customer: {
        email: values.email.trim(),
        phone: values.phone.trim(),
        fullName: values.fullName.trim(),
      },
      delivery,
      promoCode: appliedPromo?.code ?? null,
      totals,
      bagLines,
    });
  };

  const buyer = (values: FormValues) => ({
    fullName: values.fullName,
    email: values.email,
    phone: values.phone,
    city: deliveryMethod === "ship" ? values.city : undefined,
    postal: deliveryMethod === "ship" ? values.postal : undefined,
  });

  /** Runs one payment attempt; on success shows the confirmation page. */
  const attempt = async (pay: () => Promise<PlacedOrder>) => {
    setSubmitError("");
    setSubmitting(true);
    try {
      const saved = await pay();
      rememberOrder(saved);
      cart.clearCart?.();
      router.push(CONFIRMATION_PATH);
    } catch (err) {
      orderNumber.current = makeOrderNumber();
      setSubmitError(err instanceof Error ? err.message : "Payment failed — please try again.");
      setSubmitting(false);
    }
  };

  // The COMPLETE ORDER button: card and e-Transfer.
  const onSubmit = (values: FormValues) =>
    attempt(async () => {
      if (payment === "card") {
        if (!cardRef.current) throw new Error("The card form is still loading.");
        const sourceId = await cardRef.current.tokenize(totals.total, buyer(values));
        const order = await prepareOrder(values);
        return postPayment("/api/payments/square", { order, sourceId, method: "card" });
      }
      if (payment === "etransfer") {
        return postPayment("/api/payments/etransfer", { order: await prepareOrder(values) });
      }
      throw new Error("Choose a payment method.");
    });

  // Apple Pay / Google Pay: the wallet sheet runs first, then the form is checked.
  const payWithWallet = (method: "apple" | "google", sourceId: string) =>
    void handleSubmit((values) =>
      attempt(async () => postPayment("/api/payments/square", { order: await prepareOrder(values), sourceId, method }))
    )();

  // PayPal: our server creates the PayPal order, the buyer approves it, then we capture.
  const paypalOrder = useRef<PlacedOrder | null>(null);
  const createPayPalOrder = async () => {
    setSubmitError("");
    if (!(await trigger())) throw new Error("Fill in your details first.");
    const order = await prepareOrder(getValues());
    paypalOrder.current = order;
    const res = await fetch("/api/payments/paypal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", order }),
    });
    const data = (await res.json().catch(() => ({}))) as { paypalOrderId?: string; error?: string };
    if (!res.ok || !data.paypalOrderId) {
      setSubmitError(data.error ?? "Couldn't start PayPal — please try again.");
      throw new Error(data.error ?? "PayPal create failed");
    }
    return data.paypalOrderId;
  };
  const capturePayPal = (paypalOrderId: string) =>
    attempt(() => postPayment("/api/payments/paypal", { action: "capture", order: paypalOrder.current, paypalOrderId }));

  const shipRequired = (message: string) => (deliveryMethod === "ship" ? message : false);

  return (
    <>
      <Header />

      <main className={styles.page}>
        <h1 className={styles.heading}>Checkout</h1>
        <p className={styles.subheading}>Review your order and enter your details to finish.</p>

        <form className={styles.layout} onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate>
          {/* ------------------------- Left column ------------------------- */}
          <div className={styles.left}>
            <button type="button" className={styles.returnCart} onClick={() => router.push(CART_PATH)}>
              ← Return to Cart
            </button>

            {/* Customer information */}
            <section className={styles.section}>
              <h2>Customer Information</h2>
              <div className={styles.twoColumn}>
                <Field label="Email Address" htmlFor="email" error={errors.email?.message}>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="john.doe@gmail.com"
                    aria-invalid={!!errors.email}
                    {...register("email", {
                      required: "Email is required",
                      pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email" },
                    })}
                  />
                </Field>

                <Field label="Phone Number" htmlFor="phone" error={errors.phone?.message}>
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+1 (123) 456-7890"
                    aria-invalid={!!errors.phone}
                    {...register("phone", {
                      required: "Phone number is required",
                      validate: (v) => v.replace(/\D/g, "").length >= 10 || "Enter a valid phone number",
                    })}
                  />
                </Field>
              </div>
            </section>

            {/* Delivery method */}
            <section className={styles.section}>
              <h2>Delivery Method</h2>
              <div className={styles.deliveryOptions}>
                <button
                  type="button"
                  className={`${styles.deliveryOption} ${deliveryMethod === "ship" ? styles.selected : ""}`}
                  aria-pressed={deliveryMethod === "ship"}
                  onClick={() => setDeliveryMethod("ship")}
                >
                  <span className={styles.deliveryIcon}>📍</span>
                  <strong>Ship to Address</strong>
                  <span>POWERED BY DoorDash</span>
                </button>

                <button
                  type="button"
                  className={`${styles.deliveryOption} ${deliveryMethod === "pickup" ? styles.selected : ""}`}
                  aria-pressed={deliveryMethod === "pickup"}
                  onClick={() => setDeliveryMethod("pickup")}
                >
                  <span className={styles.deliveryIcon}>▣</span>
                  <strong>Pickup</strong>
                  <span>Pickup at {PICKUP_LOCATION.address}</span>
                </button>
              </div>
            </section>

            {/* Delivery information */}
            <section className={styles.section}>
              <h2>{deliveryMethod === "ship" ? "Delivery Information" : "Pickup Information"}</h2>

              <Field label="Full Name" htmlFor="fullName" error={errors.fullName?.message}>
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="John Doe"
                  aria-invalid={!!errors.fullName}
                  {...register("fullName", { required: "Full name is required" })}
                />
              </Field>

              {deliveryMethod === "ship" ? (
                <>
                  <Field label="Street Address" htmlFor="street" error={errors.street?.message}>
                    <input
                      id="street"
                      type="text"
                      autoComplete="street-address"
                      placeholder="456, Example Ave, SE"
                      aria-invalid={!!errors.street}
                      {...register("street", { required: shipRequired("Street address is required") })}
                    />
                  </Field>

                  <div className={styles.threeColumn}>
                    <Field label="City" htmlFor="city" error={errors.city?.message}>
                      <input
                        id="city"
                        type="text"
                        autoComplete="address-level2"
                        placeholder="Calgary"
                        aria-invalid={!!errors.city}
                        {...register("city", { required: shipRequired("City is required") })}
                      />
                    </Field>

                    <Field label="Province" htmlFor="province" error={errors.province?.message}>
                      <input
                        id="province"
                        type="text"
                        autoComplete="address-level1"
                        placeholder="AB"
                        aria-invalid={!!errors.province}
                        {...register("province", { required: shipRequired("Province is required") })}
                      />
                    </Field>

                    <Field label="ZIP Code" htmlFor="postal" error={errors.postal?.message}>
                      <input
                        id="postal"
                        type="text"
                        autoComplete="postal-code"
                        placeholder="EX1 123"
                        aria-invalid={!!errors.postal}
                        {...register("postal", { required: shipRequired("ZIP / postal code is required") })}
                      />
                    </Field>
                  </div>

                  {quoteError && (
                    <p className={styles.error} role="alert">
                      {quoteError}
                    </p>
                  )}
                </>
              ) : (
                <p className={styles.note}>
                  Pick up your order at <strong>{PICKUP_LOCATION.address}</strong>. We&apos;ll have it ready at the
                  time shown on your confirmation.
                </p>
              )}
            </section>

            {/* Payment */}
            <section className={styles.section}>
              <h2>Payment Details</h2>

              {AVAILABLE.length === 0 && (
                <p className={styles.error} role="alert">
                  Payments aren&apos;t set up yet. Add the Square, PayPal or e-Transfer settings to .env.local (see
                  PAYMENTS.md).
                </p>
              )}

              {AVAILABLE.map(({ id, label, badge }) => (
                <div key={id} className={payment === id ? styles.paymentCard : undefined}>
                  <button
                    type="button"
                    className={payment === id ? styles.paymentTitle : styles.altPayment}
                    aria-pressed={payment === id}
                    onClick={() => {
                      setPayment(id);
                      setSubmitError("");
                    }}
                  >
                    {label}
                    {payment !== id && <span>{badge}</span>}
                  </button>
                  {payment === id && id === "card" && <SquareCard ref={cardRef} />}
                  {payment === id && id === "etransfer" && <ETransferNote total={totals.total} />}
                  {payment === id && (id === "apple" || id === "google" || id === "paypal") && (
                    <p className={styles.note}>Fill in your details, then use the {label} button under the order summary.</p>
                  )}
                </div>
              ))}

              {(paymentsEnabled.square || paymentsEnabled.paypal) && (
                <p className={styles.note}>
                  Payments are processed securely by{" "}
                  {[paymentsEnabled.square && "Square", paymentsEnabled.paypal && "PayPal"].filter(Boolean).join(" and ")}.
                  Card details go straight to the payment provider and are never stored on our servers.
                </p>
              )}
            </section>
          </div>

          {/* ------------------------ Order summary ------------------------ */}
          <aside className={styles.summary} aria-labelledby="summary-title">
            <h2 id="summary-title" className={styles.summaryTitle}>
              Order Summary
            </h2>

            {!hydrated ? null : lines.length === 0 && !submitting ? (
              <p className={styles.empty}>
                Your order is empty.{" "}
                <Link href={CART_PATH}>Go to your cart</Link> or <Link href="/">continue shopping</Link>.
              </p>
            ) : (
              <>
                {bag.length > 0 && (
                  <div className={styles.group}>
                    <h3 className={styles.groupTitle}>Your Bag</h3>
                    <ul className={styles.lines}>
                      {bagLines.map((line) => (
                        <SummaryLine key={line.id} line={line} />
                      ))}
                    </ul>
                  </div>
                )}

                {events.map((event) => (
                  <div className={styles.group} key={event.id}>
                    <div className={styles.groupHead}>
                      <h3 className={styles.groupTitle}>
                        Event Order
                        {event.details.pickupDate ? ` · ${formatDate(event.details.pickupDate)}` : ""}
                      </h3>
                      <button type="button" className={styles.removeLink} onClick={() => removeEventOrder(event.id)}>
                        Remove
                      </button>
                    </div>
                    {event.details.eventType && <p className={styles.groupMeta}>{event.details.eventType}</p>}
                    <ul className={styles.lines}>
                      {event.lines.map((line: (typeof event.lines)[number]) => (
                        <SummaryLine key={line.id} line={line} />
                      ))}
                    </ul>
                  </div>
                ))}
              </>
            )}

            <TotalsList totals={totals} shippingLabel={shippingLabel} promoCode={appliedPromo?.code} />

            <div className={styles.promo}>
              <input
                type="text"
                placeholder="Promo Code"
                aria-label="Promo code"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyPromo();
                  }
                }}
              />
              <button type="button" onClick={applyPromo}>
                APPLY
              </button>
            </div>
            {promoMessage && (
              <p className={appliedPromo ? styles.success : styles.error} role="status">
                {promoMessage}
              </p>
            )}

            {submitError && (
              <p className={styles.error} role="alert">
                {submitError}
              </p>
            )}

            {payment === "apple" || payment === "google" ? (
              <WalletButton
                key={payment}
                wallet={payment}
                total={totals.total}
                disabled={submitting || lines.length === 0}
                onToken={(token) => payWithWallet(payment, token)}
                onError={setSubmitError}
              />
            ) : payment === "paypal" ? (
              <PayPalButton
                disabled={submitting || lines.length === 0}
                createOrder={createPayPalOrder}
                onApprove={capturePayPal}
                onError={setSubmitError}
              />
            ) : (
              <button
                type="submit"
                className={styles.complete}
                disabled={submitting || lines.length === 0 || payment === null}
              >
                {submitting ? "PLACING ORDER…" : payment === "etransfer" ? "PLACE ORDER →" : `PAY ${formatMoney(totals.total)} →`}
              </button>
            )}
            {submitting && payment !== "card" && payment !== "etransfer" && (
              <p className={styles.note} role="status">
                Placing your order…
              </p>
            )}
          </aside>
        </form>
      </main>

      <Footer />
    </>
  );
}