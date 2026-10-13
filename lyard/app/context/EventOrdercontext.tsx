"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { products } from "@/lib/data";
import { getSizes, getPrice } from "@/lib/dataSize";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type Product = (typeof products)[number];

// Same shape as the `timestamp` type in your Selections form.
export type EventDetails = {
  Starttime: string;
  number: string;
  type: string;
};

export interface CartItem {
  id: string;
  productId: number;
  selectedSize: string;
  selectedFlavor: string;
  quantity: number;
}

export type SubmitStatus = "idle" | "submitting" | "success" | "error";

export const FLAVOR_OPTIONS = [
  "Vanilla Layer Cake",
  "Chocolate Espresso",
  "Salted Caramel",
  "Red Velvet",
  "Hazelnut Crunch",
];

// Change this to your real endpoint.
const ORDER_ENDPOINT = "/api/event-orders";

/* ------------------------------------------------------------------ */
/* Context shape                                                      */
/* ------------------------------------------------------------------ */

type Validator = () => Promise<boolean>;

interface EventOrderContextValue {
  // Event details (Selections form)
  details: EventDetails;
  updateDetails: (patch: Partial<EventDetails>) => void;

  // Comment (Request form)
  comment: string;
  setComment: (value: string) => void;

  // Attachment (Uploadfile)
  file: File | null;
  setFile: (file: File | null) => void;

  // Cart (Calculationpage)
  items: CartItem[];
  addItem: (product: Product) => void;
  updateItem: (
    id: string,
    field: "selectedSize" | "selectedFlavor" | "quantity",
    value: string | number
  ) => void;
  removeItem: (id: string) => void;
  replaceItem: (id: string, product: Product) => void;
  clearItems: () => void;
  taxRate: number;
  totals: {
    detailedItems: Array<
      CartItem & { productName: string; unitPrice: number; itemTotal: number }
    >;
    totalItems: number;
    subtotal: number;
    taxAmount: number;
    grandTotal: number;
  };

  // Submission
  registerValidator: (key: string, fn: Validator) => () => void;
  submitOrder: () => Promise<void>;
  status: SubmitStatus;
  submitError: string;
}

const EventOrderContext = createContext<EventOrderContextValue | null>(null);

/* ------------------------------------------------------------------ */
/* Provider                                                           */
/* ------------------------------------------------------------------ */

export function EventOrderProvider({
  children,
  taxRate = 0.08,
}: {
  children: ReactNode;
  taxRate?: number;
}) {
  const [details, setDetails] = useState<EventDetails>({
    Starttime: "",
    number: "",
    type: "",
  });
  const [comment, setComment] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [submitError, setSubmitError] = useState("");

  // Each form registers its own validate/trigger function here,
  // so the Submit button can check every form before sending.
  const validators = useRef(new Map<string, Validator>());

  const registerValidator = useCallback((key: string, fn: Validator) => {
    validators.current.set(key, fn);
    return () => {
      validators.current.delete(key);
    };
  }, []);

  const updateDetails = useCallback((patch: Partial<EventDetails>) => {
    setDetails((prev) => ({ ...prev, ...patch }));
  }, []);

  /* ----- cart actions (from your Calculationpage) ----- */

  const addItem = useCallback((product: Product) => {
    const productId = "id" in product ? Number(product.id) : 0;
    const availableSizes = getSizes(productId) ?? [];
    const defaultSize =
      availableSizes.length > 0 ? String(availableSizes[0]) : "Standard";

    const newItem: CartItem = {
      id: crypto.randomUUID(),
      productId,
      selectedSize: defaultSize,
      selectedFlavor: "",
      quantity: 1,
    };
    setItems((prev) => [...prev, newItem]);
  }, []);

  const updateItem = useCallback(
    (
      id: string,
      field: "selectedSize" | "selectedFlavor" | "quantity",
      value: string | number
    ) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
      );
    },
    []
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // "Change" on a slot: swap the product, keep flavor + quantity, reset size.
  const replaceItem = useCallback((id: string, product: Product) => {
    const productId = "id" in product ? Number(product.id) : 0;
    const sizes = getSizes(productId) ?? [];
    const defaultSize = sizes.length > 0 ? String(sizes[0]) : "Standard";
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, productId, selectedSize: defaultSize } : item
      )
    );
  }, []);

  const clearItems = useCallback(() => setItems([]), []);

  const totals = useMemo(() => {
    const detailedItems = items.map((item) => {
      const product = products.find(
        (p) => "id" in p && Number(p.id) === item.productId
      );
      const basePrice = product && "price" in product ? Number(product.price) : 0;
      const sizePrice = product
        ? getPrice(product, item.selectedSize) ?? basePrice
        : basePrice;
      const unitPrice = sizePrice > 0 ? sizePrice : basePrice;

      return {
        ...item,
        productName:
          product && "name" in product
            ? String(product.name)
            : `Product #${item.productId}`,
        unitPrice,
        itemTotal: unitPrice * item.quantity,
      };
    });

    const totalItems = detailedItems.reduce((s, i) => s + i.quantity, 0);
    const subtotal = detailedItems.reduce((s, i) => s + i.itemTotal, 0);
    const taxAmount = subtotal * taxRate;

    return {
      detailedItems,
      totalItems,
      subtotal,
      taxAmount,
      grandTotal: subtotal + taxAmount,
    };
  }, [items, taxRate]);

  /* ----- submit everything in one request ----- */

  const submitOrder = useCallback(async () => {
    setSubmitError("");

    const results = await Promise.all(
      [...validators.current.values()].map((validate) => validate())
    );
    if (results.some((ok) => !ok)) {
      setStatus("error");
      setSubmitError("Some fields need attention before you can submit.");
      return;
    }
    if (items.length === 0) {
      setStatus("error");
      setSubmitError("Add at least one product to the order.");
      return;
    }
    const missingFlavor = items.findIndex((item) => !item.selectedFlavor);
    if (missingFlavor !== -1) {
      setStatus("error");
      setSubmitError(`Choose a flavor for slot #${missingFlavor + 1}.`);
      return;
    }

    setStatus("submitting");
    try {
      const body = new FormData();
      body.append(
        "order",
        JSON.stringify({
          details,
          comment,
          items: totals.detailedItems,
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          grandTotal: totals.grandTotal,
        })
      );
      // Don't set Content-Type manually: the browser adds the multipart boundary.
      if (file) body.append("file", file);

      const response = await fetch(ORDER_ENDPOINT, { method: "POST", body });
      if (!response.ok) throw new Error("The order could not be sent.");

      setStatus("success");
    } catch (error) {
      setStatus("error");
      setSubmitError(
        error instanceof Error ? error.message : "The order could not be sent."
      );
    }
  }, [comment, details, file, items, totals]);

  const value = useMemo<EventOrderContextValue>(
    () => ({
      details,
      updateDetails,
      comment,
      setComment,
      file,
      setFile,
      items,
      addItem,
      updateItem,
      removeItem,
      replaceItem,
      clearItems,
      taxRate,
      totals,
      registerValidator,
      submitOrder,
      status,
      submitError,
    }),
    [
      details, updateDetails, comment, file, items, addItem, updateItem,
      removeItem, replaceItem, clearItems, taxRate, totals, registerValidator, submitOrder,
      status, submitError,
    ]
  );

  return (
    <EventOrderContext.Provider value={value}>
      {children}
    </EventOrderContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* Hook                                                               */
/* ------------------------------------------------------------------ */

export function useEventOrder() {
  const ctx = useContext(EventOrderContext);
  if (!ctx) {
    throw new Error("useEventOrder must be used inside <EventOrderProvider>");
  }
  return ctx;
}

/* ------------------------------------------------------------------ */
/* Product helpers (used by Calculationpage)                          */
/* ------------------------------------------------------------------ */

export function getProductId(product: Product): number {
  return "id" in product ? Number(product.id) : 0;
}

export function getProductName(product: Product): string {
  return "name" in product ? String(product.name) : `Product #${getProductId(product)}`;
}

// Your product data shape isn't known here, so look for a few common image keys.
export function getProductImage(product: Product): string | null {
  const record = product as unknown as Record<string, unknown>;
  for (const key of ["image", "img", "imageUrl", "src", "thumbnail"]) {
    const value = record[key];
    if (typeof value === "string" && value) return value;
    if (value && typeof value === "object" && "src" in value) {
      return String((value as { src: unknown }).src);
    }
  }
  return null;
}

// "From $X": the lowest price across the product's sizes.
export function getFromPrice(product: Product): number {
  const base = "price" in product ? Number(product.price) : 0;
  const sizes = getSizes(getProductId(product)) ?? [];
  const prices = sizes
    .map((sz) => Number(getPrice(product, String(sz)) ?? base))
    .filter((p) => p > 0);
  return prices.length > 0 ? Math.min(...prices) : base;
}