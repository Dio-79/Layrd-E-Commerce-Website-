"use client";

import { useEffect, useRef, useState } from "react";
import { products, SECTIONS } from "@/lib/catelog/data";
import {
  FLAVOR_OPTIONS,
  getFromPrice,
  getProductId,
  getProductImage,
  getProductName,
  getProductSizes,
  getUnitPrice,
  useEventOrder,
  type DetailedItem,
  type Product,
} from "@/app/context/EventOrdercontext";
import styles from "./event.module.css";

// The picker lists drinks first, then cakes.
const PICKER_GROUPS = [...SECTIONS]
  .sort((a, b) => (a.id === "drinks" ? -1 : b.id === "drinks" ? 1 : 0))
  .map((section) => ({ ...section, items: products.filter((p) => p.section === section.id) }))
  .filter((g) => g.items.length > 0);

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
          <p className={styles.dialogSub}>Pick a drink or a cake for your event order.</p>

          {PICKER_GROUPS.map((group) => (
          <section key={group.id} aria-labelledby={`event-pick-${group.id}`}>
          <h3 id={`event-pick-${group.id}`} className={styles.choiceGroup}>
            {group.label.toUpperCase()}
          </h3>
          <ul className={styles.choices}>
            {group.items.map((product, index) => {
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
          </section>
          ))}
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
  onChange: () => void;
}

function SlotCard({ item, index, onChange }: SlotCardProps) {
  const { updateItem, removeItem, status } = useEventOrder();

  const product = products.find((p) => getProductId(p) === item.productId);
  const image = product ? getProductImage(product) : null;
  const name = product ? getProductName(product) : item.productName;
  const sizes = getProductSizes(item.productId); // unique string labels
  void status;
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
              Flavor (optional)
            </label>
            <select
              id={`flavor-${item.id}`}
              className={`${styles.select} ${styles.slotSelect}`}
              value={item.selectedFlavor}
              onChange={(e) => updateItem(item.id, "selectedFlavor", e.target.value)}
            >
              <option value="">No preference</option>
              {FLAVOR_OPTIONS.map((flavor: string) => (
                <option key={flavor} value={flavor}>
                  {flavor}
                </option>
              ))}
            </select>
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
                    {product ? ` · ${getUnitPrice(product, size).toFixed(2)}` : ""}
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
/* Page section: slot list + "+Add More" + running total             */
/* ------------------------------------------------------------------ */

type DialogTarget = null | "add" | { changeId: string };

export default function Calculationpage() {
  const { totals, addItem, replaceItem } = useEventOrder();
  const [target, setTarget] = useState<DialogTarget>(null);

  const slots = totals.detailedItems;
  const changeIndex =
    target && target !== "add" ? slots.findIndex((s) => s.id === target.changeId) : -1;
  const slotNumber = target === "add" ? slots.length + 1 : changeIndex + 1;

  const handleSelect = (product: Product) => {
    if (target === "add") addItem(product);
    else if (target) replaceItem(target.changeId, product);
    setTarget(null);
  };

  return (
    <div>
      {slots.length > 0 && (
        <ul className={styles.slots} aria-label="Your bundle">
          {slots.map((item, index) => (
            <SlotCard
              key={item.id}
              item={item}
              index={index}
              onChange={() => setTarget({ changeId: item.id })}
            />
          ))}
        </ul>
      )}

      <div className={styles.addMoreRow}>
        <button type="button" className={styles.addMore} onClick={() => setTarget("add")}>
          {slots.length === 0 ? "+ ADD ITEMS" : "+ ADD MORE"}
        </button>
      </div>

      {slots.length > 0 && (
        <div className={styles.bagTotal}>Total: ${totals.subtotal.toFixed(2)}</div>
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