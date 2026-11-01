"use client";

import Link from "next/link";
import { DataState, Metric, PageHeading, Panel } from "@/app/portal-ui/PortalUI";
import { usePortalList, type PortalOrder, type PortalProduct, currency, shortDate } from "@/app/portal-ui/usePortalData";

export default function AdminDashboard() {
  const products = usePortalList<PortalProduct>("/api/products", "products");
  const orders = usePortalList<PortalOrder>("/api/orders", "orders");
  const recordedOrderValue = orders.items?.reduce((sum, o) => sum + (Number(o.totals?.total) || 0), 0);
  const lowStock = products.items?.filter((p) => typeof p.stock === "number" && p.stock <= 10).length;
  return <>
    <PageHeading title="Admin dashboard" subtitle="A snapshot of the current shop data." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Products" value={products.loading ? "…" : products.error ? "—" : products.items?.length ?? 0} />
      <Metric label="Recorded orders" value={orders.loading ? "…" : orders.error ? "—" : orders.items?.length ?? 0} />
      <Metric label="Recorded order value*" value={orders.loading ? "…" : orders.error ? "—" : currency(recordedOrderValue)} />
      <Metric label="Low stock (≤10)" value={products.loading ? "…" : products.error ? "—" : lowStock ?? 0} />
    </div>
    <p className="mb-5 mt-2 text-xs text-zinc-500">*Sum of stored order totals; not a confirmed sales/revenue or payments metric. Low-stock counts require stock fields.</p>
    <div className="grid gap-5 xl:grid-cols-2">
      <Panel title="Recent orders">
        <DataState loading={orders.loading} error={orders.error} retry={orders.reload} empty={orders.items?.length === 0 ? "No orders recorded yet." : undefined} />
        {orders.items && orders.items.length > 0 && <div className="space-y-3">{orders.items.slice(0, 5).map((o) => <div key={o.orderNumber} className="flex justify-between gap-2 border-b border-zinc-100 py-2 text-sm"><div><p className="font-semibold">{o.orderNumber}</p><p className="text-zinc-500">{shortDate(o.placedAt ?? o.savedAt)}</p></div><div className="text-right"><p>{currency(o.totals?.total)}</p><p className="capitalize text-zinc-500">{o.status || "Unknown"}</p></div></div>)}</div>}
        <Link className="mt-4 inline-block text-sm font-semibold text-[#997127] underline" href="/admin/orders">View all orders</Link>
      </Panel>
      <Panel title="Inventory overview">
        <DataState loading={products.loading} error={products.error} retry={products.reload} empty={products.items?.length === 0 ? "No products recorded yet." : undefined} />
        {products.items && products.items.length > 0 && <div className="space-y-3">{products.items.slice(0, 5).map((p) => <div key={p.productID} className="flex justify-between gap-2 border-b border-zinc-100 py-2 text-sm"><span>{p.name}</span><span className="font-semibold">{typeof p.stock === "number" ? `${p.stock} in stock` : "Stock unknown"}</span></div>)}</div>}
        <Link className="mt-4 inline-block text-sm font-semibold text-[#997127] underline" href="/admin/products">View products</Link>
      </Panel>
    </div>
  </>;
}
