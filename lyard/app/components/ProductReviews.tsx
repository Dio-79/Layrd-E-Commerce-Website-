"use client";
// Reviews and star ratings for one product (MVP story 5). Shown in the
// customize popup. Everyone can read them; signed-in customers can rate.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { MAX_COMMENT, stars } from "@/lib/reviews/reviews";
import styles from "./ProductReviews.module.css";

type ShownReview = { id: string; name: string; rating: number; comment: string; verified: boolean; createdAt: string; updatedAt?: string; mine: boolean };
type Data = { reviews: ShownReview[]; average: number; count: number; mine: { rating: number; comment: string } | null };

const when = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { dateStyle: "medium" });

/** Small "★★★★☆ 4.2 (12)" line, for product cards. */
export function StarSummary({ average, count }: { average: number; count: number }) {
  if (!count) return <span className={styles.summarySmall}>No reviews yet</span>;
  return (
    <span className={styles.summarySmall} aria-label={`Rated ${average} out of 5 from ${count} reviews`}>
      <span className={styles.stars} aria-hidden="true">{stars(average)}</span> {average.toFixed(1)} ({count})
    </span>
  );
}

export default function ProductReviews({ productId }: { productId: number }) {
  const { user } = useAuth();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`, { credentials: "include", cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Couldn't load reviews.");
      setData(body);
      if (body.mine) {
        setRating(body.mine.rating);
        setComment(body.mine.comment);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }, [productId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load once per product
    void load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return setMessage("Choose a star rating first.");
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, comment }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Couldn't save your review.");
      setMessage(body.edited ? "Your review was updated." : "Thanks! Your review is posted.");
      await load();
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setSaving(true);
    const res = await fetch(`/api/reviews?productId=${productId}`, { method: "DELETE", credentials: "include" });
    setSaving(false);
    if (res.ok) {
      setRating(0);
      setComment("");
      setMessage("Your review was removed.");
      await load();
    }
  }

  const signedIn = Boolean(user && user.role !== "guest");

  return (
    <section className={styles.wrap} aria-labelledby={`reviews-${productId}`}>
      <div className={styles.head}>
        <h3 id={`reviews-${productId}`} className={styles.title}>Reviews</h3>
        {data && <StarSummary average={data.average} count={data.count} />}
      </div>
      {error && <p className={styles.error}>{error}</p>}

      {signedIn ? (
        <form className={styles.form} onSubmit={submit}>
          <div className={styles.picker} role="radiogroup" aria-label="Your rating" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`}
                className={`${styles.star} ${n <= (hover || rating) ? styles.starOn : ""}`}
                onMouseEnter={() => setHover(n)} onClick={() => setRating(n)}>★</button>
            ))}
            <span className={styles.pickerText}>{data?.mine ? "Your rating" : "Tap to rate"}</span>
          </div>
          <textarea className={styles.textarea} rows={3} maxLength={MAX_COMMENT} placeholder="What did you think? (optional)"
            aria-label="Your review" value={comment} onChange={(e) => setComment(e.target.value)} />
          <div className={styles.actions}>
            <button type="submit" className={styles.submit} disabled={saving}>{data?.mine ? "Update review" : "Post review"}</button>
            {data?.mine && <button type="button" className={styles.linkBtn} onClick={remove} disabled={saving}>Remove</button>}
            {message && <span className={styles.message} role="status">{message}</span>}
          </div>
        </form>
      ) : (
        <p className={styles.muted}><Link href="/login" className={styles.link}>Log in</Link> to rate this product.</p>
      )}

      <ul className={styles.list}>
        {data?.reviews.map((r) => (
          <li key={r.id} className={styles.item}>
            <div className={styles.itemHead}>
              <span className={styles.stars} aria-label={`${r.rating} out of 5`}>{stars(r.rating)}</span>
              <strong>{r.name}{r.mine ? " (you)" : ""}</strong>
              {r.verified && <span className={styles.badge}>Verified purchase</span>}
              <span className={styles.date}>{when(r.updatedAt ?? r.createdAt)}</span>
            </div>
            {r.comment && <p className={styles.comment}>{r.comment}</p>}
          </li>
        ))}
        {data && data.reviews.length === 0 && <li className={styles.muted}>Be the first to review this.</li>}
      </ul>
    </section>
  );
}
