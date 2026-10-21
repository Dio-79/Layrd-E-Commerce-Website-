"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Montserrat } from "next/font/google";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { loadLastOrder, type BundleRecord } from "@/lib/Bundle/Bundlecheckoutstore";
import { CANCEL_HOURS, PICKUP_LOCATION, STATUS_STEPS, parseDate, timeLabel } from "@/lib/Bundle/bundleRules";
import styles from "./confirmation.module.css";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });
const money = (n: number) => `$${n.toFixed(2)}`;

async function fetchOrder(reference: string, email: string): Promise<BundleRecord> {
  const res = await fetch(
    `/api/bundle-preorders?reference=${encodeURIComponent(reference)}&email=${encodeURIComponent(email)}`
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "We couldn't find that order.");
  return data.record as BundleRecord;
}

function ConfirmationInner() {
  const params = useSearchParams();
  const refParam = params.get("ref") ?? "";

  const [record, setRecord] = useState<BundleRecord | null>(null);
  const [reference, setReference] = useState(refParam);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!refParam) return;
    const last = loadLastOrder();
    if (last && last.reference === refParam) {
      fetchOrder(last.reference, last.customer.email).then(setRecord).catch(() => undefined);
    }
  }, [refParam]);

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      setRecord(await fetchOrder(reference.trim(), email.trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't find that order.");
    } finally {
      setLoading(false);
    }
  };

  if (!record) {
    return (
      <section className={styles.lookup}>
        <h1>Find my bundle order</h1>
        <p>Enter your reference number and the email you used at checkout.</p>
        <form onSubmit={lookup} className={styles.lookupForm}>
          <label>
            <span>Reference</span>
            <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="BN-XXXXXXXX" required />
          </label>
          <label>
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required />
          </label>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <button type="submit" disabled={loading}>{loading ? "SEARCHING…" : "FIND ORDER"}</button>
        </form>
      </section>
    );
  }

  // Older test orders saved before delivery existed have no fulfillment/deliveryFee
  const delivery = record.fulfillment === "delivery" ? record.delivery : null;
  const deliveryFee = record.deliveryFee ?? 0;

  const [y, m, d] = record.pickupDate.split("-").map(Number);
  const [hh, mm] = record.pickupTime.split(":").map(Number);
  const changesUntil = new Date(new Date(y, m - 1, d, hh, mm).getTime() - CANCEL_HOURS * 3_600_000);
  const stepIndex = STATUS_STEPS.findIndex((s) => s.key === record.status);
  const pickupDay = parseDate(record.pickupDate).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <section className={styles.confirmWrap}>
      <div className={styles.confirmHeader}>
        <h1>Order Confirmed</h1>
        <p>Thank you for your order. We are preparing your custom bundle with care.</p>
      </div>

      <div className={styles.metaBanner}>
        <div className={styles.metaCol}>
          <span className={styles.metaLabel}>Order Number</span>
          <strong className={styles.metaValue}>{record.reference}</strong>
        </div>
        <div className={styles.metaDivider} />
        <div className={styles.metaCol}>
          <span className={styles.metaLabel}>{delivery ? "Delivery Estimate" : "Pickup Estimate"}</span>
          <strong className={styles.metaValue}>{pickupDay}, {timeLabel(record.pickupTime)}</strong>
        </div>
      </div>

      <div className={styles.summaryCard}>
        <h2 className={styles.summaryTitle}>Bundle Summary</h2>
        <ul className={styles.lines}>
          {record.lines.map((line) => (
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
            <dd>{money(record.subtotal)}</dd>
          </div>
          <div>
            <dt>Estimated Tax</dt>
            <dd>{money(record.tax)}</dd>
          </div>
          {delivery && (
            <div>
              <dt>Delivery (DoorDash)</dt>
              <dd>{money(deliveryFee)}</dd>
            </div>
          )}
        </dl>

        <div className={styles.total}>
          <span>Total</span>
          <span>{money(record.total)}</span>
        </div>
      </div>

      {record.status === "cancelled" ? (
        <p className={styles.cancelled}>This order was cancelled.</p>
      ) : (
        <ol className={styles.timeline} aria-label="Order status">
          {STATUS_STEPS.map((step, i) => (
            <li
              key={step.key}
              className={i < stepIndex ? styles.done : i === stepIndex ? styles.current : ""}
              aria-current={i === stepIndex ? "step" : undefined}
            >
              <span className={styles.dot} />
              {step.label}
            </li>
          ))}
        </ol>
      )}

      {delivery ? (
        <p className={styles.note}>
          Delivering to {delivery.address.street}, {delivery.address.city}, {delivery.address.province}{" "}
          {delivery.address.postal} with DoorDash
          {delivery.courierName ? ` (courier ${delivery.courierName}${delivery.courierVehicle ? `, ${delivery.courierVehicle}` : ""})` : ""}
          . Delivery ID {delivery.deliveryId}.{" "}
          {delivery.trackingUrl && (
            <a href={delivery.trackingUrl} target="_blank" rel="noreferrer">
              Track delivery
            </a>
          )}{" "}
          Changes or cancellations are allowed until{" "}
          {changesUntil.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}.
        </p>
      ) : (
        <p className={styles.note}>
          {PICKUP_LOCATION} · collected by {record.pickupPerson}. Changes or cancellations are allowed until{" "}
          {changesUntil.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}.
        </p>
      )}

      <div className={styles.actionRow}>
        <button type="button" className={styles.actionBtn} onClick={() => window.print()}>
          PRINT ORDER
        </button>
        <Link href="/Mainpage" className={styles.complete}>
          RETURN TO SHOP
        </Link>
      </div>
    </section>
  );
}

export default function BundleConfirmationPage() {
  return (
    <div className={montserrat.variable}>
      <Header />
      <main className={styles.page}>
        <Suspense fallback={null}>
          <ConfirmationInner />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}