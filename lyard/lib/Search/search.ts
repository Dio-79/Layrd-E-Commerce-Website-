/**
 * Search logic: no React, no data source. Give it a list of items and a query.
 *
 * - ignores capitals, accents and punctuation ("Café" matches "cafe")
 * - every word typed must match (so "matcha cheesecake" narrows the list)
 * - ranks: name starts with it > a name word starts with it > name contains it
 *          > category/tag > description
 * - if nothing matches, it retries allowing small typos ("espresso" finds "expresso")
 */

export interface SearchItem {
  id: string;
  name: string;
  description: string;
  /** Shown under the name, e.g. "Drinks" */
  category: string;
  /** Page that opens when the result is chosen */
  href: string;
  price?: number;
  imageUrl?: string;
  tag?: string;
}

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Number of single-letter edits between a and b, or max + 1 once it is clearly larger than max. */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
      rowMin = Math.min(rowMin, row[j]);
    }
    if (rowMin > max) return max + 1;
    prev = row;
  }
  return prev[b.length];
}

function scoreTerm(term: string, item: SearchItem, fuzzy: boolean): number {
  const name = normalize(item.name);
  const words = name.split(" ");
  const category = normalize(item.category);
  const tag = normalize(item.tag ?? "");
  const description = normalize(item.description);

  if (name.startsWith(term)) return 100;
  if (words.some((w) => w.startsWith(term))) return 80;
  if (name.includes(term)) return 60;
  if (tag.includes(term) || category.includes(term)) return 40;
  if (description.includes(term)) return 20;

  if (fuzzy && term.length >= 4) {
    const tolerance = term.length >= 7 ? 2 : 1;
    const pool = [...words, ...category.split(" "), ...tag.split(" ")].filter(Boolean);
    if (pool.some((w) => editDistance(term, w, tolerance) <= tolerance)) return 10;
  }
  return 0;
}

function run(items: SearchItem[], terms: string[], fuzzy: boolean) {
  const scored: { item: SearchItem; score: number }[] = [];

  for (const item of items) {
    let total = 0;
    let matchesAll = true;
    for (const term of terms) {
      const s = scoreTerm(term, item, fuzzy);
      if (s === 0) {
        matchesAll = false;
        break;
      }
      total += s;
    }
    if (matchesAll) scored.push({ item, score: total });
  }

  scored.sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name));
  return scored.map((s) => s.item);
}

export function searchItems(items: SearchItem[], query: string, limit = Infinity): SearchItem[] {
  const terms = normalize(query).split(" ").filter(Boolean);
  if (terms.length === 0) return [];

  let found = run(items, terms, false);
  if (found.length === 0) found = run(items, terms, true);
  return found.slice(0, limit);
}