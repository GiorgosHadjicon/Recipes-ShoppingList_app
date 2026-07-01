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
  difficulty: { Easy: string; Medium: string; Hard: string };
  difficultyBg: { Easy: string; Medium: string; Hard: string };
}

export const lightColors: Colors = {
  primary: '#2D5016',
  primaryLight: '#4A7A25',
  accent: '#F5A623',
  background: '#FAFAF7',
  card: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#666666',
  textMuted: '#999999',
  border: '#E8E8E8',
  shadow: '#00000012',
  tagBg: '#EEF7E8',
  difficulty: {
    Easy: '#28A745',
    Medium: '#E8930A',
    Hard: '#DC3545',
  },
  difficultyBg: {
    Easy: '#D4EDDA',
    Medium: '#FFF3CD',
    Hard: '#F8D7DA',
  },
};

export const darkColors: Colors = {
  primary: '#5CA83B',
  primaryLight: '#78C158',
  accent: '#F5A623',
  background: '#121410',
  card: '#1E211B',
  text: '#EDEDE8',
  textSecondary: '#A8A8A0',
  textMuted: '#767670',
  border: '#33362F',
  shadow: '#00000040',
  tagBg: '#233420',
  difficulty: {
    Easy: '#4CAF50',
    Medium: '#F0A830',
    Hard: '#E85D6A',
  },
  difficultyBg: {
    Easy: '#1E3320',
    Medium: '#3A2E12',
    Hard: '#3A1E22',
  },
};

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
