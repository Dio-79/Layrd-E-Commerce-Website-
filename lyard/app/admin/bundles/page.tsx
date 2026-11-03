'use client';

import { useState } from 'react';
import Link from 'next/link';

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
        <div>
            <h1>Bundles</h1>
            <p>Create and manage product collections and pricing tiers</p>

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

            {/* Table */}
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
                            <th>MSRP</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visible.map((bundle) => (
                            <tr key={bundle.id}>
                                <td><input type="checkbox" /></td>
                                <td>{bundle.id}</td>
                                <td>
                                    <img src={bundle.imageUrl} alt={bundle.name} />
                                    <span>{bundle.name}</span>
                                </td>
                                <td>{bundle.type}</td>
                                <td>${bundle.basePrice.toFixed(2)}</td>
                                <td><s>${bundle.msrp.toFixed(2)}</s></td>
                                <td>
                                    {bundle.status === "In Stock"
                                        ? `${bundle.stock} IN STOCK`
                                        : bundle.status.toUpperCase()}
                                </td>
                                <td>
                                    <Link href="/admin/editbundles">Edit</Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}