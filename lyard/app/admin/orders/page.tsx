'use client';

import { useState } from 'react';
import { ui } from '../adminStyles';
import { money, send, shortDate, useApi } from '../adminApi';
import { ORDER_STATUSES, statusLabel } from '@/lib/Order/statuses';

// Orders hub (FR-15): shop orders, event and bundle preorders, and refund requests.
type Row = Record<string, unknown> & {
    id: string;
    status?: string;
    customer?: { email?: string; fullName?: string; name?: string };
    totals?: { total?: number };
    pricing?: { total?: number };
    lines?: { name: string; quantity: number; size?: string }[];
    delivery?: { method?: string };
};
type Data = { orders: Row[]; bundlePreorders: Row[]; eventPreorders: Row[]; refunds: Row[] };

const PREORDER_STATUSES = ["requested", "confirmed", "in_production", "ready", "picked_up", "cancelled"];
const TABS = ["Shop orders", "Event orders", "Bundle preorders", "Refund requests"] as const;
type Tab = (typeof TABS)[number];

const who = (r: Row) => r.customer?.fullName || r.customer?.name || r.customer?.email || String(r.email ?? "Guest");
const totalOf = (r: Row) => r.totals?.total ?? r.pricing?.total ?? (typeof r.total === "number" ? r.total : undefined);
const isOpen = (s?: string) => !["delivered", "picked_up", "cancelled"].includes(s ?? "");

function Stat({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-md border border-[var(--a-border)] bg-[var(--a-card)] p-4 shadow-md shadow-black/20">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--a-text-2)]">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--a-text)]">{value}</p>
        </div>
    );
}

export default function AdminOrdersPage() {
    const { data, error, loading, reload } = useApi<Data>("/api/admin/orders");
    const [tab, setTab] = useState<Tab>("Shop orders");
    const [query, setQuery] = useState("");
    const [openOnly, setOpenOnly] = useState(false);
    const [message, setMessage] = useState("");
    const [busy, setBusy] = useState<string | null>(null);

    async function change(kind: "order" | "event" | "bundle" | "refund", id: string, status: string) {
        setBusy(id);
        setMessage("");
        try {
            if (kind === "order" || kind === "refund") await send("/api/admin/orders", "PATCH", { kind, id, status });
            else await send(kind === "event" ? "/api/event-preorders" : "/api/bundle-preorders", "PATCH", { reference: id, status });
            setMessage(`${id}: ${statusLabel(status)}`);
            reload();
        } catch (e) {
            setMessage((e as Error).message);
        } finally {
            setBusy(null);
        }
    }

    const orders = data?.orders ?? [];
    const revenue = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + (totalOf(o) ?? 0), 0);
    const pendingRefunds = (data?.refunds ?? []).filter((r) => r.status === "pending").length;

    const list: Row[] =
        tab === "Shop orders" ? orders : tab === "Event orders" ? data?.eventPreorders ?? [] : tab === "Bundle preorders" ? data?.bundlePreorders ?? [] : data?.refunds ?? [];
    const shown = list.filter(
        (r) =>
            `${r.id} ${who(r)}`.toLowerCase().includes(query.toLowerCase()) &&
            (!openOnly || (tab === "Refund requests" ? r.status === "pending" : isOpen(r.status)))
    );
    const kind = tab === "Shop orders" ? "order" : tab === "Event orders" ? "event" : tab === "Bundle preorders" ? "bundle" : "refund";
    const statuses = kind === "order" ? [...ORDER_STATUSES] : kind === "refund" ? ["pending", "approved", "denied"] : PREORDER_STATUSES;

    return (
        <div className={ui.page}>
            <div>
                <h1 className={ui.h1}>Orders</h1>
                <p className={ui.subtitle}>Every order, preorder and refund request. Changing a status updates the customer&apos;s order page.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Stat label="Revenue" value={loading ? "…" : money(revenue)} />
                <Stat label="Shop orders" value={loading ? "…" : orders.length} />
                <Stat label="Open orders" value={loading ? "…" : orders.filter((o) => isOpen(o.status)).length} />
                <Stat label="Refunds to review" value={loading ? "…" : pendingRefunds} />
            </div>

            <div className={ui.card}>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                    {TABS.map((t) => (
                        <button key={t} type="button" onClick={() => setTab(t)}
                            className={`rounded-sm px-3 py-1.5 text-sm font-semibold ${tab === t ? "bg-[var(--a-gold)] text-black" : "text-[var(--a-text-2)] hover:bg-[var(--a-hover)]"}`}>
                            {t}
                            {t === "Refund requests" && pendingRefunds > 0 && <span className="ml-1 rounded-full bg-[var(--a-danger)] px-1.5 text-[10px] text-white">{pendingRefunds}</span>}
                        </button>
                    ))}
                    <label className="ml-auto flex items-center gap-2 text-sm text-[var(--a-text-2)]">
                        <input type="checkbox" className={ui.checkbox} checked={openOnly} onChange={() => setOpenOnly(!openOnly)} />
                        {tab === "Refund requests" ? "Pending only" : "Open only"}
                    </label>
                    <input className={`${ui.input} mt-0 max-w-60`} placeholder="Search order or customer" aria-label="Search orders"
                        value={query} onChange={(e) => setQuery(e.target.value)} />
                </div>
                {message && <p role="status" className="mb-3 text-sm text-[var(--a-gold)]">{message}</p>}
                {loading && <p className="text-sm text-[var(--a-muted)]">Loading orders…</p>}
                {error && <p className="text-sm text-[var(--a-danger)]">{error}</p>}

                {data && (
                    <div className={ui.tableWrap}>
                        <table className={ui.table}>
                            <thead>
                                <tr>
                                    <th className={ui.th}>{kind === "refund" ? "Order" : "Order ID"}</th>
                                    <th className={ui.th}>Customer</th>
                                    <th className={ui.th}>{kind === "refund" ? "Reason" : "Items"}</th>
                                    <th className={ui.th}>Date</th>
                                    <th className={`${ui.th} text-right`}>Amount</th>
                                    <th className={ui.th}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shown.map((r) => (
                                    <tr key={r.id} className="align-top hover:bg-[var(--a-hover)]">
                                        <td className={`${ui.td} font-semibold`}>
                                            {r.id}
                                            {kind === "order" && <span className="block text-xs font-normal text-[var(--a-muted)]">{r.delivery?.method === "ship" ? "Delivery" : "Pickup"}</span>}
                                        </td>
                                        <td className={ui.td}>{who(r)}</td>
                                        <td className={`${ui.td} max-w-xs text-xs`}>
                                            {kind === "refund"
                                                ? String(r.reason ?? "")
                                                : (r.lines ?? []).map((l) => `${l.quantity}× ${l.name}${l.size ? ` (${l.size})` : ""}`).join(", ") || (typeof r.units === "number" ? `${r.units} items` : "—")}
                                        </td>
                                        <td className={ui.td}>{shortDate(String(r.placedAt ?? r.createdAt ?? r.savedAt ?? ""))}{r.pickupDate ? <span className="block text-xs text-[var(--a-muted)]">Pickup {String(r.pickupDate)}</span> : null}</td>
                                        <td className={`${ui.td} text-right`}>{money(kind === "refund" ? (r.amount as number) : totalOf(r))}</td>
                                        <td className={ui.td}>
                                            <select aria-label={`Status of ${r.id}`} disabled={busy === r.id}
                                                className={`${ui.smallInput} w-40 ${r.status === "cancelled" || r.status === "denied" ? "text-[var(--a-danger)]" : isOpen(r.status) && r.status !== "approved" ? "text-[var(--a-gold)]" : ""}`}
                                                value={r.status ?? ""} onChange={(e) => change(kind, r.id, e.target.value)}>
                                                {!statuses.includes(r.status ?? "") && <option value={r.status ?? ""}>{statusLabel(r.status)}</option>}
                                                {statuses.map((s) => <option key={s} value={s}>{kind === "refund" ? s[0].toUpperCase() + s.slice(1) : statusLabel(s)}</option>)}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                                {shown.length === 0 && <tr><td colSpan={6} className={`${ui.td} py-8 text-center text-[var(--a-muted)]`}>Nothing here yet.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
