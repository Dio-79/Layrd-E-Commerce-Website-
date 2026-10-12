"use client";

import { products } from "@/lib/data";
import { useCart } from "@/app/context/CartContext";
import {
  useBundle, findProduct, SIZES, SLOT_COUNT,
  getProductId, getProductName, getProductImage, getBasePrice,
} from "@/app/context/Bundlecontext";
import styles from "./bundlebuilder.module.css";

type BundleCartItem = {
  productID: number;
  name: string;
  price: number;
  tag: string;
  description: string;
  imageUrl: string;
};

export default function BundleBuilder() {
  const {
    slots, size, quantity, activeSlot, total,
    openPicker, closePicker, selectProduct, fillEmptySlots,
    clearSlot, setSize, setQuantity, reset,
  } = useBundle();
  const { addItem } = useCart();

  const allFilled = slots.every((s) => s !== null);

  const handleAddToBag = () => {
    if (!allFilled) return;

    const bundlePrice = total / quantity;
    const bundleItem: BundleCartItem = {
      productID: Date.now(),
      name: `Custom Bundle (${SLOT_COUNT} items, ${size})`,
      price: bundlePrice,
      tag: "Custom Bundle",
      description: `Custom bundle with ${SLOT_COUNT} items in ${size} size`,
      imageUrl: products[0]?.imageUrl ?? "/placeholder.png",
    };

    addItem(bundleItem);
    for (let i = 1; i < quantity; i++) {
      addItem({
        ...bundleItem,
        productID: Date.now(),
      });
    }
    reset();
  };

  return (
    <section className={styles.builder}>
      {/* Slot grid */}
      <div className={styles.slotGrid}>
        {slots.map((productId, i) => {
          const product = findProduct(productId);
          return product ? (
            <div key={i} className={styles.slot}>
              <img src={getProductImage(product)} alt="" className={styles.slotImg} />
              <div className={styles.slotInfo}>
                <div className={styles.slotName}>{getProductName(product)}</div>
                <div className={styles.slotLabel}>Slot #{i + 1}</div>
              </div>
              <button type="button" className={styles.changeBtn} onClick={() => openPicker(i)}>
                Change
              </button>
            </div>
          ) : (
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
        })}
      </div>

      <hr className={styles.divider} />

      {/* Controls */}
      <div className={styles.controls}>
        <select
          className={styles.flavorSelect}
          value=""
          onChange={(e) => e.target.value && fillEmptySlots(Number(e.target.value))}
        >
          <option value="">Select flavors per slot</option>
          {products.map((p) => (
            <option key={getProductId(p)} value={getProductId(p)}>
              Fill empty slots with {getProductName(p)}
            </option>
          ))}
        </select>

        <div className={styles.sizeGroup}>
          <span className={styles.label}>SIZE</span>
          <div className={styles.sizeButtons}>
            {SIZES.map((s) => (
              <button
                key={s}
                type="button"
                className={`${styles.sizeBtn} ${size === s ? styles.sizeActive : ""}`}
                onClick={() => setSize(s)}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.priceBox}>Price:${total.toFixed(2)}</div>

        <div className={styles.footerRight}>
          <div>
            <span className={styles.label}>QTY</span>
            <div className={styles.qty}>
              <button type="button" onClick={() => setQuantity(quantity - 1)}>-</button>
              <span>{quantity}</span>
              <button type="button" onClick={() => setQuantity(quantity + 1)}>+</button>
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

      {/* Picker modal */}
      {activeSlot !== null && (
        <div className={styles.backdrop} onClick={closePicker}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.closeX} onClick={closePicker}>✕</button>
            <h2 className={styles.modalTitle}>CHOOSE ITEM FOR SLOT #{activeSlot + 1}</h2>
            <p className={styles.modalSub}>Select a flavor to populate this slot in your custom bundle.</p>

            <div className={styles.pickGrid}>
              {products.map((p) => (
                <div key={getProductId(p)} className={styles.pickCard}>
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