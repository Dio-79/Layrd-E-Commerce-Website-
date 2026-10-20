"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import Header from "../components/Header";
import Footer from "../components/Footer";
import styles from "./checkout.module.css";
import { BagSummaryLine, SummaryLine, TotalsList, useOrderLines } from "./order";
import { useCart } from "@/app/context/CartContext";
import { CardIcon, MastercardMark, PinIcon, StoreIcon, VisaMark } from "./icon";
import { placeOrder, removeEventOrder, setPromoCode, useCheckout, type DeliveryInfo } from "@/lib/checkout/checkoutStore";
import { calculateTotals, findPromo, formatDate, formatMoney, type PromoCode } from "@/lib/CheckoutPricing";
import {
  createDelivery,
  getDeliveryQuote,
  PICKUP_LOCATION,
  type DoorDashQuote,
} from "@/lib/Intergration/doordashapi";

const CART_PATH = "/cart";
const CONFIRMATION_PATH = "/confirmation";

type FormValues = {
  email: string;
  phone: string;
  fullName: string;
  street: string;
  city: string;
  province: string;
  postal: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
};

type PaymentMethod = "card" | "apple" | "google" | "paypal";

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
  const { clearCart } = useCart();
  // Cart items (CartContext) + event orders, combined
  const { bag, events, lines, ready: hydrated } = useOrderLines();

  const [deliveryMethod, setDeliveryMethod] = useState<"ship" | "pickup">("ship");
  const [payment, setPayment] = useState<PaymentMethod>("card");

  const {
    register,
    handleSubmit,
    watch,
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
      cardNumber: "",
      expiry: "",
      cvc: "",
    },
  });

  /* ---------------- DoorDash quote (dummy data) ---------------- */

  const [street, city, province, postal] = watch(["street", "city", "province", "postal"]);
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

  // The promo code is saved in the store, so a code applied in the cart carries over here.
  const { promoCode: savedPromoCode } = useCheckout();
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");

  const appliedPromo: PromoCode | null = useMemo(
    () => (savedPromoCode ? findPromo(savedPromoCode) : null),
    [savedPromoCode]
  );
  const promoMessage = appliedPromo ? `${appliedPromo.code} applied (${appliedPromo.label})` : promoError;

  const applyPromo = () => {
    const found = findPromo(promoInput);
    if (found) {
      setPromoCode(found.code);
      setPromoError("");
    } else {
      setPromoCode(null);
      setPromoError(promoInput.trim() ? "That promo code isn't valid." : "Enter a promo code.");
    }
  };

  const shipping = deliveryMethod === "pickup" ? 0 : quote ? quote.fee : null;
  const totals = useMemo(
    () => calculateTotals(lines, shipping, appliedPromo),
    [lines, shipping, appliedPromo]
  );

  let shippingLabel = "Calculated at Checkout";
  if (deliveryMethod === "pickup") shippingLabel = "Free";
  else if (quote) shippingLabel = formatMoney(quote.fee);
  else if (quoteLoading) shippingLabel = "Calculating…";

  /* ---------------- Submit ---------------- */

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const onSubmit = async (values: FormValues) => {
    setSubmitError("");

    if (lines.length === 0) {
      setSubmitError("Your order is empty. Add items to your bag or create an event order first.");
      return;
    }

    setSubmitting(true);
    try {
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
          trackingUrl: result.trackingUrl,
        };
      } else {
        delivery = { method: "pickup", pickupLocation: PICKUP_LOCATION.address };
      }

      // Card details are deliberately NOT saved anywhere (demo only).
      placeOrder({
        customer: {
          email: values.email.trim(),
          phone: values.phone.trim(),
          fullName: values.fullName.trim(),
        },
        delivery,
        promoCode: appliedPromo?.code ?? null,
        totals,
        bagLines: bag,
      });
      clearCart(); // the order is placed, so empty the bag (the badge goes back to 0)

      router.push(CONFIRMATION_PATH);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  const shipRequired = (message: string) => (deliveryMethod === "ship" ? message : false);
  const cardRequired = (message: string) => (payment === "card" ? message : false);

  return (
    <>
      <Header />

      <main className={styles.page}>
        <h1 className={styles.srOnly}>Checkout</h1>

        <form className={styles.layout} onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* ------------------------- Left column ------------------------- */}
          <div className={styles.left}>
            <button type="button" className={styles.returnCart} onClick={() => router.push(CART_PATH)}>
              &lt; Return to Cart
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
                  <span className={styles.deliveryIcon}><PinIcon /></span>
                  <strong>Ship to Address</strong>
                  <span className={styles.deliverySub}>
                    POWERED BY <b className={styles.doordash}>DoorDash</b>
                  </span>
                </button>

                <button
                  type="button"
                  className={`${styles.deliveryOption} ${deliveryMethod === "pickup" ? styles.selected : ""}`}
                  aria-pressed={deliveryMethod === "pickup"}
                  onClick={() => setDeliveryMethod("pickup")}
                >
                  <span className={styles.deliveryIcon}><StoreIcon /></span>
                  <strong>Pickup</strong>
                  <span className={styles.deliverySub}>Pickup at {PICKUP_LOCATION.address}</span>
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

              <div className={styles.paymentCard}>
                <div className={styles.paymentHead}>
                  <button
                    type="button"
                    className={styles.paymentTitle}
                    aria-pressed={payment === "card"}
                    onClick={() => setPayment("card")}
                  >
                    <CardIcon /> Credit/ Debit Card
                  </button>
                  <div className={styles.paymentLogos} aria-hidden="true">
                    <VisaMark />
                    <MastercardMark />
                  </div>
                </div>

                {payment === "card" && (
                  <div className={styles.cardInputs}>
                    <Field label="Card Number" htmlFor="cardNumber" error={errors.cardNumber?.message}>
                      <input
                        id="cardNumber"
                        type="text"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        placeholder="0000 0000 0000 0000"
                        aria-invalid={!!errors.cardNumber}
                        {...register("cardNumber", {
                          required: cardRequired("Card number is required"),
                          validate: (v) =>
                            payment !== "card" ||
                            /^\d{13,19}$/.test(v.replace(/\s/g, "")) ||
                            "Enter a valid card number",
                        })}
                      />
                    </Field>

                    <Field label="Expiration" htmlFor="expiry" error={errors.expiry?.message}>
                      <input
                        id="expiry"
                        type="text"
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        placeholder="MM/YY"
                        aria-invalid={!!errors.expiry}
                        {...register("expiry", {
                          required: cardRequired("Expiration is required"),
                          validate: (v) =>
                            payment !== "card" || /^(0[1-9]|1[0-2])\/\d{2}$/.test(v) || "Use MM/YY",
                        })}
                      />
                    </Field>

                    <Field label="Security Code" htmlFor="cvc" error={errors.cvc?.message}>
                      <input
                        id="cvc"
                        type="text"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        placeholder="CVC"
                        aria-invalid={!!errors.cvc}
                        {...register("cvc", {
                          required: cardRequired("Security code is required"),
                          validate: (v) => payment !== "card" || /^\d{3,4}$/.test(v) || "3 or 4 digits",
                        })}
                      />
                    </Field>
                  </div>
                )}
              </div>

              {(
                [
                  ["apple", "Apple Pay", "Pay"],
                  ["google", "Google Pay", "G Pay"],
                  ["paypal", "PayPal", "PayPal"],
                ] as const
              ).map(([id, label, badge]) => (
                <button
                  key={id}
                  type="button"
                  className={styles.altPayment}
                  aria-pressed={payment === id}
                  onClick={() => setPayment(id)}
                >
                  {label}
                  <span>{badge}</span>
                </button>
              ))}

              <p className={styles.note}>
                Demo only: card details are not stored or sent anywhere. Use a payment provider such as Stripe
                before taking real payments.
              </p>
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
                      {bag.map((line) => (
                        <BagSummaryLine key={line.id} line={line} />
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
                      {event.lines.map((line) => (
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

            <button type="submit" className={styles.complete} disabled={submitting || lines.length === 0}>
              {submitting ? "PLACING ORDER…" : "COMPLETE ORDER"}
            </button>
          </aside>
        </form>
      </main>

      <Footer />
    </>
  );
}