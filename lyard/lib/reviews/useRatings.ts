"use client";
// Average rating and review count per product, for the star line on product cards.
import { useEffect, useState } from "react";
import type { RatingSummary } from "./reviews";

export function useRatings(): Record<string, RatingSummary> {
  const [summaries, setSummaries] = useState<Record<string, RatingSummary>>({});
  useEffect(() => {
    let live = true;
    fetch("/api/reviews", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { summaries: {} }))
      .then((b) => live && setSummaries(b.summaries ?? {}))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return summaries;
}
