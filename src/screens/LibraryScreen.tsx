import { useRef, useState } from 'react';
import { useBooks } from '../context/BooksContext';
import { AlphabetScrubber } from '../components/AlphabetScrubber';
import { green } from '../theme/colors';

type LibraryTab = 'Books' | 'Authors';

// Strip leading articles for sort key only
function sortKey(title: string): string {
  return title.replace(/^(the|a|an)\s+/i, '').trim().toUpperCase();
}

function firstLetter(str: string): string {
  return sortKey(str)[0]?.toUpperCase() ?? '#';
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({
  letter,
  sectionRef,
}: {
  letter: string;
  sectionRef: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div
      ref={sectionRef}
      style={{ paddingLeft: 20, paddingRight: 36, paddingTop: 20, paddingBottom: 6 }}
    >
      <span style={{
        fontFamily: '"Work Sans", sans-serif',
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: green[700],
      }}>
        {letter}
      </span>
      <div style={{ height: 1, backgroundColor: green[300], marginTop: 6 }} />
    </div>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────
function LibraryRow({ primary, secondary }: { primary: string; secondary?: string }) {
  return (
    <div style={{
      paddingLeft: 20,
      paddingRight: 36,
      paddingTop: 10,
      paddingBottom: 10,
      minHeight: 44,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}>
      <span style={{
        fontFamily: '"Work Sans", sans-serif',
        fontSize: 15,
        fontWeight: 500,
        color: '#171717',
        lineHeight: '20px',
      }}>
        {primary}
      </span>
      {secondary && (
        <span style={{
          fontFamily: '"Work Sans", sans-serif',
          fontSize: 13,
          color: '#525252',
          lineHeight: '16px',
          marginTop: 2,
        }}>
          {secondary}
        </span>
      )}
    </div>
  );
}

// ─── Tab pill ─────────────────────────────────────────────────────────────────
function TabPill({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '8px 0',
        border: 'none',
        borderRadius: 8,
        backgroundColor: active ? green[500] : 'transparent',
        color: active ? '#ffffff' : green[700],
        fontFamily: '"Work Sans", sans-serif',
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background-color 0.15s',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function LibraryScreen() {
  const { books } = useBooks();
  const [tab, setTab] = useState<LibraryTab>('Books');
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Resolved books only
  const resolved = books.filter(b => b.state === 'FOUND' || b.state === 'READ');

  // ── Books tab data ──
  const sortedBooks = [...resolved]
    .filter(b => b.resolvedTitle)
    .sort((a, b) => sortKey(a.resolvedTitle!).localeCompare(sortKey(b.resolvedTitle!)));

  const booksByLetter = sortedBooks.reduce<Record<string, typeof sortedBooks>>((acc, book) => {
    const letter = firstLetter(book.resolvedTitle!);
    (acc[letter] ??= []).push(book);
    return acc;
  }, {});

  // ── Authors tab data ──
  const authorMap = new Map<string, string>(); // author → one book title for subtitle
  resolved.forEach(b => {
    if (b.resolvedAuthor && b.resolvedTitle && !authorMap.has(b.resolvedAuthor)) {
      authorMap.set(b.resolvedAuthor, b.resolvedTitle);
    }
  });

  const sortedAuthors = [...authorMap.keys()].sort((a, b) =>
    sortKey(a).localeCompare(sortKey(b))
  );

  const authorsByLetter = sortedAuthors.reduce<Record<string, string[]>>((acc, author) => {
    const letter = firstLetter(author);
    (acc[letter] ??= []).push(author);
    return acc;
  }, {});

  const sections = tab === 'Books' ? booksByLetter : authorsByLetter;
  const activeLetters = new Set(Object.keys(sections));

  const scrollToLetter = (letter: string) => {
    const el = sectionRefs.current.get(`${tab}-${letter}`);
    const container = scrollRef.current;
    if (!el || !container) return;
    // Instant jump — smooth feels laggy during a scrubber drag
    container.scrollTop = el.offsetTop - container.offsetTop;
  };

  const setSectionRef = (key: string) => (el: HTMLDivElement | null) => {
    if (el) sectionRefs.current.set(key, el);
    else sectionRefs.current.delete(key);
  };

  const isEmpty = Object.keys(sections).length === 0;

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Tab switcher */}
      <div style={{
        display: 'flex',
        gap: 4,
        margin: '16px 20px 8px',
        padding: 4,
        backgroundColor: green[300],
        borderRadius: 10,
      }}>
        <TabPill active={tab === 'Books'}   label="Books"   onClick={() => setTab('Books')} />
        <TabPill active={tab === 'Authors'} label="Authors" onClick={() => setTab('Authors')} />
      </div>

      {/* List + scrubber */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <div
          ref={scrollRef}
          style={{
            position: 'absolute',
            inset: 0,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: 100,
          }}
        >
          {isEmpty ? (
            <p style={{
              paddingLeft: 20,
              paddingTop: 24,
              fontFamily: '"Work Sans", sans-serif',
              fontSize: 15,
              color: '#737373',
            }}>
              {tab === 'Books' ? 'No resolved books yet.' : 'No authors yet.'}
            </p>
          ) : (
            Object.entries(sections)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([letter, items]) => (
                <div key={letter}>
                  <SectionHeader
                    letter={letter}
                    sectionRef={setSectionRef(`${tab}-${letter}`)}
                  />
                  {tab === 'Books'
                    ? (items as typeof sortedBooks).map(book => (
                        <LibraryRow
                          key={book.id}
                          primary={book.resolvedTitle!}
                          secondary={book.resolvedAuthor}
                        />
                      ))
                    : (items as string[]).map(author => (
                        <LibraryRow key={author} primary={author} />
                      ))
                  }
                </div>
              ))
          )}
        </div>

        <AlphabetScrubber
          activeLetters={activeLetters}
          onLetterSelect={scrollToLetter}
        />
      </div>
    </div>
  );
}
