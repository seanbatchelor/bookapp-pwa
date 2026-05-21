import { LookupResult, BookData } from '../types/book';

// ─── Input cleaning ───────────────────────────────────────────────────────────
function cleanInput(raw: string): string {
  return raw
    .trim()
    .replace(/^[^\w]+|[^\w]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Normalisation ────────────────────────────────────────────────────────────
function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/^(the|a|an)\s+/i, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Similarity score (0–1) ───────────────────────────────────────────────────
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
  if (q === t) return 1;
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
  const byMatch = cleaned.match(/^(.*?)\s+by\s+(.+)$/i);
  if (byMatch) {
    return { type: 'title_and_author', title: byMatch[1].trim(), author: byMatch[2].trim() };
  }
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
  return { type: 'title', title: cleaned };
}

// Weighted multi-factor score: title 60%, author 25%, popularity 15%
function scoreBook(
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

const AUTO_RESOLVE_THRESHOLD = 0.8;

// ─── Fetch helper ─────────────────────────────────────────────────────────────
const OL_FIELDS = 'key,title,author_name,first_publish_year,edition_count';

async function fetchDocs(params: Record<string, string>): Promise<any[]> {
  try {
    const qs = new URLSearchParams({ ...params, fields: OL_FIELDS, limit: '20' });
    const url = `https://openlibrary.org/search.json?${qs}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return data.docs ?? [];
  } catch {
    return [];
  }
}

// ─── Shared scoring + deduplication ──────────────────────────────────────────
function buildResult(
  allDocs: any[],
  titleQuery: string,
  authorQuery: string,
  forceMulti: boolean,
): LookupResult {
  if (allDocs.length === 0) return { type: 'none' };

  // Exact match shortcut — only for pure title searches
  if (!forceMulti && authorQuery === '') {
    const normTitle = normalise(titleQuery);
    const exactMatch = allDocs.find(
      (doc: any) => normalise(doc.title ?? '') === normTitle,
    );
    if (exactMatch) {
      return {
        type: 'single',
        book: {
          title: exactMatch.title ?? '',
          author: exactMatch.author_name?.[0] ?? 'Unknown Author',
          year: exactMatch.first_publish_year?.toString(),
        },
      };
    }
  }

  const logCounts = allDocs.map((doc: any) =>
    Math.log((doc.edition_count ?? 0) + 1),
  );
  const maxLogCount = Math.max(...logCounts);

  const scored: Array<{ book: BookData; score: number }> = allDocs
    .map((doc: any, i: number) => {
      const title: string = doc.title ?? '';
      const author: string = doc.author_name?.[0] ?? 'Unknown Author';
      const popularityScore = maxLogCount > 0 ? logCounts[i] / maxLogCount : 0;
      const book: BookData = { title, author, year: doc.first_publish_year?.toString() };
      return { book, score: scoreBook(titleQuery, authorQuery, title, author, popularityScore) };
    })
    .filter((r: { book: BookData; score: number }) => r.score > 0.1);

  if (scored.length === 0) return { type: 'none' };

  scored.sort((a: { score: number }, b: { score: number }) => b.score - a.score);

  const seen = new Map<string, { book: BookData; score: number }>();
  for (const r of scored) {
    const key = `${normalise(r.book.title)}||${normalise(r.book.author)}`;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, r);
    } else {
      const existingYear = parseInt(existing.book.year ?? '9999');
      const currentYear = parseInt(r.book.year ?? '9999');
      if (currentYear < existingYear) seen.set(key, r);
    }
  }
  const deduped = [...seen.values()].sort((a, b) => b.score - a.score);
  const best = deduped[0];

  if (!forceMulti && best.score >= AUTO_RESOLVE_THRESHOLD) {
    return { type: 'single', book: best.book };
  }

  return {
    type: 'multi',
    options: deduped.slice(0, 20).map((r: { book: BookData }) => r.book),
  };
}

// Lookup using explicit title + author, bypassing the input classifier.
export async function openLibraryLookupByTitleAuthor(
  title: string,
  author: string,
  forceMulti = false,
): Promise<LookupResult> {
  try {
    const titleQuery = cleanInput(title);
    const authorQuery = cleanInput(author);
    if (!titleQuery && !authorQuery) return { type: 'none' };

    let queryPromises: Promise<any[]>[];
    if (!titleQuery) {
      queryPromises = [
        fetchDocs({ author: authorQuery }),
        fetchDocs({ q: authorQuery }),
      ];
    } else if (authorQuery) {
      queryPromises = [
        fetchDocs({ title: titleQuery, author: authorQuery }),
        fetchDocs({ title: titleQuery }),
      ];
    } else {
      queryPromises = [
        fetchDocs({ title: titleQuery }),
        fetchDocs({ q: titleQuery }),
      ];
    }

    const docArrays = await Promise.all(queryPromises);
    const seenKeys = new Set<string>();
    const allDocs: any[] = [];
    for (const doc of docArrays.flat()) {
      if (!seenKeys.has(doc.key)) {
        seenKeys.add(doc.key);
        allDocs.push(doc);
      }
    }
    return buildResult(allDocs, titleQuery, authorQuery, forceMulti || !titleQuery);
  } catch {
    return { type: 'none' };
  }
}

// ─── Main lookup ──────────────────────────────────────────────────────────────
export async function openLibraryLookup(query: string, forceMulti = false): Promise<LookupResult> {
  try {
    const cleaned = cleanInput(query);
    const classification = classifyInput(cleaned);

    let queryPromises: Promise<any[]>[];
    let titleQuery: string;
    let authorQuery: string;

    if (classification.type === 'title_and_author') {
      titleQuery = classification.title;
      authorQuery = classification.author;
      queryPromises = [
        fetchDocs({ title: titleQuery, author: authorQuery }),
        fetchDocs({ title: titleQuery }),
      ];
    } else if (classification.type === 'author') {
      titleQuery = '';
      authorQuery = classification.author;
      queryPromises = [
        fetchDocs({ author: authorQuery }),
        fetchDocs({ q: authorQuery }), // fallback: catches misclassified titles
      ];
    } else {
      titleQuery = classification.title;
      authorQuery = '';
      queryPromises = [
        fetchDocs({ title: titleQuery }),
        fetchDocs({ q: titleQuery }),
      ];
    }

    const docArrays = await Promise.all(queryPromises);

    const seenKeys = new Set<string>();
    const allDocs: any[] = [];
    for (const doc of docArrays.flat()) {
      if (!seenKeys.has(doc.key)) {
        seenKeys.add(doc.key);
        allDocs.push(doc);
      }
    }

    return buildResult(allDocs, titleQuery, authorQuery, forceMulti);
  } catch {
    return { type: 'none' };
  }
}
