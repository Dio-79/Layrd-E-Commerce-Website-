'use client';

import { useState } from 'react';
import { ui } from '../adminStyles';
import { money, send, shortDate, useApi } from '../adminApi';
import { quoteSummary, type QuoteRequest } from '@/lib/wholesale/quotes';

// Wholesale requests (MVP story 8): price custom bulk quote requests and
// review uploaded tax exemption documents.

type Exemption = {
    userId: string; email?: string; name?: string; businessName?: string;
    status: 'pending' | 'approved' | 'denied'; fileName: string; certificateNumber: string;
    expiresOn: string | null; uploadedAt: string; note?: string; decidedBy?: string;
};

const pill = (status: string) => {
    const tone = status === 'requested' || status === 'pending' ? 'border-[var(--a-gold)] text-[var(--a-gold)]'
        : status === 'declined' || status === 'denied' ? 'border-[var(--a-danger)] text-[var(--a-danger)]'
            : 'border-[var(--a-strong)] text-[var(--a-text-2)]';
    return `inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${tone}`;
};

function QuoteCard({ q, onDone }: { q: QuoteRequest; onDone: (msg: string) => void }) {
    const s = quoteSummary(q.lines);
    const [prices, setPrices] = useState<Record<number, string>>(() =>
        Object.fromEntries(q.lines.map((l) => [l.productId, String(l.quotedPrice ?? l.listPrice)])));
    const [note, setNote] = useState(q.adminMessage ?? '');
    const [days, setDays] = useState('14');
    const [busy, setBusy] = useState(false);
    const open = q.status === 'requested' || q.status === 'quoted' || q.status === 'expired';
    const offered = q.lines.reduce((sum, l) => sum + (Number(prices[l.productId]) || 0) * l.quantity, 0);

    async function act(action: 'quote' | 'reject') {
        setBusy(true);
        try {
            await send('/api/wholesale/quotes', 'PATCH', { id: q.id, action, prices, message: note, validDays: Number(days) });
            onDone(action === 'quote' ? `Price sent for ${q.id}.` : `${q.id} declined.`);
        } catch (e) {
            onDone((e as Error).message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <li className="rounded-md border border-[var(--a-border)] bg-[var(--a-inset)] p-4">
            <div className="flex flex-wrap items-center gap-2">
                <p className="mr-auto font-semibold text-[var(--a-text)]">{q.id} · {q.businessName || q.customer.fullName || q.customer.email}</p>
                <span className={pill(q.status)}>{q.status}</span>
            </div>
            <p className="mt-1 text-xs text-[var(--a-muted)]">{q.customer.email} · asked {shortDate(q.createdAt)} · needed by {shortDate(q.neededBy)} · {s.units} units{q.targetBudget ? ` · budget ${money(q.targetBudget)}` : ''}</p>
            {q.message && <p className="mt-2 whitespace-pre-line text-sm text-[var(--a-text-2)]">“{q.message}”</p>}
            <div className={`${ui.tableWrap} mt-3`}>
                <table className={`${ui.table} min-w-[480px]`}>
                    <thead><tr><th className={ui.th}>Product</th><th className={`${ui.th} text-right`}>Qty</th><th className={`${ui.th} text-right`}>List</th><th className={`${ui.th} text-right`}>Price / unit</th></tr></thead>
                    <tbody>
                        {q.lines.map((l) => (
                            <tr key={l.productId}>
                                <td className={ui.td}>{l.name}</td>
                                <td className={`${ui.td} text-right`}>{l.quantity}</td>
                                <td className={`${ui.td} text-right`}>{money(l.listPrice)}</td>
                                <td className={`${ui.td} text-right`}>
                                    {open ? <input aria-label={`Price per unit for ${l.name}`} className={ui.smallInput} inputMode="decimal" value={prices[l.productId] ?? ''}
                                        onChange={(e) => setPrices((p) => ({ ...p, [l.productId]: e.target.value }))} /> : money(l.quotedPrice)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="mt-2 text-sm text-[var(--a-text-2)]">List {money(s.listTotal)} · {open ? 'Offer' : 'Quoted'} {money(open ? offered : s.quotedTotal ?? 0)}
                {s.listTotal > 0 && <> ({Math.round((1 - (open ? offered : s.quotedTotal ?? 0) / s.listTotal) * 100)}% off)</>}
                {q.orderNumber && <> · order <strong>{q.orderNumber}</strong></>}</p>
            {open ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_120px]">
                    <label className={ui.label}>Message to the buyer<textarea className={ui.input} rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></label>
                    <label className={ui.label}>Valid for (days)<input className={ui.input} inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} /></label>
                    <div className="flex gap-2 sm:col-span-2">
                        <button type="button" className={ui.btn} disabled={busy} onClick={() => act('quote')}>{q.status === 'requested' ? 'Send price' : 'Update price'}</button>
                        <button type="button" className={ui.btnDanger} disabled={busy} onClick={() => act('reject')}>Decline request</button>
                    </div>
                </div>
            ) : q.adminMessage ? <p className="mt-2 text-xs text-[var(--a-muted)]">Your message: {q.adminMessage}</p> : null}
        </li>
    );
}

export default function WholesaleRequestsPage() {
    const quotes = useApi<{ quotes: QuoteRequest[] }>('/api/wholesale/quotes?all=1');
    const docs = useApi<{ exemptions: Exemption[] }>('/api/wholesale/tax-exemption?all=1');
    const [message, setMessage] = useState('');
    const [filter, setFilter] = useState<'open' | 'all'>('open');
    const [notes, setNotes] = useState<Record<string, string>>({});

    const list = (quotes.data?.quotes ?? []).filter((q) => filter === 'all' || q.status === 'requested' || q.status === 'quoted');
    const waiting = (quotes.data?.quotes ?? []).filter((q) => q.status === 'requested').length;
    const pendingDocs = (docs.data?.exemptions ?? []).filter((d) => d.status === 'pending').length;

    async function decide(userId: string, status: 'approved' | 'denied') {
        setMessage('');
        try {
            await send('/api/wholesale/tax-exemption', 'PATCH', { userId, status, note: notes[userId] ?? '' });
            setMessage(status === 'approved' ? 'Tax exemption approved. Their orders are now GST free.' : 'Tax exemption denied.');
            docs.reload();
        } catch (e) {
            setMessage((e as Error).message);
        }
    }

    return (
        <div className={ui.page}>
            <div>
                <h1 className={ui.h1}>Wholesale Requests</h1>
                <p className={ui.subtitle}>{waiting} quote{waiting === 1 ? '' : 's'} waiting for a price · {pendingDocs} tax document{pendingDocs === 1 ? '' : 's'} to review</p>
            </div>
            {message && <p role="status" className="text-sm text-[var(--a-gold)]">{message}</p>}

            <section className={ui.card}>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                    <h2 className="mr-auto text-lg font-semibold">Custom Bulk Quotes</h2>
                    {(['open', 'all'] as const).map((f) => (
                        <button key={f} type="button" onClick={() => setFilter(f)}
                            className={`rounded-sm px-3 py-1 text-xs font-semibold ${filter === f ? 'bg-[var(--a-gold)] text-black' : 'text-[var(--a-text-2)] hover:bg-[var(--a-hover)]'}`}>{f === 'open' ? 'Open' : 'All'}</button>
                    ))}
                </div>
                {quotes.error && <p className="text-sm text-[var(--a-danger)]">{quotes.error}</p>}
                {quotes.loading ? <p className="text-sm text-[var(--a-muted)]">Loading…</p> : list.length === 0 ? <p className="text-sm text-[var(--a-muted)]">No quote requests{filter === 'open' ? ' waiting' : ''}.</p> : (
                    <ul className="space-y-4">{list.map((q) => <QuoteCard key={`${q.id}-${q.status}`} q={q} onDone={(m) => { setMessage(m); quotes.reload(); }} />)}</ul>
                )}
            </section>

            <section className={ui.card}>
                <h2 className={ui.h2}>Tax Exemption Documents</h2>
                {docs.error && <p className="text-sm text-[var(--a-danger)]">{docs.error}</p>}
                <div className={ui.tableWrap}>
                    <table className={ui.table}>
                        <thead><tr>
                            <th className={ui.th}>Buyer</th><th className={ui.th}>Document</th><th className={ui.th}>Certificate</th>
                            <th className={ui.th}>Expires</th><th className={ui.th}>Status</th><th className={ui.th}>Decision</th>
                        </tr></thead>
                        <tbody>
                            {(docs.data?.exemptions ?? []).map((d) => (
                                <tr key={d.userId}>
                                    <td className={ui.td}><p className="font-semibold text-[var(--a-text)]">{d.businessName || d.name || '—'}</p><p className="text-xs text-[var(--a-muted)]">{d.email}</p></td>
                                    <td className={ui.td}><a className="text-[var(--a-gold)] underline" href={`/api/wholesale/tax-exemption?file=${encodeURIComponent(d.userId)}`} target="_blank" rel="noreferrer">{d.fileName}</a><p className="text-xs text-[var(--a-muted)]">{shortDate(d.uploadedAt)}</p></td>
                                    <td className={ui.td}>{d.certificateNumber}</td>
                                    <td className={ui.td}>{d.expiresOn ? shortDate(d.expiresOn) : '—'}</td>
                                    <td className={ui.td}><span className={pill(d.status)}>{d.status}</span></td>
                                    <td className={ui.td}>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <input className={`${ui.smallInput} w-36`} placeholder="Note (optional)" aria-label="Note" value={notes[d.userId] ?? ''} onChange={(e) => setNotes((n) => ({ ...n, [d.userId]: e.target.value }))} />
                                            {d.status !== 'approved' && <button type="button" className={ui.btnSmall} onClick={() => decide(d.userId, 'approved')}>Approve</button>}
                                            {d.status !== 'denied' && <button type="button" className={ui.btnDanger} onClick={() => decide(d.userId, 'denied')}>Deny</button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!docs.loading && (docs.data?.exemptions ?? []).length === 0 && <tr><td colSpan={6} className={`${ui.td} py-8 text-center text-[var(--a-muted)]`}>No documents uploaded yet.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
