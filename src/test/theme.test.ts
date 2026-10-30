import { describe, it, expect } from 'vitest';
import { NOTE_THEMES } from '../lib/theme';

describe('Note themes', () => {
  it('contains the complete requested eight-theme set', () => {
    expect(Object.keys(NOTE_THEMES)).toEqual([
      'cream',
      'forest',
      'midnight',
      'paper',
      'terracotta',
      'lavender',
      'sage',
      'electric-red',
    ]);

    expect(NOTE_THEMES.cream.name).toBe('Cream × Crimson');
    expect(NOTE_THEMES.forest.name).toBe('Ivory × Forest');
    expect(NOTE_THEMES.midnight.name).toBe('Midnight × Burgundy');
    expect(NOTE_THEMES.paper.name).toBe('Paper × Ink');
    expect(NOTE_THEMES.terracotta.name).toBe('Terracotta × Sand');
    expect(NOTE_THEMES.lavender.name).toBe('Lavender × Plum');
    expect(NOTE_THEMES.sage.name).toBe('Sage × Espresso');
    expect(NOTE_THEMES['electric-red'].name).toBe('Cream × Electric Red');
  });
});
