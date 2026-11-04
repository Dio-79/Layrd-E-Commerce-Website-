'use client';

import { Fragment, useMemo, useState } from 'react';
import { ui, statusClass } from '../adminStyles';
import { money, stockStatus, useApi, type AdminProduct } from '../adminApi';

// Analytics (Figma "Analytics", FR-16): revenue trend, best sellers, sales by
// type, peak sale times and a per-product table with a size breakdown.
// Worked out in the browser from the admin orders API; cancelled orders don't count.

type Line = { productId?: number | string; name: string; quantity: number; unitPrice?: number; size?: string };
type Order = { id: string; status?: string; placedAt?: string; savedAt?: string; lines?: Line[]; totals?: { total?: number } };

const RANGES = { Daily: 30, Weekly: 12, Monthly: 12 } as const;
type Range = keyof typeof RANGES;
const DAY = 864e5;

function bucketStart(d: Date, range: Range) {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (range === "Weekly") x.setDate(x.getDate() - x.getDay());
    if (range === "Monthly") x.setDate(1);
    return x;
}
function bucketLabel(d: Date, range: Range) {
    return range === "Monthly"
        ? d.toLocaleDateString(undefined, { month: "short", year: "2-digit" })
        : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* ---------- Revenue line chart: one series, crosshair + tooltip on hover ---------- */
function RevenueChart({ points }: { points: { label: string; value: number }[] }) {
    const [hover, setHover] = useState<number | null>(null);
    const W = 640, H = 220, L = 52, R = 12, T = 12, B = 28;
    const max = Math.max(10, ...points.map((p) => p.value));
    const nice = Math.ceil(max / 10 ** Math.floor(Math.log10(max))) * 10 ** Math.floor(Math.log10(max));
    const x = (i: number) => L + (points.length <= 1 ? 0 : (i * (W - L - R)) / (points.length - 1));
    const y = (v: number) => T + (H - T - B) * (1 - v / nice);
    const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * nice);
    const every = Math.ceil(points.length / 6);

    return (
        <div className="relative">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Revenue over time"
                onMouseLeave={() => setHover(null)}
                onMouseMove={(e) => {
                    const box = e.currentTarget.getBoundingClientRect();
                    const px = ((e.clientX - box.left) / box.width) * W;
                    const i = Math.round(((px - L) / (W - L - R)) * (points.length - 1));
                    setHover(Math.max(0, Math.min(points.length - 1, i)));
                }}>
                {ticks.map((t) => (
                    <g key={t}>
                        <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="var(--a-border)" strokeWidth={1} />
                        <text x={L - 6} y={y(t) + 4} textAnchor="end" fontSize={10} fill="var(--a-muted)">${t >= 1000 ? `${(t / 1000).toFixed(1)}k` : t.toFixed(0)}</text>
                    </g>
                ))}
                {points.map((p, i) => i % every === 0 && (
                    <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize={10} fill="var(--a-muted)">{p.label}</text>
                ))}
                <path d={path} fill="none" stroke="var(--a-gold)" strokeWidth={2} strokeLinejoin="round" />
                {hover !== null && (
                    <g>
                        <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="var(--a-strong)" strokeDasharray="3 3" />
                        <circle cx={x(hover)} cy={y(points[hover].value)} r={5} fill="var(--a-gold)" stroke="var(--a-card)" strokeWidth={2} />
                    </g>
                )}
            </svg>
            {hover !== null && (
                <div className="pointer-events-none absolute top-0 rounded-sm border border-[var(--a-border)] bg-[var(--a-inset)] px-2 py-1 text-xs shadow-md"
                    style={{ left: `${(x(hover) / W) * 100}%`, transform: "translateX(-50%)" }}>
                    <span className="text-[var(--a-muted)]">{points[hover].label}</span> <strong className="text-[var(--a-text)]">{money(points[hover].value)}</strong>
                </div>
            )}
        </div>
    );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="rounded-md border border-[var(--a-border)] bg-[var(--a-card)] p-4 shadow-md shadow-black/20">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--a-text-2)]">{label}</p>
            <p className="mt-2 text-xl font-semibold text-[var(--a-text)]">{value}</p>
            {sub && <p className="mt-1 text-xs text-[var(--a-muted)]">{sub}</p>}
        </div>
    );
}

export default function AnalyticsPage() {
    const orders = useApi<{ orders: Order[] }>("/api/admin/orders");
    const products = useApi<{ products: AdminProduct[] }>("/api/products?all=1");
    const [range, setRange] = useState<Range>("Daily");
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState<"units" | "revenue" | "growth">("revenue");
    const [open, setOpen] = useState<string | null>(null);

    const valid = useMemo(() => (orders.data?.orders ?? []).filter((o) => o.status !== "cancelled"), [orders.data]);
    const catalog = useMemo(() => new Map((products.data?.products ?? []).map((p) => [String(p.productID), p])), [products.data]);

    // When the page opened; growth compares the 30 days before it with the 30 days before that.
    const [now] = useState(() => Date.now());
    const stats = useMemo(() => {
        const per = new Map<string, { key: string; name: string; units: number; revenue: number; recent: number; before: number; sizes: Map<string, { units: number; revenue: number }> }>();
        const byType = new Map<string, number>();
        const byHour = new Array(24).fill(0);
        let revenue = 0;
        for (const o of valid) {
            const when = Date.parse(o.placedAt ?? o.savedAt ?? "");
            revenue += o.totals?.total ?? 0;
            if (Number.isFinite(when)) byHour[new Date(when).getHours()] += 1;
            for (const l of o.lines ?? []) {
                const key = String(l.productId ?? l.name);
                const p = catalog.get(key);
                const r = per.get(key) ?? { key, name: p?.name ?? l.name, units: 0, revenue: 0, recent: 0, before: 0, sizes: new Map() };
                const amount = (l.unitPrice ?? p?.price ?? 0) * l.quantity;
                r.units += l.quantity;
                r.revenue += amount;
                if (now - when < 30 * DAY) r.recent += l.quantity;
                else if (now - when < 60 * DAY) r.before += l.quantity;
                const s = r.sizes.get(l.size || "Regular") ?? { units: 0, revenue: 0 };
                s.units += l.quantity;
                s.revenue += amount;
                r.sizes.set(l.size || "Regular", s);
                per.set(key, r);
                const type = p?.section === "drinks" ? "Drinks" : (p?.categories ?? []).includes("Bundles") ? "Bundles" : "Cakes";
                byType.set(type, (byType.get(type) ?? 0) + amount);
            }
        }
        const rows = [...per.values()].map((r) => ({ ...r, growth: r.before ? ((r.recent - r.before) / r.before) * 100 : r.recent ? null : 0 }));
        const peakHour = byHour.indexOf(Math.max(...byHour));
        return { rows, byType, revenue, peakHour: valid.length ? peakHour : null };
    }, [valid, catalog, now]);

    const points = useMemo(() => {
        const n = RANGES[range];
        const end = bucketStart(new Date(), range);
        const starts: Date[] = [];
        for (let i = n - 1; i >= 0; i--) {
            const d = new Date(end);
            if (range === "Daily") d.setDate(d.getDate() - i);
            if (range === "Weekly") d.setDate(d.getDate() - 7 * i);
            if (range === "Monthly") d.setMonth(d.getMonth() - i);
            starts.push(d);
        }
        const totals = new Map(starts.map((d) => [d.getTime(), 0]));
        for (const o of valid) {
            const when = new Date(o.placedAt ?? o.savedAt ?? "");
            if (Number.isNaN(when.getTime())) continue;
            const k = bucketStart(when, range).getTime();
            if (totals.has(k)) totals.set(k, (totals.get(k) ?? 0) + (o.totals?.total ?? 0));
        }
        return starts.map((d) => ({ label: bucketLabel(d, range), value: totals.get(d.getTime()) ?? 0 }));
    }, [valid, range]);

    const top = [...stats.rows].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    const topMax = Math.max(1, ...top.map((t) => t.revenue));
    const mostUnits = [...stats.rows].sort((a, b) => b.units - a.units)[0];
    const typeTotal = [...stats.byType.values()].reduce((a, b) => a + b, 0);
    const typeText = typeTotal
        ? [...stats.byType].sort((a, b) => b[1] - a[1]).map(([t, v]) => `${t} ${Math.round((v / typeTotal) * 100)}%`).join(" · ")
        : "—";
    const hourText = (h: number) => new Date(2000, 0, 1, h).toLocaleTimeString(undefined, { hour: "numeric" });

    const table = stats.rows
        .filter((r) => r.name.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => (sort === "units" ? b.units - a.units : sort === "growth" ? (b.growth ?? 999) - (a.growth ?? 999) : b.revenue - a.revenue));

    const loading = orders.loading || products.loading;

    return (
        <div className={ui.page}>
            <div>
                <h1 className={ui.h1}>Analytics</h1>
                <p className={ui.subtitle}>Sales from every shop order in Firebase (cancelled orders left out).</p>
            </div>
            {orders.error && <p className="text-sm text-[var(--a-danger)]">{orders.error}</p>}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Stat label="Revenue" value={loading ? "…" : money(stats.revenue)} sub={`${valid.length} orders`} />
                <Stat label="Sales by type" value={loading ? "…" : typeText} />
                <Stat label="Most units sold" value={loading ? "…" : mostUnits ? mostUnits.name : "—"} sub={mostUnits ? `${mostUnits.units} units` : undefined} />
                <Stat label="Peak sale time" value={loading ? "…" : stats.peakHour === null ? "—" : `${hourText(stats.peakHour)}–${hourText((stats.peakHour + 1) % 24)}`} />
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
                <section className={ui.card}>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-lg font-semibold">Revenue Trends</h2>
                        <div className="flex gap-1">
                            {(Object.keys(RANGES) as Range[]).map((r) => (
                                <button key={r} type="button" onClick={() => setRange(r)}
                                    className={`rounded-sm px-3 py-1 text-xs font-semibold ${range === r ? "bg-[var(--a-gold)] text-black" : "text-[var(--a-text-2)] hover:bg-[var(--a-hover)]"}`}>{r}</button>
                            ))}
                        </div>
                    </div>
                    <RevenueChart points={points} />
                </section>

                <section className={ui.card}>
                    <h2 className="mb-3 text-lg font-semibold">Best Selling</h2>
                    {top.length === 0 && <p className="text-sm text-[var(--a-muted)]">{loading ? "Loading…" : "No sales yet."}</p>}
                    <ul className="space-y-3">
                        {top.map((t) => (
                            <li key={t.key}>
                                <div className="flex justify-between text-sm"><span className="text-[var(--a-text)]">{t.name}</span><span className="text-[var(--a-text-2)]">{money(t.revenue)}</span></div>
                                <div className="mt-1 h-2 rounded-full bg-[var(--a-inset)]">
                                    <div className="h-2 rounded-full bg-[var(--a-gold)]" style={{ width: `${(t.revenue / topMax) * 100}%` }} />
                                </div>
                                <p className="mt-0.5 text-xs text-[var(--a-muted)]">{typeTotal ? Math.round((t.revenue / typeTotal) * 100) : 0}% of product sales · {t.units} units</p>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>

            <section className={ui.card}>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                    <h2 className="mr-auto text-lg font-semibold">Products</h2>
                    <input className={`${ui.input} mt-0 max-w-60`} placeholder="Search products" aria-label="Search products" value={query} onChange={(e) => setQuery(e.target.value)} />
                    <select className={`${ui.input} mt-0 max-w-44`} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort by">
                        <option value="revenue">Sort by revenue</option>
                        <option value="units">Sort by units</option>
                        <option value="growth">Sort by growth</option>
                    </select>
                </div>
                <div className={ui.tableWrap}>
                    <table className={ui.table}>
                        <thead>
                            <tr>
                                <th className={ui.th}>ID</th>
                                <th className={ui.th}>Name</th>
                                <th className={ui.th}>Category</th>
                                <th className={`${ui.th} text-right`}>Units Sold</th>
                                <th className={`${ui.th} text-right`}>Revenue</th>
                                <th className={`${ui.th} text-right`}>Growth (30 days)</th>
                                <th className={ui.th}>Inventory</th>
                            </tr>
                        </thead>
                        <tbody>
                            {table.map((r) => {
                                const p = catalog.get(r.key);
                                const status = p ? stockStatus(p) : null;
                                return (
                                    <Fragment key={r.key}>
                                        <tr className="cursor-pointer hover:bg-[var(--a-hover)]" onClick={() => setOpen(open === r.key ? null : r.key)}
                                            aria-expanded={open === r.key}>
                                            <td className={`${ui.td} text-[var(--a-muted)]`}>{p ? `#${p.productID}` : "—"}</td>
                                            <td className={`${ui.td} font-semibold`}>{open === r.key ? "▾ " : "▸ "}{r.name}</td>
                                            <td className={ui.td}>{p?.categories?.[0] ?? "—"}</td>
                                            <td className={`${ui.td} text-right`}>{r.units}</td>
                                            <td className={`${ui.td} text-right`}>{money(r.revenue)}</td>
                                            <td className={`${ui.td} text-right ${r.growth !== null && r.growth < 0 ? "text-[var(--a-danger)]" : ""}`}>
                                                {r.growth === null ? "new" : `${r.growth >= 0 ? "+" : ""}${r.growth.toFixed(0)}%`}
                                            </td>
                                            <td className={ui.td}>{status ? <span className={statusClass(status)}>{status}</span> : "—"}</td>
                                        </tr>
                                        {open === r.key && [...r.sizes].map(([size, s]) => (
                                            <tr key={`${r.key}-${size}`} className="text-xs">
                                                <td className={ui.td}></td>
                                                <td className={`${ui.td} pl-8 capitalize text-[var(--a-muted)]`}>{size}</td>
                                                <td className={ui.td}></td>
                                                <td className={`${ui.td} text-right`}>{s.units}</td>
                                                <td className={`${ui.td} text-right`}>{money(s.revenue)}</td>
                                                <td className={ui.td} colSpan={2}></td>
                                            </tr>
                                        ))}
                                    </Fragment>
                                );
                            })}
                            {table.length === 0 && <tr><td colSpan={7} className={`${ui.td} py-8 text-center text-[var(--a-muted)]`}>{loading ? "Loading…" : "No sales yet."}</td></tr>}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
