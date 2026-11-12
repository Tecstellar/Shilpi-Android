// SHILPI DESIGN TOKENS - EXACT PROTOTYPE REPLICATION
// Supports 4 prototype themes: Signature (default), Mehendi, Kumkum, Indigo

export type ThemeName = 'Signature' | 'Mehendi' | 'Kumkum' | 'Indigo';

export interface ThemeDefinition {
  name: ThemeName;
  label: string;
  hint: string;
  accent: string;
  deep: string;
  accent2: string;
  accentLt: string;
  tint: string;
  tint2: string;
}

export const THEMES: Record<ThemeName, ThemeDefinition> = {
  Signature: {
    name: 'Signature',
    label: 'Signature',
    hint: 'Brand pink, black and light orange',
    accent: '#e8276b',
    deep: '#a50f45',
    accent2: '#ff9d5c',
    accentLt: '#ff4d89',
    tint: '#fdf1e8',
    tint2: '#ffeef4',
  },
  Mehendi: {
    name: 'Mehendi',
    label: 'Mehendi',
    hint: 'Deep green with warm henna tones',
    accent: '#1f7a4d',
    deep: '#14512f',
    accent2: '#d08a3e',
    accentLt: '#37a86c',
    tint: '#eef5ee',
    tint2: '#e0efe5',
  },
  Kumkum: {
    name: 'Kumkum',
    label: 'Kumkum',
    hint: 'Vermilion red with saffron accents',
    accent: '#d62828',
    deep: '#8f1616',
    accent2: '#f2a03d',
    accentLt: '#ef4b4b',
    tint: '#fdefe8',
    tint2: '#ffe3e0',
  },
  Indigo: {
    name: 'Indigo',
    label: 'Indigo',
    hint: 'Cool indigo with a blush accent',
    accent: '#3b3fb6',
    deep: '#26297d',
    accent2: '#e78fb3',
    accentLt: '#5c60d8',
    tint: '#eeeffb',
    tint2: '#e2e3f7',
  },
};

export const THEME_LIST: ThemeDefinition[] = [
  THEMES.Signature,
  THEMES.Mehendi,
  THEMES.Kumkum,
  THEMES.Indigo,
];

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return `rgba(232, 39, 107, ${alpha})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function buildThemeColors(themeName: ThemeName = 'Signature') {
  const t = THEMES[themeName] || THEMES.Signature;
  return {
    // Brand Accents
    accent: t.accent,
    deep: t.deep,
    accent2: t.accent2,
    accentLt: t.accentLt,
    tint: t.tint,
    tint2: t.tint2,
    palePink: t.tint2,
    palePinkBorder: hexToRgba(t.accent, 0.25),

    // Aliases for backwards compatibility
    primary: t.accent,
    primaryDark: t.deep,
    secondary: t.accent2,
    background: '#f4f4f6',
    border: 'rgba(18, 18, 18, 0.07)',
    borderLight: 'rgba(18, 18, 18, 0.05)',
    surfaceElevated: '#ffffff',

    // Neutral Foundations
    bg: '#f4f4f6',
    surface: '#ffffff',
    ink: '#121212',
    black: '#000000',
    divider: 'rgba(18, 18, 18, 0.07)',
    dividerStrong: 'rgba(18, 18, 18, 0.14)',

    // Typography
    textPrimary: '#121212',
    textSecondary: 'rgba(18, 18, 18, 0.65)',
    textMuted: 'rgba(18, 18, 18, 0.45)',
    textLight: '#ffffff',
    textLightMuted: 'rgba(255, 255, 255, 0.68)',

    // Semantic
    success: '#10b981',
    warning: t.accent2,
    error: t.accent,
  };
}

export type ThemeColors = ReturnType<typeof buildThemeColors>;

export const Colors: ThemeColors = buildThemeColors('Signature');
