<<<<<<< HEAD
import React from 'react';
import { products } from '@/lib/catelog/data';



export default function CatelogPage() {
    return (
        // Catelogue container
        <div>
            {/* shop all */}
            <div>
                {/* filters */}
                <div>
                        {/* Category */}
                    <div>
                        <h1> Category</h1>
                            <ul>
                                <li>All products</li>
                                <li>Bundles</li>
                                <li>Cake in a can</li>
                                <li>Espresso shots</li>
                            </ul>

                    </div>

                    {/* Flavour */}
                    <div>
                        <h1>Flavour</h1>
                            <ul>
                                <li>Fruity</li>
                                <li>Cookie</li>
                                <li>Chocolatey</li>
                                <li>Classic</li>
                                <li>Creamy</li>
                            </ul>

                    </div>
                    {/* Price */}
                    <div>
                        <h1>Price</h1>
                            <ul>
                                <li>Under $5</li>
                                <li>6-15</li>
                                <li>$15</li>
                            </ul>

                    </div>

                </div>

                {/* items */}

                <div>
                    {products.map((product)=>(
                        <div key={product.productID}>
                            <img src={product.imageUrl} alt={product.name} />
                            <h3>{product.description}</h3>
                            <p>{product.description}</p>
                            <p>FROM ${product.price}</p>
                            <button>Custom</button>
                        </div>
                    ))}

                </div>
                
            </div>
            
        </div>
    )
}
=======
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DataState, PageHeading, Panel, inputStyle, buttonStyle } from "@/app/portal-ui/PortalUI";
import { usePortalList, type PortalProduct, currency } from "@/app/portal-ui/usePortalData";

export default function WholesaleCatalog() {
  const { items, loading, error, reload } = usePortalList<PortalProduct>("/api/products", "products");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const categories = useMemo(() => ["All", ...new Set((items ?? []).map((x) => x.section).filter((x): x is string => Boolean(x)))], [items]);
  const filtered = useMemo(() => (items ?? []).filter((x) => (category === "All" || x.section === category) && `${x.name} ${x.description ?? ""}`.toLowerCase().includes(search.toLowerCase())), [items, search, category]);

  return <>
    <PageHeading title="Product catalog" subtitle="Browse the current LÄYRD product range." action={<Link className={buttonStyle} href="/wholesale/order">Build bulk order</Link>} />
    <Panel><div className="grid gap-3 sm:grid-cols-[1fr_200px]">
      <label className="text-sm font-medium">Search products<input className={`${inputStyle} mt-1`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name" /></label>
      <label className="text-sm font-medium">Category<select className={`${inputStyle} mt-1`} value={category} onChange={(e) => setCategory(e.target.value)}>{categories.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
    </div></Panel>
    <div className="mt-5"><DataState loading={loading} error={error} retry={reload} empty={items && !items.length ? "No catalog products available yet." : items && !filtered.length ? "No products match your search." : undefined} /></div>
    {items && filtered.length > 0 && <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((product) => <article key={product.productID} className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      {product.imageUrl ? <div className="h-44 bg-zinc-50"><img src={product.imageUrl} alt={product.name} loading="lazy" className="h-full w-full object-cover" /></div> : <div className="flex h-44 items-center justify-center bg-zinc-100 text-sm text-zinc-500">Image unavailable</div>}
      <div className="p-4"><p className="text-xs uppercase tracking-wide text-[#997127]">{product.section || "Product"}</p><h2 className="mt-1 font-bold">{product.name}</h2><p className="mt-2 line-clamp-2 text-sm text-zinc-600">{product.description || "No description available."}</p><p className="mt-3 font-bold">{currency(product.price)}</p><p className="mt-1 text-xs text-zinc-500">Catalog price · wholesale rate pending</p></div>
    </article>)}</div>}
  </>;
}
>>>>>>> 80246dcef234d6de08a72a7d377df29479efed73
