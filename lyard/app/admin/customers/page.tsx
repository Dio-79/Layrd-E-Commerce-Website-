'use client';

import { useState } from 'react';
import { ui } from '../adminStyles';
import { money, send, shortDate, useApi } from '../adminApi';
import { useAuth } from '@/app/context/AuthContext';

// Customers (Figma "Customers"): retail and wholesale accounts, wholesale
// applications to approve (FR-18), role changes and deactivation.
type Account = {
    id: string;
    email: string;
    name: string;
    role: string;
    active: boolean;
    createdAt: string;
    newsletter: boolean;
    orders: number;
    spent: number;
    lastOrderAt: string;
    wholesaleApplication: { status?: string; businessName?: string; contactName?: string; phone?: string; message?: string; appliedAt?: string } | null;
};

function Stat({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-md border border-[var(--a-border)] bg-[var(--a-card)] p-4 shadow-md shadow-black/20">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--a-text-2)]">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--a-text)]">{value}</p>
        </div>
    );
}

export default function CustomersPage() {
    const { user } = useAuth();
    const { data, error, loading, reload } = useApi<{ users: Account[]; newsletterSubscribers: number }>("/api/admin/users");
    const [query, setQuery] = useState("");
    const [type, setType] = useState("all");
    const [message, setMessage] = useState("");

    const accounts = data?.users ?? [];
    const buyers = accounts.filter((a) => a.orders > 0);
    const average = buyers.length ? buyers.reduce((s, a) => s + a.spent, 0) / buyers.length : 0;
    const applications = accounts.filter((a) => a.wholesaleApplication?.status === "pending");
    const shown = accounts.filter(
        (a) => `${a.name} ${a.email} ${a.id}`.toLowerCase().includes(query.toLowerCase()) && (type === "all" || a.role === type)
    );

    async function patch(id: string, change: Record<string, unknown>, done: string) {
        setMessage("");
        try {
            await send("/api/admin/users", "PATCH", { id, ...change });
            setMessage(done);
            reload();
        } catch (e) {
            setMessage((e as Error).message);
        }
    }

    return (
        <div className={ui.page}>
            <div>
                <h1 className={ui.h1}>Customers</h1>
                <p className={ui.subtitle}>Retail and wholesale accounts. Changes take effect the next time the person loads a page.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Stat label="Newsletter subscribers" value={loading ? "…" : data?.newsletterSubscribers ?? 0} />
                <Stat label="Average spending" value={loading ? "…" : money(average)} />
                <Stat label="New customers (7 days)" value={loading ? "…" : accounts.filter((a) => Date.now() - Date.parse(a.createdAt) < 7 * 864e5).length} />
                <Stat label="Active wholesale" value={loading ? "…" : accounts.filter((a) => a.role === "wholesale" && a.active).length} />
            </div>

            {applications.length > 0 && (
                <section className={ui.card}>
                    <h2 className={ui.h2}>Wholesale applications</h2>
                    <div className="space-y-3">
                        {applications.map((a) => (
                            <div key={a.id} className="flex flex-wrap items-start justify-between gap-3 rounded-sm border border-[var(--a-border)] bg-[var(--a-inset)] p-3">
                                <div className="text-sm">
                                    <p className="font-semibold">{a.wholesaleApplication?.businessName || "Business"} <span className="font-normal text-[var(--a-muted)]">· {a.wholesaleApplication?.contactName || a.name} · {a.email}</span></p>
                                    {a.wholesaleApplication?.phone && <p className="text-xs text-[var(--a-muted)]">{a.wholesaleApplication.phone}</p>}
                                    {a.wholesaleApplication?.message && <p className="mt-1 text-xs text-[var(--a-text-2)]">{a.wholesaleApplication.message}</p>}
                                    <p className="mt-1 text-xs text-[var(--a-faint)]">Applied {shortDate(a.wholesaleApplication?.appliedAt)}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button type="button" className={ui.btn} onClick={() => patch(a.id, { wholesale: "approved" }, `${a.email} is now a wholesale account.`)}>Approve</button>
                                    <button type="button" className={ui.btnDanger} onClick={() => patch(a.id, { wholesale: "denied" }, `Application from ${a.email} denied.`)}>Deny</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <section className={ui.card}>
                <div className="mb-4 flex flex-wrap gap-2">
                    <input className={`${ui.input} mt-0 max-w-xs`} placeholder="Search name, email or ID" aria-label="Search customers"
                        value={query} onChange={(e) => setQuery(e.target.value)} />
                    <select className={`${ui.input} mt-0 max-w-44`} value={type} onChange={(e) => setType(e.target.value)} aria-label="Account type">
                        <option value="all">All accounts</option>
                        <option value="customer">Retail</option>
                        <option value="wholesale">Wholesale</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                {message && <p role="status" className="mb-3 text-sm text-[var(--a-gold)]">{message}</p>}
                {loading && <p className="text-sm text-[var(--a-muted)]">Loading customers…</p>}
                {error && <p className="text-sm text-[var(--a-danger)]">{error}</p>}
                {data && (
                    <div className={ui.tableWrap}>
                        <table className={ui.table}>
                            <thead>
                                <tr>
                                    <th className={ui.th}>Name</th>
                                    <th className={ui.th}>Contact</th>
                                    <th className={`${ui.th} text-right`}>Orders</th>
                                    <th className={`${ui.th} text-right`}>Total Spent</th>
                                    <th className={ui.th}>Type</th>
                                    <th className={ui.th}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shown.map((a) => {
                                    const me = a.email === user?.email;
                                    return (
                                        <tr key={a.id} className={`hover:bg-[var(--a-hover)] ${a.active ? "" : "opacity-60"}`}>
                                            <td className={ui.td}>
                                                <span className="font-semibold">{a.name || "—"}</span>
                                                <span className="block text-xs text-[var(--a-faint)]">since {shortDate(a.createdAt)}</span>
                                            </td>
                                            <td className={ui.td}>
                                                {a.email}
                                                {a.newsletter && <span className="ml-2 rounded-sm border border-[var(--a-gold)] px-1 text-[10px] text-[var(--a-gold)]">NEWSLETTER</span>}
                                            </td>
                                            <td className={`${ui.td} text-right`}>{a.orders}</td>
                                            <td className={`${ui.td} text-right`}>{money(a.spent)}</td>
                                            <td className={ui.td}>
                                                <select className={`${ui.smallInput} w-32`} aria-label={`Account type of ${a.email}`} value={a.role} disabled={me}
                                                    onChange={(e) => patch(a.id, { role: e.target.value }, `${a.email} is now ${e.target.value}.`)}>
                                                    <option value="customer">Retail</option>
                                                    <option value="wholesale">Wholesale</option>
                                                    <option value="admin">Admin</option>
                                                    {a.role === "user" && <option value="user">User</option>}
                                                </select>
                                            </td>
                                            <td className={ui.td}>
                                                {me ? (
                                                    <span className="text-xs text-[var(--a-faint)]">You</span>
                                                ) : a.active ? (
                                                    <button type="button" className={ui.btnDanger}
                                                        onClick={() => window.confirm(`Deactivate ${a.email}? They'll be signed out and can't log in until you reactivate them.`) &&
                                                            patch(a.id, { active: false }, `${a.email} deactivated.`)}>
                                                        Deactivate
                                                    </button>
                                                ) : (
                                                    <button type="button" className={ui.btnSmall} onClick={() => patch(a.id, { active: true }, `${a.email} reactivated.`)}>Reactivate</button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {shown.length === 0 && <tr><td colSpan={6} className={`${ui.td} py-8 text-center text-[var(--a-muted)]`}>No accounts match.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
