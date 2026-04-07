import { useRef, useEffect, useState } from 'react';
import { useBooks } from '../context/BooksContext';
import { BookItemRow } from '../components/BookItemRow';
import { BookDetailSheet } from '../components/BookDetailSheet';
import { BookItem } from '../types/book';

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-4 pt-6">
      <span className="font-sans text-xs font-medium tracking-[0.06em] uppercase text-green-700">
        {title}
      </span>
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
    <div className="flex items-center min-h-[52px] px-5">
      <input
        ref={inputRef}
        type="text"
        placeholder="Book title, author…"
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="flex-1 border-0 outline-none bg-transparent font-sans text-base font-normal text-foreground caret-primaryDark"
      />
    </div>
  );
}

export default function HomeScreen() {
  const { books, addBook, submitBook, deleteBook, markAsRead, markAsUnread, markAsNotFound, selectOption, lookupBook, lookupCandidates } = useBooks();
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);

  // To Read: searching + resolved-but-unread; newest added at top (sortOrder desc)
  const toRead = books
    .filter(b => b.state === 'SEARCHING' || (b.matchState !== undefined && b.readState !== 'read'))
    .sort((a, b) => (b.sortOrder ?? 0) - (a.sortOrder ?? 0));

  // Read: most recently marked-as-read at top (movedAt desc)
  const readBooks = books
    .filter(b => b.readState === 'read')
    .sort((a, b) => (b.movedAt ?? 0) - (a.movedAt ?? 0));
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
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
      {/* Scrollable list */}
      <div className="flex-1 min-h-0 overflow-y-auto [-webkit-overflow-scrolling:touch] pb-[100px]">
        <SectionHeader title="To Read" />

        {inputBook && (
          <AddBookInput onSubmit={handleAddSubmit} onCancel={handleAddCancel} />
        )}

        {toRead.length === 0 && !inputBook && (
          <p className="pl-5 pt-3 font-sans text-sm text-[#737373]">
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
        className={`fixed bottom-[calc(16px+env(safe-area-inset-bottom))] right-5 w-[52px] h-[52px] rounded-full border-0 text-white text-[28px] leading-none flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.18)] transition-colors duration-150 [-webkit-tap-highlight-color:transparent] select-none ${inputBook ? 'bg-green-300 cursor-default' : 'bg-primaryDark cursor-pointer'}`}
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
        onFindAlternatives={() => selectedBook && lookupCandidates(selectedBook.id)}
        onSearchAgain={(query) => selectedBook && lookupCandidates(selectedBook.id, query)}
        onSelectOption={(opt) => selectedBook && selectOption(selectedBook.id, opt)}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
