import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBooks } from '../context/BooksContext';
import { PickerSheet } from '../components/PickerSheet';
import { Button, BackIcon } from '../components/BookUI';

function BookCover({ resolvedTitle, resolvedAuthor, resolvedYear }: {
  resolvedTitle?: string;
  resolvedAuthor?: string;
  resolvedYear?: string;
}) {
  return (
    <div className="w-full aspect-[3/4] relative">
      <div className="absolute left-0 top-0 bottom-0 w-[14px] bg-foreground rounded-tl rounded-bl" />
      <div className="absolute left-[14px] right-0 top-0 bottom-0 border border-l-0 border-foreground bg-surface flex flex-col p-4">
        <span className="font-sans font-bold text-foreground text-2xl leading-snug">{resolvedTitle}</span>
        <div className="mt-auto">
          {resolvedAuthor && <p className="font-sans text-xl text-foreground m-0 leading-snug">{resolvedAuthor}</p>}
          {resolvedYear && <p className="font-sans text-base text-foreground m-0 mt-0.5">{resolvedYear}</p>}
        </div>
      </div>
    </div>
  );
}

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { books, markAsRead, markAsUnread, deleteBook } = useBooks();
  const book = books.find(b => b.id === id);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!book) navigate('/');
  }, [book]);

  useEffect(() => {
    if (book && !book.state && book.matchState === 'candidates') {
      setPickerOpen(true);
    }
  }, [book?.matchState, book?.state]);

  useEffect(() => {
    if (book && !book.state && book.matchState === 'not_found') {
      navigate(`/book/${id}/edit`, { replace: true });
    }
  }, [book?.matchState, book?.state]);

  if (!book) return null;

  const handleDelete = () => { deleteBook(book.id); navigate('/'); };

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="shrink-0 flex items-center px-2 pt-4 pb-1">
        <button
          onClick={() => navigate('/')}
          className="flex items-center p-2 text-neutral [-webkit-tap-highlight-color:transparent]"
          aria-label="Back"
        >
          <BackIcon />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto [-webkit-overflow-scrolling:touch] px-6">
        {book.state === 'SEARCHING' && (
          <div className="h-full flex items-center justify-center">
            <div className="flex items-center gap-2.5">
              <span className="inline-block shrink-0 w-4 h-4 rounded-full border-2 border-green-300 border-t-green-600 [animation:spin_0.7s_linear_infinite]" />
              <span className="font-sans text-sm text-neutral">Looking up…</span>
            </div>
          </div>
        )}

        {!book.state && book.matchState === 'matched' && (
          <div className="min-h-full flex flex-col pt-4 pb-[calc(32px+env(safe-area-inset-bottom))]">
            <div className="flex-1 flex items-center justify-center py-4">
              <BookCover
                resolvedTitle={book.resolvedTitle}
                resolvedAuthor={book.resolvedAuthor}
                resolvedYear={book.resolvedYear}
              />
            </div>
            <div className="flex flex-col gap-3 shrink-0">
              <Button
                variant="primary"
                className="w-full"
                onClick={book.readState !== 'read' ? () => markAsRead(book.id) : () => markAsUnread(book.id)}
              >
                {book.readState !== 'read' ? 'Want to read' : 'Read'}
              </Button>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => navigate(`/book/${id}/edit`)}>Edit</Button>
                <Button variant="secondary" className="flex-1" onClick={handleDelete}>Delete</Button>
              </div>
            </div>
          </div>
        )}

        {!book.state && book.matchState === 'candidates' && (
          <div className="h-full flex items-center justify-center">
            <span className="font-sans text-sm text-neutral">Loading options…</span>
          </div>
        )}
      </div>

      <PickerSheet
        book={book}
        isOpen={pickerOpen}
        onDismiss={() => setPickerOpen(false)}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
