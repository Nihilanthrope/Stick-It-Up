export interface ThemeColorDefinition {
  id: string;
  name: string;
  bg: string;
  border: string;
  tape: string;
  text: string;
  subtext: string;
  badge: string;
  pin: string;
}

export const NOTE_THEMES: Record<string, ThemeColorDefinition> = {
  cream: {
    id: 'cream',
    name: 'Cream × Crimson',
    bg: '#FFFDF5',
    border: '#E8DFC8',
    tape: '#EADFC3',
    text: '#292524',
    subtext: '#78716C',
    badge: '#9E1B32',
    pin: '#9E1B32',
  },
  yellow: {
    id: 'yellow',
    name: 'Canary Yellow',
    bg: '#FEF9C3',
    border: '#FDE047',
    tape: '#FACC15',
    text: '#422006',
    subtext: '#854D0E',
    badge: '#CA8A04',
    pin: '#CA8A04',
  },
  mint: {
    id: 'mint',
    name: 'Sage Mint',
    bg: '#ECFDF5',
    border: '#A7F3D0',
    tape: '#6EE7B7',
    text: '#064E3B',
    subtext: '#047857',
    badge: '#059669',
    pin: '#059669',
  },
  lavender: {
    id: 'lavender',
    name: 'Pastel Lavender',
    bg: '#F5F3FF',
    border: '#DDD6FE',
    tape: '#C4B5FD',
    text: '#4C1D95',
    subtext: '#6D28D9',
    badge: '#7C3AED',
    pin: '#7C3AED',
  },
  pink: {
    id: 'pink',
    name: 'Blush Pink',
    bg: '#FFF1F2',
    border: '#FECDD3',
    tape: '#FDA4AF',
    text: '#881337',
    subtext: '#BE123C',
    badge: '#E11D48',
    pin: '#E11D48',
  },
  sky: {
    id: 'sky',
    name: 'Soft Sky',
    bg: '#F0F9FF',
    border: '#BAE6FD',
    tape: '#7DD3FC',
    text: '#0C4A6E',
    subtext: '#0369A1',
    badge: '#0284C7',
    pin: '#0284C7',
  },
  velvet: {
    id: 'velvet',
    name: 'Dark Velvet',
    bg: '#24242B',
    border: '#3F3F46',
    tape: '#52525B',
    text: '#F4F4F5',
    subtext: '#A1A1AA',
    badge: '#C41E3D',
    pin: '#C41E3D',
  },
};

export function getTheme(colorId: string): ThemeColorDefinition {
  return NOTE_THEMES[colorId] || NOTE_THEMES.cream;
}
