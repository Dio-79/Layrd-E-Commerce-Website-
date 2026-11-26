"use client";

// /orders: "Track My Orders" (FR-9). A signed-in customer sees each order and
// where it is (placed, being made, out for delivery or ready, delivered or
// picked up). It's a live stream from Firestore, so when an admin changes the
// status on /admin/orders this page updates by itself.
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import styles from "../components/content.module.css";
import { useAuth } from "@/app/context/AuthContext";
import { useLiveStream } from "@/app/live/useLiveStream";
import { loginUrl, ROUTES } from "@/lib/Routes/Routes";
import { formatMoney } from "@/lib/check-out/CheckoutPricing";
import { statusLabel, trackingSteps } from "@/lib/Order/statuses";

interface Order {
  orderNumber: string;
  placedAt?: string;
  savedAt?: string;
  status?: string;
  refundStatus?: string;
  type?: string;
  totals?: { total?: number };
  lines?: { name: string; quantity: number; size?: string }[];
  delivery?: { method?: string };
  statusHistory?: { status: string; at: string }[];
}

function Tracker({ order }: { order: Order }) {
  const delivery = order.delivery?.method === "ship";
  const steps = trackingSteps(delivery);
  const status = order.status ?? "placed";
  if (status === "cancelled") return <p className={styles.error}>This order was cancelled.</p>;
  const at = Math.max(0, steps.indexOf(status as (typeof steps)[number]));
  const when = (s: string) => order.statusHistory?.filter((h) => h.status === s).pop()?.at;

  return (
    <ol style={{ display: "grid", gridTemplateColumns: `repeat(${steps.length}, 1fr)`, gap: "0.5rem", listStyle: "none", padding: 0, margin: "1rem 0 0" }}
      aria-label="Order progress">
      {steps.map((s, i) => {
        const done = i <= at;
        const time = when(s);
        return (
          <li key={s} aria-current={i === at ? "step" : undefined} style={{ textAlign: "center", fontSize: "0.75rem" }}>
            <div style={{ height: 6, borderRadius: 3, background: done ? "#c9a227" : "#e5e1d8", marginBottom: 6 }} />
            <strong style={{ opacity: done ? 1 : 0.5 }}>{statusLabel(s)}</strong>
            {time && <div style={{ opacity: 0.6 }}>{new Date(time).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</div>}
          </li>
        );
      })}
    </ol>
  );
}

export default function MyOrdersPage() {
  const { user, loading } = useAuth();
  const { docs, state } = useLiveStream<Order>("/api/live/orders", Boolean(user));
  const orders = (docs ?? []).slice().sort((a, b) => String(b.placedAt ?? b.savedAt).localeCompare(String(a.placedAt ?? a.savedAt)));

  return (
    <>
      <Header />
      <main className={styles.page}>
        <h1 className={styles.title}>TRACK MY ORDERS</h1>
        <p className={styles.lead}>
          Your orders and where they are right now. This page updates by itself when we move your order along.
        </p>

        {loading ? (
          <p className={styles.note}>Loading…</p>
        ) : !user ? (
          <div className={styles.card}>
            <p className={styles.note}>Log in to see and track your orders.</p>
            <Link href={loginUrl(ROUTES.orders, "orders")} className={styles.button}>
              Log in
            </Link>
          </div>
        ) : docs === null ? (
          <p className={styles.note}>{state === "failed" ? "Couldn't load your orders. Refresh to try again." : "Loading your orders…"}</p>
        ) : orders.length === 0 ? (
          <div className={styles.card}>
            <p className={styles.note}>You don&apos;t have any orders yet.</p>
            <Link href={ROUTES.main} className={styles.button}>
              Start shopping
            </Link>
          </div>
        ) : (
          orders.map((o) => (
            <section key={o.orderNumber} className={styles.card} style={{ marginBottom: "1.25rem" }} aria-label={`Order ${o.orderNumber}`}>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "0.5rem" }}>
                <div>
                  <strong>{o.orderNumber}</strong>
                  <div className={styles.note} style={{ margin: 0 }}>
                    {new Date(o.placedAt ?? o.savedAt ?? "").toLocaleDateString()} · {o.delivery?.method === "ship" ? "Delivery" : "Pickup"}
                    {o.type === "wholesale" ? " · Wholesale" : ""}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong>{typeof o.totals?.total === "number" ? formatMoney(o.totals.total) : ""}</strong>
                  <div>
                    <span className={styles.badge}>{statusLabel(o.status ?? "placed")}</span>
                  </div>
                </div>
              </div>
              {o.lines && (
                <p className={styles.note} style={{ marginBottom: 0 }}>
                  {o.lines.map((l) => `${l.quantity}× ${l.name}${l.size ? ` (${l.size})` : ""}`).join(", ")}
                </p>
              )}
              <Tracker order={o} />
              {o.refundStatus && (
                <p className={styles.note}>
                  Refund request: <strong>{o.refundStatus}</strong>
                </p>
              )}
            </section>
          ))
        )}
        {user && orders.length > 0 && (
          <p className={styles.note}>
            Something wrong with an order? <Link href={ROUTES.refund} className={styles.link}>Request a refund</Link> or{" "}
            <Link href={ROUTES.contact} className={styles.link}>contact us</Link>.
          </p>
        )}
      </main>
      <Footer />
    </>
  );
}
