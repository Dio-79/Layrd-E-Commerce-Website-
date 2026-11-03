'use client';

import { useState } from 'react';
import { products, CATEGORIES } from '@/lib/catelog/data';

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
        <div>
            {/* Page header */}
            <div>
                <div>
                    <h1>Product Catalog</h1>
                    <p>Manage inventory, monitor stock levels, and coordinate upcoming releases.</p>
                </div>
                <div>
                    <button>+ Add Product</button>
                    <button>+ Add Category</button>
                </div>
            </div>

            <div>
                {/* Left panel */}
                <div>
                    <h2>Categories</h2>

                    <div>
                        <p>VISIBLE</p>
                        {CATEGORIES.map((c) => (
                            <button key={c} onClick={() => toggleCategory(c)}>
                                {c} <span>{countIn(c, false)}</span>
                            </button>
                        ))}
                    </div>

                    <div>
                        <p>HIDDEN / DRAFTS</p>
                        {CATEGORIES.map((c) => (
                            <button key={c} onClick={() => toggleCategory(c)}>
                                {c} <span>{countIn(c, true)}</span>
                            </button>
                        ))}
                    </div>

                    <div>
                        <p>Status Filter</p>
                        {STATUS_FILTERS.map((s) => (
                            <button key={s} onClick={() => setStatusFilter(s)}>
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right side */}
                <div>
                    {/* Top cards */}
                    <div>
                        <div>
                            <p>NEXT DROP</p>
                            <p>PENDING</p>
                            <h3>Pistachio Tiramisu</h3>
                            <p>Saturday, Aug. 01, 2026 - 12:00 AM</p>
                        </div>
                        <div>
                            <p>SCHEDULING QUEUE</p>
                            <h3>3 Upcoming Releases</h3>
                            <p>View Calendar</p>
                        </div>
                    </div>

                    {/* Product table */}
                    <div>
                        <input
                            placeholder="Filter Product ID, Name..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />

                        <table>
                            <thead>
                                <tr>
                                    <th><input type="checkbox" /></th>
                                    <th>ID</th>
                                    <th>Product Name</th>
                                    <th>Type</th>
                                    <th>Base Price</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleRows.map((row) => (
                                    <tr key={row.productID}>
                                        <td><input type="checkbox" /></td>
                                        <td>#{row.productID}</td>
                                        <td>
                                            <img src={row.imageUrl} alt={row.name} />
                                            <span>{row.name}</span>
                                        </td>
                                        <td>{row.categories[0] ?? "Uncategorized"}</td>
                                        <td>{row.status === "Draft" ? "--" : `$${row.price.toFixed(2)}`}</td>
                                        <td>{row.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}