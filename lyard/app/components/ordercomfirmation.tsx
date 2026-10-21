"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./orderconfirmation.module.css";

export interface ConfirmationLine {
  id: string;
  name: string;
  image?: string | null;
  meta?: string;
  price: number; // line total
}

export interface ConfirmationRow {
  label: string;
  value: string;
  strong?: boolean;
}

export interface ConfirmationAction {
  label: string;
  href?: string;
  onClick?: () => void;
  primary?: boolean;
}

interface Props {
  title?: string;
  message: string;
  orderNumber: string;
  infoLabel: string; // e.g. "PICKUP" or "DOORDASH DELIVERY ESTIMATE"
  infoValue: string;
  lines: ConfirmationLine[];
  rows: ConfirmationRow[]; // subtotal, shipping, tax...
  total: string;
  afterTotal?: ConfirmationRow[]; // e.g. deposit paid, balance at pickup
  actions: ConfirmationAction[];
  children?: ReactNode; // optional extra content above the summary
}

export default function OrderConfirmation({
  title = "Order Confirmed",
  message,
  orderNumber,
  infoLabel,
  infoValue,
  lines,
  rows,
  total,
  afterTotal = [],
  actions,
  children,
}: Props) {
  return (
    <section className={styles.wrap} aria-live="polite">
      <div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.message}>{message}</p>
      </div>

      <div className={styles.strip}>
        <div>
          <span className={styles.stripLabel}>ORDER NUMBER</span>
          <strong>{orderNumber}</strong>
        </div>
        <div>
          <span className={styles.stripLabel}>{infoLabel}</span>
          <strong className={styles.gold}>{infoValue}</strong>
        </div>
      </div>

      {children}

      <div className={styles.summary}>
        <h2>Order Summary</h2>

        <ul className={styles.lines}>
          {lines.map((line) => (
            <li key={line.id}>
              {line.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={line.image} alt="" />
              ) : (
                <span className={styles.noImg} />
              )}
              <div>
                <div className={styles.lineName}>{line.name}</div>
                {line.meta && <div className={styles.lineMeta}>{line.meta}</div>}
              </div>
              <span className={styles.linePrice}>${line.price.toFixed(2)}</span>
            </li>
          ))}
        </ul>

        <dl className={styles.rows}>
          {rows.map((r) => (
            <div key={r.label}>
              <dt>{r.label}</dt>
              <dd>{r.value}</dd>
            </div>
          ))}
        </dl>

        <div className={styles.total}>
          <span>Total</span>
          <span>{total}</span>
        </div>

        {afterTotal.length > 0 && (
          <dl className={`${styles.rows} ${styles.after}`}>
            {afterTotal.map((r) => (
              <div key={r.label} className={r.strong ? styles.strong : undefined}>
                <dt>{r.label}</dt>
                <dd>{r.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className={styles.actions}>
        {actions.map((a) =>
          a.href ? (
            <Link key={a.label} href={a.href} className={a.primary ? styles.primary : styles.secondary}>
              {a.label}
            </Link>
          ) : (
            <button
              key={a.label}
              type="button"
              onClick={a.onClick}
              className={a.primary ? styles.primary : styles.secondary}
            >
              {a.label}
            </button>
          )
        )}
      </div>
    </section>
  );
}