"use client";

// /apply-wholesale: a signed-in customer applies for a wholesale account (FR-18).
// An admin approves or denies it on /admin/customers; once approved, the
// wholesale portal opens for them.
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import styles from "../components/content.module.css";
import { useAuth } from "@/app/context/AuthContext";
import { loginUrl } from "@/lib/Routes/Routes";

type Application = { status?: string; businessName?: string; appliedAt?: string } | null;

export default function ApplyWholesalePage() {
  const { user, loading } = useAuth();
  const [application, setApplication] = useState<Application | undefined>(undefined);
  const [form, setForm] = useState({ businessName: "", contactName: "", phone: "", message: "" });
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch("/api/wholesale/apply")
      .then((r) => r.json())
      .then((d) => setApplication(d.application ?? null))
      .catch(() => setApplication(null));
  }, [user]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/wholesale/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't send your application.");
      setApplication({ status: "pending", businessName: form.businessName, appliedAt: new Date().toISOString() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send your application.");
    } finally {
      setSending(false);
    }
  };

  const field = (key: keyof typeof form, label: string, props: Record<string, unknown> = {}) => (
    <div className={styles.field}>
      <label htmlFor={`w-${key}`}>{label}</label>
      <input id={`w-${key}`} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} {...props} />
    </div>
  );

  const portal = user?.role === "wholesale" || user?.role === "admin";

  return (
    <>
      <Header />
      <main className={styles.page}>
        <h1 className={styles.title}>WHOLESALE PARTNERS</h1>
        <p className={styles.lead}>
          Cafés, shops and event planners can order LÄYRD in bulk with tiered pricing: 5% off from 50 cans, 12% off from
          150, and 18% off from 300. Tell us about your business and we&apos;ll set up your account.
        </p>

        {loading ? (
          <p className={styles.note}>Loading…</p>
        ) : !user ? (
          <div className={styles.card}>
            <p className={styles.note}>Log in or create an account first, then come back to apply.</p>
            <Link href={loginUrl("/apply-wholesale", "wholesale:portal")} className={styles.button}>
              Log in
            </Link>
          </div>
        ) : portal ? (
          <div className={styles.card}>
            <p className={styles.note}>Your account already has wholesale access.</p>
            <Link href="/wholesale/dashboard" className={styles.button}>
              Open the wholesale portal
            </Link>
          </div>
        ) : application === undefined ? (
          <p className={styles.note}>Loading…</p>
        ) : application?.status === "pending" ? (
          <p className={styles.success} role="status">
            Thanks! Your application for <strong>{application.businessName}</strong> is waiting for review. We&apos;ll
            email you, and the wholesale portal opens as soon as it&apos;s approved.
          </p>
        ) : (
          <form className={styles.card} onSubmit={submit} noValidate>
            {application?.status === "denied" && (
              <p className={styles.error} role="alert">
                Your last application wasn&apos;t approved. You can apply again, or <Link href="/contact" className={styles.link}>contact us</Link>.
              </p>
            )}
            {field("businessName", "Business name", { required: true, autoComplete: "organization" })}
            {field("contactName", "Contact person", { autoComplete: "name", placeholder: user.name })}
            {field("phone", "Phone", { required: true, type: "tel", autoComplete: "tel" })}
            <div className={styles.field}>
              <label htmlFor="w-message">How many cans a month do you expect to order? (optional)</label>
              <textarea id="w-message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
            <button type="submit" className={styles.button} disabled={sending}>
              {sending ? "Sending…" : "Apply for wholesale"}
            </button>
          </form>
        )}
      </main>
      <Footer />
    </>
  );
}
