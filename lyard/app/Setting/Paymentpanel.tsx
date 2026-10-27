"use client";

import { useId, useState, type FormEvent } from "react";
import {
  detectBrand,
  isExpired,
  parseExpiry,
  passesLuhn,
  type CustomerProfile,
} from "@/lib/Account/profile";
import { Field } from "./Field";
import styles from "./account.module.css";

const pad = (n: number) => String(n).padStart(2, "0");

export default function PaymentPanel({
  profile,
  onSave,
}: {
  profile: CustomerProfile;
  onSave: (next: CustomerProfile) => Promise<void>;
}) {
  const uid = useId();
  const id = (field: string) => `${uid}-${field}`;

  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [errors, setErrors] = useState<{ number?: string; expiry?: string }>({});
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const persist = async (paymentMethods: CustomerProfile["paymentMethods"], okText: string) => {
    setBusy(true);
    try {
      await onSave({ ...profile, paymentMethods });
      setMessage({ type: "ok", text: okText });
      return true;
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "We couldn't save that." });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    const found: { number?: string; expiry?: string } = {};
    const digits = number.replace(/\D/g, "");
    const exp = parseExpiry(expiry);

    if (!passesLuhn(digits)) found.number = "Enter a valid card number";
    if (!exp) found.expiry = "Use MM/YY";
    else if (isExpired(exp.month, exp.year)) found.expiry = "That card has expired";

    setErrors(found);
    if (found.number || found.expiry || !exp) return;

    // Only the brand, last 4 digits and expiry are kept. The full number is never stored.
    const card = {
      id: crypto.randomUUID(),
      brand: detectBrand(digits),
      last4: digits.slice(-4),
      expMonth: exp.month,
      expYear: exp.year,
    };

    const ok = await persist([...profile.paymentMethods, card], "Card added.");
    if (ok) {
      setNumber("");
      setExpiry("");
    }
  };

  const handleRemove = (cardId: string) =>
    persist(
      profile.paymentMethods.filter((c) => c.id !== cardId),
      "Card removed."
    );

  return (
    <section className={styles.panel} aria-labelledby={id("title")}>
      <div className={styles.panelHead}>
        <div>
          <h2 id={id("title")} className={styles.panelTitle}>
            Payment method
          </h2>
          <p className={styles.panelSub}>
            Only the card brand, last four digits and expiry are saved. Card numbers are never stored.
          </p>
        </div>
      </div>

      {message && (
        <p className={message.type === "ok" ? styles.success : styles.error} role="status">
          {message.text}
        </p>
      )}

      {profile.paymentMethods.length === 0 ? (
        <p className={styles.empty}>You have no saved payment methods.</p>
      ) : (
        <ul className={styles.cardList} aria-label="Saved payment methods">
          {profile.paymentMethods.map((card) => (
            <li key={card.id} className={styles.cardItem}>
              <span>
                <strong>{card.brand}</strong> •••• {card.last4}
              </span>
              <span className={styles.cardExp}>
                Expires {pad(card.expMonth)}/{String(card.expYear).slice(-2)}
              </span>
              <button
                type="button"
                className={styles.linkBtn}
                disabled={busy}
                onClick={() => handleRemove(card.id)}
                aria-label={`Remove ${card.brand} ending in ${card.last4}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className={styles.addCard} onSubmit={handleAdd} noValidate>
        <h3 className={styles.subTitle}>Add a card</h3>
        <div className={styles.row}>
          <Field label="Card number" htmlFor={id("number")} error={errors.number}>
            <input
              id={id("number")}
              type="text"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="0000 0000 0000 0000"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              aria-invalid={!!errors.number}
              aria-describedby={errors.number ? `${id("number")}-error` : undefined}
            />
          </Field>
          <Field label="Expiration" htmlFor={id("expiry")} error={errors.expiry}>
            <input
              id={id("expiry")}
              type="text"
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM/YY"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              aria-invalid={!!errors.expiry}
              aria-describedby={errors.expiry ? `${id("expiry")}-error` : undefined}
            />
          </Field>
        </div>
        <button type="submit" className={styles.save} disabled={busy}>
          Add card
        </button>
      </form>
    </section>
  );
}