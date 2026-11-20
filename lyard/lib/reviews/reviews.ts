// Product reviews and ratings (MVP story 5), shared by the API and the pages.

export interface Review {
  id: string;
  productId: number;
  userId: string;
  name: string;
  rating: number;
  comment: string;
  /** The reviewer has a non-cancelled order with this product in it */
  verified: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface RatingSummary {
  average: number;
  count: number;
}

export const MAX_COMMENT = 1000;

/** One review per customer per product: saving again edits it. */
export const reviewId = (productId: number, userId: string) => `${productId}_${userId}`;

/** Average to one decimal place, and how many reviews. */
export function summarize(ratings: number[]): RatingSummary {
  if (ratings.length === 0) return { average: 0, count: 0 };
  const avg = ratings.reduce((s, r) => s + r, 0) / ratings.length;
  return { average: Math.round(avg * 10) / 10, count: ratings.length };
}

/** "Abel F." from "Abel Fekadu", so full names aren't shown publicly. */
export function publicName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Customer";
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

/** Whole number 1 to 5, or null. */
export function cleanRating(value: unknown): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
}

export const stars = (rating: number) => "★★★★★".slice(0, Math.round(rating)) + "☆☆☆☆☆".slice(0, 5 - Math.round(rating));
