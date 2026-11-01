"use client";

import { DataState, PageHeading, Panel } from "@/app/portal-ui/PortalUI";
import { usePortalList, type PortalOrder, currency, shortDate } from "@/app/portal-ui/usePortalData";

export default function WholesaleHistory() {
  const { items, loading, error, reload } = usePortalList<PortalOrder>("/api/orders", "orders");
  return <>
    <PageHeading title="Order history & tracking" subtitle="Orders associated with your signed-in account." />
    <DataState loading={loading} error={error} retry={reload} empty={items && items.length === 0 ? "No orders found. Your completed orders will appear here." : undefined} />
    {items && items.length > 0 && <Panel>
      <div className="overflow-x-auto"><table className="w-full min-w-[580px] text-left text-sm">
        <thead className="border-b border-zinc-200 text-zinc-600"><tr><th scope="col" className="px-3 py-3">Order</th><th scope="col" className="px-3 py-3">Date</th><th scope="col" className="px-3 py-3">Total</th><th scope="col" className="px-3 py-3">Status</th><th scope="col" className="px-3 py-3">Tracking</th></tr></thead>
        <tbody>{items.map((o) => <tr key={o.orderNumber} className="border-b border-zinc-100"><td className="px-3 py-4 font-semibold">{o.orderNumber}</td><td className="px-3 py-4">{shortDate(o.placedAt ?? o.savedAt)}</td><td className="px-3 py-4">{currency(o.totals?.total)}</td><td className="px-3 py-4 capitalize">{o.status || "Unavailable"}</td><td className="px-3 py-4">{o.delivery?.trackingUrl?.startsWith("https://") ? <a className="text-[#8b651e] underline" href={o.delivery.trackingUrl} target="_blank" rel="noopener noreferrer">Track parcel</a> : "No link yet"}</td></tr>)}</tbody>
      </table></div>
    </Panel>}
    <p className="mt-4 text-xs text-zinc-500">This currently displays orders from the shared checkout API. A separate wholesale order source can be connected when it is available.</p>
  </>;
}
