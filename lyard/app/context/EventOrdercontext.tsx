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

export type EventDetails = {
  Starttime: string;
  number: string;
  type: string;
  Flavor: string; // event-level flavor from the Selections form
};

export interface CartItem {
  id: string;
  productId: number;
  selectedSize: string;
  selectedFlavor: string;
  quantity: number;
}

export type DetailedItem = CartItem & {
  productName: string;
  unitPrice: number;
  itemTotal: number;
};

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
/* Product helpers                                                    */
/* ------------------------------------------------------------------ */

// Your data uses `productID`; `id` / `productId` are kept as fallbacks.
export function getProductId(product: Product): number {
  const x = product as unknown as Record<string, unknown>;
  const raw = x.productID ?? x.productId ?? x.id;
  const n = Number(raw);
  return raw !== undefined && Number.isFinite(n) ? n : products.indexOf(product) + 1;
}

export function findProduct(id: number): Product | undefined {
  return products.find((p) => getProductId(p) === id);
}

export function getProductName(product: Product): string {
  return "name" in product ? String(product.name) : `Product #${getProductId(product)}`;
}

export function getProductImage(product: Product): string | null {
  const x = product as unknown as Record<string, unknown>;
  const images = x.images as unknown[] | undefined;
  const candidates = [x.imageUrl, x.image, x.img, x.src, x.thumbnail, images?.[0]];

  for (const value of candidates) {
    let src = "";
    if (typeof value === "string") src = value;
    else if (value && typeof value === "object" && "src" in value) {
      src = String((value as { src: unknown }).src);
    }
    if (src) {
      // local paths need a leading slash ("images/a.jpg" -> "/images/a.jpg")
      return /^(https?:|\/|data:)/.test(src) ? src : `/${src}`;
    }
  }
  return null;
}

/* ----- sizes: getSizes may return strings OR objects like { size, price } ----- */

const sizeLabel = (s: unknown): string => {
  if (typeof s === "string" || typeof s === "number") return String(s);
  if (s && typeof s === "object") {
    const o = s as Record<string, unknown>;
    const v = o.size ?? o.label ?? o.name ?? o.value ?? o.title;
    if (v != null) return String(v);
  }
  return "";
};

const rawSizes = (productId: number): unknown[] =>
  (getSizes(productId) as unknown[] | undefined) ?? [];

// Unique size labels for a product (use this in SlotCard instead of .map(String))
export function getProductSizes(productId: number): string[] {
  return Array.from(new Set(rawSizes(productId).map(sizeLabel).filter(Boolean)));
}

const getBase = (product: Product) => ("price" in product ? Number(product.price) : 0);

// Price of ONE unit at a size: size entry price, then getPrice, then base price
export function getUnitPrice(product: Product, size: string): number {
  const entry = rawSizes(getProductId(product)).find((s) => sizeLabel(s) === size);
  if (entry && typeof entry === "object") {
    const o = entry as Record<string, unknown>;
    const v = Number(o.price ?? o.cost ?? o.amount);
    if (Number.isFinite(v) && v > 0) return v;
  }

  const sized = Number(getPrice(product, size));
  if (Number.isFinite(sized) && sized > 0) return sized;

  return getBase(product);
}

// "From $X": the lowest price across the product's sizes.
export function getFromPrice(product: Product): number {
  const sizes = getProductSizes(getProductId(product));
  const prices = sizes.map((s) => getUnitPrice(product, s)).filter((p) => p > 0);
  return prices.length > 0 ? Math.min(...prices) : getBase(product);
}

/* ------------------------------------------------------------------ */
/* Context shape                                                      */
/* ------------------------------------------------------------------ */

type Validator = () => Promise<boolean> | boolean | void;

export interface SubmittedOrder {
  details: EventDetails;
  comment: string;
  fileName: string | null;
  items: DetailedItem[];
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
}

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

  // Slots (ProductPicker / Calculationpage)
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
    detailedItems: DetailedItem[];
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
  order: SubmittedOrder | null; // snapshot after a successful Submit (for OrderSummary)
}

const EventOrderContext = createContext<EventOrderContextValue | null>(null);

/* ------------------------------------------------------------------ */
/* Provider                                                           */
/* ------------------------------------------------------------------ */

const EMPTY_DETAILS: EventDetails = { Starttime: "", number: "", type: "", Flavor: "" };

export function EventOrderProvider({
  children,
  taxRate = 0.08,
}: {
  children: ReactNode;
  taxRate?: number;
}) {
  const [details, setDetails] = useState<EventDetails>(EMPTY_DETAILS);
  const [comment, setComment] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [submitError, setSubmitError] = useState("");
  const [order, setOrder] = useState<SubmittedOrder | null>(null);

  // Each form registers its validate/trigger function here so Submit can check every form.
  const validators = useRef(new Map<string, Validator>());

  const registerValidator = useCallback((key: string, fn: Validator) => {
    validators.current.set(key, fn);
    return () => {
      validators.current.delete(key);
    };
  }, []);

  // Skips the state update when nothing changed, so repeated pushes can't cause a render loop
  const updateDetails = useCallback((patch: Partial<EventDetails>) => {
    setDetails((prev) => {
      const next = { ...prev, ...patch };
      const same = (Object.keys(next) as (keyof EventDetails)[]).every(
        (k) => next[k] === prev[k]
      );
      return same ? prev : next;
    });
  }, []);

  /* ----- slot actions ----- */

  const defaultSizeFor = (productId: number) => getProductSizes(productId)[0] ?? "Standard";

  const addItem = useCallback((product: Product) => {
    const productId = getProductId(product);
    const newItem: CartItem = {
      id: crypto.randomUUID(),
      productId,
      selectedSize: defaultSizeFor(productId),
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

  // "Change": swap the product, keep flavor + quantity, keep size if still offered
  const replaceItem = useCallback((id: string, product: Product) => {
    const productId = getProductId(product);
    const sizes = getProductSizes(productId);
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              productId,
              selectedSize: sizes.includes(item.selectedSize)
                ? item.selectedSize
                : sizes[0] ?? "Standard",
            }
          : item
      )
    );
  }, []);

  const clearItems = useCallback(() => setItems([]), []);

  const totals = useMemo(() => {
    const detailedItems: DetailedItem[] = items.map((item) => {
      const product = findProduct(item.productId);
      const unitPrice = product ? getUnitPrice(product, item.selectedSize) : 0;

      return {
        ...item,
        productName: product ? getProductName(product) : `Product #${item.productId}`,
        unitPrice,
        itemTotal: unitPrice * item.quantity,
      };
    });

    const totalItems = detailedItems.reduce((s, i) => s + i.quantity, 0);
    const subtotal = detailedItems.reduce((s, i) => s + i.itemTotal, 0);
    const taxAmount = subtotal * taxRate;

    return { detailedItems, totalItems, subtotal, taxAmount, grandTotal: subtotal + taxAmount };
  }, [items, taxRate]);

  /* ----- submit everything in one request ----- */

  const submitOrder = useCallback(async () => {
    setSubmitError("");

    const results = await Promise.all(
      [...validators.current.values()].map(async (validate) => (await validate()) !== false)
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
      const snapshot: SubmittedOrder = {
        details,
        comment,
        fileName: file?.name ?? null,
        items: totals.detailedItems,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        grandTotal: totals.grandTotal,
      };

      const body = new FormData();
      body.append("order", JSON.stringify(snapshot));
      // Don't set Content-Type manually: the browser adds the multipart boundary.
      if (file) body.append("file", file);

      const response = await fetch(ORDER_ENDPOINT, { method: "POST", body });
      if (!response.ok) throw new Error("The order could not be sent.");

      setOrder(snapshot);
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setSubmitError(error instanceof Error ? error.message : "The order could not be sent.");
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
      order,
    }),
    [
      details, updateDetails, comment, file, items, addItem, updateItem, removeItem,
      replaceItem, clearItems, taxRate, totals, registerValidator, submitOrder,
      status, submitError, order,
    ]
  );

  return <EventOrderContext.Provider value={value}>{children}</EventOrderContext.Provider>;
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