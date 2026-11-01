"use client";

import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { DataState, Metric, PageHeading, Panel, buttonStyle } from "@/app/portal-ui/PortalUI";
import { usePortalList, type PortalOrder, type PortalProduct, currency, shortDate } from "@/app/portal-ui/usePortalData";

export default function WholesaleDashboard() {
  const { user } = useAuth();
  const products = usePortalList<PortalProduct>("/api/products", "products");
  const orders = usePortalList<PortalOrder>("/api/orders", "orders");
  const pending = orders.items?.filter((item) => ["placed", "pending", "processing"].includes((item.status || "").toLowerCase())).length ?? 0;

  return <>
    <PageHeading title={`Welcome${user?.name ? `, ${user.name}` : " back"}`} subtitle="Your wholesale workspace" action={<Link className={buttonStyle} href="/wholesale/order">Start bulk order</Link>} />
    <div className="mb-6 grid gap-4 sm:grid-cols-3">
      <Metric label="Catalog products" value={products.loading ? "…" : products.error ? "—" : products.items?.length ?? 0} />
      <Metric label="Orders in account" value={orders.loading ? "…" : orders.error ? "—" : orders.items?.length ?? 0} />
      <Metric label="Open orders" value={orders.loading ? "…" : orders.error ? "—" : pending} />
    </div>
    <div className="grid gap-5 xl:grid-cols-2">
      <Panel title="Quick actions">
        <div className="grid gap-3 sm:grid-cols-2">
          <Link className="rounded-lg border border-amber-300 p-4 hover:bg-amber-50" href="/wholesale/catalog"><strong>Browse catalog</strong><p className="mt-1 text-sm text-zinc-600">Explore available products</p></Link>
          <Link className="rounded-lg border border-amber-300 p-4 hover:bg-amber-50" href="/wholesale/history"><strong>Track orders</strong><p className="mt-1 text-sm text-zinc-600">View order history and status</p></Link>
          <Link className="rounded-lg border border-amber-300 p-4 hover:bg-amber-50" href="/wholesale/order"><strong>Build a bulk order</strong><p className="mt-1 text-sm text-zinc-600">Create a quantity-based draft</p></Link>
          <Link className="rounded-lg border border-amber-300 p-4 hover:bg-amber-50" href="/wholesale/Account"><strong>Business account</strong><p className="mt-1 text-sm text-zinc-600">Check your account details</p></Link>
        </div>
      </Panel>
      <Panel title="Recent orders">
        <DataState loading={orders.loading} error={orders.error} retry={orders.reload} empty={orders.items?.length === 0 ? "No orders have been recorded for this account." : undefined} />
        {orders.items && orders.items.length > 0 && <div className="space-y-3">{orders.items.slice(0, 4).map((order) => <div key={order.orderNumber} className="flex items-center justify-between gap-3 border-b border-zinc-100 py-2 text-sm"><div><p className="font-semibold">{order.orderNumber}</p><p className="text-zinc-500">{shortDate(order.placedAt ?? order.savedAt)}</p></div><div className="text-right"><p>{currency(order.totals?.total)}</p><p className="capitalize text-zinc-600">{order.status || "Status unavailable"}</p></div></div>)}</div>}
      </Panel>
    </div>
    <p className="mt-5 text-xs text-zinc-500">Order history currently comes from the shared orders API; dedicated wholesale pricing and recurring-order APIs are not yet connected.</p>
  </>;
}
