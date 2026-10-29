import { Product } from "@/app/types/models";

/* ------------------------------------------------------------------ */
/* Filter options (shown in the filter sidebar)                        */
/* ------------------------------------------------------------------ */

export const CATEGORIES = ["Cakes", "Coffee", "Bundles", "Limited"] as const;
export const SIZES = ["150ml", "100ml", "50ml", "4-Pack", "6+ Pack"] as const;
export const FLAVORS = ["Fruity", "Cookie", "Chocolatey", "Classic", "Creamy"] as const;

export type Category = (typeof CATEGORIES)[number];
export type SizeOption = (typeof SIZES)[number];
export type Flavor = (typeof FLAVORS)[number];

/** Price ranges. Ranges don't overlap, so a $5 product still lands in one of them. */
export const PRICE_RANGES = [
  { id: "under-5", label: "Under $5", test: (p: number) => p < 5 },
  { id: "6-15", label: "$6-15", test: (p: number) => p >= 5 && p < 15 },
  { id: "15-plus", label: "$15+", test: (p: number) => p >= 15 },
] as const;

export type PriceRangeId = (typeof PRICE_RANGES)[number]["id"];

export function getPriceRangeId(price: number): PriceRangeId {
  return (PRICE_RANGES.find((r) => r.test(price)) ?? PRICE_RANGES[PRICE_RANGES.length - 1]).id;
}

/* ------------------------------------------------------------------ */
/* Sections: Cake in a Can  vs  Drinks                                 */
/* ------------------------------------------------------------------ */

export type Section = "cake-in-a-can" | "drinks";

export const SECTIONS: { id: Section; label: string; href: string }[] = [
  { id: "cake-in-a-can", label: "Cake in a Can", href: "/Mainpage" },
  { id: "drinks", label: "Drinks", href: "/Drinks" },
];

/* ------------------------------------------------------------------ */
/* Products - every filter field lives on the item itself              */
/* ------------------------------------------------------------------ */

/** A Product plus the fields the filter sidebar reads. */
export type CatalogProduct = Product & {
  section: Section;
  categories: Category[];
  priceRange: PriceRangeId; // filled in automatically from `price`
  sizes: SizeOption[];
  flavors: Flavor[];
};

type RawProduct = Omit<CatalogProduct, "priceRange">;

const CAN_SIZES: SizeOption[] = ["4-Pack", "6+ Pack"];

const rawProducts: RawProduct[] = [
  /* ------------------------------ Drinks ------------------------------ */
  {
    productID: 1,
    name: "Strawberry Matcha",
    price: 9,
    tag: "LIMITED",
    description: "Vibrant, creamy fusion of earthy matcha and sweet strawberry.",
    imageUrl: "/images/Strawberry matcha.jpg",
    section: "drinks",
    categories: ["Limited"],
    sizes: ["150ml"],
    flavors: ["Fruity", "Creamy"],
  },
  {
    productID: 2,
    name: "Single espresso",
    price: 4,
    tag: "CLASSIC",
    description: "Compact shot of rich, bold coffee sealed for freshness and ready to enjoy anywhere.",
    imageUrl: "/images/Single expresso.jpg",
    section: "drinks",
    categories: ["Coffee"],
    sizes: ["50ml"],
    flavors: ["Classic"],
  },
  {
    productID: 8,
    name: "Double Espresso",
    price: 4,
    tag: "",
    description: "Bold, concentrated burst of rich coffee, with the grab-and-go convenience.",
    imageUrl: "/images/double expresso.jpg",
    section: "drinks",
    categories: ["Coffee"],
    sizes: ["100ml"],
    flavors: ["Classic"],
  },
  {
    productID: 12,
    name: "Blue Raspberry Lemonade",
    price: 6,
    tag: "",
    description: "Bright, tangy lemonade with a bold blue raspberry twist.",
    imageUrl: "/images/blue raspberry lemonade.jpg",
    section: "drinks",
    categories: [],
    sizes: ["150ml"],
    flavors: ["Fruity"],
  },
  {
    productID: 13,
    name: "Red Raspberry Lemonade",
    price: 6,
    tag: "",
    description: "Classic lemonade sweetened with real red raspberry flavor.",
    imageUrl: "/images/red raspberry lemonade.jpg",
    section: "drinks",
    categories: [],
    sizes: ["150ml"],
    flavors: ["Fruity"],
  },
  {
    productID: 14,
    name: "Strawberry Lemonade",
    price: 6,
    tag: "",
    description: "Fresh lemonade blended with sweet strawberry flavor.",
    imageUrl: "/images/strawberry lemonade.jpg",
    section: "drinks",
    categories: [],
    sizes: ["150ml"],
    flavors: ["Fruity"],
  },
  {
    productID: 15,
    name: "Mango Lemonade",
    price: 6,
    tag: "",
    description: "Tropical mango meets tart lemonade for a refreshing sip.",
    imageUrl: "/images/mango lemonade.jpg",
    section: "drinks",
    categories: [],
    sizes: ["150ml"],
    flavors: ["Fruity"],
  },
  {
    productID: 16,
    name: "Peach Lemonade",
    price: 6,
    tag: "",
    description: "Smooth, juicy peach flavor layered into classic lemonade.",
    imageUrl: "/images/peach lemonade.jpg",
    section: "drinks",
    categories: [],
    sizes: ["150ml"],
    flavors: ["Fruity"],
  },

  /* --------------------------- Cake in a Can --------------------------- */
  {
    productID: 3,
    name: "Oreo Cheesecake",
    price: 8,
    tag: "POPULAR",
    description: "Creamy desert that blends cheesecake with crushed Oreos.",
    imageUrl: "/images/Oreo cheesecake.jpg",
    section: "cake-in-a-can",
    categories: ["Cakes"],
    sizes: CAN_SIZES,
    flavors: ["Cookie", "Creamy"],
  },
  {
    productID: 4,
    name: "fruit salad",
    price: 9,
    tag: "",
    description: "Bright, creamy cheesecake layered with mixed fresh fruits for a refreshing bite.",
    imageUrl: "/images/fruit salad.jpg",
    section: "cake-in-a-can",
    categories: ["Cakes"],
    sizes: CAN_SIZES,
    flavors: ["Fruity", "Creamy"],
  },
  {
    productID: 5,
    name: "Lotus Cheesecake",
    price: 8,
    tag: "",
    description: "Lotus-infused cheesecake for a sweet, deeply comforting flavor.",
    imageUrl: "/images/Lotus cheesecake.jpg",
    section: "cake-in-a-can",
    categories: ["Cakes"],
    sizes: CAN_SIZES,
    flavors: ["Cookie", "Creamy"],
  },
  {
    productID: 6,
    name: "Kinder Bueno",
    price: 9,
    tag: "",
    description: "Hazelnut-cream cheesecake blended with chocolate wafers for Kinder Bueno lovers.",
    imageUrl: "/images/Kinder Bueno.jpg",
    section: "cake-in-a-can",
    categories: ["Cakes"],
    sizes: CAN_SIZES,
    flavors: ["Chocolatey", "Creamy"],
  },
  {
    productID: 7,
    name: "Classic Tiramisu",
    price: 8,
    tag: "",
    description: "Infused with espresso and cocoa, capturing the rich indulgence of classic tiramisu.",
    imageUrl: "/images/tiramisu.jpg",
    section: "cake-in-a-can",
    categories: ["Cakes"],
    sizes: CAN_SIZES,
    flavors: ["Classic", "Creamy"],
  },
  {
    productID: 9,
    name: "Classic Bundle",
    price: 30,
    tag: "",
    description: "Curated 4-pack including Tiramisu, Lotus, Oreo, and Fruit Salad cheesecakes.",
    imageUrl: "/images/classic bundle.jpg",
    section: "cake-in-a-can",
    categories: ["Bundles"],
    sizes: ["4-Pack"],
    flavors: ["Classic", "Creamy"],
  },
  {
    productID: 10,
    name: "Biscoff Cheesecake",
    price: 8,
    tag: "",
    description: "Creamy cheesecake layered with Biscoff cookie crumb and spread.",
    imageUrl: "/images/Biscoff cheesecake.jpg",
    section: "cake-in-a-can",
    categories: ["Cakes"],
    sizes: CAN_SIZES,
    flavors: ["Cookie", "Creamy"],
  },
  {
    productID: 11,
    name: "Pumpkin Spice Cheesecake",
    price: 9,
    tag: "LIMITED",
    description: "Limited edition cheesecake with warm pumpkin spice.",
    imageUrl: "/images/Pumpkin spice cheesecake.jpg",
    section: "cake-in-a-can",
    categories: ["Cakes", "Limited"],
    sizes: CAN_SIZES,
    flavors: ["Creamy"],
  },
];

/** Same order as before (by productID), with `priceRange` worked out from the price. */
export const products: CatalogProduct[] = rawProducts
  .map((p) => ({ ...p, priceRange: getPriceRangeId(p.price) }))
  .sort((a, b) => a.productID - b.productID);

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export function getSection(productID: number): Section | undefined {
  return products.find((p) => p.productID === productID)?.section;
}

export function getProductsBySection(section: Section): CatalogProduct[] {
  return products.filter((p) => p.section === section);
}

export type Filters = {
  categories: Category[];
  prices: PriceRangeId[];
  sizes: SizeOption[];
  flavors: Flavor[];
};

export const EMPTY_FILTERS: Filters = { categories: [], prices: [], sizes: [], flavors: [] };

/** Within one group the choices are "any of" (OR); different groups must all match (AND). */
export function filterProducts(list: CatalogProduct[], f: Filters): CatalogProduct[] {
  return list.filter((p) => {
    if (f.categories.length && !f.categories.some((c) => p.categories.includes(c))) return false;
    if (f.sizes.length && !f.sizes.some((s) => p.sizes.includes(s))) return false;
    if (f.flavors.length && !f.flavors.some((fl) => p.flavors.includes(fl))) return false;
    if (f.prices.length && !f.prices.includes(p.priceRange)) return false;
    return true;
  });
}

/** Only the filter options that exist in a given list, so the Drinks page doesn't offer "6+ Pack". */
export function availableOptions(list: CatalogProduct[]) {
  return {
    categories: CATEGORIES.filter((c) => list.some((p) => p.categories.includes(c))),
    prices: PRICE_RANGES.filter((r) => list.some((p) => p.priceRange === r.id)),
    sizes: SIZES.filter((s) => list.some((p) => p.sizes.includes(s))),
    flavors: FLAVORS.filter((fl) => list.some((p) => p.flavors.includes(fl))),
  };
}