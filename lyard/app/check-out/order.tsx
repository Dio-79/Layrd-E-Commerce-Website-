import type { OrderLine } from "@/lib/checkoutStore";
import { formatMoney, type Totals } from "@/lib/checkoutPricing";
import styles from "./checkout.module.css";

export function SummaryLine({ line }: { line: OrderLine }) {
  const total = line.unitPrice * line.quantity;
  const original = (line.originalUnitPrice ?? line.unitPrice) * line.quantity;
  const meta = [line.size, line.flavor].filter(Boolean).join(" · ");

  return (
    <li className={styles.line}>
      <div className={styles.thumb}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {line.image ? <img src={line.image} alt="" /> : null}
      </div>

      <div className={styles.lineInfo}>
        <span className={styles.lineName}>{line.name}</span>
        {meta && <span className={styles.lineMeta}>{meta}</span>}
        <span className={styles.lineMeta}>Qty {line.quantity}</span>
      </div>

      <div className={styles.linePrice}>
        {original > total && <span className={styles.struck}>{formatMoney(original)}</span>}
        <span>{formatMoney(total)}</span>
      </div>
    </li>
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