<<<<<<< HEAD
import React from 'react';
import { orders } from '@/lib/Order/order';

export default function OrdersPage() {
    return (
        <div>
            <h1>Order history</h1>

            {/* Tabs */}
            <div>
                <p>All</p>
                <p>Recurring</p>
                <p>One-time</p>
            </div>

            {/* Stats cards */}
            <div>
                <div>
                    <p>REVENUE</p>
                    <p>$1,195.00</p>
                </div>
                <div>
                    <p>TOTAL ORDERS</p>
                    <p>123</p>
                </div>
                <div>
                    <p>NEW CUSTOMERS</p>
                    <p>78</p>
                </div>
                <div>
                    <p>ACTIVE WHOLESALE</p>
                    <p>11</p>
                </div>
            </div>

            {/* Table */}
            <table>
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Quantity</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((order) => (
                        <tr key={order.orderID}>
                            <td>{order.orderID}</td>
                            <td>{order.quantity}</td>
                            <td>{order.date}</td>
                            <td>{order.status}</td>
                            <td>${order.total.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
=======
"use client";

import { useMemo, useState } from "react";
import { DataState, PageHeading, Panel, inputStyle } from "@/app/portal-ui/PortalUI";
import { usePortalList, type PortalProduct, currency } from "@/app/portal-ui/usePortalData";

export default function BulkOrderBuilder() {
  const { items, loading, error, reload } = usePortalList<PortalProduct>("/api/products", "products");
  const [counts, setCounts] = useState<Record<number, number>>({});
  const selected = useMemo(() => (items ?? []).filter((p) => (counts[p.productID] || 0) > 0), [items, counts]);
  const units = selected.reduce((sum, p) => sum + counts[p.productID], 0);
  const estimate = selected.reduce((sum, p) => sum + p.price * counts[p.productID], 0);

  return <>
    <PageHeading title="Bulk order builder" subtitle="Choose quantities to prepare an order draft. Your draft is not submitted." />
    <DataState loading={loading} error={error} retry={reload} empty={items && !items.length ? "No products are available to order." : undefined} />
    {items && items.length > 0 && <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
      <Panel title="Products">
        <div className="space-y-3">{items.map((p) => <div key={p.productID} className="grid grid-cols-[1fr_105px] items-center gap-3 border-b border-zinc-100 py-3">
          <div><p className="font-semibold">{p.name}</p><p className="text-sm text-zinc-500">{currency(p.price)} catalog price</p></div>
          <label className="text-xs text-zinc-600">Quantity<input type="number" min={0} max={500} step={1} inputMode="numeric" className={`${inputStyle} mt-1`} value={counts[p.productID] ?? 0} onChange={(e) => {const n = Number(e.target.value); setCounts((old) => ({...old, [p.productID]: Number.isFinite(n) ? Math.max(0, Math.min(500, Math.floor(n))) : 0}));}} /></label>
        </div>)}</div>
      </Panel>
      <div className="xl:sticky xl:top-5 xl:self-start"><Panel title="Draft summary">
        <p className="text-sm text-zinc-600">{selected.length} product types · {units} units</p>
        {selected.length === 0 ? <p className="my-5 text-sm text-zinc-500">Add quantities to begin.</p> : <ul className="my-5 space-y-2 text-sm">{selected.map((p) => <li key={p.productID} className="flex justify-between gap-2"><span>{p.name} × {counts[p.productID]}</span><span>{currency(p.price * counts[p.productID])}</span></li>)}</ul>}
        <div className="border-t border-zinc-200 pt-3"><div className="flex justify-between font-bold"><span>Catalog estimate</span><span>{currency(estimate)}</span></div><p className="mt-2 text-xs text-zinc-500">Not a wholesale quote. Taxes, discounts, shipping and stock checks are not applied.</p></div>
        <button type="button" disabled className="mt-5 w-full cursor-not-allowed rounded-lg bg-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-700" title="Wholesale checkout API not connected">Submit order — coming soon</button>
        <p role="status" className="mt-2 text-xs text-zinc-600">The backend needs a dedicated, server-priced wholesale order endpoint before checkout is enabled.</p>
      </Panel></div>
    </div>}
  </>;
}
>>>>>>> 80246dcef234d6de08a72a7d377df29479efed73
