'use client';

import React from 'react';
import Link from 'next/link';
import { usePortalList, type PortalOrder, type PortalProduct, currency, shortDate } from '@/app/portal-ui/usePortalData';
import { ui } from '../adminStyles';

// The sidebar and top bar are in app/admin/layout.tsx so every admin page shares them.

function Stat({ label, value }: { label: string; value: string | number }) {
    return (
        <div className={ui.card}>
            <p className={ui.eyebrow}>{label}</p>
            <p className="mt-2 text-2xl font-bold text-zinc-950">{value}</p>
        </div>
    );
}

const quickLinks = [
    { href: "/admin/productmanagement", title: "Product catalog", text: "Inventory, stock levels and prices" },
    { href: "/admin/bundles", title: "Bundles", text: "Collections and bundle pricing" },
    { href: "/admin/releasemanagment", title: "Upcoming releases", text: "Drop dates, distribution and marketing" },
    { href: "/admin/editproduct", title: "Create a product", text: "Add a new item to the shop" },
];

export default function AdminDashboard() {
    const products = usePortalList<PortalProduct>("/api/products", "products");
    const orders = usePortalList<PortalOrder>("/api/orders", "orders");

    const show = (list: { loading: boolean; error: string | null }, value: string | number) =>
        list.loading ? "…" : list.error ? "—" : value;
    const revenue = (orders.items ?? []).reduce((sum, o) => sum + (o.totals?.total ?? 0), 0);
    const open = (orders.items ?? []).filter((o) =>
        ["placed", "pending", "processing"].includes((o.status || "").toLowerCase())
    ).length;

    return (
        <div className={ui.page}>
            <div className={ui.pageHeader}>
                <div>
                    <h1 className={ui.h1}>Dashboard</h1>
                    <p className={ui.subtitle}>Store overview from the live product and order data.</p>
                </div>
                <Link href="/admin/editproduct" className={ui.btn}>+ Create New Product</Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Stat label="Products" value={show(products, products.items?.length ?? 0)} />
                <Stat label="Orders" value={show(orders, orders.items?.length ?? 0)} />
                <Stat label="Open orders" value={show(orders, open)} />
                <Stat label="Revenue" value={show(orders, currency(revenue))} />
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
                <section className={ui.card}>
                    <h2 className={ui.h2}>Recent orders</h2>
                    {orders.loading && <p className="text-sm text-zinc-500">Loading…</p>}
                    {orders.error && <p className="text-sm text-red-700">{orders.error}</p>}
                    {orders.items && orders.items.length === 0 && <p className="text-sm text-zinc-500">No orders yet.</p>}
                    {orders.items && orders.items.length > 0 && (
                        <div className={ui.tableWrap}>
                            <table className={ui.table}>
                                <thead>
                                    <tr>
                                        <th className={ui.th}>Order</th>
                                        <th className={ui.th}>Customer</th>
                                        <th className={ui.th}>Date</th>
                                        <th className={ui.th}>Status</th>
                                        <th className={`${ui.th} text-right`}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.items.slice(0, 8).map((o) => (
                                        <tr key={o.orderNumber}>
                                            <td className={`${ui.td} font-semibold`}>{o.orderNumber}</td>
                                            <td className={ui.td}>{o.customer?.fullName || o.customer?.email || "Guest"}</td>
                                            <td className={ui.td}>{shortDate(o.placedAt ?? o.savedAt)}</td>
                                            <td className={`${ui.td} capitalize`}>{o.status || "—"}</td>
                                            <td className={`${ui.td} text-right`}>{currency(o.totals?.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section className={ui.card}>
                    <h2 className={ui.h2}>Quick links</h2>
                    <div className="space-y-3">
                        {quickLinks.map((q) => (
                            <Link key={q.href} href={q.href} className="block rounded-lg border border-amber-200 p-4 hover:bg-amber-50">
                                <strong className="text-sm">{q.title}</strong>
                                <p className="mt-1 text-xs text-zinc-600">{q.text}</p>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
