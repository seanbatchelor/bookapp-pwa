import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { BookItem, BookData, ReadState } from '../types/book';
import { googleBooksLookup } from '../utils/googleBooksLookup';
import { USE_SEED_DATA, SEED_BOOKS } from '../data/seedData';

const STORAGE_KEY = 'bookapp_books';

function loadBooks(): BookItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as BookItem[];
  } catch {
    // corrupt data — fall through to default
  }
  return USE_SEED_DATA ? SEED_BOOKS : [];
}

type BooksContextType = {
  books: BookItem[];
  addBook: () => void;
  updateBookText: (id: string, text: string) => void;
  submitBook: (id: string, text: string) => Promise<void>;
  lookupBook: (id: string) => Promise<void>;
  lookupCandidates: (id: string, customQuery?: string) => Promise<void>;
  selectOption: (id: string, book: BookData) => void;
  markAsRead: (id: string) => void;
  markAsUnread: (id: string) => void;
  markAsNotFound: (id: string) => void;
  deleteBook: (id: string) => void;
};

const BooksContext = createContext<BooksContextType | undefined>(undefined);

// Simple reducer so we get a stable dispatch reference alongside async actions
type Action =
  | { type: 'SET'; books: BookItem[] }
  | { type: 'UPDATE'; id: string; patch: Partial<BookItem> }
  | { type: 'UPDATE_MANY'; patches: { id: string; patch: Partial<BookItem> }[] }
  | { type: 'DELETE'; id: string };

function reducer(state: BookItem[], action: Action): BookItem[] {
  switch (action.type) {
    case 'SET':
      return action.books;
    case 'UPDATE':
      return state.map(b => b.id === action.id ? { ...b, ...action.patch } : b);
    case 'UPDATE_MANY': {
      const patchMap = new Map(action.patches.map(p => [p.id, p.patch]));
      return state.map(b => patchMap.has(b.id) ? { ...b, ...patchMap.get(b.id) } : b);
    }
    case 'DELETE':
      return state.filter(b => b.id !== action.id);
  }
}

export function BooksProvider({ children }: { children: ReactNode }) {
  const [books, dispatch] = useReducer(reducer, undefined, loadBooks);

  // Persist to localStorage whenever books changes
  useEffect(() => {
    // Don't persist transient input rows — only save books that have completed lookup
    const toSave = books.filter(b => b.state !== 'EMPTY' && b.state !== 'ACTIVE' && b.state !== 'SEARCHING');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }, [books]);

  const addBook = () => {
    const ts = Date.now();
    const newBook: BookItem = {
      id: ts.toString(),
      state: 'EMPTY',
      originalText: '',
      sortOrder: ts,
    };
    dispatch({ type: 'SET', books: [newBook, ...books] });
  };

  const updateBookText = (id: string, text: string) => {
    dispatch({ type: 'UPDATE', id, patch: { originalText: text, state: text ? 'ACTIVE' : 'EMPTY' } });
  };

  function applyLookupResult(id: string, result: Awaited<ReturnType<typeof googleBooksLookup>>, currentReadState?: ReadState) {
    if (result.type === 'single') {
      dispatch({ type: 'UPDATE', id, patch: { state: undefined, matchState: 'matched', readState: currentReadState ?? 'unread', resolvedTitle: result.book.title, resolvedAuthor: result.book.author, resolvedYear: result.book.year, options: undefined } });
    } else if (result.type === 'multi') {
      dispatch({ type: 'UPDATE', id, patch: { state: undefined, matchState: 'candidates', readState: currentReadState ?? 'unread', options: result.options } });
    } else {
      dispatch({ type: 'UPDATE', id, patch: { state: undefined, matchState: 'not_found', readState: currentReadState ?? 'unread' } });
    }
  }

  // Submit + immediate lookup in one atomic action
  const submitBook = async (id: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    dispatch({ type: 'UPDATE', id, patch: { originalText: trimmed, state: 'SEARCHING', sortOrder: Date.now() } });
    const result = await googleBooksLookup(trimmed);
    applyLookupResult(id, result);
  };

  const lookupBook = async (id: string) => {
    const book = books.find(b => b.id === id);
    if (!book || !book.originalText.trim()) return;
    dispatch({ type: 'UPDATE', id, patch: { state: 'SEARCHING' } });
    const result = await googleBooksLookup(book.originalText);
    applyLookupResult(id, result, book.readState);
  };

  // Like lookupBook but always returns candidates — used when the auto-resolved book is wrong.
  // Accepts an optional customQuery to refine the search (updates originalText too).
  const lookupCandidates = async (id: string, customQuery?: string) => {
    const book = books.find(b => b.id === id);
    if (!book) return;
    const query = customQuery ?? book.originalText;
    if (!query.trim()) return;
    const patch: Partial<BookItem> = { state: 'SEARCHING' };
    if (customQuery) patch.originalText = customQuery;
    dispatch({ type: 'UPDATE', id, patch });
    const result = await googleBooksLookup(query, true);
    if (result.type === 'multi') {
      dispatch({ type: 'UPDATE', id, patch: { state: undefined, matchState: 'candidates', options: result.options } });
    } else if (result.type === 'single') {
      // forceMulti still returned single (only 1 result after filtering) — show as candidates
      dispatch({ type: 'UPDATE', id, patch: { state: undefined, matchState: 'candidates', options: [result.book] } });
    } else {
      dispatch({ type: 'UPDATE', id, patch: { state: undefined, matchState: 'not_found' } });
    }
  };

  const selectOption = (id: string, book: BookData) => {
    const current = books.find(b => b.id === id);
    dispatch({ type: 'UPDATE', id, patch: { matchState: 'matched', resolvedTitle: book.title, resolvedAuthor: book.author, resolvedYear: book.year, options: undefined, readState: current?.readState ?? 'unread' } });
  };

  const markAsRead = (id: string) => {
    const ts = Date.now();
    // movedAt used to sort Read list — ascending, so highest movedAt = bottom (most recently read)
    const readMovedAts = books.filter(x => x.readState === 'read').map(x => x.movedAt ?? 0);
    const maxMovedAt = readMovedAts.length === 0 ? ts : Math.max(...readMovedAts);
    dispatch({ type: 'UPDATE', id, patch: { readState: 'read', sortOrder: ts, movedAt: maxMovedAt + 1 } });
  };

  const markAsUnread = (id: string) => {
    // Place at bottom of To Read by going one below the current minimum sortOrder
    const toReadSortOrders = books
      .filter(x => x.readState !== 'read' && x.matchState !== undefined)
      .map(x => x.sortOrder ?? 0);
    const minSortOrder = toReadSortOrders.length === 0 ? 0 : Math.min(...toReadSortOrders);
    dispatch({ type: 'UPDATE', id, patch: { readState: 'unread', sortOrder: minSortOrder - 1, movedAt: undefined } });
  };

  const markAsNotFound = (id: string) => {
    dispatch({ type: 'UPDATE', id, patch: { matchState: 'not_found', options: undefined } });
  };

  const deleteBook = (id: string) => {
    dispatch({ type: 'DELETE', id });
  };

  return (
    <BooksContext.Provider value={{ books, addBook, updateBookText, submitBook, lookupBook, lookupCandidates, selectOption, markAsRead, markAsUnread, markAsNotFound, deleteBook }}>
      {children}
    </BooksContext.Provider>
  );
}

export function useBooks() {
  const context = useContext(BooksContext);
  if (!context) throw new Error('useBooks must be used within BooksProvider');
  return context;
}
