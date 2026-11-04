'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CATEGORIES } from '@/lib/catelog/data';
import { ui, statusClass, showPlaceholder } from '../adminStyles';
import { money, send, stockStatus, useApi, type AdminCategory, type AdminProduct, type StockStatus } from '../adminApi';

const STATUS_FILTERS = ["All Products", "In Stock", "Low Stock", "Out of Stock", "Draft"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const pill = (active: boolean) =>
    `flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
        active ? "bg-[var(--a-gold)]/15 font-semibold text-[var(--a-gold)]" : "text-[var(--a-text-2)] hover:bg-[var(--a-hover)]"
    }`;

// Live from Firestore (/api/products?all=1 includes hidden products for admins).
export default function ProductManagementPage() {
    const { data, error, loading, reload } = useApi<{ products: AdminProduct[]; categories?: AdminCategory[] }>("/api/products?all=1");
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("All Products");
    const [category, setCategory] = useState<string | null>(null);
    const [newCategory, setNewCategory] = useState("");
    const [adding, setAdding] = useState(false);
    const [message, setMessage] = useState("");

    const products = useMemo(() => data?.products ?? [], [data]);
    const rows = useMemo(() => products.map((p) => ({ ...p, status: stockStatus(p) as StockStatus })), [products]);

    // Every category: the built-in ones, ones on products, and ones made here. Visible unless hidden here.
    const categories = useMemo(() => {
        const saved = new Map((data?.categories ?? []).map((c) => [c.name, c.visible]));
        const names = new Set<string>([...CATEGORIES, ...products.flatMap((p) => p.categories ?? []), ...saved.keys()]);
        return [...names].map((name) => ({ name, visible: saved.get(name) ?? true }));
    }, [data, products]);

    const countIn = (name: string) => products.filter((p) => (p.categories ?? []).includes(name)).length;

    const visibleRows = rows.filter((row) => {
        const q = query.toLowerCase();
        const matchesQuery = row.name.toLowerCase().includes(q) || String(row.productID).includes(q);
        const matchesStatus = statusFilter === "All Products" || row.status === statusFilter;
        const matchesCategory = category === null || (row.categories ?? []).includes(category);
        return matchesQuery && matchesStatus && matchesCategory;
    });

    async function setCategoryVisible(name: string, visible: boolean) {
        try {
            await send("/api/admin/categories", "PUT", { name, visible });
            setMessage(visible ? `"${name}" is now visible in the shop.` : `"${name}" is hidden from the shop.`);
            reload();
        } catch (e) {
            setMessage((e as Error).message);
        }
    }

    async function addCategory() {
        const name = newCategory.trim();
        if (!name) return;
        await setCategoryVisible(name, false);
        setNewCategory("");
        setAdding(false);
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
                    <button type="button" className={ui.btnOutline} onClick={() => setAdding((a) => !a)}>+ Add Category</button>
                </div>
            </div>

            {adding && (
                <div className={`${ui.card} flex flex-wrap items-end gap-3`}>
                    <label className={`${ui.label} min-w-60 flex-1`}>
                        New category (starts hidden, for a future product line)
                        <input className={ui.input} value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addCategory()} placeholder="e.g. Merch" />
                    </label>
                    <button type="button" className={ui.btn} onClick={addCategory}>Create hidden category</button>
                </div>
            )}
            {message && <p role="status" className="text-sm text-[var(--a-gold)]">{message}</p>}

            <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
                {/* Left panel */}
                <aside className={`${ui.card} space-y-5 self-start`}>
                    <h2 className="text-lg font-bold">Categories</h2>

                    {[true, false].map((visibleGroup) => (
                        <div key={String(visibleGroup)}>
                            <p className={`${ui.label} mb-2`}>{visibleGroup ? "Visible" : "Hidden / Drafts"}</p>
                            {categories.filter((c) => c.visible === visibleGroup).map((c) => (
                                <div key={c.name} className="flex items-center gap-1">
                                    <button type="button" className={pill(category === c.name)} onClick={() => setCategory(category === c.name ? null : c.name)}>
                                        {c.name} <span className="text-xs text-[var(--a-muted)]">{countIn(c.name)}</span>
                                    </button>
                                    <button type="button" className={ui.btnSmall} title={c.visible ? "Hide from the shop" : "Show in the shop"}
                                        onClick={() => setCategoryVisible(c.name, !c.visible)}>
                                        {c.visible ? "Hide" : "Show"}
                                    </button>
                                </div>
                            ))}
                            {categories.every((c) => c.visible !== visibleGroup) && <p className="px-3 text-xs text-[var(--a-faint)]">None</p>}
                        </div>
                    ))}

                    <div>
                        <p className={`${ui.label} mb-2`}>Status Filter</p>
                        {STATUS_FILTERS.map((s) => (
                            <button key={s} type="button" className={pill(statusFilter === s)} onClick={() => setStatusFilter(s)}>
                                {s} {s !== "All Products" && <span className="text-xs text-[var(--a-muted)]">{rows.filter((r) => r.status === s).length}</span>}
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
                                <span className="rounded-full bg-[var(--a-gold)]/15 px-2.5 py-1 text-xs font-semibold text-[var(--a-gold)]">PENDING</span>
                            </div>
                            <h3 className="mt-2 text-lg font-bold">Pistachio Tiramisu</h3>
                            <p className="text-sm text-[var(--a-muted)]">Saturday, Aug. 01, 2026 - 12:00 AM</p>
                        </div>
                        <div className={ui.card}>
                            <p className={ui.eyebrow}>Stock Alerts</p>
                            <h3 className="mt-2 text-lg font-bold">
                                {rows.filter((r) => r.status === "Low Stock" || r.status === "Out of Stock").length} products low or out
                            </h3>
                            <button type="button" className="text-sm font-semibold text-[var(--a-gold)] hover:underline" onClick={() => setStatusFilter("Low Stock")}>
                                Show low stock
                            </button>
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

                        {loading && <p className="text-sm text-[var(--a-muted)]">Loading products from Firebase…</p>}
                        {error && <p className="text-sm text-[var(--a-danger)]">{error}</p>}
                        {data && (
                            <div className={ui.tableWrap}>
                                <table className={ui.table}>
                                    <thead>
                                        <tr>
                                            <th className={ui.th}>ID</th>
                                            <th className={ui.th}>Product Name</th>
                                            <th className={ui.th}>Type</th>
                                            <th className={ui.th}>Base Price</th>
                                            <th className={ui.th}>Stock</th>
                                            <th className={ui.th}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visibleRows.map((row) => (
                                            <tr key={row.productID} className="hover:bg-[var(--a-hover)]">
                                                <td className={`${ui.td} text-[var(--a-muted)]`}>#{row.productID}</td>
                                                <td className={ui.td}>
                                                    <Link href={`/admin/editproduct?id=${row.productID}`} className="flex items-center gap-3 font-semibold hover:underline">
                                                        <img src={row.imageUrl || "/missing.jpg"} alt={row.name} className={ui.thumb} onError={showPlaceholder} />
                                                        <span>{row.name}</span>
                                                    </Link>
                                                </td>
                                                <td className={ui.td}>{row.categories?.[0] ?? "Uncategorized"}</td>
                                                <td className={ui.td}>{money(row.price)}</td>
                                                <td className={ui.td}>{typeof row.stock === "number" && row.trackStock !== false ? row.stock : "—"}</td>
                                                <td className={ui.td}><span className={statusClass(row.status)}>{row.status}</span></td>
                                            </tr>
                                        ))}
                                        {visibleRows.length === 0 && (
                                            <tr><td colSpan={6} className={`${ui.td} py-8 text-center text-[var(--a-muted)]`}>No products match these filters.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
