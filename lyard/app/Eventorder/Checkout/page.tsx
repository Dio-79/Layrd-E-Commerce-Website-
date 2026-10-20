"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Montserrat } from "next/font/google";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import {
  clearEventDraft,
  loadEventDraft,
  saveLastOrder,
  type EventOrderDraft,
} from "@/lib/event/eventCheckoutStore";
import {
  CANCEL_HOURS,
  DEPOSIT_RATE,
  PICKUP_LOCATION,
  PICKUP_TIMES,
  earliestEventDate,
  leadDaysFor,
  priceOrder,
} from "@/lib/event/eventRules";
import styles from "./checkout.module.css";
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

type PayMethod = "card" | "apple" | "google" | "paypal";

interface FormValues {
  email: string;
  phone: string;
  fullName: string;
  pickupPerson: string;
  pickupDate: string;
  pickupTime: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
  policy: boolean;
}

const money = (n: number) => `$${n.toFixed(2)}`;

export default function EventCheckoutPage() {
  const [draft, setDraft] = useState<EventOrderDraft | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDraft(loadEventDraft());
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
            <p>There is no event order to check out.</p>
            <Link href="/Eventorder">← Back to event ordering</Link>
          </div>
        ) : (
          <CheckoutForm draft={draft} />
        )}
      </main>
      <Footer />
    </div>
  );
}

function CheckoutForm({ draft }: { draft: EventOrderDraft }) {
  const router = useRouter();
  const [method, setMethod] = useState<PayMethod>("card");
  const [promo, setPromo] = useState("");
  const [promoMessage, setPromoMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);

  const units = useMemo(() => draft.lines.reduce((s, l) => s + l.quantity, 0), [draft]);
  const leadDays = leadDaysFor(units);
  const earliest = useMemo(() => earliestEventDate(units), [units]);
  const price = useMemo(
    () => priceOrder(draft.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0)),
    [draft]
  );

  const today = useMemo(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      email: "",
      phone: "",
      fullName: "",
      pickupPerson: "",
      pickupDate: draft.details.pickupDate >= earliest ? draft.details.pickupDate : "",
      pickupTime: "",
      cardNumber: "",
      expiry: "",
      cvc: "",
      policy: false,
    },
  });

  const pickupDate = watch("pickupDate");
  const dateTooSoon = !!draft.details.pickupDate && draft.details.pickupDate < earliest;

  useEffect(() => {
    if (!pickupDate || pickupDate < earliest) return;
    const controller = new AbortController();
    fetch(`/api/event-preorders?date=${pickupDate}`, { signal: controller.signal })
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

    try {
      const res = await fetch("/api/event-preorders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name: values.fullName, email: values.email, phone: values.phone },
          pickupPerson: values.pickupPerson,
          pickupDate: values.pickupDate,
          pickupTime: values.pickupTime,
          details: { ...draft.details, pickupDate: values.pickupDate },
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
      clearEventDraft();
      router.push(`/Eventorder/confirmation?ref=${encodeURIComponent(data.record.reference)}`);
    } catch {
      setSubmitError("We couldn't reach the server. Please try again.");
    }
  };

  const cardOnly = <T,>(check: (v: string) => T | string | true) => ({
    validate: (v: string) => method !== "card" || check(v),
  });

  return (
    <form className={styles.layout} onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className={styles.main}>
        <Link href="/Eventorder" className={styles.back}>
          ← Return to Event Order
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
          <label className={styles.field}>
            <span className={styles.label}>Who will collect it? (optional)</span>
            <input placeholder="Same as above" {...register("pickupPerson")} />
          </label>
        </div>

        <h2 className={styles.heading}>Pickup Details</h2>
        <div className={styles.pickupCard}>
          <strong>{PICKUP_LOCATION}</strong>
          <span>Event orders are pickup only.</span>
        </div>

        <p className={styles.leadNote}>
          Your order has <strong>{units}</strong> item{units === 1 ? "" : "s"}, so it needs at least{" "}
          <strong>{leadDays} days</strong> notice. Earliest pickup: <strong>{earliest}</strong>.
        </p>
        {dateTooSoon && (
          <p className={styles.warnNote} role="alert">
            The date you chose on the previous page ({draft.details.pickupDate}) is too soon for this order.
            Please pick a new date.
          </p>
        )}

        <div className={styles.grid2}>
          <label className={styles.field}>
            <span className={styles.label}>Pickup date</span>
            <input
              type="date"
              min={earliest}
              aria-invalid={!!errors.pickupDate}
              {...register("pickupDate", {
                required: "Choose a pickup date",
                validate: (v) => v >= earliest || `This order needs at least ${leadDays} days notice`,
              })}
            />
            {errors.pickupDate && <span className={styles.error}>{errors.pickupDate.message}</span>}
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Pickup time</span>
            <select
              aria-invalid={!!errors.pickupTime}
              {...register("pickupTime", { required: "Choose a pickup time" })}
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
                : `Only ${remaining} items are available on this date. Reduce your order or choose another date.`
              : `Good news: this date has room for your order (${remaining} items available).`}
          </p>
        )}

        <h2 className={styles.heading}>Payment Details</h2>
        <p className={styles.depositNote}>
          Event orders need a <strong>{Math.round(DEPOSIT_RATE * 100)}% deposit</strong> today. The remaining
          balance is paid when you pick up.
        </p>

        <fieldset
          className={`${styles.card} ${method === "card" ? styles.cardActive : ""}`}
          onClick={() => setMethod("card")}
        >
          <legend className={styles.cardTitle}>Credit / Debit Card</legend>
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
        </fieldset>

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

        <label className={styles.checkRow}>
          <input
            type="checkbox"
            aria-invalid={!!errors.policy}
            {...register("policy", { required: "Please accept the order policy" })}
          />
          <span>
            I understand that changes or cancellations are allowed until {CANCEL_HOURS} hours before pickup,
            that the deposit is non-refundable after that, and that I have shared any allergy needs in my notes.
          </span>
        </label>
        {errors.policy && <span className={styles.error}>{errors.policy.message}</span>}
      </div>

      <aside className={styles.summary} aria-label="Order summary">
        <h2 className={styles.summaryTitle}>Order Summary</h2>

        <div className={styles.eventMeta}>
          {draft.details.eventType && (
            <div>
              <strong>Event:</strong> {draft.details.eventType}
            </div>
          )}
          {draft.details.headcount && (
            <div>
              <strong>Quantity needed:</strong> {draft.details.headcount}
            </div>
          )}
          {draft.details.comment && (
            <div>
              <strong>Notes:</strong> {draft.details.comment}
            </div>
          )}
          {draft.details.fileName && (
            <div>
              <strong>Custom labels:</strong> {draft.details.fileName}
            </div>
          )}
        </div>

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
          <div>
            <dt>Order total</dt>
            <dd>{money(price.total)}</dd>
          </div>
        </dl>

        <div className={styles.dueBox}>
          <div className={styles.dueToday}>
            <span>Due today ({Math.round(DEPOSIT_RATE * 100)}%)</span>
            <span>{money(price.deposit)}</span>
          </div>
          <div className={styles.dueLater}>
            <span>Balance at pickup</span>
            <span>{money(price.balance)}</span>
          </div>
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

        <button type="submit" className={styles.complete} disabled={isSubmitting || overCapacity}>
          {isSubmitting ? "REGISTERING…" : `PAY ${money(price.deposit)} DEPOSIT`}
        </button>
      </aside>
    </form>
  );
}