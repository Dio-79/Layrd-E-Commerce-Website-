"use client";

import React from "react";
import { products } from "@/lib/data";
import { getSizes } from "@/lib/dataSize";
import { useEventOrder } from "@/app/context/EventOrdercontext";
import styles from "./event.module.css";

const FLAVOR_OPTIONS = [
  "Vanilla",
  "Chocolate",
  "Strawberry",
  "Cookies & Cream",
  "Mint",
  "Caramel",
] as const;

type ProductLike = (typeof products)[number];

type DetailedOrderItem = {
  id: number;
  productId: number;
  productName: string;
  selectedSize: string;
  selectedFlavor: string;
  quantity: number;
  unitPrice: number;
  itemTotal: number;
};

type EventOrderLike = {
  addItem?: (product: ProductLike) => void;
  updateItem?: (itemId: number, field: string, value: number | string) => void;
  removeItem?: (itemId: number) => void;
  clearItems?: () => void;
  taxRate?: number;
  totals?: {
    detailedItems: DetailedOrderItem[];
    totalItems: number;
    subtotal: number;
    taxAmount: number;
    grandTotal: number;
  };
};

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

export default function Calculationpage() {
  const eventOrder = useEventOrder() as EventOrderLike;
  const addItem = eventOrder.addItem ?? (() => {});
  const updateItem = eventOrder.updateItem ?? (() => {});
  const taxRate = Number(eventOrder.taxRate ?? 0);

  const removeItem = (itemId: number) => {
    eventOrder.removeItem?.(itemId);
  };

  const clearItems = () => {
    eventOrder.clearItems?.();
  };

  const totals = eventOrder.totals ?? {
    detailedItems: [],
    totalItems: 0,
    subtotal: 0,
    taxAmount: 0,
    grandTotal: 0,
  };

  return (
    <div className={styles.section}>
      <h2>Price Calculation Engine</h2>

      {/* Product Catalog Buttons */}
      <div>
        <h3>Select Product to Add</h3>
        <div>
          {products.map((product) => {
            const prodId = "id" in product ? Number(product.id) : 0;
            const prodName = "name" in product ? String(product.name) : `Product #${prodId}`;
            return (
              <button key={prodId} type="button" onClick={() => addItem(product)}>
                + Add {prodName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Items */}
      {totals.detailedItems.length > 0 ? (
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Product & Details</th>
                <th>Flavor</th>
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
                          onChange={(e) => updateItem(item.id, "selectedSize", e.target.value)}
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
                      <select
                        value={item.selectedFlavor}
                        onChange={(e) => updateItem(item.id, "selectedFlavor", e.target.value)}
                      >
                        {FLAVOR_OPTIONS.map((flavor) => (
                          <option key={flavor} value={flavor}>
                            {flavor}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(item.id, "quantity", Math.max(1, parseInt(e.target.value) || 1))
                        }
                      />
                    </td>
                    <td>${item.unitPrice.toFixed(2)}</td>
                    <td>${item.itemTotal.toFixed(2)}</td>
                    <td>
                      <button type="button" onClick={() => removeItem(item.id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div>
            <button type="button" onClick={clearItems}>
              Clear All Slots
            </button>
          </div>
        </div>
      ) : (
        <div>No items added yet. Click a product button above to begin automatic calculation.</div>
      )}

      {/* Summary */}
      <div className={styles.summary}>
        <div>
          <span>Total Units ({totals.totalItems}): </span>
          <span>${totals.subtotal.toFixed(2)}</span>
        </div>
        <div>
          <span>Estimated Sales Tax ({(taxRate * 100).toFixed(1)}%): </span>
          <span>${totals.taxAmount.toFixed(2)}</span>
        </div>
        <hr />
        <div>
          <strong>Grand Total: </strong>
          <strong>${totals.grandTotal.toFixed(2)}</strong>
        </div>
      </div>
    </div>
  );
}