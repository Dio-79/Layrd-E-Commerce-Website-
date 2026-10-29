"use client";

// Subscribes to one of the /api/live/* streams. EventSource reconnects by itself
// if the connection drops; each "snapshot" event replaces the whole list.
import { useEffect, useState } from "react";

export type LiveState = "connecting" | "live" | "reconnecting" | "failed";

export function useLiveStream<T>(url: string, enabled = true) {
  const [docs, setDocs] = useState<T[] | null>(null);
  const [state, setState] = useState<LiveState>("connecting");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const source = new EventSource(url);
    source.addEventListener("snapshot", (e) => {
      setDocs(JSON.parse((e as MessageEvent).data) as T[]);
      setUpdatedAt(new Date());
      setState("live");
    });
    source.addEventListener("failed", () => setState("failed"));
    source.onerror = () => setState(source.readyState === EventSource.CLOSED ? "failed" : "reconnecting");
    return () => source.close();
  }, [url, enabled]);

  return { docs, state, updatedAt };
}
