export type BookState =
  | 'EMPTY'
  | 'ACTIVE'
  | 'UNSEARCHED'
  | 'SEARCHING'
  | 'FOUND'
  | 'OPTIONS_FOUND'
  | 'NOT_FOUND'
  | 'READ';

export type BookData = {
  title: string;
  author: string;
  year?: string;
};

export type BookItem = {
  id: string;
  state: BookState;
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
