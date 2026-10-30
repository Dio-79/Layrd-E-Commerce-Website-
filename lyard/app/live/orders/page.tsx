"use client";

// /live/orders - orders as they come in, from Firestore through /api/live/orders.
// Admins see every order; customers see their own orders and their status.
// The site's login page is still the demo one, so this page has its own small
// Firebase sign-in that starts a real session (/api/auth/session).
import { useCallback, useEffect, useState, type FormEvent } from "react";
import styles from "../live.module.css";
import { LiveShell } from "../LiveShell";
import { LiveStatus } from "../LiveStatus";
import { useLiveStream } from "../useLiveStream";

interface SessionUser {
  email: string;
  name: string;
  role: string;
}

interface LiveOrder {
  id: string;
  orderNumber: string;
  placedAt?: string;
  status?: string;
  customer?: { fullName?: string; email?: string };
  lines?: { name: string; quantity: number }[];
  totals?: { total?: number };
  payment?: { method?: string; status?: string; label?: string };
}

const PAYMENT_LABELS: Record<string, string> = {
  card: "Card",
  apple: "Apple Pay",
  google: "Google Pay",
  paypal: "PayPal",
  etransfer: "e-Transfer",
  in_store: "Pay at pickup",
};

/** Admins mark an e-Transfer order as paid once the money arrives. */
function ConfirmETransfer({ orderNumber }: { orderNumber: string }) {
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const confirm = async () => {
    setState("busy");
    const res = await fetch("/api/payments/etransfer/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber }),
    });
    setState(res.ok ? "idle" : "error"); // the live stream shows the new status
  };
  return (
    <button className={styles.linkButton} onClick={confirm} disabled={state === "busy"}>
      {state === "busy" ? "Saving…" : state === "error" ? "Failed, retry" : "Mark paid"}
    </button>
  );
}

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

async function firebaseSignIn(email: string, password: string) {
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = (await res.json()) as { idToken?: string; error?: { message: string } };
  if (!data.idToken) throw new Error(data.error?.message === "INVALID_LOGIN_CREDENTIALS" ? "Wrong email or password." : "Couldn't sign in.");

  const session = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: data.idToken }),
  });
  if (!session.ok) throw new Error("Couldn't start a session.");
}

function SignIn({ onSignedIn }: { onSignedIn: () => void }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await firebaseSignIn(String(form.get("email")), String(form.get("password")));
      onSignedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <h2 className={styles.formTitle}>SIGN IN TO SEE ORDERS</h2>
      <input name="email" type="email" placeholder="Email" autoComplete="email" required />
      <input name="password" type="password" placeholder="Password" autoComplete="current-password" required />
      <button className={styles.button} type="submit" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
      {error && <p className={styles.error}>{error}</p>}
    </form>
  );
}

function OrdersTable({ admin }: { admin: boolean }) {
  const { docs, state, updatedAt } = useLiveStream<LiveOrder>("/api/live/orders");
  const orders = [...(docs ?? [])].sort((a, b) => String(b.placedAt).localeCompare(String(a.placedAt)));

  return (
    <>
      <p className={styles.message} style={{ marginBottom: "1rem" }}>
        <LiveStatus state={state} updatedAt={updatedAt} />
      </p>
      {!docs && <p className={styles.message}>Connecting to Firebase…</p>}
      {docs && orders.length === 0 && <p className={styles.message}>No orders yet. New ones appear here as they&apos;re placed.</p>}
      {orders.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order</th>
                <th>Placed</th>
                {admin && <th>Customer</th>}
                <th>Items</th>
                <th>Payment</th>
                <th>Status</th>
                <th className={styles.num}>Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className={styles.orderNumber}>{o.orderNumber}</td>
                  <td>{o.placedAt ? new Date(o.placedAt).toLocaleString() : "-"}</td>
                  {admin && <td>{o.customer?.fullName ?? o.customer?.email ?? "-"}</td>}
                  <td>{o.lines?.map((l) => `${l.quantity}× ${l.name}`).join(", ") ?? "-"}</td>
                  <td>
                    {o.payment
                      ? `${o.payment.label ?? PAYMENT_LABELS[o.payment.method ?? ""] ?? o.payment.method} · ${(o.payment.status ?? "").replaceAll("_", " ")}`
                      : "-"}
                    {admin && (o.payment?.status === "awaiting_etransfer" || o.payment?.status === "pay_at_pickup") && (
                      <>
                        {" "}
                        <ConfirmETransfer orderNumber={o.orderNumber} />
                      </>
                    )}
                  </td>
                  <td>
                    <span className={styles.badge}>{o.status ?? "placed"}</span>
                  </td>
                  <td className={styles.num}>{typeof o.totals?.total === "number" ? `$${o.totals.total.toFixed(2)}` : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function LiveOrdersPage() {
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);

  const loadUser = useCallback(
    () =>
      fetch("/api/auth/me", { cache: "no-store" })
        .then((res) => (res.ok ? (res.json() as Promise<SessionUser>) : null))
        .then(setUser),
    []
  );

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }

  const admin = user?.role === "admin";

  return (
    <LiveShell
      title={admin ? "ALL ORDERS" : user ? "YOUR ORDERS" : "LIVE ORDERS"}
      subtitle={admin ? "Every order, live from Firestore." : "Your orders and their status, live from Firestore."}
      aside={
        user && (
          <span className={styles.account}>
            {user.email} ({user.role}) ·{" "}
            <button className={styles.linkButton} onClick={signOut}>
              Sign out
            </button>
          </span>
        )
      }
    >
      {user === undefined && <p className={styles.message}>Loading…</p>}
      {user === null && <SignIn onSignedIn={loadUser} />}
      {user && <OrdersTable admin={admin} />}
    </LiveShell>
  );
}
