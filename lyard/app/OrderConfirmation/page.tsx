"use client";
import Link from "next/link";
import { Montserrat } from "next/font/google";
import Header from "../components/Header";
import Footer from "../components/Footer";
import OrderConfirmation from "../components/ordercomfirmation";
import { useCheckout, useHydrated } from "@/lib/check-out/checkoutStore";
import { formatDate, formatMoney } from "@/lib/check-out/CheckoutPricing";
import { ROUTES } from "@/lib/Routes/Routes";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

export default function OrderConfirmationPage() {
  const { lastOrder: order } = useCheckout();
  const hydrated = useHydrated();

  const delivering = order?.delivery.method === "ship";
  const trackingUrl = delivering ? order?.delivery.trackingUrl : undefined;
  const payment = order?.payment;
  const awaitingETransfer = payment?.status === "awaiting_etransfer";
  const PAID_WITH: Record<string, string> = {
    card: "Card",
    apple: "Apple Pay",
    google: "Google Pay",
    paypal: "PayPal",
    etransfer: "Interac e-Transfer",
  };

  return (
    <div className={montserrat.variable}>
      <Header />
      <main
        style={{
          fontFamily: "var(--font-montserrat), Montserrat, system-ui, sans-serif",
          borderTop: "2px solid #e6c200",
          padding: "2.5rem clamp(1rem, 5vw, 4rem) 4rem",
          minHeight: "70vh",
        }}
      >
        {!hydrated ? null : !order ? (
          <div style={{ textAlign: "center", display: "grid", gap: "1rem", marginTop: "3rem" }}>
            <p>There is no recent order to show.</p>
            <Link href={ROUTES.main}>← Back to the shop</Link>
          </div>
        ) : (
          <OrderConfirmation
            message={
              awaitingETransfer
                ? `Thank you for your order. Send your e-Transfer to finish it; we'll start preparing it once the money arrives.`
                : `Thank you for your order. We're preparing your selections. A receipt was sent to ${order.customer.email}.`
            }
            orderNumber={order.orderNumber}
            infoLabel={delivering ? "DOORDASH DELIVERY ESTIMATE" : "PICKUP"}
            infoValue={
              delivering
                ? `About ${order.delivery.etaMinutes ?? 40} min`
                : order.delivery.pickupLocation ?? "Pickup in store"
            }
            lines={order.lines.map((l) => ({
              id: l.id,
              name: l.name,
              image: l.image,
              meta: [l.group, l.size, l.flavor].filter(Boolean).join(" · ") + ` · Qty ${l.quantity}`,
              price: l.unitPrice * l.quantity,
            }))}
            rows={[
              { label: "Subtotal", value: formatMoney(order.totals.subtotal) },
              ...(order.totals.discount > 0
                ? [
                    {
                      label: `Discount${order.promoCode ? ` (${order.promoCode})` : ""}`,
                      value: `−${formatMoney(order.totals.discount)}`,
                    },
                  ]
                : []),
              ...(delivering
                ? [{ label: "Shipping", value: formatMoney(order.totals.shipping ?? 0) }]
                : []),
              { label: "Estimated Tax", value: formatMoney(order.totals.tax) },
            ]}
            total={formatMoney(order.totals.total)}
            actions={[
              ...(trackingUrl
                ? [{ label: "TRACK ON DOORDASH ↗", href: trackingUrl, primary: true }]
                : []),
              ...(payment?.receiptUrl ? [{ label: "VIEW RECEIPT ↗", href: payment.receiptUrl, primary: false }] : []),
              { label: "RETURN TO SHOP", href: ROUTES.home, primary: !trackingUrl },
            ]}
          >
            {payment && (
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#333" }}>
                {awaitingETransfer ? (
                  <>
                    <strong>Payment: waiting for your e-Transfer.</strong> Send {formatMoney(payment.amount)} to{" "}
                    <strong>{payment.etransferEmail}</strong> and put <strong>{order.orderNumber}</strong> in the
                    message.
                  </>
                ) : (
                  <>
                    Paid with {payment.label ?? PAID_WITH[payment.method] ?? payment.method} ·{" "}
                    {formatMoney(payment.amount)} {payment.currency}
                  </>
                )}
              </p>
            )}
            {order.events.length > 0 && (
              <ul style={{ margin: 0, padding: 0, listStyle: "none", fontSize: "0.75rem", color: "#555" }}>
                {order.events.map((e, i) => (
                  <li key={i}>
                    Event order: {e.eventType || "Event"} · pickup {formatDate(e.pickupDate)}
                  </li>
                ))}
              </ul>
            )}
          </OrderConfirmation>
        )}
      </main>
      <Footer />
    </div>
  );
}