import type { CartItem } from "@/app/types/models";
import type { OrderLine } from "./checkoutStore";

const num = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

const str = (v: unknown): string | undefined =>
  typeof v === "string" && v.trim() ? v.trim() : undefined;

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
    id: `bag:${String(id)}`,
    source: "bag",
    productId: typeof id === "number" ? id : String(id),
    name: str(p.name) ?? str(p.productName) ?? str(p.title) ?? `Product #${String(id)}`,
    image: str(p.image) ?? str(p.imageUrl) ?? str(p.img) ?? null,
    size: str(p.size) ?? str(p.selectedSize),
    flavor: str(p.flavor) ?? (sweetness ? `Sweetness: ${sweetness}` : undefined),
    quantity: item.quantity,
    unitPrice,
    originalUnitPrice: regular !== undefined && regular > unitPrice ? regular : undefined,
  };
}