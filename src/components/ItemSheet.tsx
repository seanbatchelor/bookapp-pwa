import { useEffect } from 'react';
import { BookItem } from '../types/book';
import { useBooks } from '../context/BooksContext';

type ItemSheetProps = {
  book: BookItem | null;
  onClose: () => void;
  onOpenPicker: () => void;
};

export function ItemSheet({ book, onClose, onOpenPicker }: ItemSheetProps) {
  const isOpen = !!book;
  const { markAsRead, markAsUnread, deleteBook } = useBooks();

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleMarkAsRead = () => { if (book) { markAsRead(book.id); onClose(); } };
  const handleMarkAsUnread = () => { if (book) { markAsUnread(book.id); onClose(); } };
  const handleDelete = () => { if (book) { deleteBook(book.id); onClose(); } };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/35 z-[100] transition-opacity duration-[250ms] ease-in-out ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Sheet — fixed height matches PickerSheet */}
      <div
        role="dialog"
        aria-modal="true"
        className={`fixed bottom-0 left-0 right-0 z-[101] h-[88vh] bg-surface rounded-t-[20px] shadow-[0_-4px_24px_rgba(0,0,0,0.12)] flex flex-col transition-transform duration-[300ms] [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-sm bg-green-300" />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 pt-2 pb-[calc(32px+env(safe-area-inset-bottom))]">
          {book && (
            <>
              {/* Searching */}
              {book.state === 'SEARCHING' && (
                <div className="flex items-center gap-2.5 pt-2 pb-6">
                  <span className="inline-block shrink-0 w-4 h-4 rounded-full border-2 border-green-300 border-t-green-600 [animation:spin_0.7s_linear_infinite]" />
                  <span className="font-sans text-sm text-[#737373]">Looking up…</span>
                </div>
              )}

              {/* Matched */}
              {book.matchState === 'matched' && (
                <>
                  <BookCover book={book} />
                  {book.readState !== 'read' ? (
                    <ActionButton label="Mark as Read" onClick={handleMarkAsRead} />
                  ) : (
                    <ActionButton label="Mark as Unread" onClick={handleMarkAsUnread} />
                  )}
                  <ActionButton label="Not the right book?" onClick={onOpenPicker} muted />
                  <ActionButton label="Delete" onClick={handleDelete} danger />
                </>
              )}

              {/* Unmatched */}
              {!book.state && book.matchState !== 'matched' && (
                <>
                  <h2 className="font-sans text-xl font-bold text-foreground mt-2 mb-5">
                    {book.originalText}
                  </h2>
                  <ActionButton label="Find this book" onClick={onOpenPicker} />
                  <ActionButton label="Delete" onClick={handleDelete} danger />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function BookCover({ book }: { book: BookItem }) {
  return (
    <div className="flex justify-center py-6">
      <div className="relative w-[210px] h-[297px]">
        {/* Spine */}
        <div className="absolute left-0 top-0 bottom-0 w-[14px] bg-foreground rounded-tl rounded-bl" />
        {/* Cover */}
        <div className="absolute left-[14px] right-0 top-0 bottom-0 border border-l-0 border-foreground bg-green-50 flex flex-col p-4">
          <span className="font-sans font-bold text-foreground text-lg leading-snug">
            {book.resolvedTitle}
          </span>
          <div className="mt-auto">
            {book.resolvedAuthor && (
              <p className="font-sans text-base text-foreground m-0 leading-snug">
                {book.resolvedAuthor}
              </p>
            )}
            {book.resolvedYear && (
              <p className="font-sans text-base text-foreground m-0 mt-0.5">
                {book.resolvedYear}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
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
