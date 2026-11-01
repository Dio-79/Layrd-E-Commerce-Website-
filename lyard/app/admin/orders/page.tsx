"use client";

import { useMemo, useState } from "react";
import { DataState, PageHeading, Panel, inputStyle } from "@/app/portal-ui/PortalUI";
import { usePortalList, type PortalOrder, currency, shortDate } from "@/app/portal-ui/usePortalData";

export default function AdminOrders() {
  const { items, loading, error, reload } = usePortalList<PortalOrder>("/api/orders", "orders");
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => (items ?? []).filter((o) => `${o.orderNumber} ${o.customer?.email ?? ""}`.toLowerCase().includes(search.toLowerCase())), [items, search]);
  return <>
    <PageHeading title="Order management" subtitle="Review customer orders. Order updates will be enabled with the admin API." />
    <Panel><label className="block text-sm font-semibold">Find an order<input className={`${inputStyle} mt-2 max-w-md`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Order number or email" /></label></Panel>
    <div className="mt-5"><DataState loading={loading} error={error} retry={reload} empty={items && items.length === 0 ? "No orders recorded yet." : items && filtered.length === 0 ? "No matching orders." : undefined} /></div>
    {items && filtered.length > 0 && <div className="mt-5"><Panel><div className="overflow-x-auto"><table className="w-full min-w-[670px] text-left text-sm"><thead className="border-b border-zinc-200"><tr><th className="px-3 py-3">Order</th><th className="px-3 py-3">Customer</th><th className="px-3 py-3">Date</th><th className="px-3 py-3">Total</th><th className="px-3 py-3">Status</th></tr></thead><tbody>{filtered.map((o) => <tr key={o.orderNumber} className="border-b border-zinc-100"><td className="px-3 py-4 font-semibold">{o.orderNumber}</td><td className="px-3 py-4">{o.customer?.email || "—"}</td><td className="px-3 py-4">{shortDate(o.placedAt ?? o.savedAt)}</td><td className="px-3 py-4">{currency(o.totals?.total)}</td><td className="px-3 py-4 capitalize">{o.status || "Unknown"}</td></tr>)}</tbody></table></div></Panel></div>}
    <p className="mt-4 text-sm text-zinc-600">Status editing, fulfillment, and refunds need authenticated admin endpoints before buttons can be safely enabled.</p>
  </>;
}
