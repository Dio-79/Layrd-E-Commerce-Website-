"use client";

// /contact: "Contact Us" form. Messages are saved to Firestore (contactMessages)
// for staff to answer by email.
import { useState, type FormEvent } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import styles from "../components/content.module.css";
import { useAuth } from "@/app/context/AuthContext";

const SUBJECTS = ["General question", "My order", "Event or bulk order", "Wholesale", "Allergies & ingredients", "Something else"];

export default function ContactPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", subject: SUBJECTS[0], orderNumber: "", message: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  // Signed-in customers don't have to type their name and email
  const name = form.name || user?.name || "";
  const email = form.email || user?.email || "";
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setState("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, name, email }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Couldn't send your message.");
      setState("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send your message.");
      setState("idle");
    }
  };

  return (
    <>
      <Header />
      <main className={styles.page}>
        <h1 className={styles.title}>CONTACT US</h1>
        <p className={styles.lead}>
          Questions about an order, an event, allergies or wholesale? Send us a message and we&apos;ll reply by email,
          usually within one business day.
        </p>

        {state === "sent" ? (
          <p className={styles.success} role="status">
            Thanks, {name.split(" ")[0] || "there"}! Your message was sent. We&apos;ll reply to <strong>{email}</strong>.
          </p>
        ) : (
          <form className={styles.card} onSubmit={submit} noValidate>
            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="c-name">Name</label>
                <input id="c-name" autoComplete="name" value={name} onChange={set("name")} required />
              </div>
              <div className={styles.field}>
                <label htmlFor="c-email">Email</label>
                <input id="c-email" type="email" autoComplete="email" value={email} onChange={set("email")} required />
              </div>
            </div>
            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="c-subject">Subject</label>
                <select id="c-subject" value={form.subject} onChange={set("subject")}>
                  {SUBJECTS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="c-order">Order number (optional)</label>
                <input id="c-order" placeholder="LYD-…" value={form.orderNumber} onChange={set("orderNumber")} />
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="c-message">Message</label>
              <textarea id="c-message" value={form.message} onChange={set("message")} required />
            </div>
            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
            <button type="submit" className={styles.button} disabled={state === "sending"}>
              {state === "sending" ? "Sending…" : "Send message"}
            </button>
          </form>
        )}
      </main>
      <Footer />
    </>
  );
}
