"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DataState, PageHeading, Panel, inputStyle, buttonStyle } from "@/app/portal-ui/PortalUI";
import { usePortalList, type PortalProduct, currency } from "@/app/portal-ui/usePortalData";
import { MIN_WHOLESALE_UNITS, RECURRING_OPTIONS, TIERS, nextTier, tierFor, wholesaleTotals } from "@/lib/wholesale/tiers";

// Bulk order builder (FR-17): tiered pricing on the whole order, one-time or
// recurring, paid by invoice. The server re-prices everything when it saves.
export default function BulkOrderBuilder() {
  const { items, loading, error, reload } = usePortalList<PortalProduct>("/api/products", "products");
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [recurringWeeks, setRecurringWeeks] = useState(0);
  const [method, setMethod] = useState<"pickup" | "ship">("pickup");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string; orderNumber?: string } | null>(null);

  const selected = useMemo(() => (items ?? []).filter((p) => (counts[p.productID] || 0) > 0), [items, counts]);
  const totals = wholesaleTotals(selected.map((p) => ({ unitPrice: p.price, quantity: counts[p.productID] })));
  const tier = tierFor(totals.units);
  const next = nextTier(totals.units);
  const enough = totals.units >= MIN_WHOLESALE_UNITS;

  async function submit() {
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/wholesale/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: selected.map((p) => ({ productId: p.productID, quantity: counts[p.productID] })), recurringWeeks, method, address, notes }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't place the order.");
      setResult({ ok: true, text: `Order ${data.orderNumber} placed. We'll send the invoice by email.`, orderNumber: data.orderNumber });
      setCounts({});
    } catch (e) {
      setResult({ ok: false, text: (e as Error).message });
    } finally {
      setSending(false);
    }
  }

  return <>
    <PageHeading title="Bulk order builder" subtitle={`Minimum ${MIN_WHOLESALE_UNITS} units. Volume discounts apply to the whole order.`} />
    <div className="mb-5 grid gap-3 sm:grid-cols-3">
      {[...TIERS].reverse().map((t) => (
        <div key={t.minUnits} className={`rounded-xl border p-4 text-sm ${tier?.minUnits === t.minUnits ? "border-amber-500 bg-amber-50" : "border-zinc-200 bg-white"}`}>
          <p className="font-bold">{t.minUnits}+ cans</p>
          <p className="text-zinc-600">{Math.round(t.discount * 100)}% off the order</p>
        </div>
      ))}
    </div>
    {result && <p role="status" className={`mb-4 rounded-lg border p-3 text-sm ${result.ok ? "border-green-300 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"}`}>
      {result.text} {result.ok && <Link className="font-semibold underline" href="/wholesale/history">See order history</Link>}
    </p>}
    <DataState loading={loading} error={error} retry={reload} empty={items && !items.length ? "No products are available to order." : undefined} />
    {items && items.length > 0 && <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <Panel title="Products">
        <div className="space-y-3">{items.map((p) => <div key={p.productID} className="grid grid-cols-[1fr_105px] items-center gap-3 border-b border-zinc-100 py-3">
          <div><p className="font-semibold">{p.name}</p><p className="text-sm text-zinc-500">{currency(p.price)} per unit{tier ? ` · ${currency(p.price * (1 - tier.discount))} with your tier` : ""}</p></div>
          <label className="text-xs text-zinc-600">Quantity<input type="number" min={0} max={2000} step={1} inputMode="numeric" className={`${inputStyle} mt-1`} value={counts[p.productID] ?? 0} onChange={(e) => {const n = Number(e.target.value); setCounts((old) => ({...old, [p.productID]: Number.isFinite(n) ? Math.max(0, Math.min(2000, Math.floor(n))) : 0}));}} /></label>
        </div>)}</div>
      </Panel>
      <div className="xl:sticky xl:top-5 xl:self-start"><Panel title="Order summary">
        <p className="text-sm text-zinc-600">{selected.length} product types · {totals.units} units</p>
        {selected.length === 0 ? <p className="my-4 text-sm text-zinc-500">Add quantities to begin.</p> : <ul className="my-4 space-y-2 text-sm">{selected.map((p) => <li key={p.productID} className="flex justify-between gap-2"><span>{p.name} × {counts[p.productID]}</span><span>{currency(p.price * counts[p.productID])}</span></li>)}</ul>}
        <div className="space-y-1 border-t border-zinc-200 pt-3 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{currency(totals.subtotal)}</span></div>
          <div className="flex justify-between text-green-700"><span>Tier discount{tier ? ` (${Math.round(tier.discount * 100)}%)` : ""}</span><span>−{currency(totals.discount)}</span></div>
          <div className="flex justify-between"><span>GST</span><span>{currency(totals.tax)}</span></div>
          <div className="flex justify-between text-base font-bold"><span>Total</span><span>{currency(totals.total)}</span></div>
        </div>
        {!enough && totals.units > 0 && <p className="mt-2 text-xs text-amber-700">Add {MIN_WHOLESALE_UNITS - totals.units} more units to reach the minimum.</p>}
        {enough && next && <p className="mt-2 text-xs text-zinc-600">Add {next.unitsToGo} more for {Math.round(next.discount * 100)}% off.</p>}

        <label className="mt-4 block text-xs font-medium text-zinc-600">How often
          <select className={`${inputStyle} mt-1`} value={recurringWeeks} onChange={(e) => setRecurringWeeks(Number(e.target.value))}>
            {RECURRING_OPTIONS.map((o) => <option key={o.weeks} value={o.weeks}>{o.label}</option>)}
          </select>
        </label>
        <fieldset className="mt-3 text-sm"><legend className="text-xs font-medium text-zinc-600">Delivery</legend>
          <label className="mr-4"><input type="radio" name="method" checked={method === "pickup"} onChange={() => setMethod("pickup")} /> Pickup</label>
          <label><input type="radio" name="method" checked={method === "ship"} onChange={() => setMethod("ship")} /> Deliver to us</label>
        </fieldset>
        {method === "ship" && <label className="mt-2 block text-xs font-medium text-zinc-600">Delivery address<input className={`${inputStyle} mt-1`} value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" /></label>}
        <label className="mt-2 block text-xs font-medium text-zinc-600">Notes (labels, timing)<textarea className={`${inputStyle} mt-1`} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
        <button type="button" disabled={!enough || sending} onClick={submit} className={`${buttonStyle} mt-4 w-full disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-700`}>
          {sending ? "Placing order…" : recurringWeeks ? "Start recurring order" : "Place order"}
        </button>
        <p className="mt-2 text-xs text-zinc-500">Paid by invoice. Prices are checked again on our side when you place the order.</p>
      </Panel></div>
    </div>}
  </>;
}
