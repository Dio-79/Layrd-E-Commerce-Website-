'use client';

import { useState } from 'react';
import Link from 'next/link';
import { products, CATEGORIES } from '@/lib/catelog/data';
import { ui } from '../adminStyles';

// Starting values come from Fruit Salad (productID 4) in your product data
const product = products.find((p) => p.productID === 4);

const sizePricing = [
    { size: "Small", price: 6.5 },
    { size: "Standard", price: 9 },
    { size: "Large", price: 12 },
];

/* ---------- Reusable tag editor (used for Product Tags AND Allergens) ---------- */

type TagEditorProps = {
    tags: string[];
    setTags: (tags: string[]) => void;
};

function TagEditor({ tags, setTags }: TagEditorProps) {
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

    return (
        <div>
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
                        <button type="button" aria-label={`Remove ${tag}`} className="ml-1 text-[var(--a-gold)] hover:text-[var(--a-text)]" onClick={() => removeTag(tag)}>×</button>
                    </span>
                ))}
            </div>
        </div>
    );
}

/* ---------- Checkbox with a title and help text ---------- */

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

/* ---------- The page ---------- */

export default function EditProductPage() {
    const [name, setName] = useState(product?.name ?? "");
    const [description, setDescription] = useState(product?.description ?? "");

    const [trackQuantity, setTrackQuantity] = useState(true);
    const [availableQuantity, setAvailableQuantity] = useState("42");
    const [lowStockAlert, setLowStockAlert] = useState("10");

    const [visibleToPublic, setVisibleToPublic] = useState(true);
    const [highlightOnHome, setHighlightOnHome] = useState(true);
    const [limitedEdition, setLimitedEdition] = useState(false);
    const [limitedEndDate, setLimitedEndDate] = useState("2026-12-12");

    const [productTags, setProductTags] = useState(["Fruity", "Classic"]);

    const [flavorProfile, setFlavorProfile] = useState(product?.flavors.join(", ") ?? "");
    const [sweetness, setSweetness] = useState(3);
    const [shelfStable, setShelfStable] = useState("Refrigeration Required");
    const [allergens, setAllergens] = useState(["Dairy", "Eggs", "Gluten"]);

    function handleSave() {
        console.log({
            name, description, trackQuantity, availableQuantity, lowStockAlert,
            visibleToPublic, highlightOnHome, limitedEdition, limitedEndDate,
            productTags, flavorProfile, sweetness, shelfStable, allergens,
        });
    }

    return (
        <div className={ui.page}>
            {/* Header */}
            <div className={ui.pageHeader}>
                <div>
                    <p className={ui.breadcrumb}>
                        <Link href="/admin/productmanagement" className={ui.breadcrumbLink}>Products</Link> &gt; Edit Product
                    </p>
                    <h1 className={ui.h1}>{name || "New product"}</h1>
                </div>
                <button type="button" className={ui.btn} onClick={handleSave}>SAVE CHANGES</button>
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
                                <input className={`${ui.input} bg-[var(--a-inset)] text-[var(--a-muted)]`} value="#CA-1" readOnly />
                            </label>
                            <label className={ui.label}>
                                Category
                                <select className={ui.input} defaultValue={product?.categories[0]}>
                                    {CATEGORIES.map((category) => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                            </label>
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
                                            <td className={ui.td}><input className={ui.smallInput} placeholder="$--" /></td>
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
                                Available Quantity
                                <input className={ui.input} inputMode="numeric" value={availableQuantity} onChange={(e) => setAvailableQuantity(e.target.value)} />
                            </label>
                            <label className={ui.label}>
                                Low Stock Alert
                                <input className={ui.input} inputMode="numeric" value={lowStockAlert} onChange={(e) => setLowStockAlert(e.target.value)} />
                            </label>
                        </div>
                    </section>

                    {/* Culinary attributes */}
                    <section className={`${ui.card} space-y-4`}>
                        <h2 className={ui.h2}>Culinary Attributes</h2>

                        <label className={ui.label}>
                            Flavor Profile
                            <input className={ui.input} value={flavorProfile} onChange={(e) => setFlavorProfile(e.target.value)} />
                        </label>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <p className={ui.label}>Sweetness Level <span className="normal-case text-[var(--a-text-2)]">· {sweetness} / 5</span></p>
                                <div className="mt-2 flex gap-1.5">
                                    {[1, 2, 3, 4, 5].map((level) => (
                                        <button
                                            key={level}
                                            type="button"
                                            aria-label={`Sweetness ${level}`}
                                            aria-pressed={level <= sweetness}
                                            onClick={() => setSweetness(level)}
                                            className={`h-8 w-8 rounded-md border ${level <= sweetness ? "border-[var(--a-gold)] bg-[var(--a-gold)]" : "border-[var(--a-border)] bg-transparent hover:bg-[var(--a-gold)]/10"}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <label className={ui.label}>
                                Shelf Stable
                                <select className={ui.input} value={shelfStable} onChange={(e) => setShelfStable(e.target.value)}>
                                    <option>Shelf Stable</option>
                                    <option>Refrigeration Required</option>
                                </select>
                            </label>
                        </div>

                        <div>
                            <p className={`${ui.label} mb-1`}>Allergens</p>
                            <TagEditor tags={allergens} setTags={setAllergens} />
                        </div>
                    </section>
                </div>

                {/* ---------- Right column ---------- */}
                <div className="space-y-5">
                    {/* Media */}
                    <section className={ui.card}>
                        <h2 className={ui.h2}>Media</h2>
                        <img src={product?.imageUrl} alt={name} className="aspect-square w-full rounded-lg object-cover" />
                        <div className="mt-3 grid grid-cols-3 gap-2">
                            <img src={product?.imageUrl} alt="thumbnail 1" className="aspect-square w-full rounded-md object-cover" />
                            <img src={product?.imageUrl} alt="thumbnail 2" className="aspect-square w-full rounded-md object-cover" />
                            <button type="button" className="flex aspect-square items-center justify-center rounded-md border-2 border-dashed border-[var(--a-border)] text-xs font-semibold text-[var(--a-muted)] hover:bg-[var(--a-hover)]">Upload</button>
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
                                help={'Adds the "Limited" indicator on the product, and sets a date to end its availability.'} />
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
                        <TagEditor tags={productTags} setTags={setProductTags} />
                    </section>
                </div>
            </div>
        </div>
    );
}
