import { useEffect, useRef, useState } from 'react';
import { BookItem, BookData } from '../types/book';
import { green } from '../theme/colors';

type BookDetailSheetProps = {
  book: BookItem | null;
  onClose: () => void;
  onMarkAsRead: () => void;
  onMarkAsUnread: () => void;
  onDelete: () => void;
  onRetryLookup: () => void;
  onNoneOfThese: () => void;
  onFindAlternatives: () => void;
  onSearchAgain: (query: string) => void;
  onSelectOption: (option: { title: string; author: string; year?: string }) => void;
};

export function BookDetailSheet({
  book,
  onClose,
  onMarkAsRead,
  onMarkAsUnread,
  onDelete,
  onRetryLookup,
  onNoneOfThese,
  onFindAlternatives,
  onSearchAgain,
  onSelectOption,
}: BookDetailSheetProps) {
  const isOpen = !!book;
  const sheetRef = useRef<HTMLDivElement>(null);

  // Dismiss on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.35)',
          zIndex: 100,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 101,
          backgroundColor: green[100],
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingBottom: 'calc(32px + env(safe-area-inset-bottom))',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: green[300] }} />
        </div>

        {book && <SheetContent book={book} onClose={onClose} onMarkAsRead={onMarkAsRead} onMarkAsUnread={onMarkAsUnread} onDelete={onDelete} onRetryLookup={onRetryLookup} onNoneOfThese={onNoneOfThese} onFindAlternatives={onFindAlternatives} onSearchAgain={onSearchAgain} onSelectOption={onSelectOption} />}
      </div>
    </>
  );
}

function SheetContent({ book, onClose, onMarkAsRead, onMarkAsUnread, onDelete, onNoneOfThese, onFindAlternatives, onSearchAgain, onSelectOption }: Omit<BookDetailSheetProps, 'book'> & { book: BookItem }) {
  const handleDelete = () => { onDelete(); onClose(); };
  const handleMarkAsRead = () => { onMarkAsRead(); onClose(); };
  const handleMarkAsUnread = () => { onMarkAsUnread(); onClose(); };

  return (
    <div style={{ padding: '12px 24px 0' }}>

      {/* Searching — loading indicator while a lookup is in flight */}
      {book.state === 'SEARCHING' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 8, paddingBottom: 24 }}>
          <span style={{
            display: 'inline-block', width: 16, height: 16, borderRadius: '50%',
            border: '2px solid #94E1B0', borderTopColor: '#298E4E',
            animation: 'spin 0.7s linear infinite', flexShrink: 0,
          }} />
          <span style={{ fontFamily: '"Work Sans", sans-serif', fontSize: 15, color: '#737373' }}>Looking up…</span>
        </div>
      )}

      {/* matched state */}
      {book.matchState === 'matched' && (
        <>
          <BookMeta book={book} />
          <Divider />
          {book.readState !== 'read' ? (
            <ActionButton label="Mark as Read" onClick={handleMarkAsRead} />
          ) : (
            <ActionButton label="Mark as Unread" onClick={handleMarkAsUnread} />
          )}
          <ActionButton label="Not the right book?" onClick={() => { onFindAlternatives(); onClose(); }} muted />
          <ActionButton label="Delete" onClick={handleDelete} danger />
        </>
      )}

      {/* candidates / not_found — searchable picker */}
      {(book.matchState === 'candidates' || book.matchState === 'not_found') && (
        <BookPicker
          book={book}
          onSelectOption={(opt) => { onSelectOption(opt); onClose(); }}
          onNoneOfThese={onNoneOfThese}
          onSearchAgain={onSearchAgain}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

function BookPicker({ book, onSelectOption, onNoneOfThese, onSearchAgain, onDelete }: {
  book: BookItem;
  onSelectOption: (opt: BookData) => void;
  onNoneOfThese: () => void;
  onSearchAgain: (query: string) => void;
  onDelete: () => void;
}) {
  const [filterText, setFilterText] = useState('');
  const [showRefine, setShowRefine] = useState(book.matchState === 'not_found');
  const [refineText, setRefineText] = useState(book.originalText);

  const candidates = book.options ?? [];
  const filtered = filterText
    ? candidates.filter(opt =>
        opt.title.toLowerCase().includes(filterText.toLowerCase()) ||
        opt.author.toLowerCase().includes(filterText.toLowerCase())
      )
    : candidates;

  const handleSearchAgain = () => {
    if (refineText.trim()) onSearchAgain(refineText.trim());
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: `1px solid ${green[300]}`,
    borderRadius: 10,
    padding: '10px 14px',
    fontFamily: '"Work Sans", sans-serif',
    fontSize: 15,
    color: '#171717',
    backgroundColor: 'transparent',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <>
      <SheetTitle>{book.matchState === 'not_found' ? 'Search again' : 'Which book did you mean?'}</SheetTitle>

      {/* Filter input */}
      {candidates.length > 0 && (
        <input
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          placeholder="Filter results…"
          style={{ ...inputStyle, marginBottom: 12 }}
        />
      )}

      {/* Candidates list */}
      <div style={{ maxHeight: '40vh', overflowY: 'auto', marginBottom: 4 }}>
        {filtered.length === 0 && candidates.length > 0 && (
          <p style={{ fontFamily: '"Work Sans", sans-serif', fontSize: 14, color: '#737373', margin: '0 0 8px' }}>
            No matches for "{filterText}"
          </p>
        )}
        {filtered.length === 0 && candidates.length === 0 && (
          <p style={{ fontFamily: '"Work Sans", sans-serif', fontSize: 14, color: '#737373', margin: '0 0 8px' }}>
            We couldn't find "{book.originalText}". Try a different search below.
          </p>
        )}
        {filtered.map((opt, i) => (
          <button
            key={i}
            onClick={() => onSelectOption(opt)}
            style={{
              display: 'flex', flexDirection: 'column', width: '100%', textAlign: 'left',
              background: 'transparent', border: `1px solid ${green[300]}`, borderRadius: 10,
              padding: '10px 14px', marginBottom: 8, cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span style={{ fontFamily: '"Work Sans", sans-serif', fontSize: 15, fontWeight: 500, color: '#171717' }}>{opt.title}</span>
            <span style={{ fontFamily: '"Work Sans", sans-serif', fontSize: 13, color: '#525252', marginTop: 2 }}>
              {opt.author}{opt.year ? ` · ${opt.year}` : ''}
            </span>
          </button>
        ))}
      </div>

      <Divider />

      {/* Search again */}
      {!showRefine ? (
        <ActionButton label="Search again" onClick={() => setShowRefine(true)} muted />
      ) : (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 0' }}>
          <input
            value={refineText}
            onChange={e => setRefineText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearchAgain()}
            autoFocus
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            onClick={handleSearchAgain}
            style={{
              flexShrink: 0, padding: '10px 16px', border: 'none', borderRadius: 10,
              backgroundColor: green[600], color: '#fff',
              fontFamily: '"Work Sans", sans-serif', fontSize: 15, fontWeight: 600,
              cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
            }}
          >
            Go
          </button>
        </div>
      )}

      <ActionButton label="None of these" onClick={onNoneOfThese} />
      <ActionButton label="Delete" onClick={onDelete} danger />
    </>
  );
}

function BookMeta({ book }: { book: BookItem }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{
        fontFamily: '"Work Sans", sans-serif',
        fontSize: 22,
        fontWeight: 700,
        color: '#171717',
        margin: '8px 0 4px',
        lineHeight: '28px',
      }}>
        {book.resolvedTitle ?? book.originalText}
      </h2>
      {book.resolvedAuthor && (
        <p style={{ fontFamily: '"Work Sans", sans-serif', fontSize: 15, color: '#525252', margin: 0 }}>
          {book.resolvedAuthor}{book.resolvedYear ? ` · ${book.resolvedYear}` : ''}
        </p>
      )}
    </div>
  );
}

function SheetTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily: '"Work Sans", sans-serif',
      fontSize: 19,
      fontWeight: 700,
      color: '#171717',
      margin: '8px 0 8px',
    }}>
      {children}
    </h2>
  );
}

function Divider() {
  return <div style={{ height: 1, backgroundColor: green[300], margin: '4px 0 8px' }} />;
}

function ActionButton({ label, onClick, danger, muted }: { label: string; onClick: () => void; danger?: boolean; muted?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: 'transparent',
        border: 'none',
        padding: '14px 0',
        fontFamily: '"Work Sans", sans-serif',
        fontSize: 17,
        fontWeight: 500,
        color: danger ? '#b91c1c' : muted ? '#737373' : green[700],
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  );
}
