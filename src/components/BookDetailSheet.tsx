import { useEffect, useRef } from 'react';
import { BookItem } from '../types/book';
import { green } from '../theme/colors';

type BookDetailSheetProps = {
  book: BookItem | null;
  onClose: () => void;
  onMarkAsRead: () => void;
  onMarkAsUnread: () => void;
  onDelete: () => void;
  onRetryLookup: () => void;
  onNoneOfThese: () => void;
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

        {book && <SheetContent book={book} onClose={onClose} onMarkAsRead={onMarkAsRead} onMarkAsUnread={onMarkAsUnread} onDelete={onDelete} onRetryLookup={onRetryLookup} onNoneOfThese={onNoneOfThese} onSelectOption={onSelectOption} />}
      </div>
    </>
  );
}

function SheetContent({ book, onClose, onMarkAsRead, onMarkAsUnread, onDelete, onRetryLookup, onNoneOfThese, onSelectOption }: Omit<BookDetailSheetProps, 'book'> & { book: BookItem }) {
  const handleDelete = () => { onDelete(); onClose(); };
  const handleMarkAsRead = () => { onMarkAsRead(); onClose(); };
  const handleMarkAsUnread = () => { onMarkAsUnread(); onClose(); };

  return (
    <div style={{ padding: '12px 24px 0' }}>

      {/* FOUND / READ state */}
      {(book.state === 'FOUND' || book.state === 'READ') && (
        <>
          <BookMeta book={book} />
          <Divider />
          {book.state === 'FOUND' ? (
            <ActionButton label="Mark as Read" onClick={handleMarkAsRead} />
          ) : (
            <ActionButton label="Mark as Unread" onClick={handleMarkAsUnread} />
          )}
          <ActionButton label="Delete" onClick={handleDelete} danger />
        </>
      )}

      {/* OPTIONS_FOUND state — pick from candidates */}
      {book.state === 'OPTIONS_FOUND' && book.options && (
        <>
          <SheetTitle>Which book did you mean?</SheetTitle>
          <p style={{ fontFamily: '"Work Sans", sans-serif', fontSize: 13, color: '#737373', marginTop: 2, marginBottom: 16 }}>
            "{book.originalText}"
          </p>
          {book.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => { onSelectOption(opt); onClose(); }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                textAlign: 'left',
                background: 'transparent',
                border: `1px solid ${green[300]}`,
                borderRadius: 10,
                padding: '10px 14px',
                marginBottom: 8,
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{ fontFamily: '"Work Sans", sans-serif', fontSize: 15, fontWeight: 500, color: '#171717' }}>{opt.title}</span>
              <span style={{ fontFamily: '"Work Sans", sans-serif', fontSize: 13, color: '#525252', marginTop: 2 }}>{opt.author}{opt.year ? ` · ${opt.year}` : ''}</span>
            </button>
          ))}
          <Divider />
          <ActionButton label="None of these" onClick={() => { onNoneOfThese(); }} />
          <ActionButton label="Delete" onClick={handleDelete} danger />
        </>
      )}

      {/* NOT_FOUND state */}
      {book.state === 'NOT_FOUND' && (
        <>
          <SheetTitle>Not found</SheetTitle>
          <p style={{ fontFamily: '"Work Sans", sans-serif', fontSize: 15, color: '#737373', marginBottom: 20 }}>
            We couldn't find "{book.originalText}" in Google Books.
          </p>
          <ActionButton label="Try Again" onClick={() => { onRetryLookup(); onClose(); }} />
          <ActionButton label="Delete" onClick={handleDelete} danger />
        </>
      )}
    </div>
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

function ActionButton({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
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
        color: danger ? '#b91c1c' : green[700],
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  );
}
