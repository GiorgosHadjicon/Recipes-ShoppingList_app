// Raw "Larder" brand palette (see assets/Larder App.pdf) — Parchment, Ink,
// Terracotta, Saffron, Sage, Fig. Reach for these directly for one-off brand
// accents; use the semantic Colors below for anything themed by light/dark.
export const palette = {
  parchment: '#F3E9DA',
  ink: '#211D18',
  terracotta: '#BC5B39',
  saffron: '#DFA53B',
  sage: '#7C9459',
  fig: '#7A3B4E',
} as const;

export interface Colors {
  primary: string;
  primaryLight: string;
  accent: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  shadow: string;
  tagBg: string;
  danger: string;
  difficulty: { Easy: string; Medium: string; Hard: string };
  difficultyBg: { Easy: string; Medium: string; Hard: string };
}

export const lightColors: Colors = {
  primary: palette.terracotta,
  primaryLight: '#D4805E',
  accent: palette.saffron,
  background: palette.parchment,
  card: '#FBF5EA',
  text: palette.ink,
  textSecondary: '#6B6355',
  textMuted: '#A69A87',
  border: '#E4D6C1',
  shadow: '#00000012',
  tagBg: '#EEF0E2',
  danger: palette.fig,
  difficulty: {
    Easy: palette.sage,
    Medium: '#C98A1F',
    Hard: palette.terracotta,
  },
  difficultyBg: {
    Easy: '#E4EAD8',
    Medium: '#F5E6C4',
    Hard: '#F3E1D6',
  },
};

// Newsreader for display/recipe titles, Hanken Grotesk for UI/body — loaded
// via useFonts in App.tsx before these names resolve to anything.
export const fonts = {
  display: 'Newsreader_600SemiBold',
  displayRegular: 'Newsreader_400Regular',
  body: 'HankenGrotesk_400Regular',
  bodyMedium: 'HankenGrotesk_500Medium',
  bodySemiBold: 'HankenGrotesk_600SemiBold',
  bodyBold: 'HankenGrotesk_700Bold',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
} as const;
