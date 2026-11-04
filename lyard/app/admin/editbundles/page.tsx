'use client';

import { useState } from 'react';
import Link from 'next/link';
import { products, CATEGORIES } from '@/lib/catelog/data';
import { ui } from '../adminStyles';

// Starting values come from the Classic Bundle in your product data
const bundle = products.find((p) => p.productID === 9);

const initialContents = [
    { name: "Fruit Salad", id: "#CA-1", quantity: 1 },
    { name: "Tiramisu", id: "#CA-2", quantity: 1 },
    { name: "Oreo", id: "#CA-3", quantity: 1 },
    { name: "Lotus", id: "#CA-4", quantity: 1 },
];

const sizePricing = [
    { size: "Small", price: 25, compareAt: 26 },
    { size: "Standard", price: 30, compareAt: 32 },
    { size: "Large", price: 42, compareAt: 48 },
];

/* ---------- Checkbox with a title and help text ---------- */

function Toggle({ checked, onChange, title, help }: { checked: boolean; onChange: () => void; title: string; help?: string }) {
    return (
        <label className={ui.checkRow}>
            <input type="checkbox" className={ui.checkbox} checked={checked} onChange={onChange} />
            <span>
                <span className="block text-sm font-semibold">{title}</span>
                {help && <span className="block text-xs text-zinc-500">{help}</span>}
            </span>
        </label>
    );
}

export default function EditBundlePage() {
    const [name, setName] = useState(bundle?.name ?? "");
    const [description, setDescription] = useState(bundle?.description ?? "");

    const [bundleContents, setBundleContents] = useState(initialContents);

    const [visibleToPublic, setVisibleToPublic] = useState(true);
    const [highlightOnHome, setHighlightOnHome] = useState(true);
    const [limitedEdition, setLimitedEdition] = useState(false);
    const [limitedEndDate, setLimitedEndDate] = useState("2026-12-12");

    const [trackQuantity, setTrackQuantity] = useState(true);
    const [totalAvailable, setTotalAvailable] = useState("15");
    const [lowStockAlert, setLowStockAlert] = useState("10");

    const [tags, setTags] = useState(["Fruity", "Classic"]);
    const [newTag, setNewTag] = useState("");

    function addTag() {
        const trimmed = newTag.trim();
        if (!trimmed || tags.includes(trimmed)) return;
        setTags([...tags, trimmed]);
        setNewTag("");
    }

    function removeTag(tag: string) {
        setTags(tags.filter((t) => t !== tag));
    }

    // Change an item's quantity by +1 / -1 (never below 1)
    function changeQuantity(id: string, by: number) {
        setBundleContents((items) =>
            items.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, item.quantity + by) } : item))
        );
    }

    function removeItem(id: string) {
        setBundleContents((items) => items.filter((item) => item.id !== id));
    }

    function handleSave() {
        console.log({
            name, description, bundleContents, visibleToPublic, highlightOnHome,
            limitedEdition, limitedEndDate, trackQuantity,
            totalAvailable, lowStockAlert, tags,
        });
    }

    return (
        <div className={ui.page}>
            {/* Header */}
            <div className={ui.pageHeader}>
                <div>
                    <p className={ui.breadcrumb}>
                        <Link href="/admin/bundles" className={ui.breadcrumbLink}>Bundles</Link> &gt; Edit Bundle
                    </p>
                    <h1 className={ui.h1}>{name || "New bundle"}</h1>
                </div>
                <button type="button" className={ui.btn} onClick={handleSave}>Save changes</button>
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                {/* ---------- Left column ---------- */}
                <div className="min-w-0 space-y-5">
                    {/* Basic information */}
                    <section className={`${ui.card} space-y-4`}>
                        <h2 className={ui.h2}>Basic Information</h2>

                        <label className={ui.label}>
                            Product Name
                            <input className={ui.input} value={name} onChange={(e) => setName(e.target.value)} />
                        </label>

                        <label className={ui.label}>
                            Description
                            <textarea rows={4} className={ui.input} value={description} onChange={(e) => setDescription(e.target.value)} />
                        </label>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className={ui.label}>
                                Product ID
                                <input className={`${ui.input} bg-zinc-50 text-zinc-500`} value="#BD-3" readOnly />
                            </label>
                            <label className={ui.label}>
                                Category
                                <select className={ui.input} defaultValue={bundle?.categories[0]}>
                                    {CATEGORIES.map((category) => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </section>

                    {/* Bundle contents */}
                    <section className={ui.card}>
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold">Bundle Contents</h2>
                            <button type="button" className={ui.btnOutline}>+ Add Product</button>
                        </div>
                        <div className={ui.tableWrap}>
                            <table className={`${ui.table} min-w-[480px]`}>
                                <thead>
                                    <tr>
                                        <th className={ui.th}></th>
                                        <th className={ui.th}>Name &amp; ID</th>
                                        <th className={ui.th}>Quantity</th>
                                        <th className={ui.th}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bundleContents.map((item) => (
                                        <tr key={item.id}>
                                            <td className={ui.td}><input type="checkbox" className={ui.checkbox} aria-label={`Select ${item.name}`} /></td>
                                            <td className={ui.td}>
                                                <span className="font-semibold">{item.name}</span>{" "}
                                                <span className="text-zinc-500">{item.id}</span>
                                            </td>
                                            <td className={ui.td}>
                                                <div className="inline-flex items-center rounded-lg border border-zinc-300">
                                                    <button type="button" aria-label={`Fewer ${item.name}`} className="px-3 py-1 hover:bg-zinc-50" onClick={() => changeQuantity(item.id, -1)}>-</button>
                                                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                                                    <button type="button" aria-label={`More ${item.name}`} className="px-3 py-1 hover:bg-zinc-50" onClick={() => changeQuantity(item.id, 1)}>+</button>
                                                </div>
                                            </td>
                                            <td className={`${ui.td} text-right`}><button type="button" className={ui.btnDanger} onClick={() => removeItem(item.id)}>Delete</button></td>
                                        </tr>
                                    ))}
                                    {bundleContents.length === 0 && (
                                        <tr><td colSpan={4} className={`${ui.td} py-6 text-center text-zinc-500`}>This bundle is empty.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Pricing & inventory */}
                    <section className={ui.card}>
                        <h2 className={ui.h2}>Pricing &amp; Inventory</h2>

                        <h3 className={`${ui.h3} mt-0`}>Size &amp; Pricing</h3>
                        <div className={ui.tableWrap}>
                            <table className={`${ui.table} min-w-[480px]`}>
                                <thead>
                                    <tr>
                                        <th className={ui.th}></th>
                                        <th className={ui.th}>Size</th>
                                        <th className={ui.th}>Price ($)</th>
                                        <th className={ui.th}>Compare at ($)</th>
                                        <th className={ui.th}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sizePricing.map((row) => (
                                        <tr key={row.size}>
                                            <td className={ui.td}><input type="checkbox" className={ui.checkbox} aria-label={`Select ${row.size}`} /></td>
                                            <td className={`${ui.td} font-semibold`}>{row.size}</td>
                                            <td className={ui.td}><input className={ui.smallInput} defaultValue={row.price.toFixed(2)} /></td>
                                            <td className={ui.td}><input className={ui.smallInput} defaultValue={row.compareAt.toFixed(2)} /></td>
                                            <td className={`${ui.td} text-right`}><button type="button" className={ui.btnDanger}>Delete</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <h3 className={ui.h3}>Stock Management</h3>
                        <Toggle checked={trackQuantity} onChange={() => setTrackQuantity(!trackQuantity)} title="Track Quantity" />

                        <div className="mt-3 grid gap-4 sm:grid-cols-2">
                            <label className={ui.label}>
                                Total Bundles Available
                                <input className={ui.input} inputMode="numeric" value={totalAvailable} onChange={(e) => setTotalAvailable(e.target.value)} />
                            </label>
                            <label className={ui.label}>
                                Low Stock Alert
                                <input className={ui.input} inputMode="numeric" value={lowStockAlert} onChange={(e) => setLowStockAlert(e.target.value)} />
                            </label>
                        </div>
                    </section>
                </div>

                {/* ---------- Right column ---------- */}
                <div className="space-y-5">
                    {/* Media */}
                    <section className={ui.card}>
                        <h2 className={ui.h2}>Media</h2>
                        <img src={bundle?.imageUrl} alt={name} className="aspect-square w-full rounded-lg object-cover" />
                        <div className="mt-3 grid grid-cols-3 gap-2">
                            <img src={bundle?.imageUrl} alt="thumbnail 1" className="aspect-square w-full rounded-md object-cover" />
                            <img src={bundle?.imageUrl} alt="thumbnail 2" className="aspect-square w-full rounded-md object-cover" />
                            <button type="button" className="flex aspect-square items-center justify-center rounded-md border-2 border-dashed border-zinc-300 text-xs font-semibold text-zinc-500 hover:bg-zinc-50">Upload</button>
                        </div>
                    </section>

                    {/* Visibility */}
                    <section className={ui.card}>
                        <h2 className={ui.h2}>Visibility</h2>
                        <div className="space-y-1">
                            <Toggle checked={visibleToPublic} onChange={() => setVisibleToPublic(!visibleToPublic)} title="Visible to Public"
                                help="Product will be publicly visible and available to purchase in wholesale and retail." />
                            <Toggle checked={highlightOnHome} onChange={() => setHighlightOnHome(!highlightOnHome)} title="Highlight on Home Page"
                                help={'Feature this item on the top of the home page in the "Our Featured Selections" section.'} />
                            <Toggle checked={limitedEdition} onChange={() => setLimitedEdition(!limitedEdition)} title="Limited Edition"
                                help={'Adds the "Limited" indicator on the product.'} />
                        </div>

                        {limitedEdition && (
                            <label className={`${ui.label} mt-3`}>
                                Limited End Date
                                <input type="date" className={ui.input} value={limitedEndDate} onChange={(e) => setLimitedEndDate(e.target.value)} />
                            </label>
                        )}
                    </section>

                    {/* Product tags */}
                    <section className={ui.card}>
                        <h2 className={ui.h2}>Product Tags</h2>
                        <div className="flex gap-2">
                            <input
                                className={`${ui.input} mt-0`}
                                placeholder="Add a tag..."
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                            />
                            <button type="button" className={ui.btnOutline} onClick={addTag}>ADD</button>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {tags.map((tag) => (
                                <span key={tag} className={ui.tag}>
                                    {tag}
                                    <button type="button" aria-label={`Remove ${tag}`} className="ml-1 text-[#735413] hover:text-black" onClick={() => removeTag(tag)}>×</button>
                                </span>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
