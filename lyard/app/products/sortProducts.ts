import type { CatalogProduct } from "@/lib/catelog/data";

export const SORT_OPTIONS = [
  "Newest",
  "Price: Low to High",
  "Price: High to Low",
  "Name: A to Z",
  "Popular",
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number];

/** Returns a sorted copy; the original list is never changed. */
export function sortProducts(list: CatalogProduct[], sortBy: SortOption): CatalogProduct[] {
  const out = [...list];
  switch (sortBy) {
    case "Price: Low to High":
      return out.sort((a, b) => a.price - b.price);
    case "Price: High to Low":
      return out.sort((a, b) => b.price - a.price);
    case "Name: A to Z":
      return out.sort((a, b) => a.name.localeCompare(b.name));
    case "Popular":
      // Items tagged POPULAR first, everything else keeps its order
      return out.sort((a, b) => Number(b.tag === "POPULAR") - Number(a.tag === "POPULAR"));
    default:
      // Newest = highest productID first
      return out.sort((a, b) => b.productID - a.productID);
  }
}