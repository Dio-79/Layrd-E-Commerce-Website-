"use client";

import Link from "next/link";
import { Montserrat } from "next/font/google";
import Header from "../components/Header";
import Footer from "../components/Footer";
import OrderConfirmation from "../components/ordercomfirmation";
import { useCheckout, useHydrated } from "@/lib/checkout/checkoutStore";
import { formatDate, formatMoney } from "@/lib/checkout/CheckoutPricing";
import { ROUTES } from "@/lib/Routes/Routes";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

export default function OrderConfirmationPage() {
  const { lastOrder: order } = useCheckout();
  const hydrated = useHydrated();

  const delivering = order?.delivery.method === "ship";
  const trackingUrl = delivering ? order?.delivery.trackingUrl : undefined;

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
            <Link href={ROUTES.home}>← Back to the shop</Link>
          </div>
        ) : (
          <OrderConfirmation
            message={`Thank you for your order. We're preparing your selections. A receipt was sent to ${order.customer.email}.`}
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
              meta: [l.size, l.flavor].filter(Boolean).join(" · ") + ` · Qty ${l.quantity}`,
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
              { label: "RETURN TO SHOP", href: ROUTES.home, primary: !trackingUrl },
            ]}
          >
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