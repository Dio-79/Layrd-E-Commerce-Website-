'use client';

import { useState } from 'react';
import Link from 'next/link';
import { products, CATEGORIES } from '@/lib/catelog/data';

// Starting values come from the Classic Bundle in your product data
const bundle = products.find((p) => p.productID === 9);

const bundleContents = [
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

export default function EditBundlePage() {
    const [name, setName] = useState(bundle?.name ?? "");
    const [description, setDescription] = useState(bundle?.description ?? "");

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

    function handleSave() {
        console.log({
            name, description, visibleToPublic, highlightOnHome,
            limitedEdition, limitedEndDate, trackQuantity,
            totalAvailable, lowStockAlert, tags,
        });
    }

    return (
        <div>
            {/* Header */}
            <div>
                <div>
                    <p>
                        <Link href="/admin/bundles">Bundles</Link> &gt; Edit Bundle
                    </p>
                    <h1>{name}</h1>
                </div>
                <button onClick={handleSave}>Save changes</button>
            </div>

            <div>
                {/* ---------- Left column ---------- */}
                <div>
                    {/* Basic information */}
                    <div>
                        <h2>Basic Information</h2>

                        <label>
                            <p>PRODUCT NAME</p>
                            <input value={name} onChange={(e) => setName(e.target.value)} />
                        </label>

                        <label>
                            <p>DESCRIPTION</p>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                        </label>

                        <div>
                            <label>
                                <p>PRODUCT ID</p>
                                <input value="#BD-3" readOnly />
                            </label>
                            <label>
                                <p>CATEGORY</p>
                                <select defaultValue={bundle?.categories[0]}>
                                    {CATEGORIES.map((category) => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </div>

                    {/* Bundle contents */}
                    <div>
                        <div>
                            <h2>Bundle Contents</h2>
                            <button>+ Add Product</button>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>Name & ID</th>
                                    <th>Quantity</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {bundleContents.map((item) => (
                                    <tr key={item.id}>
                                        <td><input type="checkbox" /></td>
                                        <td>{item.name} {item.id}</td>
                                        <td>
                                            <button>-</button>
                                            <span>{item.quantity}</span>
                                            <button>+</button>
                                        </td>
                                        <td><button>Delete</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pricing & inventory */}
                    <div>
                        <h2>Pricing &amp; Inventory</h2>

                        <h3>Size &amp; Pricing</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>Size</th>
                                    <th>Price ($)</th>
                                    <th>Compare at ($)</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {sizePricing.map((row) => (
                                    <tr key={row.size}>
                                        <td><input type="checkbox" /></td>
                                        <td>{row.size}</td>
                                        <td><input defaultValue={row.price.toFixed(2)} /></td>
                                        <td><input defaultValue={row.compareAt.toFixed(2)} /></td>
                                        <td><button>Delete</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <h3>Stock Management</h3>
                        <label>
                            <input
                                type="checkbox"
                                checked={trackQuantity}
                                onChange={() => setTrackQuantity(!trackQuantity)}
                            />
                            <span>Track Quantity</span>
                        </label>

                        <div>
                            <label>
                                <p>Total Bundles Available</p>
                                <input value={totalAvailable} onChange={(e) => setTotalAvailable(e.target.value)} />
                            </label>
                            <label>
                                <p>Low Stock Alert</p>
                                <input value={lowStockAlert} onChange={(e) => setLowStockAlert(e.target.value)} />
                            </label>
                        </div>
                    </div>
                </div>

                {/* ---------- Right column ---------- */}
                <div>
                    {/* Media */}
                    <div>
                        <h2>Media</h2>
                        <img src={bundle?.imageUrl} alt={name} />
                        <div>
                            <img src={bundle?.imageUrl} alt="thumbnail 1" />
                            <img src={bundle?.imageUrl} alt="thumbnail 2" />
                            <button>Upload</button>
                        </div>
                    </div>

                    {/* Visibility */}
                    <div>
                        <h2>Visibility</h2>

                        <label>
                            <input type="checkbox" checked={visibleToPublic} onChange={() => setVisibleToPublic(!visibleToPublic)} />
                            <span>Visible to Public</span>
                            <p>Product will be publicly visible and available to purchase in wholesale and retail.</p>
                        </label>

                        <label>
                            <input type="checkbox" checked={highlightOnHome} onChange={() => setHighlightOnHome(!highlightOnHome)} />
                            <span>Highlight on Home Page</span>
                            <p>Feature this item on the top of the home page in the "Our Featured Selections" section.</p>
                        </label>

                        <label>
                            <input type="checkbox" checked={limitedEdition} onChange={() => setLimitedEdition(!limitedEdition)} />
                            <span>Limited Edition</span>
                            <p>Adds the "Limited" indicator on the product.</p>
                        </label>

                        {limitedEdition && (
                            <label>
                                <p>Limited End Date (YYYY-MM-DD)</p>
                                <input value={limitedEndDate} onChange={(e) => setLimitedEndDate(e.target.value)} />
                            </label>
                        )}
                    </div>

                    {/* Product tags */}
                    <div>
                        <h2>Product Tags</h2>
                        <div>
                            <input
                                placeholder="Add a tag..."
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                            />
                            <button onClick={addTag}>ADD</button>
                        </div>
                        <div>
                            {tags.map((tag) => (
                                <span key={tag}>
                                    {tag} <button onClick={() => removeTag(tag)}>x</button>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}