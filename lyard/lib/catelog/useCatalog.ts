"use client";
// The shop's product list with the admin's changes from Firestore (FR-13).
// It starts with the built-in list (lib/catelog/data.ts) so the page renders
// straight away, then swaps in /api/products: new names, prices, photos,
// sweetness and allergens show up, hidden or removed products disappear, and
// products added on /admin show up. If Firebase can't be reached, the built-in
// list stays.
import { useEffect, useState } from "react";
import { getPriceRangeId, products as builtIn, type CatalogProduct, type Section } from "./data";

type Remote = Partial<CatalogProduct> & { productID: number; hidden?: boolean };

export function mergeCatalog(remote: Remote[]): CatalogProduct[] {
  const valid = remote.filter((r) => Number.isInteger(r.productID) && typeof r.name === "string" && typeof r.price === "number");
  if (valid.length === 0) return builtIn;
  const byId = new Map(builtIn.map((p) => [p.productID, p]));
  return valid
    .filter((r) => r.hidden !== true)
    .map((r) => {
      const base = byId.get(r.productID);
      const merged = {
        section: "cake-in-a-can" as Section,
        categories: [],
        sizes: [],
        flavors: [],
        tag: "",
        description: "",
        imageUrl: "",
        ...base,
        ...Object.fromEntries(Object.entries(r).filter(([, v]) => v !== undefined && v !== null && v !== "")),
      } as CatalogProduct;
      return { ...merged, priceRange: getPriceRangeId(merged.price) };
    })
    .sort((a, b) => a.productID - b.productID);
}

let cache: CatalogProduct[] | null = null;

/** Every visible product, or one section of them. */
export function useCatalog(section?: Section): CatalogProduct[] {
  const [list, setList] = useState<CatalogProduct[]>(cache ?? builtIn);

  useEffect(() => {
    let live = true;
    fetch("/api/products", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (!live || !body || !Array.isArray(body.products)) return;
        cache = mergeCatalog(body.products);
        setList(cache);
      })
      .catch(() => {
        /* offline: keep the built-in list */
      });
    return () => {
      live = false;
    };
  }, []);

  return section ? list.filter((p) => p.section === section) : list;
}
