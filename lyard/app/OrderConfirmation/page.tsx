"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import styles from "./order.module.css";
import shared from "../check-out/checkout.module.css";

import { TotalsList, useOrderLines } from "../check-out/order";
import { useCart } from "@/app/context/CartContext";
import { removeEventOrder, setPromoCode, useCheckout, type OrderLine } from "@/lib/checkoutStore";
import { calculateTotals, findPromo, formatDate, formatMoney } from "@/lib/CheckoutPricing";
import { ROUTES } from "@/lib/Routes";

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Prices({ line }: { line: OrderLine }) {
  const total = line.unitPrice * line.quantity;
  const original = (line.originalUnitPrice ?? line.unitPrice) * line.quantity;
  return (
    <div className={styles.totalCol}>
      {original > total && <span className={styles.struck}>{formatMoney(original)}</span>}
      <span>{formatMoney(total)}</span>
    </div>
  );
}

function Product({ line }: { line: OrderLine }) {
  const meta = [line.size, line.flavor].filter(Boolean).join(" · ");
  return (
    <div className={styles.product}>
      <div className={styles.thumb}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {line.image ? <img src={line.image} alt="" /> : null}
      </div>
      <div>
        <h3 className={styles.name}>{line.name}</h3>
        {meta && <p className={styles.meta}>{meta}</p>}
      </div>
    </div>
  );
}

/** A cart item (from the main page, product pages or bundles): quantity can be changed. */
function BagRow({ line }: { line: OrderLine }) {
  const { increaseQuantity, decreaseQuantity, removeItem } = useCart();
  const productId = Number(line.productId);

  return (
    <li className={styles.row}>
      <Product line={line} />

      <div className={styles.qtyCol}>
        <div className={styles.stepper} role="group" aria-label={`Quantity of ${line.name}`}>
          <button type="button" aria-label={`Decrease quantity of ${line.name}`} onClick={() => decreaseQuantity(productId)}>
            −
          </button>
          <output aria-live="polite">{line.quantity}</output>
          <button type="button" aria-label={`Increase quantity of ${line.name}`} onClick={() => increaseQuantity(productId)}>
            +
          </button>
        </div>
      </div>

      <div className={styles.trashCol}>
        <button type="button" className={styles.trash} aria-label={`Remove ${line.name}`} onClick={() => removeItem(productId)}>
          <TrashIcon />
        </button>
      </div>

      <Prices line={line} />
    </li>
  );
}

/** A line from an event / bundle order: quantity is fixed here, the whole order is removed at once. */
function EventRow({ line }: { line: OrderLine }) {
  return (
    <li className={styles.row}>
      <Product line={line} />
      <div className={styles.qtyCol}>
        <span className={styles.qtyText}>× {line.quantity}</span>
      </div>
      <div className={styles.trashCol} />
      <Prices line={line} />
    </li>
  );
}

export default function CartPage() {
  const router = useRouter();
  const { bag, events, lines, ready } = useOrderLines();
  const { promoCode } = useCheckout();

  const promo = useMemo(() => (promoCode ? findPromo(promoCode) : null), [promoCode]);
  const totals = useMemo(() => calculateTotals(lines, null, promo), [lines, promo]);

  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const promoMessage = promo ? `${promo.code} applied (${promo.label})` : promoError;

  const applyPromo = () => {
    const found = findPromo(promoInput);
    if (found) {
      setPromoCode(found.code);
      setPromoError("");
    } else {
      setPromoCode(null);
      setPromoError(promoInput.trim() ? "That promo code isn't valid." : "Enter a promo code.");
    }
  };

  const isEmpty = lines.length === 0;

  return (
    <>
      <Header />

      <main className={styles.page}>
        <h1 className={styles.title}>Your Cart</h1>
        <p className={styles.sub}>Review your selections before completing your order.</p>

        <div className={styles.layout}>
          {/* ------------------------- Items ------------------------- */}
          <section aria-label="Cart items">
            {!ready ? null : isEmpty ? (
              <p className={styles.empty}>Your cart is empty.</p>
            ) : (
              <>
                <div className={styles.head} aria-hidden="true">
                  <span>Product</span>
                  <span>Quantity</span>
                  <span />
                  <span>Total</span>
                </div>

                <ul className={styles.table}>
                  {bag.map((line) => (
                    <BagRow key={line.id} line={line} />
                  ))}

                  {events.map((event) => (
                    <li key={event.id} className={styles.eventBlock}>
                      <div className={styles.eventHead}>
                        <span>
                          Event order
                          {event.details.pickupDate ? ` · pick-up ${formatDate(event.details.pickupDate)}` : ""}
                          {event.details.eventType ? ` · ${event.details.eventType}` : ""}
                        </span>
                        <button type="button" className={styles.eventRemove} onClick={() => removeEventOrder(event.id)}>
                          Remove event order
                        </button>
                      </div>
                      <ul className={styles.table}>
                        {event.lines.map((line) => (
                          <EventRow key={line.id} line={line} />
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <Link href={ROUTES.home} className={styles.continue}>
              ← Continue Shopping
            </Link>
          </section>

          {/* ------------------------ Summary ------------------------ */}
          <div className={styles.summaryCol}>
            <aside className={shared.summary} aria-labelledby="cart-summary-title">
              <h2 id="cart-summary-title" className={shared.summaryTitle}>
                Order Summary
              </h2>

              <TotalsList totals={totals} shippingLabel="Calculated at Checkout" promoCode={promo?.code} />

              <div className={shared.promo}>
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
                <p className={promo ? shared.success : shared.error} role="status">
                  {promoMessage}
                </p>
              )}

              <button
                type="button"
                className={shared.complete}
                disabled={isEmpty}
                onClick={() => router.push(ROUTES.checkout)}
              >
                PROCEED TO CHECKOUT →
              </button>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}