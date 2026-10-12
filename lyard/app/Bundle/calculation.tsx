"use client";

import React, { useMemo } from "react";
import { products } from "@/lib/data";
import { getSizes, getPrice } from "@/lib/dataSize";
import { useBundle, BundleItem } from "@/app/context/Bundlecontext";
import styles from "./calculation.module.css";

// Keeps any existing `import { CartItem } from "./calculation"` working
export type CartItem = BundleItem;

interface SizeByProductProps {
  productId: number;
  selected: string;
}

function SizeByProduct({ productId, selected }: SizeByProductProps) {
  const sizeLabel = selected || "Standard";

  return (
    <div>
      <span>Size: {sizeLabel}</span>
      {productId > 0 ? <small> (Product #{productId})</small> : null}
    </div>
  );
}

interface CalculationProps {
  taxRate?: number;
}

export default function Calculation({ taxRate = 0.08 }: CalculationProps) {
  const {
    items,
    addItem: handleAddItem,
    updateItem: handleUpdateItem,
    removeItem: handleRemoveItem,
    clearAll: handleClearAll,
  } = useBundle();

  const totals = useMemo(() => {
    const detailedItems = items.map((item) => {
      const product = products.find((p) => "id" in p && Number(p.id) === item.productId);
      const basePrice = product && "price" in product ? Number(product.price) : 0;
      const sizePrice = product ? getPrice(product, item.selectedSize) ?? basePrice : basePrice;
      const unitPrice = sizePrice > 0 ? sizePrice : basePrice;
      const itemTotal = unitPrice * item.quantity;

      return {
        ...item,
        productName: product && "name" in product ? String(product.name) : `Product #${item.productId}`,
        unitPrice,
        itemTotal,
      };
    });

    const totalItems = detailedItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = detailedItems.reduce((sum, item) => sum + item.itemTotal, 0);
    const taxAmount = subtotal * taxRate;
    const grandTotal = subtotal + taxAmount;

    return { detailedItems, totalItems, subtotal, taxAmount, grandTotal };
  }, [items, taxRate]);

  return (
    <div className={styles.calcEngine}>
      <h2 className={styles.engineTitle}>Price Calculation Engine</h2>

      <div className={styles.catalogBtns}>
        {products.map((product) => {
          const prodId = "id" in product ? Number(product.id) : 0;
          const prodName = "name" in product ? String(product.name) : `Product #${prodId}`;
          return (
            <button key={prodId} type="button" className={styles.catalogBtn} onClick={() => handleAddItem(product)}>
              + Add {prodName}
            </button>
          );
        })}
      </div>

      {totals.detailedItems.length > 0 ? (
        <div>
          <table className={styles.calcTable}>
            <thead>
              <tr>
                <th>Product & Size</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {totals.detailedItems.map((item) => {
                const availableSizes = getSizes(item.productId) ?? [];

                return (
                  <tr key={item.id}>
                    <td>
                      <div>{item.productName}</div>
                      {availableSizes.length > 0 ? (
                        <select
                          value={item.selectedSize}
                          onChange={(e) => handleUpdateItem(item.id, "selectedSize", e.target.value)}
                        >
                          {availableSizes.map((sz) => (
                            <option key={String(sz)} value={String(sz)}>
                              Size: {String(sz)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <SizeByProduct productId={item.productId} selected={item.selectedSize} />
                      )}
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        className={styles.qtyInput}
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateItem(item.id, "quantity", Math.max(1, parseInt(e.target.value) || 1))
                        }
                      />
                    </td>
                    <td>${item.unitPrice.toFixed(2)}</td>
                    <td>${item.itemTotal.toFixed(2)}</td>
                    <td>
                      <button type="button" onClick={() => handleRemoveItem(item.id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <button type="button" className={styles.clearBtn} onClick={handleClearAll}>
            Clear All Slots
          </button>
        </div>
      ) : (
        <p>No items added yet. Click a product button above to begin automatic calculation.</p>
      )}

      <div className={styles.summarySection}>
        <div className={styles.summaryRow}>
          <span>Total Units ({totals.totalItems}):</span>
          <span>${totals.subtotal.toFixed(2)}</span>
        </div>
        <div className={styles.summaryRow}>
          <span>Estimated Sales Tax ({(taxRate * 100).toFixed(1)}%):</span>
          <span>${totals.taxAmount.toFixed(2)}</span>
        </div>
        <div className={`${styles.summaryRow} ${styles.grandTotal}`}>
          <strong>Grand Total:</strong>
          <strong>${totals.grandTotal.toFixed(2)}</strong>
        </div>
      </div>
    </div>
  );
}