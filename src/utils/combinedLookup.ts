import { LookupResult, BookData } from '../types/book';

// ─── Shared pure utils ────────────────────────────────────────────────────────

function cleanInput(raw: string): string {
  return raw.trim().replace(/^[^\w]+|[^\w]+$/g, '').replace(/\s+/g, ' ').trim();
}

function normalise(s: string): string {
  return s.toLowerCase().replace(/^(the|a|an)\s+/i, '').replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
}

function bigrams(s: string): Set<string> {
  const set = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
  return set;
}

function dice(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const ba = bigrams(a), bb = bigrams(b);
  if (ba.size === 0 || bb.size === 0) return 0;
  let overlap = 0;
  ba.forEach(bg => { if (bb.has(bg)) overlap++; });
  return (2 * overlap) / (ba.size + bb.size);
}

function titleSimilarity(query: string, title: string): number {
  const q = normalise(query), t = normalise(title);
  if (q === t) return 1;
  if (t.startsWith(q + ' ') || t.endsWith(' ' + q)) return 0.9;
  if (q.startsWith(t + ' ') || q.endsWith(' ' + t)) return 0.85;
  return dice(q, t);
}

type InputClassification =
  | { type: 'title'; title: string }
  | { type: 'author'; author: string }
  | { type: 'title_and_author'; title: string; author: string };

const STOP_WORDS = new Set(['the','a','an','of','in','on','at','for','and','or','but','with']);

function classifyInput(cleaned: string): InputClassification {
  const byMatch = cleaned.match(/^(.*?)\s+by\s+(.+)$/i);
  if (byMatch) return { type: 'title_and_author', title: byMatch[1].trim(), author: byMatch[2].trim() };
  const words = cleaned.split(' ');
  if (words.length >= 2 && words.length <= 3 && words.every(w => /^[A-Z]/.test(w)) && words.every(w => !STOP_WORDS.has(w.toLowerCase())) && !/\d/.test(cleaned)) {
    return { type: 'author', author: cleaned };
  }
  return { type: 'title', title: cleaned };
}

const AUTO_RESOLVE_THRESHOLD = 0.8;

// ─── Raw result type (common shape from both APIs) ────────────────────────────

type RawBook = { title: string; author: string; year?: string; rawPopularity: number };

// ─── Google Books fetch ───────────────────────────────────────────────────────

async function fetchGB(q: string): Promise<RawBook[]> {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=20&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items ?? []).map((item: any) => ({
      title: item.volumeInfo.title ?? '',
      author: item.volumeInfo.authors?.[0] ?? 'Unknown Author',
      year: item.volumeInfo.publishedDate?.split('-')[0],
      rawPopularity: item.volumeInfo.ratingsCount ?? 0,
    }));
  } catch { return []; }
}

// ─── Open Library fetch ───────────────────────────────────────────────────────

const OL_FIELDS = 'key,title,author_name,first_publish_year,edition_count';

async function fetchOL(params: Record<string, string>): Promise<RawBook[]> {
  try {
    const qs = new URLSearchParams({ ...params, fields: OL_FIELDS, limit: '20' });
    const res = await fetch(`https://openlibrary.org/search.json?${qs}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.docs ?? []).map((doc: any) => ({
      title: doc.title ?? '',
      author: doc.author_name?.[0] ?? 'Unknown Author',
      year: doc.first_publish_year?.toString(),
      rawPopularity: doc.edition_count ?? 0,
    }));
  } catch { return []; }
}

// ─── Score a batch and normalise popularity within it ────────────────────────

function scoreBatch(
  raw: RawBook[],
  titleQuery: string,
  authorQuery: string,
): Array<{ book: BookData; score: number }> {
  if (raw.length === 0) return [];
  const logCounts = raw.map(r => Math.log(r.rawPopularity + 1));
  const maxLog = Math.max(...logCounts);
  return raw.map((r, i) => {
    const popularityScore = maxLog > 0 ? logCounts[i] / maxLog : 0;
    const s =
      titleSimilarity(titleQuery, r.title) * 0.6 +
      dice(normalise(authorQuery), normalise(r.author)) * 0.25 +
      popularityScore * 0.15;
    return { book: { title: r.title, author: r.author, year: r.year }, score: s };
  }).filter(r => r.score > 0.1);
}

// ─── Merge, dedup, apply threshold ───────────────────────────────────────────

function buildResult(
  batches: Array<{ book: BookData; score: number }>[],
  titleQuery: string,
  authorQuery: string,
  forceMulti: boolean,
): LookupResult {
  const allScored = batches.flat();
  if (allScored.length === 0) return { type: 'none' };

  // Exact match shortcut — only for pure title searches
  if (!forceMulti && authorQuery === '') {
    const normTitle = normalise(titleQuery);
    const exact = allScored.find(r => normalise(r.book.title) === normTitle);
    if (exact) return { type: 'single', book: exact.book };
  }

  allScored.sort((a, b) => b.score - a.score);

  // Deduplicate by title+author key, keeping highest score (and earliest year for ties)
  const seen = new Map<string, { book: BookData; score: number }>();
  for (const r of allScored) {
    const key = `${normalise(r.book.title)}||${normalise(r.book.author)}`;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, r);
    } else if (r.score > existing.score) {
      seen.set(key, r);
    } else if (r.score === existing.score) {
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

  return { type: 'multi', options: deduped.slice(0, 20).map(r => r.book) };
}

// ─── Exported lookups ─────────────────────────────────────────────────────────

export async function combinedLookupByTitleAuthor(
  title: string,
  author: string,
  forceMulti = false,
): Promise<LookupResult> {
  try {
    const titleQuery = cleanInput(title);
    const authorQuery = cleanInput(author);
    if (!titleQuery && !authorQuery) return { type: 'none' };

    let gbPromises: Promise<RawBook[]>[];
    let olPromises: Promise<RawBook[]>[];

    if (!titleQuery) {
      gbPromises = [fetchGB(`inauthor:"${authorQuery}"`), fetchGB(`intitle:"${authorQuery}"`)];
      olPromises = [fetchOL({ author: authorQuery }), fetchOL({ q: authorQuery })];
    } else if (authorQuery) {
      gbPromises = [fetchGB(`intitle:"${titleQuery}"+inauthor:${authorQuery}`), fetchGB(`intitle:"${titleQuery}"`)];
      olPromises = [fetchOL({ title: titleQuery, author: authorQuery }), fetchOL({ title: titleQuery })];
    } else {
      const perWord = titleQuery.split(' ').map(w => `intitle:${w}`).join('+');
      gbPromises = [fetchGB(`intitle:"${titleQuery}"`), fetchGB(perWord), fetchGB(titleQuery)];
      olPromises = [fetchOL({ title: titleQuery }), fetchOL({ q: titleQuery })];
    }

    const [gbRaw, olRaw] = await Promise.all([
      Promise.all(gbPromises).then(arrs => arrs.flat()),
      Promise.all(olPromises).then(arrs => arrs.flat()),
    ]);

    const forceMultiFinal = forceMulti || !titleQuery;
    return buildResult(
      [scoreBatch(gbRaw, titleQuery, authorQuery), scoreBatch(olRaw, titleQuery, authorQuery)],
      titleQuery,
      authorQuery,
      forceMultiFinal,
    );
  } catch { return { type: 'none' }; }
}

export async function combinedLookup(query: string, forceMulti = false): Promise<LookupResult> {
  try {
    const cleaned = cleanInput(query);
    const classification = classifyInput(cleaned);

    let gbPromises: Promise<RawBook[]>[];
    let olPromises: Promise<RawBook[]>[];
    let titleQuery: string;
    let authorQuery: string;

    if (classification.type === 'title_and_author') {
      titleQuery = classification.title;
      authorQuery = classification.author;
      gbPromises = [fetchGB(`intitle:"${titleQuery}"+inauthor:${authorQuery}`), fetchGB(`intitle:"${titleQuery}"`)];
      olPromises = [fetchOL({ title: titleQuery, author: authorQuery }), fetchOL({ title: titleQuery })];
    } else if (classification.type === 'author') {
      titleQuery = '';
      authorQuery = classification.author;
      gbPromises = [fetchGB(`inauthor:"${authorQuery}"`), fetchGB(`intitle:"${authorQuery}"`)];
      olPromises = [fetchOL({ author: authorQuery }), fetchOL({ q: authorQuery })];
    } else {
      titleQuery = classification.title;
      authorQuery = '';
      const perWord = titleQuery.split(' ').map(w => `intitle:${w}`).join('+');
      gbPromises = [fetchGB(`intitle:"${titleQuery}"`), fetchGB(perWord), fetchGB(titleQuery)];
      olPromises = [fetchOL({ title: titleQuery }), fetchOL({ q: titleQuery })];
    }

    const [gbRaw, olRaw] = await Promise.all([
      Promise.all(gbPromises).then(arrs => arrs.flat()),
      Promise.all(olPromises).then(arrs => arrs.flat()),
    ]);

    return buildResult(
      [scoreBatch(gbRaw, titleQuery, authorQuery), scoreBatch(olRaw, titleQuery, authorQuery)],
      titleQuery,
      authorQuery,
      forceMulti,
    );
  } catch { return { type: 'none' }; }
}
