import type { Part } from './types';

type PartColors = Record<Part, { light: string; dark: string; labelColor: string }>;

type Colors = {
  pageBg: string;
  surface: string;
  surfaceAlt: string;
  surfaceHover: string;
  border: string;
  borderLight: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  link: string;
  linkHover: string;
  inputBg: string;
  inputBorder: string;
  focus: string;
  cardUnselectedText: string;
  accentSurface: string;
  accentBorder: string;
  accentHeader: string;
  statusColors: Record<'Inactive' | 'Optional' | 'Active', { bg: string; text: string }>;
};

const lightPartColors: PartColors = {
  Tenor:    { light: '#FFF9C4', dark: '#F9A825', labelColor: '#a07800' },
  Lead:     { light: '#BBDEFB', dark: '#1565C0', labelColor: '#1565C0' },
  Baritone: { light: '#C8E6C9', dark: '#2E7D32', labelColor: '#2E7D32' },
  Bass:     { light: '#FFCDD2', dark: '#C62828', labelColor: '#C62828' },
};

const darkPartColors: PartColors = {
  Tenor:    { light: '#4a3800', dark: '#F9A825', labelColor: '#F9A825' },
  Lead:     { light: '#0d2d54', dark: '#1565C0', labelColor: '#90caf9' },
  Baritone: { light: '#0d3010', dark: '#2E7D32', labelColor: '#66bb6a' },
  Bass:     { light: '#400d0d', dark: '#C62828', labelColor: '#ef9a9a' },
};

const lightColors: Colors = {
  pageBg: '#f5f5f5',
  surface: '#fff',
  surfaceAlt: '#f5f5f5',
  surfaceHover: '#fafafa',
  border: '#e0e0e0',
  borderLight: '#f0f0f0',
  text: '#222',
  textSecondary: '#444',
  textMuted: '#888',
  link: '#1565c0',
  linkHover: '#0d47a1',
  inputBg: '#fff',
  inputBorder: '#ccc',
  focus: '#1565c0',
  cardUnselectedText: '#222',
  accentSurface: '#f5f8ff',
  accentBorder: '#c5d3f5',
  accentHeader: '#e3eaff',
  statusColors: {
    Inactive: { bg: '#ffebee', text: '#c62828' },
    Optional:  { bg: '#fff8e1', text: '#f57f17' },
    Active:    { bg: '#e8f5e9', text: '#2e7d32' },
  },
};

const darkColors: Colors = {
  pageBg: '#121212',
  surface: '#1e1e1e',
  surfaceAlt: '#2a2a2a',
  surfaceHover: '#252525',
  border: '#333',
  borderLight: '#2a2a2a',
  text: '#e8e8e8',
  textSecondary: '#bbb',
  textMuted: '#777',
  link: '#90caf9',
  linkHover: '#64b5f6',
  inputBg: '#2a2a2a',
  inputBorder: '#444',
  focus: '#90caf9',
  cardUnselectedText: '#f0f0f0',
  accentSurface: '#0d1829',
  accentBorder: '#1e3a5f',
  accentHeader: '#0d1f3d',
  statusColors: {
    Inactive: { bg: '#3d0a0a', text: '#ef9a9a' },
    Optional:  { bg: '#3d2f00', text: '#ffe082' },
    Active:    { bg: '#0a2e0c', text: '#a5d6a7' },
  },
};

export const lightTheme = {
  parts: lightPartColors,
  colors: lightColors,
  cardBorderRadius: '8px',
};

export const darkTheme = {
  parts: darkPartColors,
  colors: darkColors,
  cardBorderRadius: '8px',
};

declare module 'styled-components' {
  export interface DefaultTheme {
    parts: PartColors;
    colors: Colors;
    cardBorderRadius: string;
  }
}
