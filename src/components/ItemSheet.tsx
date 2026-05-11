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
        className={`fixed bottom-0 left-0 right-0 z-[101] h-[88vh] bg-surface rounded-t-[20px] shadow-[0_-4px_24px_rgba(0,0,0,0.12)] flex flex-col transition-transform duration-[300ms] [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-sm bg-green-300" />
        </div>

        <div className="flex-1 overflow-y-auto px-6 pt-2 pb-[calc(32px+env(safe-area-inset-bottom))]">
          {book && (
            <>
              {book.state === 'SEARCHING' && (
                <div className="flex items-center gap-2.5 pt-2 pb-6">
                  <span className="inline-block shrink-0 w-4 h-4 rounded-full border-2 border-green-300 border-t-green-600 [animation:spin_0.7s_linear_infinite]" />
                  <span className="font-sans text-sm text-[#737373]">Looking up…</span>
                </div>
              )}

              {book.matchState === 'matched' && !editing && (
                <>
                  <BookCover book={book} />
                  {book.readState !== 'read' ? (
                    <ActionButton label="Mark as Read" onClick={handleMarkAsRead} />
                  ) : (
                    <ActionButton label="Mark as Unread" onClick={handleMarkAsUnread} />
                  )}
                  <ActionButton label="Update" onClick={() => setEditing(true)} muted />
                  <ActionButton label="Delete" onClick={handleDelete} danger />
                </>
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
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => titleRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  const inputClass = "w-full border border-green-300 rounded-[10px] py-2.5 px-3.5 font-sans text-base text-foreground bg-transparent outline-none box-border";

  return (
    <>
      <h2 className="font-sans text-lg font-bold text-foreground my-2">Add book details</h2>

      <div className="flex flex-col gap-2 py-2 mb-1">
        <input
          ref={titleRef}
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && title.trim() && onSave(title.trim(), author.trim())}
          placeholder="Title"
          className={inputClass}
        />
        <input
          value={author}
          onChange={e => setAuthor(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && title.trim() && onSave(title.trim(), author.trim())}
          placeholder="Author (optional)"
          className={inputClass}
        />
        <button
          onClick={() => { if (title.trim()) onSave(title.trim(), author.trim()); }}
          className="w-full py-2.5 px-4 border-0 rounded-[10px] bg-primaryDark text-white font-sans text-sm font-semibold cursor-pointer [-webkit-tap-highlight-color:transparent]"
        >
          Save
        </button>
      </div>

      <p className="font-sans text-sm text-[#737373] mt-1 mb-2">
        Not sure about title or author?{' '}
        <button
          onClick={() => { if (title.trim()) onLookupOptions(title.trim(), author.trim()); }}
          disabled={!title.trim()}
          className="text-green-700 underline bg-transparent border-0 p-0 font-sans text-sm cursor-pointer disabled:opacity-40 [-webkit-tap-highlight-color:transparent]"
        >
          Look up options
        </button>
      </p>

      <div className="h-px bg-green-300 mt-1 mb-2" />
      <ActionButton label="Delete" onClick={onDelete} danger />
    </>
  );
}

function BookCover({ book }: { book: BookItem }) {
  return (
    <div className="flex justify-center py-6">
      <div className="relative w-[210px] h-[297px]">
        <div className="absolute left-0 top-0 bottom-0 w-[14px] bg-foreground rounded-tl rounded-bl" />
        <div className="absolute left-[14px] right-0 top-0 bottom-0 border border-l-0 border-foreground bg-green-50 flex flex-col p-4">
          <span className="font-sans font-bold text-foreground text-lg leading-snug">{book.resolvedTitle}</span>
          <div className="mt-auto">
            {book.resolvedAuthor && <p className="font-sans text-base text-foreground m-0 leading-snug">{book.resolvedAuthor}</p>}
            {book.resolvedYear && <p className="font-sans text-base text-foreground m-0 mt-0.5">{book.resolvedYear}</p>}
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
