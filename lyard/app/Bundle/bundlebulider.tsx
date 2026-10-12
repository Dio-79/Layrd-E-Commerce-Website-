"use client";

import { useState } from "react";
import { products } from "@/lib/data";
import { useCart } from "@/app/context/CartContext";
import {
  useBundle,
  findProduct,
  SIZES,
  FLAVORS,
  SLOT_COUNT,
  getProductId,
  getProductName,
  getProductImage,
  getBasePrice,
} from "@/app/context/Bundlecontext";
import styles from "./bundlebuilder.module.css";

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

  const allFilled = slots.every((s) => s !== null);
  const missingFlavor = slots.some((s) => s && !s.flavor);

  const handleAddToBag = () => {
    if (!allFilled) return;
    if (missingFlavor) {
      setShowErrors(true);
      return;
    }

    const summary = slots
      .map((s) => {
        if (!s) return "";
        const name = getProductName(findProduct(s.productId)!);
        return `${name} x${s.quantity} (${s.size}, ${s.flavor})`;
      })
      .join(", ");

    const bundleProduct: Parameters<typeof addItem>[0] = {
      productID: makeBundleId(summary),
      name: `Custom Bundle: ${summary}`,
      price: unitPrice,
      tag: "bundle",
      description: `Custom bundle: ${summary}`,
      imageUrl: getProductImage(findProduct(slots[0]!.productId)!),
    };

    addItem(bundleProduct);
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

                {/* Size per slot */}
                <div className={styles.optionCol}>
                  <span className={styles.optionLabel}>SIZE</span>
                  <div className={styles.slotSizeBtns}>
                    {SIZES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`${styles.slotSizeBtn} ${slot.size === s ? styles.sizeActive : ""}`}
                        onClick={() => updateSlot(i, { size: s })}
                      >
                        {s.charAt(0)}
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
            disabled={!allFilled}
            onClick={handleAddToBag}
          >
            ADD TO BAG →
          </button>
        </div>
      </div>

      {showErrors && missingFlavor && (
        <p className={styles.errorMessage}>Choose a flavor for every slot before adding to bag.</p>
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