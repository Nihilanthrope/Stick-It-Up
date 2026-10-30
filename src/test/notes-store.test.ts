import { beforeEach, describe, expect, it } from 'vitest';
import { NotesStore } from '../lib/notes/store';

describe('NotesStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('normalizes legacy notes with missing optional fields', () => {
    localStorage.setItem(
      'stick_up_notes_v1',
      JSON.stringify([
        {
          id: 'legacy-note',
          title: 'Legacy',
          content: 'Works',
          color: 'yellow',
          isPinned: false,
          isArchived: false,
          position: { x: 10, y: 20 },
          zIndex: 2,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ]),
    );

    const store = new NotesStore();
    const note = store.getNote('legacy-note');

    expect(note?.checklist).toEqual([]);
    expect(note?.tags).toEqual([]);
    expect(note?.reminder).toBeNull();
    expect(note?.title).toBe('Legacy');
    store.destroy();
  });

  it('creates a valid overlay note when the board is empty', () => {
    localStorage.setItem('stick_up_notes_v1', JSON.stringify([]));

    const store = new NotesStore();
    const note = store.createOverlayNote({ title: 'Quick Sticky' });

    expect(note.title).toBe('Quick Sticky');
    expect(store.getOverlayNote(note.id)?.id).toBe(note.id);
    store.destroy();
  });
});
