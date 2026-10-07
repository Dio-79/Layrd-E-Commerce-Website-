"use client";
import { useForm } from 'react-hook-form';

import React, { useState, useMemo } from "react";
import { products } from "@/lib/data";
import { getSizes, getPrice } from "@/lib/dataSize";

type Product = (typeof products)[number];

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

export interface CartItem {
  id: string;
  productId: number;
  selectedSize: string;
  quantity: number;
}

interface CalculationProps {
  taxRate?: number;
}


export default function Calculation({ taxRate = 0.08 }: CalculationProps) {
  const [items, setItems] = useState<CartItem[]>([]);

  const findProductById = (productId: number) => {
    return products.find((p) => "id" in p && Number(p.id) === productId) as Product | undefined;
  };

  const handleAddItem = (product: Product) => {
    const productId = "id" in product ? Number(product.id) : 0;
    const availableSizes = getSizes(productId) ?? [];
    const defaultSize = availableSizes.length > 0 ? String(availableSizes[0]) : "Standard";

    const newItem: CartItem = {
      id: crypto.randomUUID(),
      productId,
      selectedSize: defaultSize,
      quantity: 1,
    };

    setItems((prev) => [...prev, newItem]);
  };
   type OrderFormValues = {
    Flavor?: string;
  };

  const { register } = useForm<OrderFormValues>({ mode: "onBlur" });

  const handleUpdateItem = (id: string, field: "selectedSize" | "quantity", value: string | number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    setItems([]);
  };

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

    return {
      detailedItems,
      totalItems,
      subtotal,
      taxAmount,
      grandTotal,
    };
  }, [items, taxRate]);

  return (
    <div>
      <h2>Price Calculation Engine</h2>

      {/* Product Catalog Buttons */}
      <div>
        <h3>Select Product to Add</h3>
        <div>
          {products.map((product) => {
            const prodId = "id" in product ? Number(product.id) : 0;
            const prodName = "name" in product ? String(product.name) : `Product #${prodId}`;
            return (
              <button key={prodId} type="button" onClick={() => handleAddItem(product)}>
                + Add {prodName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Items Table / List */}
      {totals.detailedItems.length > 0 ? (
        <div>
          <table>
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
                       <label htmlFor="Flavor">
             <select id="Flavor" {...register('Flavor')}>
                <option value={""}></option>
                </select>  
                </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateItem(
                            item.id,
                            "quantity",
                            Math.max(1, parseInt(e.target.value) || 1)
                          )
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

          <div>
            <button type="button" onClick={handleClearAll}>
              Clear All Slots
            </button>
          </div>
        </div>
      ) : (
        <div>No items added yet. Click a product button above to begin automatic calculation.</div>
      )}

      {/* Summary Section */}
      <div>
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