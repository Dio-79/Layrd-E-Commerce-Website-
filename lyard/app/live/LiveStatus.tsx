"use client";

import styles from "./live.module.css";
import type { LiveState } from "./useLiveStream";

const LABELS: Record<LiveState, string> = {
  connecting: "Connecting…",
  live: "Live",
  reconnecting: "Reconnecting…",
  failed: "Disconnected",
};

export function LiveStatus({ state, updatedAt }: { state: LiveState; updatedAt: Date | null }) {
  return (
    <span className={styles.status}>
      <span className={`${styles.dot} ${styles[state] ?? ""}`} />
      {LABELS[state]}
      {updatedAt && ` · updated ${updatedAt.toLocaleTimeString()}`}
    </span>
  );
}
