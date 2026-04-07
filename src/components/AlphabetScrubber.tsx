import { useRef } from 'react';

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
      className="absolute right-0 top-0 bottom-0 w-7 flex flex-col justify-evenly items-center touch-none select-none [-webkit-user-select:none] cursor-default pt-2 pb-20 z-10"
    >
      {ALL_LETTERS.map(letter => (
        <span
          key={letter}
          className={`font-sans text-[10px] font-semibold leading-none ${activeLetters.has(letter) ? 'text-green-700' : 'text-green-300'}`}
        >
          {letter}
        </span>
      ))}
    </div>
  );
}
