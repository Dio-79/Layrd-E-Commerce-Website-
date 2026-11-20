'use client';

import { useMemo, useState } from 'react';
import { ui } from '../adminStyles';
import { shortDate, useApi, type AdminProduct } from '../adminApi';
import { stars, summarize, type Review } from '@/lib/reviews/reviews';

// Product reviews (MVP story 5): see what customers are saying and remove
// anything abusive or off-topic.
export default function ReviewsAdminPage() {
    const reviews = useApi<{ reviews: Review[] }>('/api/reviews?all=1');
    const products = useApi<{ products: AdminProduct[] }>('/api/products?all=1');
    const [query, setQuery] = useState('');
    const [message, setMessage] = useState('');

    const names = useMemo(() => new Map((products.data?.products ?? []).map((p) => [p.productID, p.name])), [products.data]);
    const all = reviews.data?.reviews ?? [];
    const overall = summarize(all.map((r) => r.rating));
    const shown = all.filter((r) => `${names.get(r.productId) ?? ''} ${r.name} ${r.comment}`.toLowerCase().includes(query.toLowerCase()));

    async function remove(id: string) {
        setMessage('');
        const res = await fetch(`/api/reviews?id=${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' });
        const body = await res.json().catch(() => ({}));
        setMessage(res.ok ? 'Review removed.' : body.error ?? 'Couldn\'t remove it.');
        reviews.reload();
    }

    return (
        <div className={ui.page}>
            <div>
                <h1 className={ui.h1}>Reviews</h1>
                <p className={ui.subtitle}>{overall.count} reviews · average {overall.count ? overall.average.toFixed(1) : '—'} / 5</p>
            </div>
            {message && <p role="status" className="text-sm text-[var(--a-gold)]">{message}</p>}
            {reviews.error && <p className="text-sm text-[var(--a-danger)]">{reviews.error}</p>}
            <section className={ui.card}>
                <input className={`${ui.input} mb-4 mt-0 max-w-72`} placeholder="Search reviews" aria-label="Search reviews" value={query} onChange={(e) => setQuery(e.target.value)} />
                <div className={ui.tableWrap}>
                    <table className={ui.table}>
                        <thead><tr><th className={ui.th}>Product</th><th className={ui.th}>Rating</th><th className={ui.th}>Review</th><th className={ui.th}>Customer</th><th className={ui.th}>Date</th><th className={ui.th}></th></tr></thead>
                        <tbody>
                            {shown.map((r) => (
                                <tr key={r.id}>
                                    <td className={`${ui.td} font-semibold`}>{names.get(r.productId) ?? `#${r.productId}`}</td>
                                    <td className={`${ui.td} whitespace-nowrap text-[var(--a-gold)]`} aria-label={`${r.rating} out of 5`}>{stars(r.rating)}</td>
                                    <td className={`${ui.td} max-w-md`}>{r.comment || <span className="text-[var(--a-muted)]">No comment</span>}</td>
                                    <td className={ui.td}>{r.name}{r.verified && <span className="ml-1 text-xs text-[var(--a-muted)]">(verified)</span>}</td>
                                    <td className={ui.td}>{shortDate(r.updatedAt ?? r.createdAt)}</td>
                                    <td className={ui.td}><button type="button" className={ui.btnDanger} onClick={() => remove(r.id)}>Remove</button></td>
                                </tr>
                            ))}
                            {!reviews.loading && shown.length === 0 && <tr><td colSpan={6} className={`${ui.td} py-8 text-center text-[var(--a-muted)]`}>No reviews yet.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
