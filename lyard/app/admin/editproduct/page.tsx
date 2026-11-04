'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CATEGORIES } from '@/lib/catelog/data';
import { getSizes } from '@/lib/catelog/dataSize';
import { ui, showPlaceholder } from '../adminStyles';
import { api, send, type AdminProduct } from '../adminApi';

// /admin/editproduct?id=4 edits product 4; /admin/editproduct with no id adds a new one.
// Saves to Firestore through /api/admin/products (FR-13, FR-14).

/* ---------- Reusable tag editor (used for Product Tags AND Allergens) ---------- */

function TagEditor({ tags, setTags, placeholder }: { tags: string[]; setTags: (tags: string[]) => void; placeholder: string }) {
    const [newTag, setNewTag] = useState("");

    function addTag() {
        const trimmed = newTag.trim();
        if (!trimmed || tags.includes(trimmed)) return;
        setTags([...tags, trimmed]);
        setNewTag("");
    }

    return (
        <div>
            <div className="flex gap-2">
                <input className={`${ui.input} mt-0`} placeholder={placeholder} value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} />
                <button type="button" className={ui.btnOutline} onClick={addTag}>ADD</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
                {tags.map((tag) => (
                    <span key={tag} className={ui.tag}>
                        {tag}
                        <button type="button" aria-label={`Remove ${tag}`} className="ml-1 text-[var(--a-gold)] hover:text-[var(--a-text)]"
                            onClick={() => setTags(tags.filter((t) => t !== tag))}>×</button>
                    </span>
                ))}
                {tags.length === 0 && <span className="text-xs text-[var(--a-faint)]">None yet</span>}
            </div>
        </div>
    );
}

function Toggle({ checked, onChange, title, help }: { checked: boolean; onChange: () => void; title: string; help?: string }) {
    return (
        <label className={ui.checkRow}>
            <input type="checkbox" className={ui.checkbox} checked={checked} onChange={onChange} />
            <span>
                <span className="block text-sm font-semibold">{title}</span>
                {help && <span className="block text-xs text-[var(--a-muted)]">{help}</span>}
            </span>
        </label>
    );
}

const EMPTY: AdminProduct = { productID: 0, name: "", price: 0, description: "", imageUrl: "", categories: ["Cakes"] };

/* ---------- The page ---------- */

export default function EditProductPage() {
    const router = useRouter();
    const [id, setId] = useState<number | null>(null);
    const [p, setP] = useState<AdminProduct>(EMPTY);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

    // Which product: read ?id= once in the browser.
    useEffect(() => {
        const raw = new URLSearchParams(window.location.search).get("id");
        const wanted = raw ? Number(raw) : null;
        if (!wanted) {
            setLoading(false);
            return;
        }
        api<{ products: AdminProduct[] }>("/api/products?all=1")
            .then(({ products }) => {
                const found = products.find((x) => x.productID === wanted);
                if (found) {
                    setId(wanted);
                    setP(found);
                } else setMessage({ ok: false, text: `Product #${wanted} isn't in Firestore.` });
            })
            .catch((e: Error) => setMessage({ ok: false, text: e.message }))
            .finally(() => setLoading(false));
    }, []);

    const set = <K extends keyof AdminProduct>(key: K, value: AdminProduct[K]) => setP((old) => ({ ...old, [key]: value }));
    const sizes = id ? getSizes(id) : undefined;
    const tracking = p.trackStock !== false && typeof p.stock === "number";

    async function handleSave() {
        setSaving(true);
        setMessage(null);
        const payload = {
            name: p.name,
            description: p.description ?? "",
            price: Number(p.price),
            category: p.categories?.[0],
            imageUrl: p.imageUrl ?? "",
            tag: p.tag ?? "",
            flavors: p.flavors ?? [],
            allergens: p.allergens ?? [],
            tags: p.tags ?? [],
            sweetness: p.sweetness ?? 3,
            shelf: p.shelf ?? "Refrigeration Required",
            trackStock: tracking,
            ...(tracking ? { stock: Number(p.stock ?? 0), lowStockAt: Number(p.lowStockAt ?? 10) } : {}),
            hidden: Boolean(p.hidden),
            featured: Boolean(p.featured),
            limited: Boolean(p.limited),
            limitedUntil: p.limited ? (p.limitedUntil ?? "") : "",
        };
        try {
            if (id) {
                await send("/api/admin/products", "PATCH", { productID: id, ...payload });
                setMessage({ ok: true, text: "Saved. The shop shows the change on its next page load." });
            } else {
                const res = await send("/api/admin/products", "POST", payload);
                const newId = Number(res.productID);
                setId(newId);
                router.replace(`/admin/editproduct?id=${newId}`);
                setMessage({ ok: true, text: `Product #${newId} added.` });
            }
        } catch (e) {
            setMessage({ ok: false, text: (e as Error).message });
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!id || !window.confirm(`Remove "${p.name}" from the storefront for good? Hiding it (untick Visible to Public) can be undone; this can't.`)) return;
        try {
            await send(`/api/admin/products?id=${id}`, "DELETE");
            router.push("/admin/productmanagement");
        } catch (e) {
            setMessage({ ok: false, text: (e as Error).message });
        }
    }

    if (loading) return <p className="text-sm text-[var(--a-muted)]">Loading product…</p>;

    return (
        <div className={ui.page}>
            {/* Header */}
            <div className={ui.pageHeader}>
                <div>
                    <p className={ui.breadcrumb}>
                        <Link href="/admin/productmanagement" className={ui.breadcrumbLink}>Products</Link> &gt; {id ? "Edit Product" : "New Product"}
                    </p>
                    <h1 className={ui.h1}>{p.name || "New product"}</h1>
                </div>
                <div className="flex gap-2">
                    {id && <button type="button" className={ui.btnDanger} onClick={handleDelete}>Delete</button>}
                    <button type="button" className={ui.btn} onClick={handleSave} disabled={saving}>{saving ? "SAVING…" : "SAVE CHANGES"}</button>
                </div>
            </div>
            {message && <p role="status" className={`text-sm ${message.ok ? "text-[var(--a-gold)]" : "text-[var(--a-danger)]"}`}>{message.text}</p>}

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                {/* ---------- Left column ---------- */}
                <div className="min-w-0 space-y-5">
                    <section className={`${ui.card} space-y-4`}>
                        <h2 className={ui.h2}>Basic Information</h2>
                        <label className={ui.label}>
                            Product Name
                            <input className={ui.input} value={p.name} onChange={(e) => set("name", e.target.value)} />
                        </label>
                        <label className={ui.label}>
                            Description
                            <textarea rows={4} className={ui.input} value={p.description ?? ""} onChange={(e) => set("description", e.target.value)} />
                        </label>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <label className={ui.label}>
                                Product ID
                                <input className={`${ui.input} opacity-70`} value={id ? `#${id}` : "Assigned on save"} readOnly />
                            </label>
                            <label className={ui.label}>
                                Category
                                <select className={ui.input} value={p.categories?.[0] ?? "Cakes"} onChange={(e) => set("categories", [e.target.value])}>
                                    {[...new Set([...CATEGORIES, ...(p.categories ?? [])])].map((c) => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </label>
                            <label className={ui.label}>
                                Badge (optional)
                                <input className={ui.input} value={p.tag ?? ""} placeholder="e.g. NEW" onChange={(e) => set("tag", e.target.value)} />
                            </label>
                        </div>
                    </section>

                    <section className={ui.card}>
                        <h2 className={ui.h2}>Pricing &amp; Inventory</h2>
                        <label className={`${ui.label} max-w-xs`}>
                            Base price ($)
                            <input className={ui.input} inputMode="decimal" value={String(p.price ?? "")} onChange={(e) => set("price", e.target.value as unknown as number)} />
                        </label>

                        <h3 className={ui.h3}>Size &amp; Pricing</h3>
                        {sizes && sizes.length > 0 ? (
                            <div className={ui.tableWrap}>
                                <table className={`${ui.table} min-w-[360px]`}>
                                    <thead><tr><th className={ui.th}>Size</th><th className={ui.th}>Price</th></tr></thead>
                                    <tbody>
                                        {sizes.map((s) => (
                                            <tr key={s.label}><td className={`${ui.td} font-semibold capitalize`}>{s.label}</td><td className={ui.td}>${s.price.toFixed(2)}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-sm text-[var(--a-muted)]">One size, at the base price.</p>
                        )}
                        <p className="mt-2 text-xs text-[var(--a-faint)]">Size prices come from lib/catelog/dataSize.ts, so checkout and the server always agree on them.</p>

                        <h3 className={ui.h3}>Stock Management</h3>
                        <Toggle checked={tracking} title="Track Quantity" help="Orders take units off the count, and the dashboard warns at the low-stock level."
                            onChange={() => setP((old) => ({ ...old, trackStock: !tracking, stock: !tracking ? (old.stock ?? 0) : old.stock }))} />
                        {tracking && (
                            <div className="mt-3 grid gap-4 sm:grid-cols-2">
                                <label className={ui.label}>
                                    Available Quantity
                                    <input className={ui.input} inputMode="numeric" value={String(p.stock ?? 0)} onChange={(e) => set("stock", e.target.value as unknown as number)} />
                                </label>
                                <label className={ui.label}>
                                    Low Stock Alert
                                    <input className={ui.input} inputMode="numeric" value={String(p.lowStockAt ?? 10)} onChange={(e) => set("lowStockAt", e.target.value as unknown as number)} />
                                </label>
                            </div>
                        )}
                    </section>

                    <section className={`${ui.card} space-y-4`}>
                        <h2 className={ui.h2}>Culinary Attributes</h2>
                        <div>
                            <p className={`${ui.label} mb-1`}>Flavor Profile</p>
                            <TagEditor tags={p.flavors ?? []} setTags={(t) => set("flavors", t)} placeholder="e.g. Fruity" />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <p className={ui.label}>Sweetness Level <span className="normal-case text-[var(--a-text-2)]">· {p.sweetness ?? 3} / 5</span></p>
                                <div className="mt-2 flex gap-1.5">
                                    {[1, 2, 3, 4, 5].map((level) => (
                                        <button key={level} type="button" aria-label={`Sweetness ${level}`} aria-pressed={level <= (p.sweetness ?? 3)}
                                            onClick={() => set("sweetness", level)}
                                            className={`h-8 w-8 rounded-md border ${level <= (p.sweetness ?? 3) ? "border-[var(--a-gold)] bg-[var(--a-gold)]" : "border-[var(--a-strong)] bg-transparent hover:bg-[var(--a-gold)]/10"}`} />
                                    ))}
                                </div>
                            </div>
                            <label className={ui.label}>
                                Shelf Stable
                                <select className={ui.input} value={p.shelf ?? "Refrigeration Required"} onChange={(e) => set("shelf", e.target.value)}>
                                    <option>Shelf Stable</option>
                                    <option>Refrigeration Required</option>
                                </select>
                            </label>
                        </div>
                        <div>
                            <p className={`${ui.label} mb-1`}>Allergens</p>
                            <TagEditor tags={p.allergens ?? []} setTags={(t) => set("allergens", t)} placeholder="e.g. Dairy" />
                        </div>
                    </section>
                </div>

                {/* ---------- Right column ---------- */}
                <div className="space-y-5">
                    <section className={ui.card}>
                        <h2 className={ui.h2}>Media</h2>
                        <img src={p.imageUrl || "/missing.jpg"} alt={p.name} className="aspect-square w-full rounded-lg object-cover" onError={showPlaceholder} />
                        <label className={`${ui.label} mt-3`}>
                            Photo path
                            <input className={ui.input} value={p.imageUrl ?? ""} placeholder="/images/fruit salad.jpg" onChange={(e) => set("imageUrl", e.target.value)} />
                        </label>
                        <p className="mt-1 text-xs text-[var(--a-faint)]">Put the photo in public/images, then enter its path here.</p>
                    </section>

                    <section className={ui.card}>
                        <h2 className={ui.h2}>Visibility</h2>
                        <div className="space-y-1">
                            <Toggle checked={!p.hidden} onChange={() => set("hidden", !p.hidden)} title="Visible to Public"
                                help="Untick to hide it from the shop without deleting it." />
                            <Toggle checked={Boolean(p.featured)} onChange={() => set("featured", !p.featured)} title="Highlight on Home Page"
                                help={'Shows it first in "Our Featured Collection".'} />
                            <Toggle checked={Boolean(p.limited)} onChange={() => set("limited", !p.limited)} title="Limited Edition"
                                help="Adds the Limited indicator and an end date." />
                        </div>
                        {p.limited && (
                            <label className={`${ui.label} mt-3`}>
                                Limited End Date
                                <input type="date" className={ui.input} value={p.limitedUntil ?? ""} onChange={(e) => set("limitedUntil", e.target.value)} />
                            </label>
                        )}
                    </section>

                    <section className={ui.card}>
                        <h2 className={ui.h2}>Product Tags</h2>
                        <TagEditor tags={p.tags ?? []} setTags={(t) => set("tags", t)} placeholder="Add a tag..." />
                    </section>
                </div>
            </div>
        </div>
    );
}
