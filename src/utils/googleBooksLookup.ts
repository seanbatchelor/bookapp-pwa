import { LookupResult, BookData } from '../types/book';

// ─── Normalisation ────────────────────────────────────────────────────────────
// Strip articles, punctuation, extra spaces; lowercase.
function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/^(the|a|an)\s+/i, '')   // leading article
    .replace(/[^\w\s]/g, '')           // punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Similarity score (0–1) ───────────────────────────────────────────────────
// Uses Dice coefficient on bigrams — good for short strings like titles.
function bigrams(s: string): Set<string> {
  const set = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
  return set;
}

function dice(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const ba = bigrams(a);
  const bb = bigrams(b);
  if (ba.size === 0 || bb.size === 0) return 0;
  let overlap = 0;
  ba.forEach(bg => { if (bb.has(bg)) overlap++; });
  return (2 * overlap) / (ba.size + bb.size);
}

function titleSimilarity(query: string, title: string): number {
  const q = normalise(query);
  const t = normalise(title);

  // Exact match after normalisation
  if (q === t) return 1;

  // One fully contains the other (e.g. query "Dune" vs title "Dune Messiah")
  if (t === q || t.startsWith(q + ' ') || t.endsWith(' ' + q)) return 0.9;
  if (q.startsWith(t + ' ') || q.endsWith(' ' + t)) return 0.85;

  return dice(q, t);
}

// Combined title + author score — title dominates (70/30)
function score(query: string, title: string, author: string): number {
  return titleSimilarity(query, title) * 0.7 + dice(normalise(query), normalise(author)) * 0.3;
}

// Auto-resolve threshold: score must be at or above this to skip the picker
const AUTO_RESOLVE_THRESHOLD = 0.8;

// ─── Main lookup ──────────────────────────────────────────────────────────────
export async function googleBooksLookup(query: string, forceMulti = false): Promise<LookupResult> {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
    const url = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(query)}&maxResults=10&key=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) return { type: 'none' };

    const data = await response.json();
    if (!data.items || data.items.length === 0) return { type: 'none' };

    // Map and score all results
    const scored: Array<{ book: BookData; score: number }> = data.items
      .map((item: any) => {
        const title: string = item.volumeInfo.title ?? '';
        const author: string = item.volumeInfo.authors?.[0] ?? 'Unknown Author';
        const book: BookData = {
          title,
          author,
          year: item.volumeInfo.publishedDate?.split('-')[0],
        };
        return { book, score: score(query, title, author) };
      })
      // Drop results with no meaningful similarity at all
      .filter((r: { book: BookData; score: number }) => r.score > 0.1);

    if (scored.length === 0) return { type: 'none' };

    // Sort best match first
    scored.sort((a: { score: number }, b: { score: number }) => b.score - a.score);

    // Deduplicate by normalised title+author — keep earliest edition
    const seen = new Map<string, { book: BookData; score: number }>();
    for (const r of scored) {
      const key = `${normalise(r.book.title)}||${normalise(r.book.author)}`;
      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, r);
      } else {
        // Keep whichever has the earlier year (or replace if current has a year and existing doesn't)
        const existingYear = parseInt(existing.book.year ?? '9999');
        const currentYear = parseInt(r.book.year ?? '9999');
        if (currentYear < existingYear) seen.set(key, r);
      }
    }
    const deduped = [...seen.values()].sort((a, b) => b.score - a.score);

    const best = deduped[0];

    // Auto-resolve if the top result is clearly the right book (unless caller wants candidates)
    if (!forceMulti && best.score >= AUTO_RESOLVE_THRESHOLD) {
      return { type: 'single', book: best.book };
    }

    // Otherwise return top 10 ranked candidates for the user to pick
    return {
      type: 'multi',
      options: deduped.slice(0, 10).map((r: { book: BookData }) => r.book),
    };
  } catch {
    return { type: 'none' };
  }
}
