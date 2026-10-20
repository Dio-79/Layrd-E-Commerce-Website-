"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Montserrat } from "next/font/google";
import Header from "../app/components/Header";
import Footer from "../app/components/Footer";
import OrderConfirmation from "../app/components/ordercomfirmation";
import { loadRegularOrder, type RegularOrder } from "@/lib/Orderstore";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });
const money = (n: number) => `$${n.toFixed(2)}`;

export default function RegularOrderConfirmationPage() {
  const [order, setOrder] = useState<RegularOrder | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setOrder(loadRegularOrder()); // sessionStorage only exists in the browser
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

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
        {!loaded ? null : !order ? (
          <div style={{ textAlign: "center", display: "grid", gap: "1rem", marginTop: "3rem" }}>
            <p>There is no recent order to show.</p>
            <Link href="/Mainpage">← Back to the shop</Link>
          </div>
        ) : (
          <OrderConfirmation
            message={`Thank you for your order. We're preparing your selections. A receipt was sent to ${order.email}.`}
            orderNumber={order.reference}
            infoLabel={order.method === "delivery" ? "DOORDASH DELIVERY ESTIMATE" : "PICKUP"}
            infoValue={order.estimate}
            lines={order.lines.map((l) => ({
              id: l.id,
              name: l.name,
              image: l.image,
              meta: l.meta,
              price: l.unitPrice * l.quantity,
            }))}
            rows={[
              { label: "Subtotal", value: money(order.subtotal) },
              ...(order.method === "delivery"
                ? [{ label: "Shipping", value: money(order.shipping) }]
                : []),
              { label: "Estimated Tax", value: money(order.tax) },
            ]}
            total={money(order.total)}
            actions={[
              ...(order.trackingUrl
                ? [{ label: "TRACK ON DOORDASH ↗", href: order.trackingUrl, primary: true }]
                : []),
              { label: "RETURN TO SHOP", href: "/Mainpage", primary: !order.trackingUrl },
            ]}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}