import { cartKey, type CartItem } from "@/app/types/models";
import type { OrderLine } from "./checkoutStore";

const num = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

const str = (v: unknown): string | undefined =>
  typeof v === "string" && v.trim() ? v.trim() : undefined;

/** "images/a.png" only works on one page; "/images/a.png" works everywhere. */
const toSrc = (v: unknown): string | null => {
  const s = str(v);
  if (!s) return null;
  return /^(https?:|data:|blob:|\/)/.test(s) ? s : `/${s}`;
};

/**
 * Turns a cart item into a checkout line.
 * The product is read loosely so this works with whatever fields your Product has.
 * If your product uses different property names, edit the lookups below.
 */
export function cartItemToLine(item: CartItem): OrderLine {
  const p = item.product as unknown as Record<string, unknown>;
  const id = p.productID;
  const unitPrice = num(p.price) ?? 0;
  const regular = num(p.originalPrice) ?? num(p.compareAtPrice) ?? num(p.oldPrice);
  const sweetness = str(p.sweetness);

  return {
    id: `bag:${cartKey(item)}`,
    source: "bag",
    productId: typeof id === "number" ? id : String(id),
    name: str(p.name) ?? str(p.productName) ?? str(p.title) ?? `Product #${String(id)}`,
    image: toSrc(p.image) ?? toSrc(p.imageUrl) ?? toSrc(p.img),
    size: item.size ?? str(p.size) ?? str(p.selectedSize),
    flavor: item.flavor ?? str(p.flavor) ?? (sweetness ? `Sweetness: ${sweetness}` : undefined),
    group: item.group?.name,
    quantity: item.quantity,
    unitPrice,
    originalUnitPrice: regular !== undefined && regular > unitPrice ? regular : undefined,
  };
}