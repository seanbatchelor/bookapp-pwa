import { useEffect, useRef, useState } from 'react';
import { BookItem, BookData } from '../types/book';

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
        className={`fixed inset-0 bg-black/35 z-[100] transition-opacity duration-[250ms] ease-in-out ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        className={`fixed bottom-0 left-0 right-0 z-[101] bg-surface rounded-t-[20px] pb-[calc(32px+env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgba(0,0,0,0.12)] transition-transform duration-[300ms] [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-sm bg-green-300" />
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
    <div className="px-6 pt-3">

      {/* Searching — loading indicator while a lookup is in flight */}
      {book.state === 'SEARCHING' && (
        <div className="flex items-center gap-2.5 pt-2 pb-6">
          <span className="inline-block shrink-0 w-4 h-4 rounded-full border-2 border-green-300 border-t-green-600 [animation:spin_0.7s_linear_infinite]" />
          <span className="font-sans text-sm text-[#737373]">Looking up…</span>
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

  const inputClass = "w-full border border-green-300 rounded-[10px] py-2.5 px-3.5 font-sans text-sm text-foreground bg-transparent outline-none box-border";

  return (
    <>
      <SheetTitle>{book.matchState === 'not_found' ? 'Search again' : 'Which book did you mean?'}</SheetTitle>

      {/* Filter input */}
      {candidates.length > 0 && (
        <input
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          placeholder="Filter results…"
          className={`${inputClass} mb-3`}
        />
      )}

      {/* Candidates list */}
      <div className="max-h-[40vh] overflow-y-auto mb-1">
        {filtered.length === 0 && candidates.length > 0 && (
          <p className="font-sans text-[14px] text-[#737373] mb-2">
            No matches for "{filterText}"
          </p>
        )}
        {filtered.length === 0 && candidates.length === 0 && (
          <p className="font-sans text-[14px] text-[#737373] mb-2">
            We couldn't find "{book.originalText}". Try a different search below.
          </p>
        )}
        {filtered.map((opt, i) => (
          <button
            key={i}
            onClick={() => onSelectOption(opt)}
            className="flex flex-col w-full text-left bg-transparent border border-green-300 rounded-[10px] py-2.5 px-3.5 mb-2 cursor-pointer [-webkit-tap-highlight-color:transparent]"
          >
            <span className="font-sans text-sm font-medium text-foreground">{opt.title}</span>
            <span className="font-sans text-xs text-neutral mt-0.5">
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
        <div className="flex gap-2 items-center py-2">
          <input
            value={refineText}
            onChange={e => setRefineText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearchAgain()}
            autoFocus
            className={`${inputClass} flex-1`}
          />
          <button
            onClick={handleSearchAgain}
            className="shrink-0 py-2.5 px-4 border-0 rounded-[10px] bg-primaryDark text-white font-sans text-sm font-semibold cursor-pointer [-webkit-tap-highlight-color:transparent]"
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
    <div className="mb-5">
      <h2 className="font-sans text-xl font-bold text-foreground mt-2 mb-1">
        {book.resolvedTitle ?? book.originalText}
      </h2>
      {book.resolvedAuthor && (
        <p className="font-sans text-sm text-neutral m-0">
          {book.resolvedAuthor}{book.resolvedYear ? ` · ${book.resolvedYear}` : ''}
        </p>
      )}
    </div>
  );
}

function SheetTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-sans text-lg font-bold text-foreground my-2">
      {children}
    </h2>
  );
}

function Divider() {
  return <div className="h-px bg-green-300 mt-1 mb-2" />;
}

function ActionButton({ label, onClick, danger, muted }: { label: string; onClick: () => void; danger?: boolean; muted?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`block w-full text-left bg-transparent border-0 py-3.5 font-sans text-base font-medium cursor-pointer [-webkit-tap-highlight-color:transparent] ${danger ? 'text-danger-text' : muted ? 'text-[#737373]' : 'text-green-700'}`}
    >
      {label}
    </button>
  );
}
