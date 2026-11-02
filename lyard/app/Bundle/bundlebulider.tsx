"use client";
import { useRouter } from "next/navigation";
import { products, SECTIONS, type CatalogProduct } from "@/lib/catelog/data";
import {
  useBundle,
  findProduct,
  getProductId,
  getProductName,
  getProductImage,
  getProductSizes,
  getUnitPrice,
  type Product,
} from "@/app/context/Bundlecontext";
import { getAllergenInfo } from "@/lib/catelog/dataAllergens";
import { saveBundleDraft } from "@/lib/Bundle/Bundlecheckoutstore";
import type { BundleLine } from "@/lib/Bundle/bundleRules";
import styles from "./bundlebuilder.module.css";

const MIN_SLOTS = 3; // change this number to require more or fewer slots

/** Lowest price across the product's sizes, for "From $X". */
const fromPrice = (p: Product) => Math.min(...getProductSizes(p).map((s) => getUnitPrice(p, s)));

// The picker lists drinks first, then cakes. Ready-made bundles can't go inside a bundle.
const PICKER_GROUPS = [...SECTIONS]
  .sort((a, b) => (a.id === "drinks" ? -1 : b.id === "drinks" ? 1 : 0))
  .map((section) => ({
    ...section,
    items: products.filter(
      (p: CatalogProduct) => p.section === section.id && !p.categories.some((c) => c === "Bundles")
    ),
  }))
  .filter((g) => g.items.length > 0);

export default function BundleBuilder() {
  const router = useRouter();
  const {
    slots,
    quantity,
    activeSlot,
    total,
    openPicker,
    closePicker,
    selectProduct,
    updateSlot,
    clearSlot,
    setQuantity,
    reset,
  } = useBundle();

  const filledCount = slots.filter((s) => s !== null).length;
  const canAdd = filledCount >= MIN_SLOTS;

  // The bundle has its own checkout (pickup or delivery date, payment) and confirmation.
  const checkoutBundle = () => {
    if (!canAdd) return;
    const lines: BundleLine[] = [];
    slots.forEach((s, i) => {
      if (!s) return;
      const product = findProduct(s.productId);
      if (!product) return;
      lines.push({
        id: `${i}-${getProductId(product)}-${s.size}`,
        productId: Number(getProductId(product)),
        name: getProductName(product),
        size: s.size,
        flavor: s.flavor,
        quantity: s.quantity * quantity, // items per slot x bundle quantity
        unitPrice: getUnitPrice(product, s.size),
        image: getProductImage(product),
      });
    });
    if (lines.length === 0) return;
    saveBundleDraft({ lines });
    reset();
    router.push("/Bundle/checkout");
  };

  return (
    <section className={styles.builder}>
      <header className={styles.intro}>
        <h1 className={styles.introTitle}>BUILD YOUR BUNDLE</h1>
        <p className={styles.introText}>
          Fill at least {MIN_SLOTS} of the {slots.length} slots with drinks and cakes, choose sizes, then check out to pick a
          pickup or delivery time.
        </p>
      </header>

      {/* Slot grid */}
      <div className={styles.slotGrid}>
        {slots.map((slot, i) => {
          const product = findProduct(slot?.productId);

          if (!slot || !product) {
            return (
              <div key={i} className={styles.slot}>
                <button
                  type="button"
                  className={styles.emptyBox}
                  onClick={() => openPicker(i)}
                  aria-label={`Choose an item for slot ${i + 1}`}
                >
                  +
                </button>
                <div className={styles.emptyLabel}>Empty Slot #{i + 1}</div>
                <button type="button" className={styles.addMoreBtn} onClick={() => openPicker(i)}>
                  +ADD
                </button>
              </div>
            );
          }

          const sizes = getProductSizes(product);
          const slotPrice = getUnitPrice(product, slot.size) * slot.quantity;
          const allergens = getAllergenInfo(Number(getProductId(product))).allergens;

          return (
            <div key={i} className={styles.slotFilled}>
              <div className={styles.slotTop}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getProductImage(product)} alt={getProductName(product)} className={styles.slotImg} />
                <div className={styles.slotInfo}>
                  <div className={styles.slotName}>{getProductName(product)}</div>
                  <div className={styles.slotLabel}>Slot #{i + 1}</div>
                  <div className={styles.slotPrice}>${slotPrice.toFixed(2)}</div>
                  {allergens.length > 0 && (
                    <div className={styles.slotLabel}>Contains: {allergens.join(", ")}</div>
                  )}
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
                {/* Size per slot: only this product's sizes, each with its own price */}
                {sizes.some(Boolean) && (
                  <div className={styles.optionCol}>
                    <span className={styles.optionLabel}>SIZE</span>
                    <div className={styles.slotSizeBtns}>
                      {sizes.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={`${styles.slotSizeBtn} ${slot.size === s ? styles.sizeActive : ""}`}
                          aria-pressed={slot.size === s}
                          onClick={() => updateSlot(i, { size: s })}
                          title={`$${getUnitPrice(product, s).toFixed(2)}`}
                        >
                          {s} · ${getUnitPrice(product, s).toFixed(2)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Qty per slot */}
                <div className={styles.optionCol}>
                  <span className={styles.optionLabel}>QTY</span>
                  <div className={styles.slotQty}>
                    <button
                      type="button"
                      aria-label="Fewer"
                      onClick={() => updateSlot(i, { quantity: slot.quantity - 1 })}
                    >
                      -
                    </button>
                    <span>{slot.quantity}</span>
                    <button
                      type="button"
                      aria-label="More"
                      onClick={() => updateSlot(i, { quantity: slot.quantity + 1 })}
                    >
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
        <div className={styles.priceBox}>Price: ${total.toFixed(2)}</div>

        <div className={styles.footerRight}>
          <div>
            <span className={styles.label}>BUNDLE QTY</span>
            <div className={styles.qty}>
              <button type="button" aria-label="Fewer bundles" onClick={() => setQuantity(quantity - 1)}>
                -
              </button>
              <span>{quantity}</span>
              <button type="button" aria-label="More bundles" onClick={() => setQuantity(quantity + 1)}>
                +
              </button>
            </div>
          </div>

          <button type="button" className={styles.addToBag} disabled={!canAdd} onClick={checkoutBundle}>
            CHECK OUT BUNDLE →
          </button>
        </div>
      </div>

      {!canAdd && (
        <p className={styles.hint}>
          Fill at least {MIN_SLOTS} slots to check out ({filledCount}/{MIN_SLOTS} selected)
        </p>
      )}

      {/* Picker modal: drinks first, then cakes */}
      {activeSlot !== null && (
        <div className={styles.backdrop} onClick={closePicker}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bundle-picker-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className={styles.closeX} onClick={closePicker} aria-label="Close">
              ✕
            </button>
            <h2 id="bundle-picker-title" className={styles.modalTitle}>
              CHOOSE ITEM FOR SLOT #{activeSlot + 1}
            </h2>
            <p className={styles.modalSub}>Pick a drink or a cake for this slot of your bundle.</p>

            {PICKER_GROUPS.map((group) => (
              <section key={group.id} aria-labelledby={`pick-${group.id}`}>
                <h3 id={`pick-${group.id}`} className={styles.pickGroupTitle}>
                  {group.label.toUpperCase()}
                </h3>
                <div className={styles.pickGrid}>
                  {group.items.map((item) => {
                    const p = item as unknown as Product;
                    return (
                      <div key={getProductId(p)} className={styles.pickCard}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={getProductImage(p)} alt="" className={styles.pickImg} />
                        <div className={styles.pickName}>{getProductName(p)}</div>
                        <div className={styles.pickPrice}>From ${fromPrice(p).toFixed(2)}</div>
                        <button
                          type="button"
                          className={styles.selectBtn}
                          onClick={() => selectProduct(getProductId(p))}
                          aria-label={`Select ${getProductName(p)}`}
                        >
                          SELECT
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
