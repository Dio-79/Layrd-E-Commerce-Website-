"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/app/types/models";
import { useCart } from "@/app/context/CartContext";
import { getSizes, getPrice } from "@/lib/catelog/dataSize";
import { getAllergenInfo, ALLERGY_DISCLAIMER } from "@/lib/catelog/dataAllergens";
import styles from "./Customizemodal.module.css";

/* These two types are taken from the helpers themselves, so the modal always
   agrees with whatever id / product shape dataSize.ts expects. */
type SizeKey = Parameters<typeof getSizes>[0];
type PriceArg = Parameters<typeof getPrice>[0];

/** The few fields the modal needs. Any page can build one from its own product data. */
export type CustomizableProduct = {
  productID: SizeKey;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  /** Extra photos. With two or more, thumbnails appear under the main image. */
  images?: string[];
  sizes: string[];
};

type Props = {
  product: CustomizableProduct;
  /** Small trail shown above the name, e.g. "Featured" or "Cakes" */
  breadcrumb?: string;
  onClose: () => void;
};

/**
 * Customize popup shared by every page: pick a size, pick a quantity,
 * add to the real cart. Render it only while a product is selected:
 *   {selected && <CustomizeModal product={selected} onClose={() => setSelected(null)} />}
 */
export default function CustomizeModal({ product, breadcrumb = "Shop", onClose }: Props) {
  const { addItem } = useCart();

  // Real sizes (with prices) when we have them, otherwise the single size from the product
  const sizeChoices = useMemo(
    () => getSizes(product.productID) ?? product.sizes.map((label) => ({ label, price: product.price })),
    [product]
  );

  const [selectedSize, setSelectedSize] = useState(() => {
    const sizes = getSizes(product.productID);
    const fallback = sizes?.find((s) => s.label.toLowerCase() === "medium") ?? sizes?.[0];
    return fallback?.label ?? product.sizes[0] ?? "";
  });
  const [quantity, setQuantity] = useState(1);

  const gallery = useMemo(
    () => (product.images && product.images.length > 0 ? product.images : [product.imageUrl]),
    [product]
  );
  const [activeImage, setActiveImage] = useState(gallery[0]);

  // Esc closes the popup
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const unitPrice = getPrice(product as unknown as PriceArg, selectedSize);
  const allergenInfo = getAllergenInfo(product.productID);

  const handleAddToCart = () => {
    const cartProduct = {
      productID: product.productID,
      name: product.name,
      price: unitPrice, // the chosen size's price
      imageUrl: product.imageUrl,
    } as unknown as Product;

    // addItem adds 1 per call
    for (let i = 0; i < quantity; i++) addItem(cartProduct);
    onClose();
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={`Customize ${product.name}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className={styles.gallery}>
          <div className={styles.imageWrap}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={activeImage || product.imageUrl} alt={product.name} className={styles.image} />
          </div>

          {gallery.length > 1 && (
            <div className={styles.thumbs}>
              {gallery.map((url, i) => (
                <button
                  key={`${url}-${i}`}
                  type="button"
                  className={`${styles.thumb} ${activeImage === url ? styles.activeThumb : ""}`}
                  aria-label={`Show photo ${i + 1} of ${product.name}`}
                  aria-pressed={activeImage === url}
                  onClick={() => setActiveImage(url)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.details}>
          <div className={styles.breadcrumb}>
            {breadcrumb} &gt; {product.name}
          </div>
          <h2 className={styles.heading}>{product.name}</h2>
          <p className={styles.subtitle}>{product.description}</p>
          <div className={styles.price}>${unitPrice.toFixed(2)}</div>

          <hr className={styles.divider} />

          <div className={styles.optionGroup}>
            <span className={styles.optionLabel}>SIZE</span>
            <div className={styles.sizeButtons}>
              {sizeChoices.map((size) => (
                <button
                  key={size.label}
                  type="button"
                  className={`${styles.sizeBtn} ${selectedSize === size.label ? styles.selected : ""}`}
                  aria-pressed={selectedSize === size.label}
                  onClick={() => setSelectedSize(size.label)}
                >
                  {size.label.toUpperCase()} · ${size.price}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.actionRow}>
            <div className={styles.qtyBox}>
              <span className={styles.optionLabel}>QTY</span>
              <div className={styles.qtyControls}>
                <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                  -
                </button>
                <span>{quantity}</span>
                <button type="button" aria-label="Increase quantity" onClick={() => setQuantity(quantity + 1)}>
                  +
                </button>
              </div>
            </div>

            <button type="button" className={styles.addBtn} onClick={handleAddToCart}>
              ADD TO BAG →
            </button>
          </div>

          <hr className={styles.divider} />

          <section className={styles.notes} aria-labelledby="allergen-title">
            <h3 id="allergen-title" className={styles.notesTitle}>
              <span className={styles.notesIcon} aria-hidden="true">
                ✓
              </span>
              Ingredients &amp; allergens
            </h3>
            {allergenInfo && allergenInfo.allergens.length > 0 ? (
              <div className={styles.allergenRow}>
                <span className={styles.allergenLabel}>Contains</span>
                <ul className={styles.allergenList}>
                  {allergenInfo.allergens.map((a) => (
                    <li key={a} className={styles.allergenChip}>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className={styles.note}>No major allergens listed for this product.</p>
            )}
            <p className={styles.note}>{ALLERGY_DISCLAIMER}</p>
          </section>
        </div>
      </div>
    </div>
  );
}