"use client";

import { useState } from "react";
import { products } from "@/api/data";
import { getSizes } from "@/lib/dataSize";
import { useCart } from "@/app/context/CartContext";
import type { Product as CartProduct } from "@/app/types/models";
import {
  FLAVOR_OPTIONS,
  getProductId,
  getProductImage,
  getProductName,
  useEventOrder,
  type CartItem,
  type Product,
} from "@/app/context/EventOrdercontext";
import styles from "./event.module.css";

type DetailedItem = CartItem & { productName: string; unitPrice: number };

const STEP = 2; // how many products "+Add more" reveals

// Same product + size + flavor => same cart id, so identical lines merge.
// Negative so it never collides with real product IDs.
const makeCartId = (key: string) => {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return -Math.abs(hash) - 1;
};

// getSizes may return strings or objects like { size: "Small", price: 5 }
const sizeLabel = (s: unknown): string => {
  if (typeof s === "string" || typeof s === "number") return String(s);
  if (s && typeof s === "object") {
    const o = s as Record<string, unknown>;
    const v = o.size ?? o.label ?? o.name ?? o.value ?? o.title;
    if (v != null) return String(v);
  }
  return "";
};

const sizesFor = (productId: number): string[] =>
  Array.from(
    new Set(((getSizes(productId) ?? []) as unknown[]).map(sizeLabel).filter(Boolean))
  );

/* ---------------- One slot ---------------- */

interface SlotCardProps {
  item: DetailedItem;
  index: number;
  showErrors: boolean;
  changing: boolean;
  onChange: () => void;
}

function SlotCard({ item, index, showErrors, changing, onChange }: SlotCardProps) {
  const { updateItem, removeItem } = useEventOrder();

  const product = products.find((p) => getProductId(p) === item.productId);
  const image = product ? getProductImage(product) : null;
  const name = product ? getProductName(product) : item.productName;
  const sizes = sizesFor(item.productId);
  const flavorMissing = showErrors && !item.selectedFlavor;

  return (
    <li className={styles.slot}>
      <div className={styles.slotThumb}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {image ? <img src={image} alt={name} /> : null}
      </div>

      <div>
        <div className={styles.slotHead}>
          <div>
            <h3 className={styles.slotName}>{name}</h3>
            <p className={styles.slotLabel}>Slot #{index + 1}</p>
            <p className={styles.slotPrice}>${item.unitPrice.toFixed(2)}</p>
          </div>

          <div className={styles.slotActions}>
            <button type="button" className={styles.change} onClick={onChange}>
              {changing ? "Pick a product…" : "Change"}
            </button>
            <button type="button" className={styles.remove} onClick={() => removeItem(item.id)}>
              Remove
            </button>
          </div>
        </div>

        <div className={styles.slotOptions}>
          <div>
            <label className={styles.optionLabel} htmlFor={`flavor-${item.id}`}>
              Flavor
            </label>
            <select
              id={`flavor-${item.id}`}
              className={`${styles.select} ${styles.slotSelect}`}
              value={item.selectedFlavor}
              aria-invalid={flavorMissing}
              onChange={(e) => updateItem(item.id, "selectedFlavor", e.target.value)}
            >
              <option value="">Select</option>
              {FLAVOR_OPTIONS.map((flavor: string) => (
                <option key={flavor} value={flavor}>
                  {flavor}
                </option>
              ))}
            </select>
            {flavorMissing && <span className={styles.error}>Choose a flavor</span>}
          </div>

          {sizes.length > 0 && (
            <div>
              <span className={styles.optionLabel} id={`size-${item.id}`}>
                Size
              </span>
              <div className={styles.sizes} role="group" aria-labelledby={`size-${item.id}`}>
                {sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={styles.size}
                    aria-pressed={item.selectedSize === size}
                    onClick={() => updateItem(item.id, "selectedSize", size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.slotQty}>
          <span className={styles.optionLabel} id={`qty-${item.id}`}>
            Qty
          </span>
          <div className={styles.qty} role="group" aria-labelledby={`qty-${item.id}`}>
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => updateItem(item.id, "quantity", Math.max(1, item.quantity - 1))}
            >
              −
            </button>
            <output aria-live="polite">{item.quantity}</output>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => updateItem(item.id, "quantity", item.quantity + 1)}
            >
              +
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

/* ---------------- Gallery + slots + calculator + cart ---------------- */

export default function ProductPicker() {
  const { totals, addItem, replaceItem, removeItem } = useEventOrder();
  const { addItem: addToCart } = useCart();

  const [visible, setVisible] = useState(STEP);
  const [changingId, setChangingId] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  const slots = totals.detailedItems as DetailedItem[];
  const hasSlots = slots.length > 0;
  const missingFlavor = slots.some((s) => !s.selectedFlavor);
  const changingIndex = changingId ? slots.findIndex((s) => s.id === changingId) : -1;

  // Gallery click: replace the slot being changed, otherwise toggle add/remove
  const handlePick = (product: Product) => {
    const productId = getProductId(product);

    if (changingId) {
      replaceItem(changingId, product);
      setChangingId(null);
      return;
    }

    const existing = slots.find((s) => s.productId === productId);
    if (existing) removeItem(existing.id);
    else addItem(product);
  };

  const handleAddToBag = () => {
    if (!hasSlots) return;
    if (missingFlavor) {
      setShowErrors(true);
      return;
    }

    slots.forEach((slot) => {
      const details = [slot.selectedSize, slot.selectedFlavor].filter(Boolean).join(", ");
      const product = products.find((p) => getProductId(p) === slot.productId);
      const cartProduct: CartProduct = {
        productID: makeCartId(`${slot.productId}|${slot.selectedSize}|${slot.selectedFlavor}`),
        name: details ? `${slot.productName} (${details})` : slot.productName,
        price: slot.unitPrice,
        tag: product?.tag ?? "",
        description: product?.description ?? (details || slot.productName),
        imageUrl: product?.imageUrl ?? "",
      };

      for (let i = 0; i < slot.quantity; i++) {
        addToCart(cartProduct);
      }
    });

    slots.forEach((slot) => removeItem(slot.id)); // clear the slots after adding
    setShowErrors(false);
  };

  return (
    <div>
      {/* Gallery */}
      <ul className={styles.gallery} aria-label="Products">
        {products.slice(0, visible).map((product, index) => {
          const productId = getProductId(product);
          const name = getProductName(product);
          const image = getProductImage(product);
          const selected = slots.some((s) => s.productId === productId);

          return (
            <li key={`${productId}-${index}`}>
              <button
                type="button"
                className={styles.product}
                aria-pressed={selected}
                onClick={() => handlePick(product)}
              >
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt={name} />
                ) : (
                  <span className={styles.productName}>{name}</span>
                )}
              </button>
            </li>
          );
        })}

        {visible < products.length && (
          <li>
            <button
              type="button"
              className={styles.addMore}
              onClick={() => setVisible((v) => v + STEP)}
            >
              +Add
              <br />
              More
            </button>
          </li>
        )}
      </ul>

      {changingId && changingIndex >= 0 && (
        <p className={styles.changeHint}>
          Pick a product above to replace slot #{changingIndex + 1}.{" "}
          <button type="button" className={styles.remove} onClick={() => setChangingId(null)}>
            Cancel
          </button>
        </p>
      )}

      {/* Slots */}
      {hasSlots && (
        <ul className={styles.slots} aria-label="Your bundle">
          {slots.map((item, index) => (
            <SlotCard
              key={item.id}
              item={item}
              index={index}
              showErrors={showErrors}
              changing={changingId === item.id}
              onChange={() => setChangingId(changingId === item.id ? null : item.id)}
            />
          ))}
        </ul>
      )}

      {/* Calculator total + cart */}
      {hasSlots && (
        <div className={styles.bagRow}>
          <div className={styles.bagTotal}>Total: ${totals.subtotal.toFixed(2)}</div>
          <button type="button" className={styles.addToBag} onClick={handleAddToBag}>
            ADD TO BAG →
          </button>
        </div>
      )}

      {showErrors && missingFlavor && (
        <p className={styles.error} role="alert">
          Choose a flavor for every slot before adding to bag.
        </p>
      )}
    </div>
  );
}