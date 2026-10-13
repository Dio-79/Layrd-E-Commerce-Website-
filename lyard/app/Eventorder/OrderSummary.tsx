"use client";

import {
  getProductId,
  getProductImage,
  getProductName,
  useEventOrder,
} from "@/app/context/EventOrdercontext";
import { products } from "@/lib/data";
import styles from "./event.module.css";

export default function OrderSummary() {
  const { order } = useEventOrder();

  // Nothing to show until Submit succeeds
  if (!order) return null;

  const { details, comment, fileName, items, subtotal, taxAmount, grandTotal } = order;

  return (
    <section className={styles.summary} aria-labelledby="order-summary-title">
      <h2 id="order-summary-title">Order submitted</h2>

      <dl className={styles.summaryList}>
        {details.Starttime && (
          <>
            <dt>Date of event</dt>
            <dd>{details.Starttime}</dd>
          </>
        )}
        {details.type && (
          <>
            <dt>Event type</dt>
            <dd>{details.type}</dd>
          </>
        )}
        {details.number && (
          <>
            <dt>Quantity</dt>
            <dd>{details.number}</dd>
          </>
        )}
        {details.Flavor && (
          <>
            <dt>Flavor</dt>
            <dd>{details.Flavor}</dd>
          </>
        )}
        {comment && (
          <>
            <dt>Comments</dt>
            <dd>{comment}</dd>
          </>
        )}
        {fileName && (
          <>
            <dt>Attachment</dt>
            <dd>{fileName}</dd>
          </>
        )}
      </dl>

      {items.length > 0 && (
        <ul className={styles.summaryItems}>
          {items.map((item) => {
            const product = products.find((p) => getProductId(p) === item.productId);
            const image = product ? getProductImage(product) : null;
            const name = product ? getProductName(product) : item.productName;
            const options = [item.selectedSize, item.selectedFlavor].filter(Boolean).join(", ");

            return (
              <li key={item.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {image ? <img src={image} alt="" /> : null}
                <span>
                  {name} x{item.quantity}
                  {options && ` (${options})`}
                </span>
                <span>${item.itemTotal.toFixed(2)}</span>
              </li>
            );
          })}
        </ul>
      )}

      <div className={styles.summaryTotals}>
        <p>Subtotal: ${subtotal.toFixed(2)}</p>
        <p>Tax: ${taxAmount.toFixed(2)}</p>
        <p>
          <strong>Total: ${grandTotal.toFixed(2)}</strong>
        </p>
      </div>
    </section>
  );
}