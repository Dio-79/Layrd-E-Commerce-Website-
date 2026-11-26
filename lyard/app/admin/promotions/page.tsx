'use client';

import { useState } from 'react';
import { ui } from '../adminStyles';
import { send, useApi } from '../adminApi';

// Promotions (Figma "Promotions - Coupons / Events", FR-19). Coupons are typed in
// at the cart or checkout; events are limited-time sales announced on the home
// page with their code. The server checks dates, limits and minimums at checkout.
type Coupon = {
    code: string;
    kind: "coupon" | "event";
    title: string;
    type: "percent" | "amount";
    value: number;
    active: boolean;
    minOrder: number;
    usageLimit: number;
    uses: number;
    startsAt: string;
    expiresAt: string;
};

const blank = (kind: Coupon["kind"]): Coupon => ({
    code: "", kind, title: "", type: "percent", value: 10, active: true, minOrder: 0, usageLimit: 0, uses: 0, startsAt: "", expiresAt: "",
});

const today = () => new Date().toISOString().slice(0, 10);
function statusOf(c: Coupon) {
    if (!c.active) return { text: "Paused", cls: "border-[var(--a-strong)] text-[var(--a-muted)]" };
    if (c.expiresAt && today() > c.expiresAt) return { text: "Expired", cls: "border-[var(--a-danger)] text-[var(--a-danger)]" };
    if (c.startsAt && today() < c.startsAt) return { text: "Scheduled", cls: "border-[var(--a-gold)] text-[var(--a-gold)]" };
    if (c.usageLimit > 0 && c.uses >= c.usageLimit) return { text: "Used up", cls: "border-[var(--a-strong)] text-[var(--a-muted)]" };
    return { text: "Active", cls: "border-[var(--a-text-2)] text-[var(--a-text)]" };
}

export default function PromotionsPage() {
    const { data, error, loading, reload } = useApi<{ coupons: Coupon[] }>("/api/admin/coupons");
    const [tab, setTab] = useState<Coupon["kind"]>("coupon");
    const [edit, setEdit] = useState<Coupon>(blank("coupon"));
    const [isNew, setIsNew] = useState(true);
    const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

    const list = (data?.coupons ?? []).filter((c) => (c.kind ?? "coupon") === tab);
    const set = <K extends keyof Coupon>(k: K, v: Coupon[K]) => setEdit((e) => ({ ...e, [k]: v }));

    function startNew(kind: Coupon["kind"]) {
        setTab(kind);
        setEdit(blank(kind));
        setIsNew(true);
        setMessage(null);
    }

    async function save() {
        setMessage(null);
        try {
            await send("/api/admin/coupons", "PUT", edit);
            setMessage({ ok: true, text: `${edit.code.toUpperCase()} saved.` });
            setIsNew(false);
            reload();
        } catch (e) {
            setMessage({ ok: false, text: (e as Error).message });
        }
    }

    async function remove(code: string) {
        if (!window.confirm(`Delete ${code}? Customers won't be able to use it any more.`)) return;
        try {
            await send(`/api/admin/coupons?code=${encodeURIComponent(code)}`, "DELETE");
            if (edit.code === code) startNew(tab);
            reload();
        } catch (e) {
            setMessage({ ok: false, text: (e as Error).message });
        }
    }

    const label = tab === "coupon" ? "Coupon" : "Event";

    return (
        <div className={ui.page}>
            <div className={ui.pageHeader}>
                <div>
                    <h1 className={ui.h1}>Promotions</h1>
                    <p className={ui.subtitle}>Coupon codes for checkout, and limited-time events shown on the home page.</p>
                </div>
                <button type="button" className={ui.btn} onClick={() => startNew(tab)}>+ Create New {label}</button>
            </div>

            <div className="flex gap-2">
                {(["coupon", "event"] as const).map((k) => (
                    <button key={k} type="button" onClick={() => startNew(k)}
                        className={`rounded-sm px-4 py-1.5 text-sm font-semibold ${tab === k ? "bg-[var(--a-gold)] text-black" : "text-[var(--a-text-2)] hover:bg-[var(--a-hover)]"}`}>
                        {k === "coupon" ? "Coupons" : "Events"}
                    </button>
                ))}
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <section className={ui.card}>
                    <h2 className={ui.h2}>{tab === "coupon" ? "Coupon Codes" : "Limited Time Events"}</h2>
                    {loading && <p className="text-sm text-[var(--a-muted)]">Loading…</p>}
                    {error && <p className="text-sm text-[var(--a-danger)]">{error}</p>}
                    {data && (
                        <div className={ui.tableWrap}>
                            <table className={ui.table}>
                                <thead>
                                    <tr>
                                        <th className={ui.th}>{tab === "coupon" ? "Code" : "Event"}</th>
                                        <th className={ui.th}>Discount</th>
                                        <th className={ui.th}>Usage</th>
                                        <th className={ui.th}>Dates</th>
                                        <th className={ui.th}>Status</th>
                                        <th className={ui.th}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {list.map((c) => {
                                        const s = statusOf(c);
                                        return (
                                            <tr key={c.code} className={`hover:bg-[var(--a-hover)] ${edit.code === c.code && !isNew ? "bg-[var(--a-gold)]/10" : ""}`}>
                                                <td className={ui.td}>
                                                    <span className="font-semibold">{tab === "event" && c.title ? c.title : c.code}</span>
                                                    {tab === "event" && <span className="block text-xs text-[var(--a-muted)]">Code {c.code}</span>}
                                                </td>
                                                <td className={ui.td}>{c.type === "percent" ? `${c.value}% off` : `$${c.value} off`}{c.minOrder ? <span className="block text-xs text-[var(--a-muted)]">min ${c.minOrder}</span> : null}</td>
                                                <td className={ui.td}>{c.uses}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</td>
                                                <td className={`${ui.td} text-xs`}>{c.startsAt || "now"} → {c.expiresAt || "no end"}</td>
                                                <td className={ui.td}><span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${s.cls}`}>{s.text}</span></td>
                                                <td className={ui.td}>
                                                    <button type="button" className={ui.btnSmall} onClick={() => { setEdit(c); setIsNew(false); setMessage(null); }}>Edit</button>{" "}
                                                    <button type="button" className={ui.btnDanger} onClick={() => remove(c.code)}>Delete</button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {list.length === 0 && <tr><td colSpan={6} className={`${ui.td} py-8 text-center text-[var(--a-muted)]`}>None yet. The demo codes LAYRD10 and WELCOME5 still work at checkout.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section className={`${ui.card} space-y-4 self-start`}>
                    <h2 className={ui.h2}>{isNew ? `New ${label}` : `Edit ${label}`}</h2>
                    {tab === "event" && (
                        <label className={ui.label}>
                            Event title
                            <input className={ui.input} value={edit.title} placeholder="e.g. Summer Launch Sale" onChange={(e) => set("title", e.target.value)} />
                        </label>
                    )}
                    <label className={ui.label}>
                        {tab === "coupon" ? "Coupon code" : "Code customers enter"}
                        <input className={`${ui.input} uppercase`} value={edit.code} disabled={!isNew} placeholder="e.g. SUMMER15"
                            onChange={(e) => set("code", e.target.value.toUpperCase())} />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <label className={ui.label}>
                            Discount type
                            <select className={ui.input} value={edit.type} onChange={(e) => set("type", e.target.value as Coupon["type"])}>
                                <option value="percent">Percent</option>
                                <option value="amount">Dollar amount</option>
                            </select>
                        </label>
                        <label className={ui.label}>
                            Value {edit.type === "percent" ? "(%)" : "($)"}
                            <input className={ui.input} inputMode="decimal" value={String(edit.value)} onChange={(e) => set("value", e.target.value as unknown as number)} />
                        </label>
                    </div>
                    <label className={ui.checkRow}>
                        <input type="checkbox" className={ui.checkbox} checked={edit.active} onChange={() => set("active", !edit.active)} />
                        <span className="text-sm font-semibold">Active</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <label className={ui.label}>
                            Minimum order ($)
                            <input className={ui.input} inputMode="decimal" value={String(edit.minOrder)} onChange={(e) => set("minOrder", e.target.value as unknown as number)} />
                        </label>
                        <label className={ui.label}>
                            Total usage limit
                            <input className={ui.input} inputMode="numeric" value={String(edit.usageLimit)} placeholder="0 = no limit"
                                onChange={(e) => set("usageLimit", e.target.value as unknown as number)} />
                        </label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <label className={ui.label}>
                            Starts
                            <input type="date" className={ui.input} value={edit.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
                        </label>
                        <label className={ui.label}>
                            Expires
                            <input type="date" className={ui.input} value={edit.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} />
                        </label>
                    </div>
                    {message && <p role="status" className={`text-sm ${message.ok ? "text-[var(--a-gold)]" : "text-[var(--a-danger)]"}`}>{message.text}</p>}
                    <button type="button" className={`${ui.btn} w-full`} onClick={save}>Save Changes</button>
                </section>
            </div>
        </div>
    );
}
