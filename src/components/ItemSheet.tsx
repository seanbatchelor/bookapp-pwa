import { useEffect, useRef, useState } from 'react';
import { BookItem } from '../types/book';
import { useBooks } from '../context/BooksContext';

type ItemSheetProps = {
  book: BookItem | null;
  onClose: () => void;
  onLookupOptions: (title: string, author: string) => void;
};

function getInitialTitleAuthor(book: BookItem): { title: string; author: string } {
  if (book.resolvedTitle) return { title: book.resolvedTitle, author: book.resolvedAuthor ?? '' };
  if (book.searchAuthor !== undefined) return { title: book.originalText, author: book.searchAuthor };
  return { title: book.originalText, author: '' };
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M13 4L7 10l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SwapIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1v12M4 4L7 1l3 3M4 10l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'pill' | 'danger';

function Button({ children, onClick, disabled, variant = 'secondary', className = '' }: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  className?: string;
}) {
  const base = 'py-3.5 px-4 font-sans text-base font-medium border-0 cursor-pointer whitespace-nowrap [-webkit-tap-highlight-color:transparent] disabled:opacity-40';
  const variants: Record<ButtonVariant, string> = {
    primary:   'rounded-[10px] bg-primaryDark text-white font-semibold',
    secondary: 'rounded-[10px] bg-neutral-surface text-foreground',
    pill:      'rounded-full bg-neutral-surface text-foreground',
    danger:    'rounded-[10px] bg-neutral-surface text-danger-text',
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function ItemSheet({ book, onClose, onLookupOptions }: ItemSheetProps) {
  const isOpen = !!book;
  const { markAsRead, markAsUnread, deleteBook, saveManualEntry } = useBooks();
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => { setEditing(false); }, [book?.id, book?.matchState]);

  const handleMarkAsRead = () => { if (book) { markAsRead(book.id); onClose(); } };
  const handleMarkAsUnread = () => { if (book) { markAsUnread(book.id); onClose(); } };
  const handleDelete = () => { if (book) { deleteBook(book.id); onClose(); } };
  const handleSave = (title: string, author: string) => {
    if (!book) return;
    saveManualEntry(book.id, title, author);
    onClose();
  };

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/35 z-[100] transition-opacity duration-[250ms] ease-in-out ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`fixed bottom-0 left-0 right-0 z-[101] h-[95vh] bg-surface rounded-t-[20px] shadow-[0_-4px_24px_rgba(0,0,0,0.12)] flex flex-col transition-transform duration-[300ms] [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="flex items-center justify-between px-4 pt-2 pb-1 shrink-0">
          <div className="w-10">
            {editing && book?.matchState === 'matched' && (
              <button
                onClick={() => setEditing(false)}
                className="p-2 text-neutral [-webkit-tap-highlight-color:transparent]"
                aria-label="Back"
              >
                <BackIcon />
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral [-webkit-tap-highlight-color:transparent]"
            aria-label="Close"
          >
            <XIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pt-2 pb-[calc(32px+env(safe-area-inset-bottom))]">
          {book && (
            <>
              {book.state === 'SEARCHING' && (
                <div className="flex items-center gap-2.5 pt-2 pb-6">
                  <span className="inline-block shrink-0 w-4 h-4 rounded-full border-2 border-green-300 border-t-green-600 [animation:spin_0.7s_linear_infinite]" />
                  <span className="font-sans text-sm text-neutral">Looking up…</span>
                </div>
              )}

              {book.matchState === 'matched' && !editing && (
                <div className="flex flex-col h-full">
                  <div className="flex-1 flex items-center justify-center py-6">
                    <BookCover book={book} />
                  </div>
                  <div className="flex flex-col gap-3">
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={book.readState !== 'read' ? handleMarkAsRead : handleMarkAsUnread}
                    >
                      {book.readState !== 'read' ? 'Want to read' : 'Read'}
                    </Button>
                    <div className="flex gap-3">
                      <Button variant="secondary" className="flex-1" onClick={() => setEditing(true)}>Edit</Button>
                      <Button variant="secondary" className="flex-1" onClick={handleDelete}>Delete</Button>
                    </div>
                  </div>
                </div>
              )}

              {!book.state && (book.matchState !== 'matched' || editing) && (
                <ManualEntryForm
                  book={book}
                  onSave={handleSave}
                  onDelete={handleDelete}
                  onLookupOptions={onLookupOptions}
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function ManualEntryForm({ book, onSave, onDelete, onLookupOptions }: {
  book: BookItem;
  onSave: (title: string, author: string) => void;
  onDelete: () => void;
  onLookupOptions: (title: string, author: string) => void;
}) {
  const initial = getInitialTitleAuthor(book);
  const [title, setTitle] = useState(initial.title);
  const [author, setAuthor] = useState(initial.author);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const authorRef = useRef<HTMLTextAreaElement>(null);
  const isNew = book.matchState !== 'matched';

  useEffect(() => {
    const t = setTimeout(() => titleRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  const handleSwap = () => {
    const t = title;
    setTitle(author);
    setAuthor(t);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center py-6">
        <div className="w-80 aspect-[3/4] relative">
          <div className="absolute left-0 top-0 bottom-0 w-[14px] bg-green-300 rounded-tl rounded-bl" />
          <div className="absolute left-[14px] right-0 top-0 bottom-0 border border-l-0 border-green-300 bg-surface flex flex-col">

            {/* Title section */}
            <div className="flex-1 relative p-4 flex flex-col overflow-hidden">
              <span className="text-xs text-neutral font-sans mb-1 shrink-0">Title</span>
              <textarea
                ref={titleRef}
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="flex-1 resize-none bg-transparent outline-none font-sans text-xl font-bold text-foreground w-full pr-8 overflow-hidden"
              />
              {title.length > 0 && (
                <button
                  onClick={() => { setTitle(''); titleRef.current?.focus(); }}
                  className="absolute top-2 right-2 p-2 text-neutral [-webkit-tap-highlight-color:transparent]"
                  aria-label="Clear title"
                >
                  <XIcon />
                </button>
              )}
            </div>

            {/* Divider + swap */}
            <div className="relative h-px bg-green-300 shrink-0">
              <button
                onClick={handleSwap}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-surface border border-green-300 flex items-center justify-center text-neutral [-webkit-tap-highlight-color:transparent]"
                aria-label="Swap title and author"
              >
                <SwapIcon />
              </button>
            </div>

            {/* Author section */}
            <div className="flex-1 relative p-4 flex flex-col overflow-hidden">
              <span className="text-xs text-neutral font-sans mb-1 shrink-0">Author</span>
              <textarea
                ref={authorRef}
                value={author}
                onChange={e => setAuthor(e.target.value)}
                className="flex-1 resize-none bg-transparent outline-none font-sans text-xl text-foreground w-full pr-8 overflow-hidden"
              />
              {author.length > 0 && (
                <button
                  onClick={() => { setAuthor(''); authorRef.current?.focus(); }}
                  className="absolute top-2 right-2 p-2 text-neutral [-webkit-tap-highlight-color:transparent]"
                  aria-label="Clear author"
                >
                  <XIcon />
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Lookup prompt — same width as book */}
        <div className="w-80 flex items-center justify-between gap-3 mt-4">
          <span className="font-sans text-sm text-neutral">Not sure about the book title or author?</span>
          <Button
            variant="secondary"
            disabled={!title.trim()}
            onClick={() => { if (title.trim()) onLookupOptions(title.trim(), author.trim()); }}
          >
            Find options
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button variant="primary" className="w-full" onClick={() => { if (title.trim()) onSave(title.trim(), author.trim()); }}>
          Save
        </Button>
        <Button variant="danger" className="w-full" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </div>
  );
}

function BookCover({ book }: { book: BookItem }) {
  return (
    <div className="w-80 aspect-[3/4] relative">
      <div className="absolute left-0 top-0 bottom-0 w-[14px] bg-foreground rounded-tl rounded-bl" />
      <div className="absolute left-[14px] right-0 top-0 bottom-0 border border-l-0 border-foreground bg-surface flex flex-col p-4">
        <span className="font-sans font-bold text-foreground text-2xl leading-snug">{book.resolvedTitle}</span>
        <div className="mt-auto">
          {book.resolvedAuthor && <p className="font-sans text-xl text-foreground m-0 leading-snug">{book.resolvedAuthor}</p>}
          {book.resolvedYear && <p className="font-sans text-base text-foreground m-0 mt-0.5">{book.resolvedYear}</p>}
        </div>
      </div>
    </div>
  );
}
