'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ui, showPlaceholder } from '../adminStyles';
import { api, send, type AdminProduct } from '../adminApi';

// /admin/editbundles?id=9 edits bundle 9; with no id it creates a new bundle.
// A bundle is a product in the "Bundles" category, plus what's inside it.

type Item = { productID: number; name: string; quantity: number };

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

const EMPTY: AdminProduct = { productID: 0, name: "", price: 0, description: "", imageUrl: "", categories: ["Bundles"], contents: [] };

export default function EditBundlePage() {
    const router = useRouter();
    const [id, setId] = useState<number | null>(null);
    const [b, setB] = useState<AdminProduct>(EMPTY);
    const [catalog, setCatalog] = useState<AdminProduct[]>([]);
    const [pick, setPick] = useState("");
    const [tagInput, setTagInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

    useEffect(() => {
        const raw = new URLSearchParams(window.location.search).get("id");
        const wanted = raw ? Number(raw) : null;
        api<{ products: AdminProduct[] }>("/api/products?all=1")
            .then(({ products }) => {
                setCatalog(products);
                if (!wanted) return;
                const found = products.find((x) => x.productID === wanted);
                if (found) {
                    setId(wanted);
                    setB({ ...found, contents: found.contents ?? [] });
                } else setMessage({ ok: false, text: `Bundle #${wanted} isn't in Firestore.` });
            })
            .catch((e: Error) => setMessage({ ok: false, text: e.message }))
            .finally(() => setLoading(false));
    }, []);

    const set = <K extends keyof AdminProduct>(key: K, value: AdminProduct[K]) => setB((old) => ({ ...old, [key]: value }));
    const items: Item[] = b.contents ?? [];
    const setItems = (next: Item[]) => set("contents", next);
    const choices = useMemo(
        () => catalog.filter((p) => !(p.categories ?? []).includes("Bundles") && !items.some((i) => i.productID === p.productID)),
        [catalog, items]
    );
    const itemsValue = items.reduce((sum, i) => sum + (catalog.find((p) => p.productID === i.productID)?.price ?? 0) * i.quantity, 0);
    const tracking = b.trackStock !== false && typeof b.stock === "number";

    function addItem() {
        const product = catalog.find((p) => String(p.productID) === pick);
        if (!product) return;
        setItems([...items, { productID: product.productID, name: product.name, quantity: 1 }]);
        setPick("");
    }

    async function handleSave() {
        setSaving(true);
        setMessage(null);
        const payload = {
            name: b.name,
            description: b.description ?? "",
            price: Number(b.price),
            compareAt: b.compareAt ? Number(b.compareAt) : 0,
            category: "Bundles",
            imageUrl: b.imageUrl ?? "",
            contents: items,
            tags: b.tags ?? [],
            trackStock: tracking,
            ...(tracking ? { stock: Number(b.stock ?? 0), lowStockAt: Number(b.lowStockAt ?? 10) } : {}),
            hidden: Boolean(b.hidden),
            featured: Boolean(b.featured),
            limited: Boolean(b.limited),
            limitedUntil: b.limited ? (b.limitedUntil ?? "") : "",
        };
        try {
            if (id) {
                await send("/api/admin/products", "PATCH", { productID: id, ...payload });
                setMessage({ ok: true, text: "Saved." });
            } else {
                const res = await send("/api/admin/products", "POST", { ...payload, sizes: [] });
                const newId = Number(res.productID);
                setId(newId);
                router.replace(`/admin/editbundles?id=${newId}`);
                setMessage({ ok: true, text: `Bundle #${newId} added.` });
            }
        } catch (e) {
            setMessage({ ok: false, text: (e as Error).message });
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <p className="text-sm text-[var(--a-muted)]">Loading bundle…</p>;

    return (
        <div className={ui.page}>
            <div className={ui.pageHeader}>
                <div>
                    <p className={ui.breadcrumb}>
                        <Link href="/admin/bundles" className={ui.breadcrumbLink}>Bundles</Link> &gt; {id ? "Edit Bundle" : "New Bundle"}
                    </p>
                    <h1 className={ui.h1}>{b.name || "New bundle"}</h1>
                </div>
                <button type="button" className={ui.btn} onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
            </div>
            {message && <p role="status" className={`text-sm ${message.ok ? "text-[var(--a-gold)]" : "text-[var(--a-danger)]"}`}>{message.text}</p>}

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="min-w-0 space-y-5">
                    <section className={`${ui.card} space-y-4`}>
                        <h2 className={ui.h2}>Basic Information</h2>
                        <label className={ui.label}>
                            Bundle Name
                            <input className={ui.input} value={b.name} onChange={(e) => set("name", e.target.value)} />
                        </label>
                        <label className={ui.label}>
                            Description
                            <textarea rows={4} className={ui.input} value={b.description ?? ""} onChange={(e) => set("description", e.target.value)} />
                        </label>
                        <label className={`${ui.label} max-w-xs`}>
                            Product ID
                            <input className={`${ui.input} opacity-70`} value={id ? `#${id}` : "Assigned on save"} readOnly />
                        </label>
                    </section>

                    <section className={ui.card}>
                        <h2 className={ui.h2}>Bundle Contents</h2>
                        <div className="mb-4 flex flex-wrap gap-2">
                            <select className={`${ui.input} mt-0 max-w-xs`} value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Product to add">
                                <option value="">Choose a product…</option>
                                {choices.map((p) => <option key={p.productID} value={p.productID}>{p.name}</option>)}
                            </select>
                            <button type="button" className={ui.btnOutline} onClick={addItem} disabled={!pick}>+ Add Product</button>
                        </div>
                        <div className={ui.tableWrap}>
                            <table className={`${ui.table} min-w-[420px]`}>
                                <thead>
                                    <tr><th className={ui.th}>Name &amp; ID</th><th className={ui.th}>Quantity</th><th className={ui.th}></th></tr>
                                </thead>
                                <tbody>
                                    {items.map((item) => (
                                        <tr key={item.productID}>
                                            <td className={ui.td}><span className="font-semibold">{item.name}</span> <span className="text-[var(--a-muted)]">#{item.productID}</span></td>
                                            <td className={ui.td}>
                                                <div className="inline-flex items-center rounded-lg border border-[var(--a-strong)]">
                                                    <button type="button" aria-label={`Fewer ${item.name}`} className="px-3 py-1 hover:bg-[var(--a-hover)]"
                                                        onClick={() => setItems(items.map((i) => i.productID === item.productID ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))}>-</button>
                                                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                                                    <button type="button" aria-label={`More ${item.name}`} className="px-3 py-1 hover:bg-[var(--a-hover)]"
                                                        onClick={() => setItems(items.map((i) => i.productID === item.productID ? { ...i, quantity: Math.min(99, i.quantity + 1) } : i))}>+</button>
                                                </div>
                                            </td>
                                            <td className={`${ui.td} text-right`}>
                                                <button type="button" className={ui.btnDanger} onClick={() => setItems(items.filter((i) => i.productID !== item.productID))}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {items.length === 0 && <tr><td colSpan={3} className={`${ui.td} py-6 text-center text-[var(--a-muted)]`}>This bundle is empty.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                        <p className="mt-2 text-xs text-[var(--a-muted)]">Bought separately these would cost ${itemsValue.toFixed(2)}.</p>
                    </section>

                    <section className={ui.card}>
                        <h2 className={ui.h2}>Pricing &amp; Inventory</h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className={ui.label}>
                                Bundle price ($)
                                <input className={ui.input} inputMode="decimal" value={String(b.price ?? "")} onChange={(e) => set("price", e.target.value as unknown as number)} />
                            </label>
                            <label className={ui.label}>
                                Compare at / MSRP ($)
                                <input className={ui.input} inputMode="decimal" value={b.compareAt ? String(b.compareAt) : ""} placeholder={itemsValue ? itemsValue.toFixed(2) : "$--"}
                                    onChange={(e) => set("compareAt", e.target.value as unknown as number)} />
                            </label>
                        </div>
                        <h3 className={ui.h3}>Stock Management</h3>
                        <Toggle checked={tracking} title="Track Quantity"
                            onChange={() => setB((old) => ({ ...old, trackStock: !tracking, stock: !tracking ? (old.stock ?? 0) : old.stock }))} />
                        {tracking && (
                            <div className="mt-3 grid gap-4 sm:grid-cols-2">
                                <label className={ui.label}>
                                    Total Bundles Available
                                    <input className={ui.input} inputMode="numeric" value={String(b.stock ?? 0)} onChange={(e) => set("stock", e.target.value as unknown as number)} />
                                </label>
                                <label className={ui.label}>
                                    Low Stock Alert
                                    <input className={ui.input} inputMode="numeric" value={String(b.lowStockAt ?? 10)} onChange={(e) => set("lowStockAt", e.target.value as unknown as number)} />
                                </label>
                            </div>
                        )}
                    </section>
                </div>

                <div className="space-y-5">
                    <section className={ui.card}>
                        <h2 className={ui.h2}>Media</h2>
                        <img src={b.imageUrl || "/missing.jpg"} alt={b.name} className="aspect-square w-full rounded-lg object-cover" onError={showPlaceholder} />
                        <label className={`${ui.label} mt-3`}>
                            Photo path
                            <input className={ui.input} value={b.imageUrl ?? ""} placeholder="/images/classic bundle.jpg" onChange={(e) => set("imageUrl", e.target.value)} />
                        </label>
                    </section>

                    <section className={ui.card}>
                        <h2 className={ui.h2}>Visibility</h2>
                        <div className="space-y-1">
                            <Toggle checked={!b.hidden} onChange={() => set("hidden", !b.hidden)} title="Visible to Public" help="Untick to hide it from the shop." />
                            <Toggle checked={Boolean(b.featured)} onChange={() => set("featured", !b.featured)} title="Highlight on Home Page" />
                            <Toggle checked={Boolean(b.limited)} onChange={() => set("limited", !b.limited)} title="Limited Edition" />
                        </div>
                        {b.limited && (
                            <label className={`${ui.label} mt-3`}>
                                Limited End Date
                                <input type="date" className={ui.input} value={b.limitedUntil ?? ""} onChange={(e) => set("limitedUntil", e.target.value)} />
                            </label>
                        )}
                    </section>

                    <section className={ui.card}>
                        <h2 className={ui.h2}>Product Tags</h2>
                        <div className="flex gap-2">
                            <input className={`${ui.input} mt-0`} placeholder="Add a tag..." value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && tagInput.trim()) {
                                        e.preventDefault();
                                        set("tags", [...new Set([...(b.tags ?? []), tagInput.trim()])]);
                                        setTagInput("");
                                    }
                                }} />
                            <button type="button" className={ui.btnOutline} onClick={() => {
                                if (!tagInput.trim()) return;
                                set("tags", [...new Set([...(b.tags ?? []), tagInput.trim()])]);
                                setTagInput("");
                            }}>ADD</button>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {(b.tags ?? []).map((tag) => (
                                <span key={tag} className={ui.tag}>
                                    {tag}
                                    <button type="button" aria-label={`Remove ${tag}`} className="ml-1 text-[var(--a-gold)]" onClick={() => set("tags", (b.tags ?? []).filter((t) => t !== tag))}>×</button>
                                </span>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
