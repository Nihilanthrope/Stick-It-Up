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
    bg: '#F5EFE3',
    border: '#D8C5B8',
    tape: '#E5D8CA',
    text: '#241B1D',
    subtext: '#6F6262',
    badge: '#8E1F2D',
    pin: '#8E1F2D',
  },
  forest: {
    id: 'forest',
    name: 'Ivory × Forest',
    bg: '#F4F0E6',
    border: '#A8B39F',
    tape: '#D9DED2',
    text: '#202A25',
    subtext: '#667169',
    badge: '#344E3D',
    pin: '#344E3D',
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight × Burgundy',
    bg: '#151316',
    border: '#49343A',
    tape: '#302329',
    text: '#E8DED3',
    subtext: '#B9AAA0',
    badge: '#7D1F2B',
    pin: '#C8A48A',
  },
  paper: {
    id: 'paper',
    name: 'Paper × Ink',
    bg: '#EFE9DC',
    border: '#C7BFAF',
    tape: '#DDD5C5',
    text: '#171717',
    subtext: '#625E56',
    badge: '#A33B32',
    pin: '#A33B32',
  },
  terracotta: {
    id: 'terracotta',
    name: 'Terracotta × Sand',
    bg: '#EFE2CF',
    border: '#C9A989',
    tape: '#DEC5A8',
    text: '#3C2924',
    subtext: '#745B50',
    badge: '#A84F3D',
    pin: '#A84F3D',
  },
  lavender: {
    id: 'lavender',
    name: 'Lavender × Plum',
    bg: '#EEE9F5',
    border: '#B8A8C4',
    tape: '#D5CADF',
    text: '#25202A',
    subtext: '#6C6272',
    badge: '#5B365F',
    pin: '#5B365F',
  },
  sage: {
    id: 'sage',
    name: 'Sage × Espresso',
    bg: '#E8E8D8',
    border: '#B7A58E',
    tape: '#D2D2BC',
    text: '#302520',
    subtext: '#685B52',
    badge: '#4D6652',
    pin: '#4D6652',
  },
  'electric-red': {
    id: 'electric-red',
    name: 'Cream × Electric Red',
    bg: '#F8F2E7',
    border: '#E5D8CA',
    tape: '#EDE2D4',
    text: '#171717',
    subtext: '#625B55',
    badge: '#D7193F',
    pin: '#D7193F',
  },
};

const LEGACY_THEME_ALIASES: Record<string, string> = {
  yellow: 'terracotta',
  mint: 'sage',
  pink: 'electric-red',
  sky: 'forest',
  velvet: 'midnight',
};

export function getTheme(colorId: string): ThemeColorDefinition {
  return NOTE_THEMES[colorId] || NOTE_THEMES[LEGACY_THEME_ALIASES[colorId]] || NOTE_THEMES.cream;
}
