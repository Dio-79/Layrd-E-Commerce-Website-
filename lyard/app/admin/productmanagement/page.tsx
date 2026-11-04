'use client';

import { useState } from 'react';
import Link from 'next/link';
import { products, CATEGORIES } from '@/lib/catelog/data';
import { ui, statusClass } from '../adminStyles';

type Status = "In Stock" | "Low Stock" | "Out of Stock" | "Draft";

const STATUS_FILTERS = ["All Products", "In Stock", "Low Stock", "Out of Stock", "Draft"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

// The shared product data has no stock info yet, so this is a stand-in.
// Anything not listed here counts as "In Stock".
const statusById: Record<number, Status> = {
    2: "Out of Stock",
    7: "Low Stock",
    11: "Draft",
};

const rows = products.map((p) => ({
    ...p,
    status: statusById[p.productID] ?? "In Stock",
}));

// How many products are in a category, visible (hidden = false) or hidden/draft (hidden = true)
function countIn(category: string, hidden: boolean) {
    return rows.filter(
        (r) => r.categories.some((c) => c === category) && (r.status === "Draft") === hidden
    ).length;
}

const pill = (active: boolean) =>
    `flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
        active ? "bg-[#e0b43a]/15 font-semibold text-[#e0b43a]" : "text-zinc-200 hover:bg-white/5"
    }`;

export default function ProductManagementPage() {
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("All Products");
    const [category, setCategory] = useState<string | null>(null);

    const visibleRows = rows.filter((row) => {
        const matchesQuery =
            row.name.toLowerCase().includes(query.toLowerCase()) ||
            String(row.productID).includes(query);
        const matchesStatus = statusFilter === "All Products" || row.status === statusFilter;
        const matchesCategory = category === null || row.categories.some((c) => c === category);
        return matchesQuery && matchesStatus && matchesCategory;
    });

    function toggleCategory(c: string) {
        setCategory(category === c ? null : c);
    }

    return (
        <div className={ui.page}>
            {/* Page header */}
            <div className={ui.pageHeader}>
                <div>
                    <h1 className={ui.h1}>Product Catalog</h1>
                    <p className={ui.subtitle}>Manage inventory, monitor stock levels, and coordinate upcoming releases.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/editproduct" className={ui.btn}>+ Add Product</Link>
                    <button type="button" className={ui.btnOutline}>+ Add Category</button>
                </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
                {/* Left panel */}
                <aside className={`${ui.card} space-y-5 self-start`}>
                    <h2 className="text-lg font-bold">Categories</h2>

                    <div>
                        <p className={`${ui.label} mb-2`}>Visible</p>
                        {CATEGORIES.map((c) => (
                            <button key={c} type="button" className={pill(category === c)} onClick={() => toggleCategory(c)}>
                                {c} <span className="text-xs text-zinc-400">{countIn(c, false)}</span>
                            </button>
                        ))}
                    </div>

                    <div>
                        <p className={`${ui.label} mb-2`}>Hidden / Drafts</p>
                        {CATEGORIES.map((c) => (
                            <button key={c} type="button" className={pill(false)} onClick={() => toggleCategory(c)}>
                                {c} <span className="text-xs text-zinc-400">{countIn(c, true)}</span>
                            </button>
                        ))}
                    </div>

                    <div>
                        <p className={`${ui.label} mb-2`}>Status Filter</p>
                        {STATUS_FILTERS.map((s) => (
                            <button key={s} type="button" className={pill(statusFilter === s)} onClick={() => setStatusFilter(s)}>
                                {s}
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Right side */}
                <div className="min-w-0 space-y-5">
                    {/* Top cards */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className={ui.card}>
                            <div className="flex items-center justify-between">
                                <p className={ui.eyebrow}>Next Drop</p>
                                <span className="rounded-full bg-[#e0b43a]/15 px-2.5 py-1 text-xs font-semibold text-[#e0b43a]">PENDING</span>
                            </div>
                            <h3 className="mt-2 text-lg font-bold">Pistachio Tiramisu</h3>
                            <p className="text-sm text-zinc-400">Saturday, Aug. 01, 2026 - 12:00 AM</p>
                        </div>
                        <div className={ui.card}>
                            <p className={ui.eyebrow}>Scheduling Queue</p>
                            <h3 className="mt-2 text-lg font-bold">3 Upcoming Releases</h3>
                            <Link href="/admin/releasemanagment" className="text-sm font-semibold text-[#e0b43a] hover:underline">View Calendar</Link>
                        </div>
                    </div>

                    {/* Product table */}
                    <div className={ui.card}>
                        <input
                            className={`${ui.input} mb-4 mt-0 max-w-sm`}
                            placeholder="Filter Product ID, Name..."
                            aria-label="Filter products"
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
                                        <th className={ui.th}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleRows.map((row) => (
                                        <tr key={row.productID} className="hover:bg-white/5">
                                            <td className={ui.td}><input type="checkbox" className={ui.checkbox} aria-label={`Select ${row.name}`} /></td>
                                            <td className={`${ui.td} text-zinc-400`}>#{row.productID}</td>
                                            <td className={ui.td}>
                                                <Link href="/admin/editproduct" className="flex items-center gap-3 font-semibold hover:underline">
                                                    <img src={row.imageUrl} alt={row.name} className={ui.thumb} />
                                                    <span>{row.name}</span>
                                                </Link>
                                            </td>
                                            <td className={ui.td}>{row.categories[0] ?? "Uncategorized"}</td>
                                            <td className={ui.td}>{row.status === "Draft" ? "--" : `$${row.price.toFixed(2)}`}</td>
                                            <td className={ui.td}><span className={statusClass(row.status)}>{row.status}</span></td>
                                        </tr>
                                    ))}
                                    {visibleRows.length === 0 && (
                                        <tr><td colSpan={6} className={`${ui.td} py-8 text-center text-zinc-400`}>No products match these filters.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
