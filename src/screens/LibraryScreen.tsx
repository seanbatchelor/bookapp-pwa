import { useRef, useState } from 'react';
import { useBooks } from '../context/BooksContext';
import { AlphabetScrubber } from '../components/AlphabetScrubber';

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
    <div ref={sectionRef} className="pl-5 pr-9 pt-5 pb-1.5">
      <span className="font-sans text-xs font-bold tracking-[0.06em] uppercase text-green-700">
        {letter}
      </span>
      <div className="h-px bg-green-300 mt-1.5" />
    </div>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────
function LibraryRow({ primary, secondary }: { primary: string; secondary?: string }) {
  return (
    <div className="pl-5 pr-9 py-2.5 min-h-[44px] flex flex-col justify-center">
      <span className="font-sans text-sm font-medium text-foreground leading-5">
        {primary}
      </span>
      {secondary && (
        <span className="font-sans text-xs text-neutral leading-4 mt-0.5">
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
      className={`flex-1 py-2 border-0 rounded-lg font-sans text-[14px] font-semibold cursor-pointer transition-colors duration-150 [-webkit-tap-highlight-color:transparent] ${active ? 'bg-primary text-white' : 'bg-transparent text-green-700'}`}
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

  // Matched books only (both unread and read)
  const resolved = books.filter(b => b.matchState === 'matched');

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
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Tab switcher */}
      <div className="flex gap-1 mx-5 mt-4 mb-2 p-1 bg-green-300 rounded-[10px]">
        <TabPill active={tab === 'Books'}   label="Books"   onClick={() => setTab('Books')} />
        <TabPill active={tab === 'Authors'} label="Authors" onClick={() => setTab('Authors')} />
      </div>

      {/* List + scrubber */}
      <div className="flex-1 min-h-0 relative">
        <div
          ref={scrollRef}
          className="absolute inset-0 overflow-y-auto [-webkit-overflow-scrolling:touch] pb-[100px]"
        >
          {isEmpty ? (
            <p className="pl-5 pt-6 font-sans text-sm text-[#737373]">
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
