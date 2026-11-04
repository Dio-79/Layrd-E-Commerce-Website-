'use client';

import React from 'react';
import Link from 'next/link';
import { usePortalList, type PortalOrder, type PortalProduct, currency, shortDate } from '@/app/portal-ui/usePortalData';
import { ui } from '../adminStyles';

// "Overview" screen from the Figma. The sidebar and top bar are in app/admin/layout.tsx.
// Every number here comes from the live product and order APIs.

function Stat({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-md border border-zinc-600 bg-[#3a3a3a] p-4 shadow-md shadow-black/20">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-200">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
        </div>
    );
}

const OPEN = ["placed", "pending", "processing"];

function statusColour(status?: string) {
    const s = (status || "").toLowerCase();
    if (s === "delivered" || s === "completed") return "text-zinc-100 font-semibold";
    if (s === "cancelled" || s.includes("pending payment")) return "text-red-400";
    if (OPEN.includes(s)) return "text-[#e0b43a]";
    return "text-zinc-300";
}

export default function AdminDashboard() {
    const products = usePortalList<PortalProduct>("/api/products", "products");
    const orders = usePortalList<PortalOrder>("/api/orders", "orders");

    const show = (list: { loading: boolean; error: string | null }, value: string | number) =>
        list.loading ? "…" : list.error ? "—" : value;
    const items = orders.items ?? [];
    const revenue = items.reduce((sum, o) => sum + (o.totals?.total ?? 0), 0);
    const customers = new Set(items.map((o) => o.customer?.email).filter(Boolean)).size;
    const openOrders = items.filter((o) => OPEN.includes((o.status || "").toLowerCase()));

    return (
        <div className={ui.page}>
            <div>
                <h1 className={ui.h1}>Overview</h1>
                <p className={ui.subtitle}>Today&apos;s performance and priority items</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Stat label="Revenue" value={show(orders, currency(revenue))} />
                <Stat label="Total orders" value={show(orders, items.length)} />
                <Stat label="Customers" value={show(orders, customers)} />
                <Stat label="Products" value={show(products, products.items?.length ?? 0)} />
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
                <section className={ui.card}>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold tracking-wide text-white">RECENT ORDERS</h2>
                        <span className="text-xs font-semibold text-zinc-500" title="The orders page is coming soon">VIEW ALL</span>
                    </div>
                    {orders.loading && <p className="text-sm text-zinc-400">Loading…</p>}
                    {orders.error && <p className="text-sm text-red-400">{orders.error}</p>}
                    {orders.items && items.length === 0 && <p className="text-sm text-zinc-400">No orders yet.</p>}
                    {items.length > 0 && (
                        <div className={ui.tableWrap}>
                            <table className={ui.table}>
                                <thead>
                                    <tr>
                                        <th className={ui.th}>Order ID</th>
                                        <th className={ui.th}>Customer</th>
                                        <th className={ui.th}>Date</th>
                                        <th className={ui.th}>Status</th>
                                        <th className={`${ui.th} text-right`}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.slice(0, 8).map((o) => (
                                        <tr key={o.orderNumber}>
                                            <td className={`${ui.td} text-zinc-400`}>{o.orderNumber}</td>
                                            <td className={ui.td}>{o.customer?.fullName || o.customer?.email || "Guest"}</td>
                                            <td className={ui.td}>{shortDate(o.placedAt ?? o.savedAt)}</td>
                                            <td className={`${ui.td} capitalize ${statusColour(o.status)}`}>{o.status || "—"}</td>
                                            <td className={`${ui.td} text-right`}>{currency(o.totals?.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section className={ui.card}>
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                        <span className="text-red-400" aria-hidden="true">⚠</span> Priority Alerts
                    </h2>
                    <div className="space-y-3">
                        {orders.loading && <p className="text-sm text-zinc-400">Loading…</p>}
                        {!orders.loading && openOrders.length === 0 && (
                            <p className="rounded-sm border border-zinc-600 bg-[#2b2b2b] p-3 text-sm text-zinc-400">Nothing needs attention right now.</p>
                        )}
                        {openOrders.slice(0, 4).map((o) => (
                            <div key={o.orderNumber} className="rounded-sm border border-zinc-600 bg-[#2b2b2b] p-3">
                                <p className="text-sm font-semibold text-[#e0b43a]">Open order</p>
                                <p className="mt-1 text-xs text-zinc-300">
                                    {o.orderNumber} from {o.customer?.fullName || o.customer?.email || "a guest"} is still {o.status}.
                                </p>
                            </div>
                        ))}
                        <Link href="/admin/releasemanagment" className="block rounded-sm border border-zinc-600 bg-[#2b2b2b] p-3 hover:border-[#e0b43a]">
                            <p className="text-sm font-semibold text-[#e0b43a]">Upcoming releases</p>
                            <p className="mt-1 text-xs text-zinc-300">Check drop dates, distribution and marketing.</p>
                            <p className="mt-1 text-xs font-semibold text-[#e0b43a] underline">Review</p>
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
