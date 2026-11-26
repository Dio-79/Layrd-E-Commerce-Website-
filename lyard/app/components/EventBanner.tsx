"use client";

// Limited-time events running today (made on /admin/promotions, FR-19), shown
// as a strip on the home page with the code to use at checkout.
import { useEffect, useState } from "react";

type Event = { code: string; label: string; expiresAt?: string; minOrder?: number };

export default function EventBanner() {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    let live = true;
    fetch("/api/coupons?events=1", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => live && Array.isArray(d?.events) && setEvents(d.events))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  if (events.length === 0) return null;
  return (
    <div role="region" aria-label="Current offers" style={{ background: "#111", color: "#e0b43a", textAlign: "center", padding: "0.75rem 1rem", fontSize: "0.9rem", letterSpacing: "0.05em" }}>
      {events.map((e) => (
        <p key={e.code} style={{ margin: "0.15rem 0" }}>
          <strong>{e.label}</strong> with code <strong style={{ color: "#fff" }}>{e.code}</strong>
          {e.minOrder ? ` on orders over $${e.minOrder}` : ""}
          {e.expiresAt ? ` · ends ${new Date(`${e.expiresAt}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : ""}
        </p>
      ))}
    </div>
  );
}
