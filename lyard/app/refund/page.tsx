"use client";

// /refund: "Request Refund" (Use Case 8). A signed-in customer picks one of their
// orders, says what went wrong, and the request is saved to Firestore
// (refundRequests) for an admin to approve or deny.
import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import styles from "../components/content.module.css";
import { useAuth } from "@/app/context/AuthContext";
import { loginUrl, ROUTES } from "@/lib/Routes/Routes";
import { formatMoney } from "@/lib/check-out/CheckoutPricing";

interface Order {
  orderNumber: string;
  placedAt?: string;
  totals?: { total?: number };
}
interface RefundRequest {
  orderNumber: string;
  status: string;
  createdAt: string;
}

export default function RefundPage() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [orderNumber, setOrderNumber] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState("");

  const load = useCallback(
    () =>
      Promise.all([
        fetch("/api/orders").then((r) => r.json().catch(() => ({}))) as Promise<{ orders?: Order[] }>,
        fetch("/api/refunds").then((r) => r.json().catch(() => ({}))) as Promise<{ requests?: RefundRequest[] }>,
      ]).then(([od, rd]) => {
        setOrders(od.orders ?? []);
        setRequests(rd.requests ?? []);
      }),
    []
  );

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    load().catch(() => !cancelled && setOrders([]));
    return () => {
      cancelled = true;
    };
  }, [user, load]);

  const requested = new Set(requests.map((r) => r.orderNumber));
  const choosable = (orders ?? []).filter((o) => !requested.has(o.orderNumber));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: orderNumber || choosable[0]?.orderNumber, reason }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; orderNumber?: string };
      if (!res.ok) throw new Error(data.error ?? "Couldn't send your request.");
      setSent(data.orderNumber ?? "");
      setReason("");
      setOrderNumber("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send your request.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Header />
      <main className={styles.page}>
        <h1 className={styles.title}>REQUEST A REFUND</h1>
        <p className={styles.lead}>
          Something not right with your order? Orders can be refunded within 14 days. Pick the order, tell us what
          happened, and we&apos;ll email you once it&apos;s reviewed.
        </p>

        {loading ? (
          <p className={styles.note}>Loading…</p>
        ) : !user ? (
          <div className={styles.card}>
            <p className={styles.note}>Log in to see your orders and request a refund.</p>
            <Link href={loginUrl(ROUTES.refund, "refund")} className={styles.button}>
              Log in
            </Link>
          </div>
        ) : (
          <>
            {sent && (
              <p className={styles.success} role="status">
                Your refund request for <strong>{sent}</strong> was sent. We&apos;ll email you once it&apos;s reviewed.
              </p>
            )}

            {orders === null ? (
              <p className={styles.note}>Loading your orders…</p>
            ) : choosable.length === 0 ? (
              <p className={styles.note}>
                {orders.length === 0
                  ? "You don't have any orders yet."
                  : "You've already asked for a refund on all of your orders."}{" "}
                Questions? <Link href={ROUTES.contact} className={styles.link}>Contact us</Link>.
              </p>
            ) : (
              <form className={styles.card} onSubmit={submit} noValidate style={{ marginTop: sent ? "1.5rem" : 0 }}>
                <div className={styles.field}>
                  <label htmlFor="r-order">Order</label>
                  <select id="r-order" value={orderNumber || choosable[0].orderNumber} onChange={(e) => setOrderNumber(e.target.value)}>
                    {choosable.map((o) => (
                      <option key={o.orderNumber} value={o.orderNumber}>
                        {o.orderNumber}
                        {o.placedAt ? ` · ${new Date(o.placedAt).toLocaleDateString()}` : ""}
                        {typeof o.totals?.total === "number" ? ` · ${formatMoney(o.totals.total)}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="r-reason">What went wrong?</label>
                  <textarea id="r-reason" value={reason} onChange={(e) => setReason(e.target.value)} required />
                </div>
                {error && (
                  <p className={styles.error} role="alert">
                    {error}
                  </p>
                )}
                <button type="submit" className={styles.button} disabled={sending}>
                  {sending ? "Sending…" : "Request refund"}
                </button>
              </form>
            )}

            {requests.length > 0 && (
              <section style={{ marginTop: "2rem" }} aria-labelledby="r-list">
                <h2 id="r-list" style={{ fontSize: "1rem", letterSpacing: "0.1em" }}>
                  YOUR REQUESTS
                </h2>
                <ul className={styles.list}>
                  {requests.map((r) => (
                    <li key={r.orderNumber}>
                      <span>
                        {r.orderNumber} · {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                      <span className={styles.badge}>{r.status}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
