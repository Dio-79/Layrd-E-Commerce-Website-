import { getProductsBySection } from "@/lib/catelog/data";
import { ROUTES } from "@/lib/Routes/Routes";
import type { SearchItem } from "./search";

type Section = Parameters<typeof getProductsBySection>[0];

/**
 * Every catalog section that should be searchable.
 * To add one, copy the line, use that section's name (the same one its page passes to
 * getProductsBySection), a label, and the route of the page that shows it.
 */
const SECTIONS: { section: Section; label: string; href: string }[] = [
  { section: "drinks" as Section, label: "Drinks", href: ROUTES.drinks },
  // { section: "cakes" as Section, label: "Cake-in-a-Can", href: ROUTES.cakeInACan },
];

export function getSearchItems(): SearchItem[] {
  return SECTIONS.flatMap(({ section, label, href }) =>
    getProductsBySection(section).map((p) => ({
      id: `${section}-${p.productID}`,
      name: p.name,
      description: p.description ?? "",
      category: label,
      href,
      price: p.price,
      imageUrl: p.imageUrl,
      tag: p.tag ?? undefined,
    }))
  );
}