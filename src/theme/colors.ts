export const green = {
  50:  '#F3FCF6',
  100: '#E2F8EA',
  200: '#C3EFD3',
  300: '#94E1B0',
  400: '#5EC986',
  500: '#37AE63',
  600: '#298E4E',
  700: '#237040',
  800: '#205A36',
  900: '#1D492D',
  950: '#0B2816',
} as const;

const neutral = {
  50:  '#fafafa',
  100: '#f5f5f5',
  200: '#e5e5e5',
  300: '#d4d4d4',
  400: '#a3a3a3',
  500: '#737373',
  600: '#525252',
  700: '#404040',
  800: '#262626',
  900: '#171717',
  950: '#0a0a0a',
} as const;

const red = {
  50:  '#fef2f2',
  600: '#dc2626',
  700: '#b91c1c',
  800: '#991b1b',
} as const;

export const theme = {
  primary:        green[500],
  primaryDark:    green[600],
  background:     green[200],
  surface:        green[100],
  border:         green[300],
  foreground:     neutral[900],
  muted:          neutral[800],
  subtle:         neutral[700],

  danger:         red[600],
  dangerDark:     red[800],
  dangerSurface:  red[50],
  dangerText:     red[700],
  neutral:        neutral[600],
  neutralSurface: neutral[100],
};
