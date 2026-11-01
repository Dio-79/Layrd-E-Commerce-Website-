"use client";

import { useMemo, useState } from "react";
import { DataState, PageHeading, Panel, inputStyle } from "@/app/portal-ui/PortalUI";
import { usePortalList, type PortalProduct, currency } from "@/app/portal-ui/usePortalData";

export default function AdminProducts() {
  const { items, loading, error, reload } = usePortalList<PortalProduct>("/api/products", "products");
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => (items ?? []).filter((p) => p.name.toLowerCase().includes(search.toLowerCase())), [items, search]);
  return <>
    <PageHeading title="Product & inventory management" subtitle="Current catalog and available stock data." />
    <Panel><label className="block text-sm font-semibold">Search products<input className={`${inputStyle} mt-2 max-w-md`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Product name" /></label></Panel>
    <div className="mt-5"><DataState loading={loading} error={error} retry={reload} empty={items && items.length === 0 ? "No products in Firebase yet." : items && filtered.length === 0 ? "No matching products." : undefined} /></div>
    {items && filtered.length > 0 && <div className="mt-5"><Panel><div className="overflow-x-auto"><table className="w-full min-w-[550px] text-left text-sm"><thead className="border-b border-zinc-200"><tr><th className="px-3 py-3">ID</th><th className="px-3 py-3">Product</th><th className="px-3 py-3">Catalog price</th><th className="px-3 py-3">Stock</th></tr></thead><tbody>{filtered.map((p) => <tr key={p.productID} className="border-b border-zinc-100"><td className="px-3 py-4">{p.productID}</td><td className="px-3 py-4 font-semibold">{p.name}</td><td className="px-3 py-4">{currency(p.price)}</td><td className="px-3 py-4">{typeof p.stock === "number" ? p.stock : "Not tracked"}</td></tr>)}</tbody></table></div></Panel></div>}
    <p className="mt-4 text-sm text-zinc-600">Adding, editing and deleting inventory require admin-only write APIs, input validation, and Firestore rules. These actions are intentionally unavailable in this read-only starter.</p>
  </>;
}
