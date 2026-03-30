import { useRef, useEffect, useState } from 'react';
import { useBooks } from '../context/BooksContext';
import { BookItemRow } from '../components/BookItemRow';
import { BookDetailSheet } from '../components/BookDetailSheet';
import { BookItem } from '../types/book';
import { green } from '../theme/colors';

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 24, paddingBottom: 8 }}>
      <span style={{
        fontFamily: '"Work Sans", sans-serif',
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: green[700],
      }}>
        {title}
      </span>
      <div style={{ height: 1, backgroundColor: green[300], marginTop: 6 }} />
    </div>
  );
}

function AddBookInput({ onSubmit, onCancel }: { onSubmit: (text: string) => void; onCancel: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = inputRef.current?.value.trim() ?? '';
      if (val) onSubmit(val);
      else onCancel();
    }
    if (e.key === 'Escape') onCancel();
  };

  const handleBlur = () => {
    const val = inputRef.current?.value.trim() ?? '';
    if (!val) onCancel();
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', minHeight: 52, paddingLeft: 20, paddingRight: 20 }}>
      <input
        ref={inputRef}
        type="text"
        placeholder="Book title, author…"
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontFamily: '"Work Sans", sans-serif',
          fontSize: 17,
          fontWeight: 400,
          color: '#171717',
          caretColor: green[600],
        }}
      />
    </div>
  );
}

export default function HomeScreen() {
  const { books, addBook, submitBook, deleteBook, markAsRead, markAsUnread, markAsNotFound, selectOption, lookupBook } = useBooks();
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);

  // To Read: newest added at top (sortOrder desc), seed data has low values so sits below new entries
  const toRead = books
    .filter(b => b.state !== 'READ' && b.state !== 'EMPTY' && b.state !== 'ACTIVE')
    .sort((a, b) => (b.sortOrder ?? 0) - (a.sortOrder ?? 0));

  // Read: oldest marked-as-read at top, most recently read at bottom (movedAt asc)
  const readBooks = books
    .filter(b => b.state === 'READ')
    .sort((a, b) => (a.movedAt ?? 0) - (b.movedAt ?? 0));
  const inputBook = books.find(b => b.state === 'EMPTY' || b.state === 'ACTIVE');

  // Keep selectedBook in sync if its state changes while sheet is open
  useEffect(() => {
    if (!selectedBook) return;
    const updated = books.find(b => b.id === selectedBook.id);
    if (updated) setSelectedBook(updated);
    else setSelectedBook(null);
  }, [books]);

  const handleAddSubmit = (text: string) => {
    if (!inputBook) return;
    submitBook(inputBook.id, text);
  };

  const handleAddCancel = () => {
    if (inputBook) deleteBook(inputBook.id);
  };

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      {/* Scrollable list */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 100 }}>
        <SectionHeader title="To Read" />

        {inputBook && (
          <AddBookInput onSubmit={handleAddSubmit} onCancel={handleAddCancel} />
        )}

        {toRead.length === 0 && !inputBook && (
          <p style={{ paddingLeft: 20, paddingTop: 12, fontFamily: '"Work Sans", sans-serif', fontSize: 15, color: '#737373' }}>
            Tap + to add a book
          </p>
        )}

        {toRead.map(book => (
          <BookItemRow
            key={book.id}
            book={book}
            onPress={() => setSelectedBook(book)}
            onToggleRead={() => markAsRead(book.id)}
          />
        ))}

        {readBooks.length > 0 && (
          <>
            <SectionHeader title="Read" />
            {readBooks.map(book => (
              <BookItemRow
                key={book.id}
                book={book}
                onPress={() => setSelectedBook(book)}
                onToggleRead={() => markAsUnread(book.id)}
              />
            ))}
          </>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => { if (!inputBook) addBook(); }}
        disabled={!!inputBook}
        style={{
          position: 'fixed',
          bottom: 'calc(16px + env(safe-area-inset-bottom))',
          right: 20,
          width: 52,
          height: 52,
          borderRadius: '50%',
          border: 'none',
          backgroundColor: inputBook ? green[300] : green[600],
          color: '#ffffff',
          fontSize: 28,
          lineHeight: 1,
          cursor: inputBook ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          transition: 'background-color 0.15s',
          WebkitTapHighlightColor: 'transparent',
          userSelect: 'none',
        }}
        aria-label="Add book"
      >
        +
      </button>

      {/* Detail sheet */}
      <BookDetailSheet
        book={selectedBook}
        onClose={() => setSelectedBook(null)}
        onMarkAsRead={() => selectedBook && markAsRead(selectedBook.id)}
        onMarkAsUnread={() => selectedBook && markAsUnread(selectedBook.id)}
        onDelete={() => selectedBook && deleteBook(selectedBook.id)}
        onRetryLookup={() => selectedBook && lookupBook(selectedBook.id)}
        onNoneOfThese={() => selectedBook && markAsNotFound(selectedBook.id)}
        onSelectOption={(opt) => selectedBook && selectOption(selectedBook.id, opt)}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
