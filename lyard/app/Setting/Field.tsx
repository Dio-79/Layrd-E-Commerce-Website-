import type { ReactNode } from "react";
import styles from "./Account.module.css";

export function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.field}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {error && (
        <span id={`${htmlFor}-error`} className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}