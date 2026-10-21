"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { Montserrat } from "next/font/google";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import {
  clearBundleDraft,
  loadBundleDraft,
  saveLastOrder,
  type BundleDraft,
} from "@/lib/Bundle/Bundlecheckoutstore";
import {
  CANCEL_HOURS,
  PICKUP_LOCATION,
  PICKUP_TIMES,
  earliestBundleDate,
  leadDaysFor,
  priceOrder,
  type Fulfillment,
} from "@/lib/Bundle/bundleRules";
// >>> ADJUST THIS PATH to wherever your doordashapi.ts file lives <<<
import {
  createDelivery,
  getDeliveryQuote,
  type DoorDashQuote,
} from "@/lib/Intergration/doordashapi";
import { ALLERGY_DISCLAIMER } from "@/lib/catelog/dataAllergens";
import styles from "./checkout.module.css";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

type PayMethod = "card" | "apple" | "google" | "paypal";

interface FormValues {
  email: string;
  phone: string;
  fullName: string;
  pickupPerson: string;
  street: string;
  city: string;
  province: string;
  postal: string;
  pickupDate: string;
  pickupTime: string;
  notes: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
  policy: boolean;
}

const money = (n: number) => `$${n.toFixed(2)}`;
const isQuoteExpired = (expiresAt: string) => new Date(expiresAt).getTime() < Date.now();

export default function BundleCheckoutPage() {
  const [draft, setDraft] = useState<BundleDraft | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDraft(loadBundleDraft());
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className={montserrat.variable}>
      <Header />
      <main className={styles.page}>
        {!loaded ? null : !draft || draft.lines.length === 0 ? (
          <div className={styles.empty}>
            <p>There is no bundle to check out.</p>
            <Link href="/Bundle">← Back to the bundle builder</Link>
          </div>
        ) : (
          <CheckoutForm draft={draft} />
        )}
      </main>
      <Footer />
    </div>
  );
}

function PinIcon() {
  return (
    <svg className={styles.methodIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg className={styles.methodIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9l1.5-5h13L20 9" />
      <path d="M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0A2.7 2.7 0 0 0 20 9" />
      <path d="M5 12v8h14v-8" />
      <path d="M10 20v-5h4v5" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg className={styles.cardIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M2.5 10h19" />
      <path d="M6 15h4" />
    </svg>
  );
}

function CheckoutForm({ draft }: { draft: BundleDraft }) {
  const router = useRouter();
  const [fulfillment, setFulfillment] = useState<Fulfillment>("pickup");
  const [method, setMethod] = useState<PayMethod>("card");
  const [promo, setPromo] = useState("");
  const [promoMessage, setPromoMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);

  const isDelivery = fulfillment === "delivery";
  const noun = isDelivery ? "delivery" : "pickup";

  const units = useMemo(() => draft.lines.reduce((s, l) => s + l.quantity, 0), [draft]);
  const leadDays = leadDaysFor(units);
  const earliest = useMemo(() => earliestBundleDate(units), [units]);
  const lineSubtotal = useMemo(
    () => draft.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
    [draft]
  );

  const today = useMemo(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  }, []);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      email: "",
      phone: "",
      fullName: "",
      pickupPerson: "",
      street: "",
      city: "",
      province: "",
      postal: "",
      pickupDate: "",
      pickupTime: "",
      notes: "",
      cardNumber: "",
      expiry: "",
      cvc: "",
      policy: false,
    },
  });

  const pickupDate = useWatch({ control, name: "pickupDate" });
  const street = useWatch({ control, name: "street" });
  const city = useWatch({ control, name: "city" });
  const province = useWatch({ control, name: "province" });
  const postal = useWatch({ control, name: "postal" });

  /* ---------- DoorDash quote: refreshed as the address is typed ---------- */
  const address = useMemo(
    () => ({
      street: (street ?? "").trim(),
      city: (city ?? "").trim(),
      province: (province ?? "").trim().toUpperCase(),
      postal: (postal ?? "").trim(),
    }),
    [street, city, province, postal]
  );
  const postalClean = address.postal.replace(/[\s-]/g, "");
  const wantsQuote = isDelivery && address.street.length > 0 && postalClean.length >= 5;
  const addressKey = wantsQuote
    ? [address.street, address.city, address.province, postalClean.toUpperCase()].join("|")
    : "";

  const [quoteState, setQuoteState] = useState<{
    key: string;
    quote: DoorDashQuote | null;
    error: string;
  }>({ key: "", quote: null, error: "" });

  useEffect(() => {
    if (!wantsQuote) return;
    let cancelled = false;
    const t = window.setTimeout(() => {
      getDeliveryQuote(address)
        .then((q) => {
          if (!cancelled) setQuoteState({ key: addressKey, quote: q, error: "" });
        })
        .catch((err) => {
          if (!cancelled) {
            setQuoteState({
              key: addressKey,
              quote: null,
              error: err instanceof Error ? err.message : "We couldn't get a delivery quote.",
            });
          }
        });
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [wantsQuote, addressKey, address]);

  const quoteCurrent = wantsQuote && quoteState.key === addressKey;
  const quote = quoteCurrent ? quoteState.quote : null;
  const quoteError = quoteCurrent ? quoteState.error : "";
  const quoteLoading = wantsQuote && !quoteCurrent;

  const price = useMemo(
    () => priceOrder(lineSubtotal, isDelivery && quote ? quote.fee : 0),
    [lineSubtotal, isDelivery, quote]
  );

  /* ---------- capacity for the chosen day ---------- */
  useEffect(() => {
    if (!pickupDate || pickupDate < earliest) return;
    const controller = new AbortController();
    fetch(`/api/bundle-preorders?date=${pickupDate}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => setRemaining(typeof d.remaining === "number" ? d.remaining : null))
      .catch(() => undefined);
    return () => controller.abort();
  }, [pickupDate, earliest]);

  const overCapacity = remaining !== null && !!pickupDate && units > remaining;

  const onSubmit = async (values: FormValues) => {
    setSubmitError("");
    if (overCapacity) {
      setSubmitError("That date doesn't have enough capacity for this order. Choose another date.");
      return;
    }

    // Book the DoorDash delivery first (dummy for now, see doordashapi.ts)
    let deliveryPayload: Record<string, unknown> | undefined;
    if (isDelivery) {
      if (quoteLoading) {
        setSubmitError("Getting your delivery fee. Try again in a moment.");
        return;
      }
      if (!quote) {
        setSubmitError(quoteError || "Enter your address to get a delivery fee.");
        return;
      }

      try {
        let activeQuote = quote;
        if (isQuoteExpired(quote.expiresAt)) {
          const fresh = await getDeliveryQuote(address);
          setQuoteState({ key: addressKey, quote: fresh, error: "" });
          if (fresh.fee !== quote.fee) {
            setSubmitError(`The delivery fee changed to ${money(fresh.fee)}. Please review the total and submit again.`);
            return;
          }
          activeQuote = fresh;
        }

        const booked = await createDelivery(activeQuote, address, {
          name: values.fullName,
          phone: values.phone,
        });
        deliveryPayload = { ...booked, quoteId: activeQuote.quoteId, address };
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : "We couldn't book the delivery. Please try again.");
        return;
      }
    }

    try {
      const res = await fetch("/api/bundle-preorders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name: values.fullName, email: values.email, phone: values.phone },
          pickupPerson: isDelivery ? "" : values.pickupPerson,
          fulfillment,
          delivery: deliveryPayload,
          pickupDate: values.pickupDate,
          pickupTime: values.pickupTime,
          notes: values.notes,
          lines: draft.lines,
          paymentMethod: method,
          acceptedPolicy: values.policy,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(data.error ?? "We couldn't register your preorder. Please try again.");
        return;
      }

      saveLastOrder(data.record);
      clearBundleDraft();
      router.push(`/Bundle/confirmation?ref=${encodeURIComponent(data.record.reference)}`);
    } catch {
      setSubmitError("We couldn't reach the server. Please try again.");
    }
  };

  const cardOnly = <T,>(check: (v: string) => T | string | true) => ({
    validate: (v: string) => method !== "card" || check(v),
  });

  const deliveryOnly = (check: (v: string) => true | string) => ({
    validate: (v: string) => !isDelivery || check(v),
  });

  return (
    <form className={styles.layout} onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className={styles.main}>
        <Link href="/Bundle" className={styles.back}>
          ← Return to Bundle Builder
        </Link>

        <h2 className={styles.heading}>Customer Information</h2>
        <div className={styles.grid2}>
          <label className={styles.field}>
            <span className={styles.label}>Email address</span>
            <input
              type="email"
              placeholder="john.doe@gmail.com"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register("email", {
                required: "Enter your email",
                pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email" },
              })}
            />
            {errors.email && <span className={styles.error}>{errors.email.message}</span>}
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Phone number</span>
            <input
              type="tel"
              placeholder="+1 (123) 456-7890"
              autoComplete="tel"
              aria-invalid={!!errors.phone}
              {...register("phone", {
                required: "Enter your phone number",
                validate: (v) => v.replace(/\D/g, "").length >= 10 || "Enter a valid phone number",
              })}
            />
            {errors.phone && <span className={styles.error}>{errors.phone.message}</span>}
          </label>
        </div>

        <h2 className={styles.heading}>Delivery Method</h2>
        <div className={styles.methodGrid}>
          <button
            type="button"
            className={`${styles.methodCard} ${isDelivery ? styles.methodCardActive : ""}`}
            aria-pressed={isDelivery}
            onClick={() => setFulfillment("delivery")}
          >
            <PinIcon />
            <span className={styles.methodTitle}>Ship to Address</span>
            <span className={styles.poweredBy}>
              Powered by <span className={styles.doordash}>DoorDash</span>
            </span>
          </button>
          <button
            type="button"
            className={`${styles.methodCard} ${!isDelivery ? styles.methodCardActive : ""}`}
            aria-pressed={!isDelivery}
            onClick={() => setFulfillment("pickup")}
          >
            <StoreIcon />
            <span className={styles.methodTitle}>Pickup</span>
            <span className={styles.methodSub}>{PICKUP_LOCATION}</span>
          </button>
        </div>

        <h2 className={styles.heading}>{isDelivery ? "Delivery Information" : "Pickup Information"}</h2>
        <div className={styles.grid2}>
          <label className={styles.field}>
            <span className={styles.label}>Full name</span>
            <input
              placeholder="John Doe"
              autoComplete="name"
              aria-invalid={!!errors.fullName}
              {...register("fullName", { required: "Enter your name" })}
            />
            {errors.fullName && <span className={styles.error}>{errors.fullName.message}</span>}
          </label>
          {isDelivery ? (
            <label className={styles.field}>
              <span className={styles.label}>Street address</span>
              <input
                placeholder="456, Example Ave, SE"
                autoComplete="street-address"
                aria-invalid={!!errors.street}
                {...register("street", deliveryOnly((v) => v.trim().length > 0 || "Enter your street address"))}
              />
              {errors.street && <span className={styles.error}>{errors.street.message}</span>}
            </label>
          ) : (
            <label className={styles.field}>
              <span className={styles.label}>Who will collect it? (optional)</span>
              <input placeholder="Same as above" {...register("pickupPerson")} />
            </label>
          )}
        </div>

        {isDelivery && (
          <div className={styles.grid3}>
            <label className={styles.field}>
              <span className={styles.label}>City</span>
              <input
                placeholder="Calgary"
                autoComplete="address-level2"
                aria-invalid={!!errors.city}
                {...register("city", deliveryOnly((v) => v.trim().length > 0 || "Enter your city"))}
              />
              {errors.city && <span className={styles.error}>{errors.city.message}</span>}
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Province</span>
              <input
                placeholder="AB"
                autoComplete="address-level1"
                aria-invalid={!!errors.province}
                {...register("province", deliveryOnly((v) => v.trim().length > 0 || "Enter your province"))}
              />
              {errors.province && <span className={styles.error}>{errors.province.message}</span>}
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Zip code</span>
              <input
                placeholder="EX1 123"
                autoComplete="postal-code"
                aria-invalid={!!errors.postal}
                {...register(
                  "postal",
                  deliveryOnly((v) => v.replace(/[\s-]/g, "").length >= 5 || "Enter a valid postal code")
                )}
              />
              {errors.postal && <span className={styles.error}>{errors.postal.message}</span>}
            </label>
          </div>
        )}

        {isDelivery &&
          (quoteLoading ? (
            <p className={styles.leadNote}>Getting your DoorDash delivery fee…</p>
          ) : quote ? (
            <p className={styles.okNote}>
              DoorDash delivery fee: <strong>{money(quote.fee)}</strong> · estimated delivery time about{" "}
              {quote.etaMinutes} minutes.
            </p>
          ) : quoteError ? (
            <p className={styles.warnNote} role="alert">
              {quoteError}
            </p>
          ) : (
            <p className={styles.leadNote}>Enter your street address and postal code to see the DoorDash delivery fee.</p>
          ))}

        {!isDelivery && (
          <div className={styles.pickupCard}>
            <strong>{PICKUP_LOCATION}</strong>
            <span>Pickup orders are collected at the shop.</span>
          </div>
        )}

        <p className={styles.leadNote}>
          Your bundle has <strong>{units}</strong> drink{units === 1 ? "" : "s"}, so it needs at least{" "}
          <strong>
            {leadDays} day{leadDays === 1 ? "" : "s"}
          </strong>{" "}
          notice. Earliest {noun}: <strong>{earliest}</strong>.
        </p>

        <div className={styles.grid2}>
          <label className={styles.field}>
            <span className={styles.label}>{isDelivery ? "Delivery date" : "Pickup date"}</span>
            <input
              type="date"
              min={earliest}
              aria-invalid={!!errors.pickupDate}
              {...register("pickupDate", {
                required: `Choose a ${noun} date`,
                validate: (v) => v >= earliest || `This order needs at least ${leadDays} day(s) notice`,
              })}
            />
            {errors.pickupDate && <span className={styles.error}>{errors.pickupDate.message}</span>}
          </label>
          <label className={styles.field}>
            <span className={styles.label}>{isDelivery ? "Delivery time" : "Pickup time"}</span>
            <select
              aria-invalid={!!errors.pickupTime}
              {...register("pickupTime", { required: `Choose a ${noun} time` })}
            >
              <option value="">Select a time</option>
              {PICKUP_TIMES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            {errors.pickupTime && <span className={styles.error}>{errors.pickupTime.message}</span>}
          </label>
        </div>

        {pickupDate && pickupDate >= earliest && remaining !== null && (
          <p className={overCapacity ? styles.warnNote : styles.okNote} role={overCapacity ? "alert" : undefined}>
            {overCapacity
              ? remaining === 0
                ? "This date is fully booked. Please choose another date."
                : `Only ${remaining} drinks are available on this date. Reduce your bundle or choose another date.`
              : `Good news: this date has room for your bundle (${remaining} drinks available).`}
          </p>
        )}

        <label className={styles.field}>
          <span className={styles.label}>Notes (optional)</span>
          <textarea placeholder="Allergies, labels, anything we should know" {...register("notes")} />
        </label>

        <h2 className={styles.heading}>Payment Details</h2>

        <div
          role="group"
          aria-label="Credit or debit card"
          className={`${styles.card} ${method === "card" ? styles.cardActive : ""}`}
          onClick={() => setMethod("card")}
        >
          <div className={styles.cardHeader}>
            <span className={styles.cardTitleRow}>
              <CardIcon />
              Credit/ Debit Card
            </span>
            <span className={styles.brands} aria-hidden="true">
              <span className={styles.visa}>VISA</span>
              <span className={styles.mc} />
            </span>
          </div>
          <label className={styles.field}>
            <span className={styles.smallLabel}>Card number</span>
            <input
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="0000 0000 0000 0000"
              aria-invalid={!!errors.cardNumber}
              {...register(
                "cardNumber",
                cardOnly((v) => /^\d{13,19}$/.test(v.replace(/\s/g, "")) || "Enter a valid card number")
              )}
            />
            {errors.cardNumber && <span className={styles.error}>{errors.cardNumber.message}</span>}
          </label>
          <div className={styles.grid2}>
            <label className={styles.field}>
              <span className={styles.smallLabel}>Expiration</span>
              <input
                placeholder="MM/YY"
                autoComplete="cc-exp"
                aria-invalid={!!errors.expiry}
                {...register(
                  "expiry",
                  cardOnly((v) => {
                    const match = /^(\d{2})\/(\d{2})$/.exec(v.trim());
                    if (!match) return "Use MM/YY";
                    const month = Number(match[1]);
                    const year = 2000 + Number(match[2]);
                    if (month < 1 || month > 12) return "Invalid month";
                    return new Date(year, month, 0) >= today || "This card has expired";
                  })
                )}
              />
              {errors.expiry && <span className={styles.error}>{errors.expiry.message}</span>}
            </label>
            <label className={styles.field}>
              <span className={styles.smallLabel}>Security code</span>
              <input
                inputMode="numeric"
                placeholder="CVC"
                autoComplete="cc-csc"
                aria-invalid={!!errors.cvc}
                {...register("cvc", cardOnly((v) => /^\d{3,4}$/.test(v) || "3 or 4 digits"))}
              />
              {errors.cvc && <span className={styles.error}>{errors.cvc.message}</span>}
            </label>
          </div>
        </div>

        {(
          [
            ["apple", "Apple Pay"],
            ["google", "Google Pay"],
            ["paypal", "PayPal"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`${styles.wallet} ${method === key ? styles.walletActive : ""}`}
            aria-pressed={method === key}
            onClick={() => setMethod(key)}
          >
            <span>{label}</span>
          </button>
        ))}

        <p className={styles.leadNote}>{ALLERGY_DISCLAIMER}</p>

        <label className={styles.checkRow}>
          <input
            type="checkbox"
            aria-invalid={!!errors.policy}
            {...register("policy", { required: "Please accept the order policy" })}
          />
          <span>
            I understand that changes or cancellations are allowed until {CANCEL_HOURS} hours before {noun}, and
            that I have shared any allergy needs in my notes.
          </span>
        </label>
        {errors.policy && <span className={styles.error}>{errors.policy.message}</span>}
      </div>

      <aside className={styles.summary} aria-label="Order summary">
        <h2 className={styles.summaryTitle}>Bundle Summary</h2>

        <ul className={styles.lines}>
          {draft.lines.map((line) => (
            <li key={line.id}>
              {line.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={line.image} alt="" />
              ) : (
                <span className={styles.noImg} />
              )}
              <div>
                <div className={styles.lineName}>{line.name}</div>
                <div className={styles.lineMeta}>
                  {[line.size, line.flavor].filter(Boolean).join(" · ")} · x{line.quantity}
                </div>
              </div>
              <span className={styles.linePrice}>{money(line.unitPrice * line.quantity)}</span>
            </li>
          ))}
        </ul>

        <dl className={styles.totals}>
          <div>
            <dt>Subtotal</dt>
            <dd>{money(price.subtotal)}</dd>
          </div>
          <div>
            <dt>Estimated Tax</dt>
            <dd>{money(price.tax)}</dd>
          </div>
          {isDelivery && (
            <div>
              <dt>Delivery (DoorDash)</dt>
              <dd>{quote ? money(price.deliveryFee) : "Enter address"}</dd>
            </div>
          )}
        </dl>

        <div className={styles.total}>
          <span>Total</span>
          <span>{money(price.total)}</span>
        </div>

        <div className={styles.promo}>
          <input
            placeholder="Promo Code"
            value={promo}
            onChange={(e) => setPromo(e.target.value)}
            aria-label="Promo code"
          />
          <button type="button" onClick={() => setPromoMessage(promo.trim() ? "That code isn't valid." : "")}>
            APPLY
          </button>
        </div>
        {promoMessage && <p className={styles.error}>{promoMessage}</p>}

        {submitError && (
          <p className={styles.error} role="alert">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          className={styles.complete}
          disabled={isSubmitting || overCapacity || (isDelivery && quoteLoading)}
        >
          {isSubmitting ? "REGISTERING…" : `PLACE PREORDER · ${money(price.total)}`}
        </button>
      </aside>
    </form>
  );
}