import styles from "./checkout.module.css";

/* Simple placeholder marks. Swap in the official logo files (svg/png) when you have them. */

export function PinIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function StoreIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 9l1.5-5h15L21 9" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M4 9v11h16V9" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 20v-5h4v5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function CardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5.5" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function VisaMark() {
  return <span className={styles.visa}>VISA</span>;
}

export function MastercardMark() {
  return (
    <svg width="28" height="18" viewBox="0 0 28 18" aria-hidden="true">
      <circle cx="10" cy="9" r="7" fill="#eb001b" />
      <circle cx="18" cy="9" r="7" fill="#f79e1b" fillOpacity="0.9" />
    </svg>
  );
}