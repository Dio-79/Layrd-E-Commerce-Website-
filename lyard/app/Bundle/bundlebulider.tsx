"use client";

import { useState } from "react";
import type { Product } from "@/app/types/models";
import { products } from "@/api/data";
import { useCart } from "@/app/context/CartContext";
import {
  useBundle,
  findProduct,
  FLAVORS,
  SLOT_COUNT,
  getProductId,
  getProductName,
  getProductImage,
  getBasePrice,
  getProductSizes,
  getUnitPrice,
} from "@/app/context/Bundlecontext";
import styles from "./bundlebuilder.module.css";

const MIN_SLOTS = 3; // change this number to require more or fewer slots

// Same slots/options => same id, so identical bundles merge into one cart line
const makeBundleId = (key: string) => {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return -Math.abs(hash) - 1; // negative, never collides with real product IDs
};

export default function BundleBuilder() {
  const {
    slots,
    quantity,
    activeSlot,
    unitPrice,
    total,
    openPicker,
    closePicker,
    selectProduct,
    updateSlot,
    clearSlot,
    setQuantity,
    reset,
  } = useBundle();
  const { addItem } = useCart();
  const [showErrors, setShowErrors] = useState(false);

  const filledCount = slots.filter((s) => s !== null).length;
  const canAdd = filledCount >= MIN_SLOTS;
  const missingFlavor = slots.some((s) => s && !s.flavor); // only checks filled slots

  const handleAddToBag = () => {
    if (!canAdd) return;
    if (missingFlavor) {
      setShowErrors(true);
      return;
    }

    // Empty slots are skipped
    const summary = slots
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .map((s) => {
        const name = getProductName(findProduct(s.productId)!);
        return `${name} x${s.quantity} (${s.size}, ${s.flavor})`;
      })
      .join(", ");

    const bundleProduct: Product & { quantity: number } = {
      productID: makeBundleId(summary),
      name: `Custom Bundle: ${summary}`,
      price: unitPrice,
      tag: "Bundles",
      description: summary,
      imageUrl: "",
      quantity,
    };

    for (let i = 0; i < quantity; i++) {
      addItem(bundleProduct as Product);
    }
    setShowErrors(false);
    reset();
  };

  return (
    <section className={styles.builder}>
      {/* Slot grid */}
      <div className={styles.slotGrid}>
        {slots.map((slot, i) => {
          const product = findProduct(slot?.productId);

          if (!slot || !product) {
            return (
              <div key={i} className={styles.slot}>
                <button type="button" className={styles.emptyBox} onClick={() => openPicker(i)}>
                  +
                </button>
                <div className={styles.emptyLabel}>Empty Slot #{i + 1}</div>
                <button type="button" className={styles.addMoreBtn} onClick={() => openPicker(i)}>
                  +ADD More
                </button>
              </div>
            );
          }

          const sizes = getProductSizes(product);
          const slotPrice = getUnitPrice(product, slot.size) * slot.quantity;

          return (
            <div key={i} className={styles.slotFilled}>
              <div className={styles.slotTop}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getProductImage(product)}
                  alt={getProductName(product)}
                  className={styles.slotImg}
                />
                <div className={styles.slotInfo}>
                  <div className={styles.slotName}>{getProductName(product)}</div>
                  <div className={styles.slotLabel}>Slot #{i + 1}</div>
                  <div className={styles.slotPrice}>${slotPrice.toFixed(2)}</div>
                </div>
                <div className={styles.slotActions}>
                  <button type="button" className={styles.changeBtn} onClick={() => openPicker(i)}>
                    Change
                  </button>
                  <button type="button" className={styles.removeBtn} onClick={() => clearSlot(i)}>
                    Remove
                  </button>
                </div>
              </div>

              <div className={styles.slotOptions}>
                {/* Flavor per slot */}
                <div className={styles.optionCol}>
                  <label className={styles.optionLabel} htmlFor={`flavor-${i}`}>
                    FLAVOR
                  </label>
                  <select
                    id={`flavor-${i}`}
                    className={styles.slotSelect}
                    value={slot.flavor}
                    onChange={(e) => updateSlot(i, { flavor: e.target.value })}
                  >
                    <option value="">Select</option>
                    {FLAVORS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                  {showErrors && !slot.flavor && (
                    <span className={styles.errorMessage}>Please select a flavor</span>
                  )}
                </div>

                {/* Size per slot: only this product's sizes, each with its own price */}
                <div className={styles.optionCol}>
                  <span className={styles.optionLabel}>SIZE</span>
                  <div className={styles.slotSizeBtns}>
                    {sizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`${styles.slotSizeBtn} ${slot.size === s ? styles.sizeActive : ""}`}
                        onClick={() => updateSlot(i, { size: s })}
                        title={`$${getUnitPrice(product, s).toFixed(2)}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Qty per slot */}
                <div className={styles.optionCol}>
                  <span className={styles.optionLabel}>QTY</span>
                  <div className={styles.slotQty}>
                    <button type="button" onClick={() => updateSlot(i, { quantity: slot.quantity - 1 })}>
                      -
                    </button>
                    <span>{slot.quantity}</span>
                    <button type="button" onClick={() => updateSlot(i, { quantity: slot.quantity + 1 })}>
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <hr className={styles.divider} />

      {/* Footer: price, bundle qty, add to bag */}
      <div className={styles.footer}>
        <div className={styles.priceBox}>Price:${total.toFixed(2)}</div>

        <div className={styles.footerRight}>
          <div>
            <span className={styles.label}>BUNDLE QTY</span>
            <div className={styles.qty}>
              <button type="button" onClick={() => setQuantity(quantity - 1)}>
                -
              </button>
              <span>{quantity}</span>
              <button type="button" onClick={() => setQuantity(quantity + 1)}>
                +
              </button>
            </div>
          </div>

          <button
            type="button"
            className={styles.addToBag}
            disabled={!canAdd}
            onClick={handleAddToBag}
          >
            ADD TO BAG →
          </button>
        </div>
      </div>

      {!canAdd && (
        <p className={styles.hint}>
          Fill at least {MIN_SLOTS} slots to add to bag ({filledCount}/{MIN_SLOTS} selected)
        </p>
      )}

      {showErrors && missingFlavor && (
        <p className={styles.hint} style={{ color: "#b91c1c" }}>
          Choose a flavor for every filled slot before adding to bag.
        </p>
      )}

      {/* Picker modal */}
      {activeSlot !== null && (
        <div className={styles.backdrop} onClick={closePicker}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.closeX} onClick={closePicker}>
              ✕
            </button>
            <h2 className={styles.modalTitle}>CHOOSE ITEM FOR SLOT #{activeSlot + 1}</h2>
            <p className={styles.modalSub}>
              Select a flavor to populate this slot in your custom bundle.
            </p>

            <div className={styles.pickGrid}>
              {products.map((p) => (
                <div key={getProductId(p)} className={styles.pickCard}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getProductImage(p)} alt={getProductName(p)} className={styles.pickImg} />
                  <div className={styles.pickName}>{getProductName(p)}</div>
                  <div className={styles.pickPrice}>From ${getBasePrice(p).toFixed(2)}</div>
                  <button
                    type="button"
                    className={styles.selectBtn}
                    onClick={() => selectProduct(getProductId(p))}
                  >
                    SELECT
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}