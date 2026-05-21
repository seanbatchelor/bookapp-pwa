import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { BookItem, BookData, ReadState } from '../types/book';
import { openLibraryLookup, openLibraryLookupByTitleAuthor } from '../utils/openLibraryLookup';
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
  lookupCandidates: (id: string) => Promise<void>;
  lookupCandidatesByTitleAuthor: (id: string, title: string, author: string) => Promise<'candidates' | 'not_found'>;
  saveManualEntry: (id: string, title: string, author: string) => Promise<void>;
  selectOption: (id: string, book: BookData) => void;
  markAsRead: (id: string) => void;
  markAsUnread: (id: string) => void;
  markAsNotFound: (id: string) => void;
  deleteBook: (id: string) => void;
};

const BooksContext = createContext<BooksContextType | undefined>(undefined);

type Action =
  | { type: 'SET'; books: BookItem[] }
  | { type: 'UPDATE'; id: string; patch: Partial<BookItem> }
  | { type: 'DELETE'; id: string };

function reducer(state: BookItem[], action: Action): BookItem[] {
  switch (action.type) {
    case 'SET':
      return action.books;
    case 'UPDATE':
      return state.map(b => b.id === action.id ? { ...b, ...action.patch } : b);
    case 'DELETE':
      return state.filter(b => b.id !== action.id);
  }
}

export function BooksProvider({ children }: { children: ReactNode }) {
  const [books, dispatch] = useReducer(reducer, undefined, loadBooks);

  useEffect(() => {
    const toSave = books.filter(b => b.state !== 'EMPTY' && b.state !== 'ACTIVE' && b.state !== 'SEARCHING');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }, [books]);

  const addBook = () => {
    const ts = Date.now();
    dispatch({ type: 'SET', books: [{ id: ts.toString(), state: 'EMPTY', originalText: '', sortOrder: ts }, ...books] });
  };

  const updateBookText = (id: string, text: string) => {
    dispatch({ type: 'UPDATE', id, patch: { originalText: text, state: text ? 'ACTIVE' : 'EMPTY' } });
  };

  function applyLookupResult(id: string, result: Awaited<ReturnType<typeof openLibraryLookup>>, currentReadState?: ReadState) {
    if (result.type === 'single') {
      dispatch({ type: 'UPDATE', id, patch: { state: undefined, matchState: 'matched', readState: currentReadState ?? 'unread', resolvedTitle: result.book.title, resolvedAuthor: result.book.author, resolvedYear: result.book.year, options: undefined } });
    } else if (result.type === 'multi') {
      dispatch({ type: 'UPDATE', id, patch: { state: undefined, matchState: 'candidates', readState: currentReadState ?? 'unread', options: result.options } });
    } else {
      dispatch({ type: 'UPDATE', id, patch: { state: undefined, matchState: 'not_found', readState: currentReadState ?? 'unread' } });
    }
  }

  const submitBook = async (id: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    dispatch({ type: 'UPDATE', id, patch: { originalText: trimmed, state: 'SEARCHING', sortOrder: Date.now() } });
    const result = await openLibraryLookup(trimmed);
    applyLookupResult(id, result);
  };

  const lookupCandidatesByTitleAuthor = async (id: string, title: string, author: string): Promise<'candidates' | 'not_found'> => {
    dispatch({ type: 'UPDATE', id, patch: { state: 'SEARCHING' } });
    const result = await openLibraryLookupByTitleAuthor(title, author, true);
    if (result.type !== 'none') {
      const options = result.type === 'multi' ? result.options : [result.book];
      dispatch({ type: 'UPDATE', id, patch: { state: undefined, matchState: 'candidates', options } });
      return 'candidates';
    } else {
      dispatch({ type: 'UPDATE', id, patch: { state: undefined, matchState: 'not_found' } });
      return 'not_found';
    }
  };

  const lookupCandidates = async (id: string) => {
    const book = books.find(b => b.id === id);
    if (!book) return;
    dispatch({ type: 'UPDATE', id, patch: { state: 'SEARCHING' } });
    const result = await openLibraryLookup(book.originalText, true);
    if (result.type === 'multi') {
      dispatch({ type: 'UPDATE', id, patch: { state: undefined, matchState: 'candidates', options: result.options } });
    } else if (result.type === 'single') {
      dispatch({ type: 'UPDATE', id, patch: { state: undefined, matchState: 'candidates', options: [result.book] } });
    } else {
      dispatch({ type: 'UPDATE', id, patch: { state: undefined, matchState: 'not_found' } });
    }
  };

  const saveManualEntry = async (id: string, title: string, author: string) => {
    const book = books.find(b => b.id === id);
    if (!book) return;
    dispatch({ type: 'UPDATE', id, patch: { matchState: 'matched', resolvedTitle: title, resolvedAuthor: author || undefined, resolvedYear: undefined, options: undefined, searchAuthor: undefined, readState: book.readState ?? 'unread' } });
    const result = await openLibraryLookupByTitleAuthor(title, author, false);
    if (result.type === 'single') {
      dispatch({ type: 'UPDATE', id, patch: { resolvedTitle: result.book.title, resolvedAuthor: result.book.author, resolvedYear: result.book.year } });
    }
  };

  const selectOption = (id: string, book: BookData) => {
    const current = books.find(b => b.id === id);
    dispatch({ type: 'UPDATE', id, patch: { matchState: 'matched', resolvedTitle: book.title, resolvedAuthor: book.author, resolvedYear: book.year, options: undefined, readState: current?.readState ?? 'unread' } });
  };

  const markAsRead = (id: string) => {
    const ts = Date.now();
    const readMovedAts = books.filter(x => x.readState === 'read').map(x => x.movedAt ?? 0);
    const maxMovedAt = readMovedAts.length === 0 ? ts : Math.max(...readMovedAts);
    dispatch({ type: 'UPDATE', id, patch: { readState: 'read', sortOrder: ts, movedAt: maxMovedAt + 1 } });
  };

  const markAsUnread = (id: string) => {
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
    <BooksContext.Provider value={{ books, addBook, updateBookText, submitBook, lookupCandidates, lookupCandidatesByTitleAuthor, saveManualEntry, selectOption, markAsRead, markAsUnread, markAsNotFound, deleteBook }}>
      {children}
    </BooksContext.Provider>
  );
}

export function useBooks() {
  const context = useContext(BooksContext);
  if (!context) throw new Error('useBooks must be used within BooksProvider');
  return context;
}
