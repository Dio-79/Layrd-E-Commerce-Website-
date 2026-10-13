"use client";

import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import styles from "../checkout/checkout.module.css";
import { SummaryLine, TotalsList } from "./order";
import { useCheckout, useHydrated } from "@/lib/checkoutStore";
import { formatDate, formatMoney } from "@/lib/checkoutPricing";

export default function OrderConfirmationPage() {
  const hydrated = useHydrated();
  const { lastOrder: order } = useCheckout();

  return (
    <>
      <Header />

      <main className={styles.page}>
        {!hydrated ? null : !order ? (
          <div className={styles.confirmEmpty}>
            <h1 className={styles.heading}>No recent order</h1>
            <p className={styles.subheading}>We couldn&apos;t find an order to confirm.</p>
            <Link href="/" className={styles.complete}>
              CONTINUE SHOPPING
            </Link>
          </div>
        ) : (
          <>
            <h1 className={styles.heading}>Order Confirmed</h1>
            <p className={styles.subheading}>
              Thank you{order.customer.fullName ? `, ${order.customer.fullName.split(" ")[0]}` : ""}! We&apos;ll use{" "}
              {order.customer.email} for order updates.
            </p>

            <div className={styles.layout}>
              <div className={styles.left}>
                <section className={styles.section}>
                  <h2>Order Details</h2>
                  <dl className={styles.details}>
                    <div>
                      <dt>Order number</dt>
                      <dd className={styles.orderNumber}>{order.orderNumber}</dd>
                    </div>
                    <div>
                      <dt>Placed</dt>
                      <dd>{new Date(order.placedAt).toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt>Contact</dt>
                      <dd>
                        {order.customer.fullName}
                        <br />
                        {order.customer.email}
                        <br />
                        {order.customer.phone}
                      </dd>
                    </div>
                  </dl>
                </section>

                <section className={styles.section}>
                  <h2>{order.delivery.method === "ship" ? "Delivery" : "Pickup"}</h2>
                  {order.delivery.method === "ship" && order.delivery.address ? (
                    <dl className={styles.details}>
                      <div>
                        <dt>Delivering to</dt>
                        <dd>
                          {order.delivery.address.street}
                          <br />
                          {order.delivery.address.city}, {order.delivery.address.province}{" "}
                          {order.delivery.address.postal}
                        </dd>
                      </div>
                      <div>
                        <dt>Carrier</dt>
                        <dd>
                          DoorDash
                          {order.delivery.courierName ? ` · courier ${order.delivery.courierName}` : ""}
                        </dd>
                      </div>
                      <div>
                        <dt>Estimated arrival</dt>
                        <dd>About {order.delivery.etaMinutes} minutes</dd>
                      </div>
                      <div>
                        <dt>Tracking ID</dt>
                        <dd>{order.delivery.deliveryId}</dd>
                      </div>
                    </dl>
                  ) : (
                    <p className={styles.note}>
                      Pick up at <strong>{order.delivery.pickupLocation}</strong>.
                    </p>
                  )}
                </section>

                {order.events.map((event, index) => (
                  <section className={styles.section} key={`${event.pickupDate}-${index}`}>
                    <h2>Event Order{order.events.length > 1 ? ` #${index + 1}` : ""}</h2>
                    <dl className={styles.details}>
                      <div>
                        <dt>Pick-up date</dt>
                        <dd>{formatDate(event.pickupDate)}</dd>
                      </div>
                      <div>
                        <dt>Event</dt>
                        <dd>{event.eventType}</dd>
                      </div>
                      <div>
                        <dt>Quantity</dt>
                        <dd>{event.headcount}</dd>
                      </div>
                      {event.comment && (
                        <div>
                          <dt>Comment</dt>
                          <dd>{event.comment}</dd>
                        </div>
                      )}
                      {event.fileName && (
                        <div>
                          <dt>Attachment</dt>
                          <dd>{event.fileName}</dd>
                        </div>
                      )}
                    </dl>
                  </section>
                ))}

                <Link href="/" className={styles.returnCart}>
                  ← Continue shopping
                </Link>
              </div>

              <aside className={styles.summary} aria-labelledby="receipt-title">
                <h2 id="receipt-title" className={styles.summaryTitle}>
                  Order Summary
                </h2>

                <ul className={styles.lines}>
                  {order.lines.map((line) => (
                    <SummaryLine key={line.id} line={line} />
                  ))}
                </ul>

                <TotalsList
                  totals={order.totals}
                  shippingLabel={
                    order.delivery.method === "pickup" ? "Free" : formatMoney(order.totals.shipping ?? 0)
                  }
                  promoCode={order.promoCode}
                />
              </aside>
            </div>
          </>
        )}
      </main>

      <Footer />
    </>
  );
}