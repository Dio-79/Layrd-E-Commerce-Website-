// lib/eventDates.ts

const pad = (n: number) => String(n).padStart(2, "0");

/** Local-time YYYY-MM-DD string */
export const toLocalISODate = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export { MIN_LEAD_DAYS, earliestEventDate } from "./eventRules";