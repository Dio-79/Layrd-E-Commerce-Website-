'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ui, statusClass, showPlaceholder } from '../adminStyles';
import { money, stockStatus, useApi, type AdminProduct } from '../adminApi';

// Bundles are products in the "Bundles" category, live from Firestore.
export default function BundlesPage() {
    const { data, error, loading } = useApi<{ products: AdminProduct[] }>("/api/products?all=1");
    const [query, setQuery] = useState("");

    const bundles = useMemo(() => (data?.products ?? []).filter((p) => (p.categories ?? []).includes("Bundles")), [data]);
    const visible = bundles.filter((b) => `${b.name} ${b.productID}`.toLowerCase().includes(query.toLowerCase()));

    return (
        <div className={ui.page}>
            <div className={ui.pageHeader}>
                <div>
                    <h1 className={ui.h1}>Bundles</h1>
                    <p className={ui.subtitle}>Create and manage product collections and pricing tiers</p>
                </div>
                <Link href="/admin/editbundles" className={ui.btn}>+ Create New Bundle</Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <div className={ui.card}>
                    <p className={ui.eyebrow}>Bundles</p>
                    <h3 className="mt-2 text-2xl font-semibold">{loading ? "…" : bundles.length}</h3>
                </div>
                <div className={ui.card}>
                    <p className={ui.eyebrow}>Visible in shop</p>
                    <h3 className="mt-2 text-2xl font-semibold">{loading ? "…" : bundles.filter((b) => !b.hidden).length}</h3>
                </div>
                <div className={ui.card}>
                    <p className={ui.eyebrow}>Mix &amp; match builder</p>
                    <Link href="/Bundle" className="mt-2 inline-block text-sm font-semibold text-[var(--a-gold)] hover:underline">Open the customer builder</Link>
                </div>
            </div>

            <div className={ui.card}>
                <input className={`${ui.input} mb-4 mt-0 max-w-sm`} placeholder="Filter Product ID, Name..." aria-label="Filter bundles"
                    value={query} onChange={(e) => setQuery(e.target.value)} />
                {loading && <p className="text-sm text-[var(--a-muted)]">Loading bundles from Firebase…</p>}
                {error && <p className="text-sm text-[var(--a-danger)]">{error}</p>}
                {data && (
                    <div className={ui.tableWrap}>
                        <table className={ui.table}>
                            <thead>
                                <tr>
                                    <th className={ui.th}>ID</th>
                                    <th className={ui.th}>Product Name</th>
                                    <th className={ui.th}>Contents</th>
                                    <th className={ui.th}>Base Price</th>
                                    <th className={ui.th}>MSRP</th>
                                    <th className={ui.th}>Status</th>
                                    <th className={ui.th}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visible.map((b) => {
                                    const status = stockStatus(b);
                                    return (
                                        <tr key={b.productID} className="hover:bg-[var(--a-hover)]">
                                            <td className={`${ui.td} text-[var(--a-muted)]`}>#{b.productID}</td>
                                            <td className={ui.td}>
                                                <div className="flex items-center gap-3 font-semibold">
                                                    <img src={b.imageUrl || "/missing.jpg"} alt={b.name} className={ui.thumb} onError={showPlaceholder} />
                                                    <span>{b.name}</span>
                                                </div>
                                            </td>
                                            <td className={`${ui.td} text-xs`}>{b.contents?.length ? b.contents.map((c) => `${c.quantity}× ${c.name}`).join(", ") : "—"}</td>
                                            <td className={`${ui.td} font-semibold`}>{money(b.price)}</td>
                                            <td className={`${ui.td} text-[var(--a-faint)]`}>{b.compareAt ? <s>{money(b.compareAt)}</s> : "—"}</td>
                                            <td className={ui.td}>
                                                <span className={statusClass(status)}>{status === "In Stock" && typeof b.stock === "number" ? `${b.stock} IN STOCK` : status.toUpperCase()}</span>
                                            </td>
                                            <td className={ui.td}><Link href={`/admin/editbundles?id=${b.productID}`} className={ui.btnSmall}>Edit</Link></td>
                                        </tr>
                                    );
                                })}
                                {visible.length === 0 && (
                                    <tr><td colSpan={7} className={`${ui.td} py-8 text-center text-[var(--a-muted)]`}>No bundles yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
