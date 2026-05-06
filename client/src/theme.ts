import type { Part } from './types';

export const partColors: Record<Part, { light: string; dark: string }> = {
  Tenor:    { light: '#FFF9C4', dark: '#F9A825' },
  Lead:     { light: '#BBDEFB', dark: '#1565C0' },
  Baritone: { light: '#C8E6C9', dark: '#2E7D32' },
  Bass:     { light: '#FFCDD2', dark: '#C62828' },
};

export const theme = {
  parts: partColors,
  cardBorderRadius: '8px',
};

declare module 'styled-components' {
  export interface DefaultTheme {
    parts: typeof partColors;
    cardBorderRadius: string;
  }
}
