'use client';
// Reports (MVP story 3): pick a date range, see revenue, ingredient cost and
// profit, and download the sales or ingredient cost report as a CSV for accounting.
import { useState } from 'react';
import Link from 'next/link';
import { ui } from '../adminStyles';
import { money, useApi } from '../adminApi';

type Summary = {
    orders: number;
    totals: { units: number; revenue: number; ingredientCost: number; profit: number; margin: number | null; missingCost: string[] };
};

const isoDay = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);

export default function ReportsPanel() {
    const [from, setFrom] = useState(() => isoDay(new Date(Date.now() - 29 * 864e5)));
    const [to, setTo] = useState(() => isoDay(new Date()));
    const range = new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) }).toString();
    const summary = useApi<Summary>(`/api/admin/reports?type=summary&${range}`);
    const t = summary.data?.totals;

    return (
        <section className={ui.card} aria-labelledby="reports-heading">
            <div className="mb-4 flex flex-wrap items-end gap-3">
                <div className="mr-auto">
                    <h2 id="reports-heading" className="text-lg font-semibold">Sales &amp; Ingredient Cost Reports</h2>
                    <p className="text-xs text-[var(--a-muted)]">Shop and wholesale orders in the dates below, cancelled orders left out. Downloads open in Excel or Google Sheets.</p>
                </div>
                <label className={`${ui.label} mt-0`}>From<input type="date" className={`${ui.input} mt-1`} value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} /></label>
                <label className={`${ui.label} mt-0`}>To<input type="date" className={`${ui.input} mt-1`} value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} /></label>
            </div>

            {summary.error && <p className="mb-3 text-sm text-[var(--a-danger)]">{summary.error}</p>}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    ["Revenue (after discounts)", t ? money(t.revenue) : "…", summary.data ? `${summary.data.orders} orders · ${t?.units ?? 0} units` : ""],
                    ["Ingredient cost", t ? money(t.ingredientCost) : "…", ""],
                    ["Gross profit", t ? money(t.profit) : "…", ""],
                    ["Margin", t ? (t.margin === null ? "—" : `${t.margin.toFixed(1)}%`) : "…", ""],
                ].map(([label, value, sub]) => (
                    <div key={label} className="rounded-md border border-[var(--a-border)] bg-[var(--a-inset)] p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--a-text-2)]">{label}</p>
                        <p className="mt-1 text-lg font-semibold text-[var(--a-text)]">{value}</p>
                        {sub && <p className="text-xs text-[var(--a-muted)]">{sub}</p>}
                    </div>
                ))}
            </div>
            {t && t.missingCost.length > 0 && (
                <p className="mt-3 text-xs text-[var(--a-gold)]">
                    No ingredient cost set for {t.missingCost.slice(0, 4).join(', ')}{t.missingCost.length > 4 ? ` and ${t.missingCost.length - 4} more` : ''}, so they count as $0.
                    Add it on <Link href="/admin/productmanagement" className="underline">Product Management</Link>.
                </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
                <a className={ui.btn} href={`/api/admin/reports?type=sales&${range}`} download>
                    Export sales report (CSV)
                </a>
                <a className={ui.btnOutline} href={`/api/admin/reports?type=costs&${range}`} download>
                    Export ingredient cost report (CSV)
                </a>
            </div>
        </section>
    );
}
