import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBooks } from '../context/BooksContext';
import { PickerSheet } from '../components/PickerSheet';
import { Button, XIcon, SwapIcon } from '../components/BookUI';
import { BookItem } from '../types/book';

function getInitialTitleAuthor(book: BookItem) {
  if (book.resolvedTitle) return { title: book.resolvedTitle, author: book.resolvedAuthor ?? '' };
  if (book.searchAuthor !== undefined) return { title: book.originalText, author: book.searchAuthor };
  return { title: book.originalText, author: '' };
}

export default function BookEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { books, saveManualEntry, deleteBook, lookupCandidatesByTitleAuthor } = useBooks();
  const book = books.find(b => b.id === id);

  const initial = book ? getInitialTitleAuthor(book) : { title: '', author: '' };
  const [title, setTitle] = useState(initial.title);
  const [author, setAuthor] = useState(initial.author);
  const [pickerOpen, setPickerOpen] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const authorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!book) navigate('/');
  }, [book]);

  useEffect(() => {
    const t = setTimeout(() => titleRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  if (!book) return null;

  const handleSwap = () => { setTitle(author); setAuthor(title); };

  const handleSave = () => {
    if (!title.trim()) return;
    saveManualEntry(book.id, title.trim(), author.trim());
    navigate(`/book/${id}`);
  };

  const handleDelete = () => { deleteBook(book.id); navigate('/'); };

  const handleLookupOptions = async () => {
    if (!title.trim()) return;
    setPickerOpen(true);
    const outcome = await lookupCandidatesByTitleAuthor(id!, title.trim(), author.trim());
    if (outcome === 'not_found') setPickerOpen(false);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="shrink-0 flex items-center px-4 pt-4 pb-1">
        <button
          onClick={() => navigate(-1)}
          className="font-sans text-base text-neutral [-webkit-tap-highlight-color:transparent] border-0 bg-transparent cursor-pointer p-2 -ml-2"
        >
          Cancel
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto [-webkit-overflow-scrolling:touch] px-6">
        <div className="min-h-full flex flex-col pt-4 pb-[calc(32px+env(safe-area-inset-bottom))]">

          {/* Editable book cover */}
          <div className="w-full aspect-[3/4] relative shrink-0">
            <div className="absolute left-0 top-0 bottom-0 w-[14px] bg-green-300 rounded-tl rounded-bl" />
            <div className="absolute left-[14px] right-0 top-0 bottom-0 border border-l-0 border-green-300 bg-surface flex flex-col">

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

              <div className="relative h-px bg-green-300 shrink-0">
                <button
                  onClick={handleSwap}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-surface border border-green-300 flex items-center justify-center text-neutral [-webkit-tap-highlight-color:transparent]"
                  aria-label="Swap title and author"
                >
                  <SwapIcon />
                </button>
              </div>

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

          {/* Find options row — same width as book */}
          <div className="flex items-center justify-between gap-3 mt-4 shrink-0">
            <span className="font-sans text-sm text-neutral">Not sure about the book title or author?</span>
            <Button variant="secondary" disabled={!title.trim()} onClick={handleLookupOptions}>
              Find options
            </Button>
          </div>

          <div className="flex-1" />

          <div className="flex flex-col gap-3 shrink-0">
            <Button variant="primary" className="w-full" onClick={handleSave} disabled={!title.trim()}>
              Save
            </Button>
            <Button variant="danger" className="w-full" onClick={handleDelete}>
              Delete
            </Button>
          </div>

        </div>
      </div>

      <PickerSheet
        book={book}
        isOpen={pickerOpen}
        onDismiss={() => setPickerOpen(false)}
        onAfterSelect={() => navigate(`/book/${id}`)}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
