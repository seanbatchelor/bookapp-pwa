// Transient input-row lifecycle — only ever set on the one in-progress add row
export type BookState = 'EMPTY' | 'ACTIVE' | 'SEARCHING';

// Set after a lookup completes — independent of read status
export type MatchState = 'matched' | 'candidates' | 'not_found';

// Set when a book is first resolved, toggled independently of match status
export type ReadState = 'unread' | 'read';

export type BookData = {
  title: string;
  author: string;
  year?: string;
};

export type BookItem = {
  id: string;
  state?: BookState;       // only present while the book is being added/searched
  matchState?: MatchState; // set once lookup completes, never changes on read/unread
  readState?: ReadState;   // toggled independently of matchState
  sortOrder?: number;
  movedAt?: number;
  originalText: string;
  resolvedTitle?: string;
  resolvedAuthor?: string;
  resolvedYear?: string;
  options?: BookData[];
};

export type LookupResult =
  | { type: 'single'; book: BookData }
  | { type: 'multi'; options: BookData[] }
  | { type: 'none' };
