"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

// ---- Types shared by every part of the event order ----

export interface CartItem {
  id: string;
  productId: number;
  selectedSize: string;
  selectedFlavor: string;
  quantity: number;
}

export type EventSelection = {
  Starttime: string;
  number: string;
  type: string;
  Flavor?: string;
};

export interface EventOrder {
  selection: EventSelection;
  comment: string;
  items: CartItem[];
  fileName: string | null;
}

interface EventOrderContextValue {
  selection: EventSelection | null;
  setSelection: (value: EventSelection | null) => void;

  comment: string | null;
  setComment: (value: string | null) => void;

  items: CartItem[];
  setItems: Dispatch<SetStateAction<CartItem[]>>;

  file: File | null;
  setFile: (file: File | null) => void;

  /** Becomes available once both forms (selection + comment) have been submitted. */
  order: EventOrder | null;
  resetOrder: () => void;
}

const EventOrderContext = createContext<EventOrderContextValue | null>(null);

export function EventOrderProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<EventSelection | null>(null);
  const [comment, setComment] = useState<string | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const order = useMemo<EventOrder | null>(() => {
    if (!selection || comment === null) return null;
    return { selection, comment, items, fileName: file?.name ?? null };
  }, [selection, comment, items, file]);

  const resetOrder = () => {
    setSelection(null);
    setComment(null);
    setItems([]);
    setFile(null);
  };

  const value: EventOrderContextValue = {
    selection,
    setSelection,
    comment,
    setComment,
    items,
    setItems,
    file,
    setFile,
    order,
    resetOrder,
  };

  return <EventOrderContext.Provider value={value}>{children}</EventOrderContext.Provider>;
}

export function useEventOrder() {
  const ctx = useContext(EventOrderContext);
  if (!ctx) {
    throw new Error("useEventOrder must be used inside <EventOrderProvider>");
  }
  return ctx;
}