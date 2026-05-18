import { ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export function Button({ children, onClick, disabled, variant = 'secondary', className = '' }: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  className?: string;
}) {
  const base = 'py-3.5 px-4 font-sans text-base font-medium border-0 cursor-pointer whitespace-nowrap [-webkit-tap-highlight-color:transparent] disabled:opacity-40';
  const variants: Record<ButtonVariant, string> = {
    primary: 'rounded-[10px] bg-primaryDark text-white font-semibold',
    secondary: 'rounded-[10px] bg-neutral-surface text-foreground',
    danger: 'rounded-[10px] bg-neutral-surface text-danger-text',
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function BackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M13 4L7 10l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SwapIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1v12M4 4L7 1l3 3M4 10l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
