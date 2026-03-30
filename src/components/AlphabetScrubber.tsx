import { useRef } from 'react';
import { green } from '../theme/colors';

const ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

type AlphabetScrubberProps = {
  activeLetters: Set<string>;          // letters that have at least one item
  onLetterSelect: (letter: string) => void;
};

export function AlphabetScrubber({ activeLetters, onLetterSelect }: AlphabetScrubberProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastLetter = useRef<string | null>(null);

  const letterFromY = (clientY: number): string | null => {
    const el = containerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    const index = Math.floor(ratio * ALL_LETTERS.length);
    return ALL_LETTERS[Math.min(index, ALL_LETTERS.length - 1)];
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const letter = letterFromY(e.clientY);
    if (letter && activeLetters.has(letter)) {
      lastLetter.current = letter;
      onLetterSelect(letter);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const letter = letterFromY(e.clientY);
    if (letter && letter !== lastLetter.current && activeLetters.has(letter)) {
      lastLetter.current = letter;
      onLetterSelect(letter);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    lastLetter.current = null;
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 28,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        touchAction: 'none',    // prevents native scroll hijacking the drag
        userSelect: 'none',
        WebkitUserSelect: 'none',
        cursor: 'default',
        paddingTop: 8,
        paddingBottom: 80,       // clear the nav
        zIndex: 10,
      }}
    >
      {ALL_LETTERS.map(letter => (
        <span
          key={letter}
          style={{
            fontFamily: '"Work Sans", sans-serif',
            fontSize: 10,
            fontWeight: 600,
            lineHeight: 1,
            color: activeLetters.has(letter) ? green[700] : green[300],
          }}
        >
          {letter}
        </span>
      ))}
    </div>
  );
}
