import { describe, it, expect } from 'vitest';
import { NOTE_THEMES, getTheme } from '../lib/theme';

describe('Note themes', () => {
  it('contains the core theme set with distinct vibrant colors', () => {
    const requiredThemes = [
      'cream',
      'forest',
      'midnight',
      'paper',
      'terracotta',
      'lavender',
      'sage',
      'electric-red',
    ];

    for (const key of requiredThemes) {
      expect(NOTE_THEMES[key]).toBeDefined();
    }

    expect(NOTE_THEMES.cream.name).toBe('Cream × Crimson');
    expect(NOTE_THEMES.forest.name).toBe('Ivory × Forest');
    expect(NOTE_THEMES.midnight.name).toBe('Midnight × Burgundy');
    expect(NOTE_THEMES.paper.name).toBe('Paper × Ink');
    expect(NOTE_THEMES.terracotta.name).toBe('Terracotta × Sand');
    expect(NOTE_THEMES.lavender.name).toBe('Lavender × Plum');
    expect(NOTE_THEMES.sage.name).toBe('Sage × Espresso');
    expect(NOTE_THEMES['electric-red'].name).toBe('Electric Crimson');

    // Verify themes have distinct background colors (not monochromatic pale creams)
    expect(NOTE_THEMES.paper.bg).toBe('#FEF08A'); // Post-It Yellow
    expect(NOTE_THEMES.forest.bg).toBe('#DCFCE7'); // Mint Green
    expect(NOTE_THEMES.lavender.bg).toBe('#F3E8FF'); // Lavender
    expect(NOTE_THEMES.midnight.bg).toBe('#1E1E24'); // Dark
  });

  it('supports expanded modern pastel colors and aliases', () => {
    expect(getTheme('yellow').name).toBe('Canary Yellow');
    expect(getTheme('mint').name).toBe('Mint Green');
    expect(getTheme('blue').name).toBe('Sky Blue');
    expect(getTheme('pink').name).toBe('Rose Pink');
    expect(getTheme('peach').name).toBe('Warm Peach');
    expect(getTheme('matcha').name).toBe('Matcha Lime');
    expect(getTheme('kraft').name).toBe('Kraft Paper');
    expect(getTheme('dark').name).toBe('Dark Velvet');
  });
});
