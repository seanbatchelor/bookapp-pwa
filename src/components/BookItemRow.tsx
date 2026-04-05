import { MatchState, BookItem } from '../types/book';
import { green } from '../theme/colors';

type BookItemRowProps = {
  book: BookItem;
  onPress?: () => void;
  onToggleRead?: () => void;
};

const MATCH_BADGE: Partial<Record<MatchState, { label: string; color: string; bg: string }>> = {
  candidates: { label: 'Multiple matches', color: '#92400e', bg: '#fef3c7' },
  not_found:  { label: 'Not found',        color: '#b91c1c', bg: '#fef2f2' },
};

export function BookItemRow({ book, onPress, onToggleRead }: BookItemRowProps) {
  const badge = book.matchState ? MATCH_BADGE[book.matchState] : undefined;
  const title = book.resolvedTitle ?? book.originalText ?? '';
  const author = book.resolvedAuthor ?? '';
  const isRead = book.readState === 'read';
  const showCheckbox = book.matchState === 'matched';
  const isInteractive = book.matchState !== undefined;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 52,
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 20,
        paddingRight: 12,
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
      }}
    >
      {/* Checkbox */}
      {showCheckbox && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleRead?.(); }}
          aria-label={isRead ? 'Mark as unread' : 'Mark as read'}
          style={{
            flexShrink: 0,
            width: 28,
            height: 28,
            marginRight: 12,
            borderRadius: '50%',
            border: `2px solid ${isRead ? green[500] : green[400]}`,
            backgroundColor: isRead ? green[500] : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            transition: 'background-color 0.15s, border-color 0.15s',
          }}
        >
          {isRead && (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      )}

      {/* Text — tappable to open sheet */}
      <div
        onClick={isInteractive ? onPress : undefined}
        style={{
          flex: 1,
          cursor: isInteractive ? 'pointer' : 'default',
          minWidth: 0,
        }}
      >
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {book.state === 'SEARCHING' && (
            <span style={{
              display: 'inline-block',
              width: 14,
              height: 14,
              borderRadius: '50%',
              border: '2px solid #94E1B0',
              borderTopColor: '#298E4E',
              animation: 'spin 0.7s linear infinite',
              flexShrink: 0,
            }} />
          )}
          <span style={{
            fontFamily: '"Work Sans", sans-serif',
            fontSize: 17,
            fontWeight: 500,
            lineHeight: '24px',
            color: book.state === 'SEARCHING' ? '#737373' : isRead ? '#525252' : '#171717',
            textDecoration: isRead ? 'line-through' : 'none',
            textDecorationColor: green[400],
          }}>
            {title}
          </span>
        </div>

        {/* Author / badge row */}
        {(author || badge) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
            {author && (
              <span style={{
                fontFamily: '"Work Sans", sans-serif',
                fontSize: 13,
                color: isRead ? '#a3a3a3' : '#525252',
                lineHeight: '16px',
              }}>
                {author}
              </span>
            )}
            {badge && badge.label !== 'Looking up…' && (
              <span style={{
                fontFamily: '"Work Sans", sans-serif',
                fontSize: 11,
                fontWeight: 500,
                color: badge.color,
                backgroundColor: badge.bg,
                borderRadius: 4,
                padding: '1px 5px',
                lineHeight: '16px',
              }}>
                {badge.label}
              </span>
            )}
            {book.state === 'SEARCHING' && (
              <span style={{ fontFamily: '"Work Sans", sans-serif', fontSize: 13, color: '#737373' }}>
                Looking up…
              </span>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
