"use client";

import { useMemo } from "react";
import { useCheckout, useHydrated, type OrderLine } from "@/lib/check-out/checkoutStore";
import { cartItemToLine } from "@/lib/check-out/CartLine";
import { formatMoney, type Totals } from "@/lib/check-out/CheckoutPricing";
import { useCart } from "@/app/context/CartContext";
import styles from "./checkout.module.css";

/**
 * Everything being ordered: the cart (from CartContext) plus any event orders.
 * `ready` is false until both have loaded in the browser.
 */
export function useOrderLines() {
  const { items, hydrated: cartReady } = useCart();
  const { events } = useCheckout();
  const storeReady = useHydrated();

  const bag = useMemo(() => items.map(cartItemToLine), [items]);
  const lines = useMemo(() => [...bag, ...events.flatMap((e) => e.lines)], [bag, events]);

  return { bag, events, lines, ready: cartReady && storeReady };
}

/** One line of the summary. `actions` is an optional slot for quantity controls. */
export function SummaryLine({ line, actions }: { line: OrderLine; actions?: React.ReactNode }) {
  const total = line.unitPrice * line.quantity;
  const original = (line.originalUnitPrice ?? line.unitPrice) * line.quantity;
  const meta = [line.group, line.size, line.flavor].filter(Boolean).join(" · ");

  return (
    <li className={styles.line}>
      <div className={styles.thumb}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {line.image ? <img src={line.image} alt="" /> : null}
      </div>

      <div className={styles.lineInfo}>
        <span className={styles.lineName}>{line.name}</span>
        {meta && <span className={styles.lineMeta}>{meta}</span>}
        {actions ?? <span className={styles.lineMeta}>Qty {line.quantity}</span>}
      </div>

      <div className={styles.linePrice}>
        {original > total && <span className={styles.struck}>{formatMoney(original)}</span>}
        <span>{formatMoney(total)}</span>
      </div>
    </li>
  );
}

/** A cart line with − / + and Remove, wired to CartContext. */
export function BagSummaryLine({ line }: { line: OrderLine }) {
  const { increaseQuantity, decreaseQuantity, removeItem } = useCart();
  const key = line.id.replace(/^bag:/, "");

  return (
    <SummaryLine
      line={line}
      actions={
        <div className={styles.lineActions}>
          <div className={styles.stepper} role="group" aria-label={`Quantity of ${line.name}`}>
            <button
              type="button"
              aria-label={`Decrease quantity of ${line.name}`}
              onClick={() => decreaseQuantity(key)}
            >
              −
            </button>
            <output aria-live="polite">{line.quantity}</output>
            <button
              type="button"
              aria-label={`Increase quantity of ${line.name}`}
              onClick={() => increaseQuantity(key)}
            >
              +
            </button>
          </div>
          <button type="button" className={styles.lineRemove} onClick={() => removeItem(key)}>
            Remove
          </button>
        </div>
      }
    />
  );
}

export function TotalsList({
  totals,
  shippingLabel,
  promoCode,
}: {
  totals: Totals;
  shippingLabel: string;
  promoCode?: string | null;
}) {
  return (
    <>
      <dl className={styles.totals}>
        <div>
          <dt>Subtotal</dt>
          <dd>{formatMoney(totals.subtotal)}</dd>
        </div>
        {totals.discount > 0 && (
          <div>
            <dt>Discount{promoCode ? ` (${promoCode})` : ""}</dt>
            <dd>−{formatMoney(totals.discount)}</dd>
          </div>
        )}
        <div>
          <dt>Shipping</dt>
          <dd>{shippingLabel}</dd>
        </div>
        <div>
          <dt>Estimated Tax</dt>
          <dd>{formatMoney(totals.tax)}</dd>
        </div>
      </dl>

      <div className={styles.totalRow}>
        <span>Total</span>
        <span>{formatMoney(totals.total)}</span>
      </div>
    </>
  );
}