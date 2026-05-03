import { ArrowRight } from 'lucide-react';
import { BookItem } from '../types/book';
import { Badge, BadgeVariant } from './Badge';

type BookItemRowProps = {
  book: BookItem;
  onPress?: () => void;
  onToggleRead?: () => void;
};

export function BookItemRow({ book, onPress, onToggleRead }: BookItemRowProps) {
  const badge =
    book.matchState === 'candidates' ? { label: 'Multiple matches', variant: 'default' as BadgeVariant } :
    book.matchState === 'not_found'  ? { label: 'Not found',        variant: 'default' as BadgeVariant } :
    undefined;
  const title = book.resolvedTitle ?? book.originalText ?? '';
  const author = book.resolvedAuthor ?? book.searchAuthor ?? '';
  const isRead = book.readState === 'read';
  const isMatched = book.matchState === 'matched';

  return (
    <div className="flex items-center min-h-[52px] py-2 px-4 select-none [-webkit-tap-highlight-color:transparent]">
      {/* Checkbox / Spinner */}
      {book.state === 'SEARCHING' ? (
        <div className="shrink-0 w-7 h-7 mr-3 rounded-full border-2 border-green-300 border-t-green-600 [animation:spin_0.7s_linear_infinite]" />
      ) : book.matchState !== undefined && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleRead?.(); }}
          aria-label={isRead ? 'Mark as unread' : 'Mark as read'}
          className={`relative shrink-0 w-7 h-7 mr-3 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-150 [-webkit-tap-highlight-color:transparent] ${isRead ? 'bg-green-500' : 'bg-transparent'} ${isRead || isMatched ? 'border-2' : ''} ${isRead ? 'border-green-500' : isMatched ? 'border-green-400' : ''}`}
        >
          {!isMatched && !isRead && (
            <svg className="absolute inset-0" width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="12" stroke="#5EC986" strokeWidth="2" strokeDasharray="3 6" strokeLinecap="round" />
            </svg>
          )}
          {isRead && (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      )}

      {/* Text — tappable to open sheet */}
      <div
        onClick={book.matchState !== undefined ? onPress : undefined}
        className={`flex-1 min-w-0 space-y-0.5 ${book.matchState !== undefined ? 'cursor-pointer' : 'cursor-default'}`}
      >
        {/* Title row */}
        <div className="flex items-center gap-2">
          <span className="font-sans text-base text-foreground">
            {title}
          </span>
        </div>

        {/* Author / badge row */}
        {(author || badge) && (
          <div className="flex items-center gap-1.5 mt-px">
            {author && (
              <span className="font-sans text-sm text-foreground">
                {author}
              </span>
            )}
            {badge && <Badge label={badge.label} variant={badge.variant} icon={ArrowRight} />}
          </div>
        )}
      </div>

    </div>
  );
}
