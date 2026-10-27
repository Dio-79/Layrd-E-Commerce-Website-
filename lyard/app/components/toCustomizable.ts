import type { CatalogProduct } from "@/lib/catelog/data";
import type { CustomizableProduct } from "./Customizemodal";

/** Turns a product from lib/catelog/data.ts into what CustomizeModal needs. Every page uses this one function. */
export function toCustomizable(product: CatalogProduct): CustomizableProduct {
  return {
    productID: product.productID,
    name: product.name,
    description: product.description ?? "",
    price: Number(product.price),
    imageUrl: product.imageUrl ?? "",
    sizes: [...product.sizes],
  };
}