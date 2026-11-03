'use client';

import { useState } from 'react';
import Link from 'next/link';
import { products, CATEGORIES } from '@/lib/catelog/data';

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
            <div>
                <input value={newTag} onChange={(e) => setNewTag(e.target.value)} />
                <button onClick={addTag}>ADD</button>
            </div>
            <div>
                {tags.map((tag) => (
                    <span key={tag}>
                        {tag} <button onClick={() => removeTag(tag)}>X</button>
                    </span>
                ))}
            </div>
        </div>
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
        <div>
            {/* Header */}
            <div>
                <div>
                    <p>
                        <Link href="/admin/productmanagement">Products</Link> &gt; Edit Product
                    </p>
                    <h1>{name}</h1>
                </div>
                <button onClick={handleSave}>SAVE CHANGES</button>
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
                                <input value="#CA-1" readOnly />
                            </label>
                            <label>
                                <p>CATEGORY</p>
                                <select defaultValue={product?.categories[0]}>
                                    {CATEGORIES.map((category) => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
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
                                        <td><input placeholder="$--" /></td>
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
                                <p>Available Quantity</p>
                                <input value={availableQuantity} onChange={(e) => setAvailableQuantity(e.target.value)} />
                            </label>
                            <label>
                                <p>Low Stock Alert</p>
                                <input value={lowStockAlert} onChange={(e) => setLowStockAlert(e.target.value)} />
                            </label>
                        </div>
                    </div>

                    {/* Culinary attributes */}
                    <div>
                        <h2>Culinary Attributes</h2>

                        <label>
                            <p>Flavor Profile</p>
                            <input value={flavorProfile} onChange={(e) => setFlavorProfile(e.target.value)} />
                        </label>

                        <div>
                            <div>
                                <p>Sweetness Level</p>
                                <p>{sweetness} / 5</p>
                                <div>
                                    {[1, 2, 3, 4, 5].map((level) => (
                                        <button key={level} onClick={() => setSweetness(level)}>
                                            {level <= sweetness ? "■" : "□"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <label>
                                <p>Shelf Stable</p>
                                <select value={shelfStable} onChange={(e) => setShelfStable(e.target.value)}>
                                    <option>Shelf Stable</option>
                                    <option>Refrigeration Required</option>
                                </select>
                            </label>
                        </div>

                        <div>
                            <p>Allergens</p>
                            <TagEditor tags={allergens} setTags={setAllergens} />
                        </div>
                    </div>
                </div>

                {/* ---------- Right column ---------- */}
                <div>
                    {/* Media */}
                    <div>
                        <h2>Media</h2>
                        <img src={product?.imageUrl} alt={name} />
                        <div>
                            <img src={product?.imageUrl} alt="thumbnail 1" />
                            <img src={product?.imageUrl} alt="thumbnail 2" />
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
                            <p>Adds the "Limited" indicator on the product, and sets a date to end its availability.</p>
                        </label>

                        {limitedEdition && (
                            <label>
                                <p>Limited End Date</p>
                                <input value={limitedEndDate} onChange={(e) => setLimitedEndDate(e.target.value)} />
                            </label>
                        )}
                    </div>

                    {/* Product tags */}
                    <div>
                        <h2>Product Tags</h2>
                        <TagEditor tags={productTags} setTags={setProductTags} />
                    </div>
                </div>
            </div>
        </div>
    );
}