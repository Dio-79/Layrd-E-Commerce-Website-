"use client";

import { useEffect, useRef, useState } from "react";
import { products } from "@/lib/data";
import { getSizes } from "@/lib/dataSize";
import { useCart } from "@/app/context/CartContext";
import {
  FLAVOR_OPTIONS,
  getFromPrice,
  getProductId,
  getProductImage,
  getProductName,
  useEventOrder,
  type CartItem,
  type Product,
} from "@/app/context/EventOrdercontext";
import styles from "./event.module.css";

type DetailedItem = CartItem & { productName: string; unitPrice: number };

// Same product + size + flavor => same id, so identical lines merge in the cart.
// Negative so it never collides with real product IDs.
const makeCartId = (key: string) => {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return -Math.abs(hash) - 1;
};

/* ------------------------------------------------------------------ */
/* "Choose item for slot #N" dialog                                   */
/* ------------------------------------------------------------------ */

interface DialogProps {
  open: boolean;
  slotNumber: number;
  onClose: () => void;
  onSelect: (product: Product) => void;
}

function ChooseItemDialog({ open, slotNumber, onClose, onSelect }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="slot-dialog-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {open && (
        <div className={styles.dialogInner}>
          <button type="button" className={styles.dialogClose} aria-label="Close" onClick={onClose}>
            ×
          </button>

          <h2 id="slot-dialog-title" className={styles.dialogTitle}>
            Choose item for slot #{slotNumber}
          </h2>
          <p className={styles.dialogSub}>
            Select a flavor to populate this slot in your custom bundle.
          </p>

          <ul className={styles.choices}>
            {products.map((product, index) => {
              const name = getProductName(product);
              const image = getProductImage(product);

              return (
                <li key={`${getProductId(product)}-${index}`} className={styles.choice}>
                  <div className={styles.choiceImg}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {image ? <img src={image} alt="" /> : null}
                  </div>
                  <h3 className={styles.choiceName}>{name}</h3>
                  <p className={styles.choicePrice}>From ${getFromPrice(product).toFixed(2)}</p>
                  <button
                    type="button"
                    className={styles.selectBtn}
                    aria-label={`Select ${name}`}
                    onClick={() => onSelect(product)}
                  >
                    Select
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </dialog>
  );
}

/* ------------------------------------------------------------------ */
/* One slot: image, flavor, size, quantity                            */
/* ------------------------------------------------------------------ */

interface SlotCardProps {
  item: DetailedItem;
  index: number;
  showErrors: boolean;
  onChange: () => void;
}

function SlotCard({ item, index, showErrors, onChange }: SlotCardProps) {
  const { updateItem, removeItem } = useEventOrder();

  const product = products.find((p) => "id" in p && Number(p.id) === item.productId);
  const image = product ? getProductImage(product) : null;
  const sizes = (getSizes(item.productId) ?? []).map(String);
  const flavorMissing = showErrors && !item.selectedFlavor;

  return (
    <li className={styles.slot}>
      <div className={styles.slotThumb}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {image ? <img src={image} alt={item.productName} /> : null}
      </div>

      <div>
        <div className={styles.slotHead}>
          <div>
            <h3 className={styles.slotName}>{item.productName}</h3>
            <p className={styles.slotLabel}>Slot #{index + 1}</p>
            <p className={styles.slotPrice}>${item.unitPrice.toFixed(2)}</p>
          </div>

          <div className={styles.slotActions}>
            <button type="button" className={styles.change} onClick={onChange}>
              Change
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

/* ------------------------------------------------------------------ */
/* Page section: slot list + "+Add More" + "Add to bag"              */
/* ------------------------------------------------------------------ */

type DialogTarget = null | "add" | { changeId: string };

export default function Calculationpage() {
  const { totals, addItem, replaceItem, removeItem } = useEventOrder();
  const { addItem: addToCart } = useCart();
  const [target, setTarget] = useState<DialogTarget>(null);
  const [showErrors, setShowErrors] = useState(false);

  const slots = totals.detailedItems as DetailedItem[];
  const changeIndex =
    target && target !== "add" ? slots.findIndex((s) => s.id === target.changeId) : -1;
  const slotNumber = target === "add" ? slots.length + 1 : changeIndex + 1;

  const hasSlots = slots.length > 0;
  const missingFlavor = slots.some((s) => !s.selectedFlavor);

  const handleSelect = (product: Product) => {
    if (target === "add") addItem(product);
    else if (target) replaceItem(target.changeId, product);
    setTarget(null);
  };

  const handleAddToBag = () => {
    if (!hasSlots) return;
    if (missingFlavor) {
      setShowErrors(true);
      return;
    }

    // One cart line per slot; quantity is represented by repeating the same product in cart.
    slots.forEach((slot) => {
      const baseProduct = products.find((product) => product.productID === slot.productId);
      const details = [slot.selectedSize, slot.selectedFlavor].filter(Boolean).join(", ");
      const cartProduct: Product = {
        productID: makeCartId(`${slot.productId}|${slot.selectedSize}|${slot.selectedFlavor}`),
        name: details ? `${slot.productName} (${details})` : slot.productName,
        price: slot.unitPrice,
        tag: baseProduct?.tag ?? "",
        description: baseProduct?.description ?? `${slot.productName} custom bundle item`,
        imageUrl: baseProduct?.imageUrl ?? "",
      };

      for (let i = 0; i < slot.quantity; i += 1) {
        addToCart(cartProduct);
      }
    });

    // Clear the order now that it's in the cart
    slots.forEach((slot) => removeItem(slot.id));
    setShowErrors(false);
  };

  return (
    <div>
      {hasSlots && (
        <ul className={styles.slots} aria-label="Your bundle">
          {slots.map((item, index) => (
            <SlotCard
              key={item.id}
              item={item}
              index={index}
              showErrors={showErrors}
              onChange={() => setTarget({ changeId: item.id })}
            />
          ))}
        </ul>
      )}

      <div className={styles.addMoreRow}>
        <button type="button" className={styles.addMore} onClick={() => setTarget("add")}>
          +Add
          <br />
          More
        </button>
      </div>

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

      <ChooseItemDialog
        open={target !== null}
        slotNumber={slotNumber}
        onClose={() => setTarget(null)}
        onSelect={handleSelect}
      />
    </div>
  );
}