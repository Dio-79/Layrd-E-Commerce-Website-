'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ui, statusClass, showPlaceholder } from '../adminStyles';

type BundleRow = {
    id: string;
    name: string;
    imageUrl: string;
    type: string;
    basePrice: number;
    msrp: number;
    status: "In Stock" | "Hidden" | "Low Stock";
    stock?: number;
};

const bundles: BundleRow[] = [
    { id: "#BD-1", name: "Espresso Bundle", imageUrl: "/images/Espresso bundle.jpg", type: "Coffee", basePrice: 14, msrp: 16, status: "In Stock", stock: 35 },
    { id: "#BD-2", name: "Bundle of 6", imageUrl: "/images/Bundle of 6.jpg", type: "Cakes", basePrice: 44, msrp: 48, status: "Hidden" },
    { id: "#BD-3", name: "Classic Bundle", imageUrl: "/images/classic bundle.jpg", type: "Cakes", basePrice: 30, msrp: 32, status: "In Stock", stock: 35 },
];

export default function BundlesPage() {
    const [query, setQuery] = useState("");

    const visible = bundles.filter(
        (b) =>
            b.name.toLowerCase().includes(query.toLowerCase()) ||
            b.id.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className={ui.page}>
            <div className={ui.pageHeader}>
                <div>
                    <h1 className={ui.h1}>Bundles</h1>
                    <p className={ui.subtitle}>Create and manage product collections and pricing tiers</p>
                </div>
                <Link href="/admin/editbundles" className={ui.btn}>+ New Bundle</Link>
            </div>

            {/* Top cards */}
            <div className="grid gap-4 sm:grid-cols-2">
                <div className={ui.card}>
                    <div className="flex items-center justify-between">
                        <p className={ui.eyebrow}>Next Drop</p>
                        <span className="rounded-full bg-[var(--a-gold)]/15 px-2.5 py-1 text-xs font-semibold text-[var(--a-gold)]">PENDING</span>
                    </div>
                    <h3 className="mt-2 text-lg font-bold">Pistachio Tiramisu</h3>
                    <p className="text-sm text-[var(--a-muted)]">Saturday, Aug. 01, 2026 - 12:00 AM</p>
                </div>
                <div className={ui.card}>
                    <p className={ui.eyebrow}>Scheduling Queue</p>
                    <h3 className="mt-2 text-lg font-bold">3 Upcoming Releases</h3>
                    <Link href="/admin/releasemanagment" className="text-sm font-semibold text-[var(--a-gold)] hover:underline">View Calendar</Link>
                </div>
            </div>

            {/* Table */}
            <div className={ui.card}>
                <input
                    className={`${ui.input} mb-4 mt-0 max-w-sm`}
                    placeholder="Filter Product ID, Name..."
                    aria-label="Filter bundles"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />

                <div className={ui.tableWrap}>
                    <table className={ui.table}>
                        <thead>
                            <tr>
                                <th className={ui.th}><input type="checkbox" className={ui.checkbox} aria-label="Select all" /></th>
                                <th className={ui.th}>ID</th>
                                <th className={ui.th}>Product Name</th>
                                <th className={ui.th}>Type</th>
                                <th className={ui.th}>Base Price</th>
                                <th className={ui.th}>MSRP</th>
                                <th className={ui.th}>Status</th>
                                <th className={ui.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map((bundle) => (
                                <tr key={bundle.id} className="hover:bg-[var(--a-hover)]">
                                    <td className={ui.td}><input type="checkbox" className={ui.checkbox} aria-label={`Select ${bundle.name}`} /></td>
                                    <td className={`${ui.td} text-[var(--a-muted)]`}>{bundle.id}</td>
                                    <td className={ui.td}>
                                        <div className="flex items-center gap-3 font-semibold">
                                            <img src={bundle.imageUrl} alt={bundle.name} className={ui.thumb} onError={showPlaceholder} />
                                            <span>{bundle.name}</span>
                                        </div>
                                    </td>
                                    <td className={ui.td}>{bundle.type}</td>
                                    <td className={`${ui.td} font-semibold`}>${bundle.basePrice.toFixed(2)}</td>
                                    <td className={`${ui.td} text-[var(--a-faint)]`}><s>${bundle.msrp.toFixed(2)}</s></td>
                                    <td className={ui.td}>
                                        <span className={statusClass(bundle.status)}>
                                            {bundle.status === "In Stock"
                                                ? `${bundle.stock} IN STOCK`
                                                : bundle.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className={ui.td}>
                                        <Link href="/admin/editbundles" className={ui.btnSmall}>Edit</Link>
                                    </td>
                                </tr>
                            ))}
                            {visible.length === 0 && (
                                <tr><td colSpan={8} className={`${ui.td} py-8 text-center text-[var(--a-muted)]`}>No bundles match your search.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
