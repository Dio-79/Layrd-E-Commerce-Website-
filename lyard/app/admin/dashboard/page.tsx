'use client';

import React from 'react';
import Link from 'next/link';
import { ui } from '../adminStyles';
import { money, shortDate, stockStatus, useApi, type AdminProduct } from '../adminApi';
import { statusLabel } from '@/lib/Order/statuses';

// "Overview" screen from the Figma. Everything comes from Firestore through the admin APIs.

type Row = Record<string, unknown> & { id: string; status?: string; customer?: { email?: string; fullName?: string }; totals?: { total?: number } };
type OrdersData = { orders: Row[]; eventPreorders: Row[]; bundlePreorders: Row[]; refunds: Row[] };
type UsersData = { users: { role: string; createdAt: string; wholesaleApplication: { status?: string } | null }[] };

const WEEK = 7 * 864e5;
const inLastWeek = (iso: unknown) => Date.now() - Date.parse(String(iso ?? "")) < WEEK;
const inWeekBefore = (iso: unknown) => {
    const age = Date.now() - Date.parse(String(iso ?? ""));
    return age >= WEEK && age < 2 * WEEK;
};

function trend(now: number, before: number) {
    if (before === 0) return now > 0 ? { text: "new this week", up: true } : { text: "no change", up: null };
    const pct = ((now - before) / before) * 100;
    return { text: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% vs last week`, up: pct > 0 ? true : pct < 0 ? false : null };
}

function Stat({ label, value, change }: { label: string; value: string | number; change?: { text: string; up: boolean | null } }) {
    return (
        <div className="rounded-md border border-[var(--a-border)] bg-[var(--a-card)] p-4 shadow-md shadow-black/20">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--a-text-2)]">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--a-text)]">{value}</p>
            {change && (
                <p className={`mt-1 text-xs ${change.up === true ? "text-[var(--a-gold)]" : change.up === false ? "text-[var(--a-danger)]" : "text-[var(--a-muted)]"}`}>
                    {change.up === true ? "↗ " : change.up === false ? "↘ " : "→ "}{change.text}
                </p>
            )}
        </div>
    );
}

function statusColour(status?: string) {
    if (status === "delivered" || status === "picked_up") return "text-[var(--a-text)] font-semibold";
    if (status === "cancelled") return "text-[var(--a-danger)]";
    return "text-[var(--a-gold)]";
}

export default function AdminDashboard() {
    const orders = useApi<OrdersData>("/api/admin/orders");
    const products = useApi<{ products: AdminProduct[] }>("/api/products?all=1");
    const users = useApi<UsersData>("/api/admin/users");

    const all = (orders.data?.orders ?? []).filter((o) => o.status !== "cancelled");
    const when = (o: Row) => o.placedAt ?? o.savedAt;
    const revenueNow = all.filter((o) => inLastWeek(when(o))).reduce((s, o) => s + (o.totals?.total ?? 0), 0);
    const revenueBefore = all.filter((o) => inWeekBefore(when(o))).reduce((s, o) => s + (o.totals?.total ?? 0), 0);
    const revenue = all.reduce((s, o) => s + (o.totals?.total ?? 0), 0);
    const accounts = users.data?.users ?? [];
    const newNow = accounts.filter((u) => inLastWeek(u.createdAt)).length;
    const newBefore = accounts.filter((u) => inWeekBefore(u.createdAt)).length;

    // Priority alerts (Figma): refund requests, new event orders, low stock, wholesale applications.
    const alerts: { title: string; text: string; href: string; danger?: boolean }[] = [];
    for (const r of (orders.data?.refunds ?? []).filter((r) => r.status === "pending")) {
        alerts.push({ title: "Refund Request", text: `${r.id}: ${String(r.reason ?? "").slice(0, 70)}`, href: "/admin/orders", danger: true });
    }
    for (const e of (orders.data?.eventPreorders ?? []).filter((e) => e.status === "requested")) {
        alerts.push({ title: "Event Order Form", text: `${e.id} for ${String(e.pickupDate ?? "")} needs confirming.`, href: "/admin/orders" });
    }
    for (const p of (products.data?.products ?? []).filter((p) => ["Low Stock", "Out of Stock"].includes(stockStatus(p)))) {
        alerts.push({ title: stockStatus(p), text: `${p.name}: ${p.stock} left (alert at ${p.lowStockAt ?? 10}).`, href: `/admin/editproduct?id=${p.productID}`, danger: stockStatus(p) === "Out of Stock" });
    }
    const applications = accounts.filter((u) => u.wholesaleApplication?.status === "pending").length;
    if (applications) alerts.push({ title: "Wholesale applications", text: `${applications} waiting for approval.`, href: "/admin/customers" });

    const loading = orders.loading || products.loading;

    return (
        <div className={ui.page}>
            <div>
                <h1 className={ui.h1}>Overview</h1>
                <p className={ui.subtitle}>Today&apos;s performance and priority items</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Stat label="Revenue" value={orders.loading ? "…" : money(revenue)} change={orders.loading ? undefined : trend(revenueNow, revenueBefore)} />
                <Stat label="Total orders" value={orders.loading ? "…" : all.length}
                    change={orders.loading ? undefined : trend(all.filter((o) => inLastWeek(when(o))).length, all.filter((o) => inWeekBefore(when(o))).length)} />
                <Stat label="New customers" value={users.loading ? "…" : newNow} change={users.loading ? undefined : trend(newNow, newBefore)} />
                <Stat label="Active wholesale" value={users.loading ? "…" : accounts.filter((u) => u.role === "wholesale").length} />
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
                <section className={ui.card}>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold tracking-wide text-[var(--a-text)]">RECENT ORDERS</h2>
                        <Link href="/admin/orders" className="text-xs font-semibold text-[var(--a-gold)] hover:underline">VIEW ALL</Link>
                    </div>
                    {orders.loading && <p className="text-sm text-[var(--a-muted)]">Loading…</p>}
                    {orders.error && <p className="text-sm text-[var(--a-danger)]">{orders.error}</p>}
                    {orders.data && all.length === 0 && <p className="text-sm text-[var(--a-muted)]">No orders yet.</p>}
                    {(orders.data?.orders.length ?? 0) > 0 && (
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
                                    {(orders.data?.orders ?? []).slice(0, 8).map((o) => (
                                        <tr key={o.id}>
                                            <td className={`${ui.td} text-[var(--a-muted)]`}>{o.id}</td>
                                            <td className={ui.td}>{o.customer?.fullName || o.customer?.email || "Guest"}</td>
                                            <td className={ui.td}>{shortDate(String(when(o) ?? ""))}</td>
                                            <td className={`${ui.td} ${statusColour(o.status)}`}>{statusLabel(o.status)}</td>
                                            <td className={`${ui.td} text-right`}>{money(o.totals?.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section className={ui.card}>
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--a-text)]">
                        <span className="text-[var(--a-danger)]" aria-hidden="true">⚠</span> Priority Alerts
                    </h2>
                    <div className="space-y-3">
                        {loading && <p className="text-sm text-[var(--a-muted)]">Loading…</p>}
                        {!loading && alerts.length === 0 && (
                            <p className="rounded-sm border border-[var(--a-border)] bg-[var(--a-inset)] p-3 text-sm text-[var(--a-muted)]">Nothing needs attention right now.</p>
                        )}
                        {alerts.slice(0, 6).map((a, i) => (
                            <div key={i} className="rounded-sm border border-[var(--a-border)] bg-[var(--a-inset)] p-3">
                                <p className={`text-sm font-semibold ${a.danger ? "text-[var(--a-danger)]" : "text-[var(--a-gold)]"}`}>{a.title}</p>
                                <p className="mt-1 text-xs text-[var(--a-text-2)]">{a.text}</p>
                                <Link href={a.href} className="mt-1 inline-block text-xs font-semibold text-[var(--a-gold)] underline">Review</Link>
                            </div>
                        ))}
                        {alerts.length > 6 && <p className="text-xs text-[var(--a-muted)]">and {alerts.length - 6} more</p>}
                    </div>
                </section>
            </div>
        </div>
    );
}
