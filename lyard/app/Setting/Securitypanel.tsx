"use client";

import { useId, useState, type FormEvent } from "react";
import { useAuth } from "@/app/context/AuthContext";
import type { CustomerProfile } from "@/lib/Account/profile";
import { Field } from "./Field";
import styles from "./Account.module.css";

type ChangePassword = (current: string, next: string) => Promise<void>;

export default function SecurityPanel({ profile }: { profile: CustomerProfile }) {
  const uid = useId();
  const id = (field: string) => `${uid}-${field}`;

  // Your AuthContext can provide changePassword(current, next). Until it does, the form is disabled.
  const auth = useAuth() as unknown as { changePassword?: ChangePassword };
  const changePassword = auth.changePassword;

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!changePassword) return;

    const found: typeof errors = {};
    if (!current) found.current = "Enter your current password";
    if (next.length < 8) found.next = "Use at least 8 characters";
    else if (next === current) found.next = "Choose a different password";
    if (confirm !== next) found.confirm = "Passwords must match";

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    try {
      await changePassword(current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      setMessage({ type: "ok", text: "Your password was updated." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "We couldn't update your password.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className={styles.panel} onSubmit={handleSubmit} noValidate aria-labelledby={id("title")}>
      <div className={styles.panelHead}>
        <div>
          <h2 id={id("title")} className={styles.panelTitle}>
            Security
          </h2>
          <p className={styles.panelSub}>Signed in as {profile.email || "your account"}</p>
        </div>
        <button type="submit" className={styles.save} disabled={!changePassword || busy}>
          {busy ? "Updating…" : "Update password"}
        </button>
      </div>

      {!changePassword && (
        <p className={styles.notice} role="note">
          Password changes aren&apos;t connected yet. Add a <code>changePassword(current, next)</code> function to
          AuthContext and this form will start working.
        </p>
      )}

      {message && (
        <p className={message.type === "ok" ? styles.success : styles.error} role="status">
          {message.text}
        </p>
      )}

      <Field label="Current password" htmlFor={id("current")} error={errors.current}>
        <input
          id={id("current")}
          type="password"
          autoComplete="current-password"
          value={current}
          disabled={!changePassword}
          onChange={(e) => setCurrent(e.target.value)}
          aria-invalid={!!errors.current}
          aria-describedby={errors.current ? `${id("current")}-error` : undefined}
        />
      </Field>

      <div className={styles.row}>
        <Field label="New password" htmlFor={id("next")} error={errors.next}>
          <input
            id={id("next")}
            type="password"
            autoComplete="new-password"
            value={next}
            disabled={!changePassword}
            onChange={(e) => setNext(e.target.value)}
            aria-invalid={!!errors.next}
            aria-describedby={errors.next ? `${id("next")}-error` : undefined}
          />
        </Field>
        <Field label="Confirm new password" htmlFor={id("confirm")} error={errors.confirm}>
          <input
            id={id("confirm")}
            type="password"
            autoComplete="new-password"
            value={confirm}
            disabled={!changePassword}
            onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={!!errors.confirm}
            aria-describedby={errors.confirm ? `${id("confirm")}-error` : undefined}
          />
        </Field>
      </div>
    </form>
  );
}