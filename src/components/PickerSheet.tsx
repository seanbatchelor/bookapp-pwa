import { useState } from 'react';
import { BookItem, BookData } from '../types/book';
import { useBooks } from '../context/BooksContext';

type PickerSheetProps = {
  book: BookItem | null;
  isOpen: boolean;
  onDismiss: () => void;
};

export function PickerSheet({ book, isOpen, onDismiss }: PickerSheetProps) {
  const { selectOption, markAsNotFound, deleteBook } = useBooks();

  const handleSelect = (opt: BookData) => {
    if (!book) return;
    selectOption(book.id, opt);
    onDismiss();
  };

  const handleNoneOfThese = () => {
    if (!book) return;
    markAsNotFound(book.id);
    onDismiss();
  };

  const handleDelete = () => {
    if (!book) return;
    deleteBook(book.id);
    onDismiss();
  };

  return (
    <>
      <div
        onClick={onDismiss}
        className={`fixed inset-0 bg-black/20 z-[102] transition-opacity duration-[250ms] ease-in-out ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`fixed bottom-0 left-0 right-0 z-[103] h-[88vh] bg-surface rounded-t-[20px] shadow-[0_-4px_24px_rgba(0,0,0,0.12)] flex flex-col transition-transform duration-[300ms] [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
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
                  <span className="font-sans text-sm text-[#737373]">Searching…</span>
                </div>
              )}

              {!book.state && book.matchState === 'candidates' && !!book.options?.length && (
                <CandidateView
                  book={book}
                  onSelect={handleSelect}
                  onNoneOfThese={handleNoneOfThese}
                  onDelete={handleDelete}
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function CandidateView({ book, onSelect, onNoneOfThese, onDelete }: {
  book: BookItem;
  onSelect: (opt: BookData) => void;
  onNoneOfThese: () => void;
  onDelete: () => void;
}) {
  const [filterText, setFilterText] = useState('');
  const candidates = book.options ?? [];
  const filtered = filterText
    ? candidates.filter(opt =>
        opt.title.toLowerCase().includes(filterText.toLowerCase()) ||
        opt.author.toLowerCase().includes(filterText.toLowerCase())
      )
    : candidates;

  const inputClass = "w-full border border-green-300 rounded-[10px] py-2.5 px-3.5 font-sans text-base text-foreground bg-transparent outline-none box-border";

  return (
    <>
      <h2 className="font-sans text-lg font-bold text-foreground my-2">Which book did you mean?</h2>

      <input
        value={filterText}
        onChange={e => setFilterText(e.target.value)}
        placeholder={book.originalText}
        className={`${inputClass} mb-3`}
      />

      <div className="mb-1">
        {filtered.length === 0 && (
          <p className="font-sans text-[14px] text-[#737373] mb-2">No matches for "{filterText}"</p>
        )}
        {filtered.map((opt, i) => (
          <button
            key={i}
            onClick={() => onSelect(opt)}
            className="flex flex-col w-full text-left bg-transparent border border-green-300 rounded-[10px] py-2.5 px-3.5 mb-2 cursor-pointer [-webkit-tap-highlight-color:transparent]"
          >
            <span className="font-sans text-sm font-medium text-foreground">{opt.title}</span>
            <span className="font-sans text-xs text-neutral mt-0.5">
              {opt.author}{opt.year ? ` · ${opt.year}` : ''}
            </span>
          </button>
        ))}
      </div>

      <div className="h-px bg-green-300 mt-1 mb-2" />
      <TextButton label="None of these" onClick={onNoneOfThese} />
      <TextButton label="Delete" onClick={onDelete} danger />
    </>
  );
}

function TextButton({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`block w-full text-left bg-transparent border-0 py-3.5 font-sans text-base font-medium cursor-pointer [-webkit-tap-highlight-color:transparent] ${danger ? 'text-danger-text' : 'text-[#737373]'}`}
    >
      {label}
    </button>
  );
}
