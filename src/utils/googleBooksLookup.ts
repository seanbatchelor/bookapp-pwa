import { LookupResult, BookData } from '../types/book';

// ─── Input cleaning ───────────────────────────────────────────────────────────
// Trim, strip leading/trailing punctuation, collapse spaces.
function cleanInput(raw: string): string {
  return raw
    .trim()
    .replace(/^[^\w]+|[^\w]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

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

// ─── Input intent classifier ──────────────────────────────────────────────────
type InputClassification =
  | { type: 'title'; title: string }
  | { type: 'author'; author: string }
  | { type: 'title_and_author'; title: string; author: string };

const STOP_WORDS = new Set(['the','a','an','of','in','on','at','for','and','or','but','with']);

function classifyInput(cleaned: string): InputClassification {
  // 1. "Title by Author"
  const byMatch = cleaned.match(/^(.*?)\s+by\s+(.+)$/i);
  if (byMatch) {
    return { type: 'title_and_author', title: byMatch[1].trim(), author: byMatch[2].trim() };
  }

  // 2. "Author, Title"
  const commaIdx = cleaned.indexOf(',');
  if (commaIdx !== -1) {
    return {
      type: 'title_and_author',
      title: cleaned.slice(commaIdx + 1).trim(),
      author: cleaned.slice(0, commaIdx).trim(),
    };
  }

  // 3. Author-only heuristic: 2–3 title-case words, no stop words, no digits
  const words = cleaned.split(' ');
  if (
    words.length >= 2 &&
    words.length <= 3 &&
    words.every(w => /^[A-Z]/.test(w)) &&
    words.every(w => !STOP_WORDS.has(w.toLowerCase())) &&
    !/\d/.test(cleaned)
  ) {
    return { type: 'author', author: cleaned };
  }

  // 4. Default: treat as title
  return { type: 'title', title: cleaned };
}

// Weighted multi-factor score: title 60%, author 25%, popularity 15%
function score(
  titleQuery: string,
  authorQuery: string,
  title: string,
  author: string,
  popularityScore: number,
): number {
  return (
    titleSimilarity(titleQuery, title) * 0.6 +
    dice(normalise(authorQuery), normalise(author)) * 0.25 +
    popularityScore * 0.15
  );
}

// Auto-resolve threshold: score must be at or above this to skip the picker
const AUTO_RESOLVE_THRESHOLD = 0.8;

// ─── Fetch helper ─────────────────────────────────────────────────────────────
async function fetchVolumes(q: string, apiKey: string): Promise<any[]> {
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=20&key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return data.items ?? [];
  } catch {
    return [];
  }
}

// ─── Main lookup ──────────────────────────────────────────────────────────────
export async function googleBooksLookup(query: string, forceMulti = false): Promise<LookupResult> {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
    const cleaned = cleanInput(query);
    const classification = classifyInput(cleaned);

    // Build queries based on classification and fire in parallel
    let queryPromises: Promise<any[]>[];
    let titleQuery: string;
    let authorQuery: string;

    if (classification.type === 'title_and_author') {
      titleQuery = classification.title;
      authorQuery = classification.author;
      queryPromises = [
        fetchVolumes(`intitle:"${titleQuery}"+inauthor:${authorQuery}`, apiKey),
        fetchVolumes(`intitle:"${titleQuery}"`, apiKey),
      ];
    } else if (classification.type === 'author') {
      titleQuery = '';
      authorQuery = classification.author;
      queryPromises = [
        fetchVolumes(`inauthor:"${authorQuery}"`, apiKey),
        fetchVolumes(`intitle:"${authorQuery}"`, apiKey), // fallback: catches misclassified titles
      ];
    } else {
      titleQuery = classification.title;
      authorQuery = '';
      const words = titleQuery.split(' ');
      const perWordQ = words.map(w => `intitle:${w}`).join('+');
      queryPromises = [
        fetchVolumes(`intitle:"${titleQuery}"`, apiKey),
        fetchVolumes(perWordQ, apiKey),
        fetchVolumes(titleQuery, apiKey),
      ];
    }

    const itemArrays = await Promise.all(queryPromises);

    // Merge and deduplicate by Google Books volume ID (first occurrence wins)
    const seenIds = new Set<string>();
    const allItems: any[] = [];
    for (const item of itemArrays.flat()) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        allItems.push(item);
      }
    }

    if (allItems.length === 0) return { type: 'none' };

    // Exact match shortcut — only for pure title searches (no author component).
    // Compare normalised titleQuery against each result title; skip if the user
    // provided an author hint (to avoid matching study guides titled "The Road by McCarthy").
    if (!forceMulti && authorQuery === '') {
      const normTitle = normalise(titleQuery);
      const exactMatch = allItems.find(
        (item: any) => normalise(item.volumeInfo.title ?? '') === normTitle,
      );
      if (exactMatch) {
        return {
          type: 'single',
          book: {
            title: exactMatch.volumeInfo.title ?? '',
            author: exactMatch.volumeInfo.authors?.[0] ?? 'Unknown Author',
            year: exactMatch.volumeInfo.publishedDate?.split('-')[0],
          },
        };
      }
    }

    // Popularity normalisation — log-scale ratingsCount, normalised to 0–1 across result set
    const logCounts = allItems.map((item: any) =>
      Math.log((item.volumeInfo.ratingsCount ?? 0) + 1),
    );
    const maxLogCount = Math.max(...logCounts);

    // Map and score all results
    const scored: Array<{ book: BookData; score: number }> = allItems
      .map((item: any, i: number) => {
        const title: string = item.volumeInfo.title ?? '';
        const author: string = item.volumeInfo.authors?.[0] ?? 'Unknown Author';
        const popularityScore = maxLogCount > 0 ? logCounts[i] / maxLogCount : 0;
        const book: BookData = {
          title,
          author,
          year: item.volumeInfo.publishedDate?.split('-')[0],
        };
        return { book, score: score(titleQuery, authorQuery, title, author, popularityScore) };
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

    // Otherwise return top 20 ranked candidates for the user to pick
    return {
      type: 'multi',
      options: deduped.slice(0, 20).map((r: { book: BookData }) => r.book),
    };
  } catch {
    return { type: 'none' };
  }
}
