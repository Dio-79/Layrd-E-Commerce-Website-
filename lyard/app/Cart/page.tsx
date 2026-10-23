"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import styles from "./Cart.module.css";
import summaryStyles from "../checkout/checkout.module.css";
import { TotalsList, useOrderLines } from "../checkout/order";
import { useCart } from "@/app/context/CartContext";
import { ROUTES } from "@/lib/Routes/Routes";
import { removeEventOrder, useCheckout } from "@/lib/checkout/checkoutStore";
import {
  calculateTotals,
  findPromo,
  formatDate,
  formatMoney,
  type PromoCode,
} from "@/lib/checkout/CheckoutPricing";

export default function CartPage() {
  const { increaseQuantity, decreaseQuantity, removeItem } = useCart();
  const { bag, events, lines, ready } = useOrderLines();
  const { promoCode } = useCheckout();

  /* ---------------- Promo ---------------- */
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoMessage, setPromoMessage] = useState("");

  const storedPromo = useMemo(() => (promoCode ? findPromo(promoCode) : null), [promoCode]);
  const promo = appliedPromo ?? storedPromo;

  const applyPromo = () => {
    const found = findPromo(promoInput);
    if (found) {
      setAppliedPromo(found);
      setPromoMessage(`${found.code} applied (${found.label})`);
    } else {
      setAppliedPromo(null);
      setPromoMessage(promoInput.trim() ? "That promo code isn't valid." : "Enter a promo code.");
    }
  };

  const totals = useMemo(() => calculateTotals(lines, null, promo), [lines, promo]);

  return (
    <>
      <Header />

      <main className={styles.page}>
        <h1 className={styles.title}>Your Cart</h1>
        <p className={styles.sub}>Review your selections before completing your order.</p>

        <div className={styles.layout}>
          <section>
            {!ready ? null : lines.length === 0 ? (
              <>
                <p className={styles.empty}>Your cart is empty.</p>
                <Link href={ROUTES.main} className={styles.continue}>
                  ← Continue Shopping
                </Link>
              </>
            ) : (
              <>
                {bag.length > 0 && (
                  <>
                    <div className={styles.head}>
                      <span>Product</span>
                      <span>Quantity</span>
                      <span />
                      <span>Total</span>
                    </div>

                    <ul className={styles.table}>
                      {bag.map((line) => {
                        const productId = Number(line.productId);
                        const meta = [line.size, line.flavor].filter(Boolean).join(" · ");
                        const total = line.unitPrice * line.quantity;
                        const original = (line.originalUnitPrice ?? line.unitPrice) * line.quantity;

                        return (
                          <li key={line.id} className={styles.row}>
                            <div className={styles.product}>
                              <div className={styles.thumb}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                {line.image ? <img src={line.image} alt="" /> : null}
                              </div>
                              <div>
                                <p className={styles.name}>{line.name}</p>
                                {meta && <p className={styles.meta}>{meta}</p>}
                              </div>
                            </div>

                            <div className={styles.qtyCol}>
                              <div className={styles.stepper} role="group" aria-label={`Quantity of ${line.name}`}>
                                <button
                                  type="button"
                                  aria-label={`Decrease quantity of ${line.name}`}
                                  onClick={() => decreaseQuantity(productId)}
                                >
                                  −
                                </button>
                                <output aria-live="polite">{line.quantity}</output>
                                <button
                                  type="button"
                                  aria-label={`Increase quantity of ${line.name}`}
                                  onClick={() => increaseQuantity(productId)}
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            <div className={styles.trashCol}>
                              <button
                                type="button"
                                className={styles.trash}
                                aria-label={`Remove ${line.name}`}
                                onClick={() => removeItem(productId)}
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                  <path
                                    d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>
                            </div>

                            <div className={styles.totalCol}>
                              {original > total && <span className={styles.struck}>{formatMoney(original)}</span>}
                              <span>{formatMoney(total)}</span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}

                {events.map((event) => (
                  <div className={styles.eventBlock} key={event.id}>
                    <div className={styles.eventHead}>
                      <span>
                        Event Order
                        {event.details.pickupDate ? ` · ${formatDate(event.details.pickupDate)}` : ""}
                      </span>
                      <button type="button" className={styles.eventRemove} onClick={() => removeEventOrder(event.id)}>
                        Remove
                      </button>
                    </div>

                    <ul className={styles.table}>
                      {event.lines.map((line) => {
                        const meta = [line.size, line.flavor].filter(Boolean).join(" · ");
                        return (
                          <li key={line.id} className={styles.row}>
                            <div className={styles.product}>
                              <div className={styles.thumb}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                {line.image ? <img src={line.image} alt="" /> : null}
                              </div>
                              <div>
                                <p className={styles.name}>{line.name}</p>
                                {meta && <p className={styles.meta}>{meta}</p>}
                              </div>
                            </div>
                            <div className={styles.qtyCol}>
                              <span className={styles.qtyText}>Qty {line.quantity}</span>
                            </div>
                            <div className={styles.trashCol} />
                            <div className={styles.totalCol}>
                              <span>{formatMoney(line.unitPrice * line.quantity)}</span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}

                <Link href={ROUTES.main} className={styles.continue}>
                  ← Continue Shopping
                </Link>
              </>
            )}
          </section>

          <aside className={`${styles.summaryCol} ${summaryStyles.summary}`}>
            <h2 className={summaryStyles.summaryTitle}>Order Summary</h2>

            <TotalsList totals={totals} shippingLabel="Calculated at Checkout" promoCode={promo?.code} />

            <div className={summaryStyles.promo}>
              <input
                type="text"
                placeholder="Promo Code"
                aria-label="Promo code"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyPromo();
                  }
                }}
              />
              <button type="button" onClick={applyPromo}>
                APPLY
              </button>
            </div>
            {promoMessage && (
              <p className={appliedPromo ? summaryStyles.success : summaryStyles.error} role="status">
                {promoMessage}
              </p>
            )}

            {lines.length > 0 ? (
              <Link href={ROUTES.checkout} className={summaryStyles.complete}>
                PROCEED TO CHECKOUT →
              </Link>
            ) : (
              <span className={`${summaryStyles.complete} ${styles.disabled}`} aria-disabled="true">
                PROCEED TO CHECKOUT →
              </span>
            )}
          </aside>
        </div>
      </main>

      <Footer />
    </>
  );
}