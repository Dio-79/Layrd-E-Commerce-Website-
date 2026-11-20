"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DataState, PageHeading, Panel, inputStyle, buttonStyle } from "@/app/portal-ui/PortalUI";
import { usePortalList, type PortalProduct, currency, shortDate } from "@/app/portal-ui/usePortalData";
import { MIN_QUOTE_UNITS, quoteSummary, type QuoteRequest } from "@/lib/wholesale/quotes";

// Custom bulk quotes (MVP story 8): ask for a price on a large or custom order,
// then accept or decline the price we send back. Accepting places the order.

const STATUS_STYLE: Record<string, string> = {
  requested: "bg-zinc-100 text-zinc-700",
  quoted: "bg-amber-100 text-[#735413]",
  accepted: "bg-green-100 text-green-800",
  declined: "bg-red-50 text-red-700",
  expired: "bg-zinc-100 text-zinc-500",
};
const STATUS_TEXT: Record<string, string> = {
  requested: "Waiting for our price",
  quoted: "Price ready",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Price expired",
};

const minDate = () => new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10);

export default function WholesaleQuotes() {
  const { items, loading, error, reload } = usePortalList<PortalProduct>("/api/products", "products");
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [neededBy, setNeededBy] = useState("");
  const [budget, setBudget] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [quotes, setQuotes] = useState<QuoteRequest[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const loadQuotes = useCallback(async () => {
    const res = await fetch("/api/wholesale/quotes", { credentials: "include", cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    setQuotes(res.ok ? data.quotes : []);
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load once
    void loadQuotes();
  }, [loadQuotes]);

  const selected = useMemo(() => (items ?? []).filter((p) => (counts[p.productID] || 0) > 0), [items, counts]);
  const units = selected.reduce((s, p) => s + counts[p.productID], 0);
  const listTotal = selected.reduce((s, p) => s + p.price * counts[p.productID], 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/wholesale/quotes", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: selected.map((p) => ({ productId: p.productID, quantity: counts[p.productID] })), neededBy, targetBudget: budget, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't send the request.");
      setResult({ ok: true, text: `Quote request ${data.id} sent. We'll reply here with a price, usually within 2 business days.` });
      setCounts({});
      setMessage("");
      setBudget("");
      await loadQuotes();
    } catch (err) {
      setResult({ ok: false, text: (err as Error).message });
    } finally {
      setSending(false);
    }
  }

  async function decide(id: string, action: "accept" | "decline") {
    setBusy(id);
    setResult(null);
    try {
      const res = await fetch("/api/wholesale/quotes", { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setResult({ ok: true, text: action === "accept" ? `Accepted. Order ${data.orderNumber} is placed and we'll send the invoice by email.` : "Quote declined." });
      await loadQuotes();
    } catch (err) {
      setResult({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(null);
    }
  }

  return <>
    <PageHeading title="Custom quotes" subtitle={`For large, custom or event orders (${MIN_QUOTE_UNITS}+ units). Tell us what you need and we'll send a price to accept.`} />
    {result && <p role="status" className={`mb-4 rounded-lg border p-3 text-sm ${result.ok ? "border-green-300 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"}`}>
      {result.text} {result.ok && result.text.startsWith("Accepted") && <Link className="font-semibold underline" href="/wholesale/history">See order history</Link>}
    </p>}

    <div className="mb-6">
      <Panel title="Your quotes">
        {quotes === null ? <p className="text-sm text-zinc-500">Loading…</p> : quotes.length === 0 ? <p className="text-sm text-zinc-500">No quote requests yet.</p> : (
          <ul className="space-y-4">{quotes.map((q) => {
            const s = quoteSummary(q.lines);
            return <li key={q.id} className="rounded-lg border border-zinc-200 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="mr-auto font-semibold">{q.id} <span className="font-normal text-zinc-500">· needed {shortDate(q.neededBy)} · {s.units} units</span></p>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[q.status]}`}>{STATUS_TEXT[q.status]}</span>
              </div>
              <table className="mt-3 w-full text-sm"><thead><tr className="text-left text-xs text-zinc-500"><th className="py-1 font-medium">Product</th><th className="py-1 text-right font-medium">Qty</th><th className="py-1 text-right font-medium">List</th>{s.quotedTotal !== null && <th className="py-1 text-right font-medium">Your price</th>}</tr></thead>
                <tbody>{q.lines.map((l) => <tr key={l.productId} className="border-t border-zinc-100"><td className="py-1.5">{l.name}</td><td className="py-1.5 text-right">{l.quantity}</td><td className="py-1.5 text-right text-zinc-500">{currency(l.listPrice)}</td>{s.quotedTotal !== null && <td className="py-1.5 text-right font-semibold">{currency(l.quotedPrice)}</td>}</tr>)}</tbody>
              </table>
              <p className="mt-2 text-sm">List total {currency(s.listTotal)}{s.quotedTotal !== null && <> · <strong>Quoted {currency(s.quotedTotal)}</strong> <span className="text-green-700">(save {currency(s.saving ?? 0)}, {s.savingPct}%)</span> + GST unless tax exempt</>}</p>
              {q.adminMessage && <p className="mt-2 rounded-md bg-amber-50 p-2 text-sm text-zinc-700"><strong>From LÄYRD:</strong> {q.adminMessage}</p>}
              {q.status === "quoted" && q.validUntil && <p className="mt-1 text-xs text-zinc-500">Price good until {shortDate(q.validUntil)}.</p>}
              {q.orderNumber && <p className="mt-1 text-sm">Order <strong>{q.orderNumber}</strong></p>}
              {(q.status === "quoted" || q.status === "requested") && <div className="mt-3 flex gap-2">
                {q.status === "quoted" && <button type="button" className={buttonStyle} disabled={busy === q.id} onClick={() => decide(q.id, "accept")}>Accept and place order</button>}
                <button type="button" className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-semibold hover:bg-zinc-50" disabled={busy === q.id} onClick={() => decide(q.id, "decline")}>{q.status === "quoted" ? "Decline" : "Cancel request"}</button>
              </div>}
            </li>;
          })}</ul>
        )}
      </Panel>
    </div>

    <DataState loading={loading} error={error} retry={reload} empty={items && !items.length ? "No products are available." : undefined} />
    {items && items.length > 0 && <form onSubmit={submit} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <Panel title="Request a new quote">
        <div className="space-y-2">{items.map((p) => <div key={p.productID} className="grid grid-cols-[1fr_105px] items-center gap-3 border-b border-zinc-100 py-2">
          <div><p className="font-semibold">{p.name}</p><p className="text-sm text-zinc-500">{currency(p.price)} list price</p></div>
          <label className="text-xs text-zinc-600">Quantity<input type="number" min={0} max={10000} step={1} inputMode="numeric" className={`${inputStyle} mt-1`} value={counts[p.productID] ?? 0}
            onChange={(e) => { const n = Number(e.target.value); setCounts((old) => ({ ...old, [p.productID]: Number.isFinite(n) ? Math.max(0, Math.min(10000, Math.floor(n))) : 0 })); }} /></label>
        </div>)}</div>
      </Panel>
      <div className="xl:sticky xl:top-5 xl:self-start"><Panel title="Details">
        <p className="text-sm text-zinc-600">{units} units · {currency(listTotal)} at list price</p>
        {units > 0 && units < MIN_QUOTE_UNITS && <p className="mt-1 text-xs text-amber-700">Add {MIN_QUOTE_UNITS - units} more units for a custom quote.</p>}
        <label className="mt-4 block text-xs font-medium text-zinc-600">Needed by<input type="date" required min={minDate()} className={`${inputStyle} mt-1`} value={neededBy} onChange={(e) => setNeededBy(e.target.value)} /></label>
        <label className="mt-3 block text-xs font-medium text-zinc-600">Target budget (optional)<input inputMode="decimal" className={`${inputStyle} mt-1`} placeholder="e.g. 900" value={budget} onChange={(e) => setBudget(e.target.value)} /></label>
        <label className="mt-3 block text-xs font-medium text-zinc-600">What do you need? (custom labels, flavours, delivery, payment terms)<textarea rows={4} className={`${inputStyle} mt-1`} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1500} /></label>
        <button type="submit" disabled={units < MIN_QUOTE_UNITS || !neededBy || sending} className={`${buttonStyle} mt-4 w-full disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-700`}>{sending ? "Sending…" : "Request quote"}</button>
      </Panel></div>
    </form>}
  </>;
}
