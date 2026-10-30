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

  it('duplicates an existing note with an offset position and new ID', () => {
    const store = new NotesStore();
    const original = store.createNote({
      title: 'Original Template',
      content: 'Template body',
      color: 'forest',
      tags: ['template'],
      checklist: [{ id: 'c1', text: 'Task 1', completed: true }],
      position: { x: 100, y: 100 },
    });

    const duplicate = store.duplicateNote(original.id);
    expect(duplicate).toBeDefined();
    expect(duplicate?.id).not.toBe(original.id);
    expect(duplicate?.title).toContain('Original Template');
    expect(duplicate?.color).toBe('forest');
    expect(duplicate?.tags).toEqual(['template']);
    expect(duplicate?.checklist[0].text).toBe('Task 1');
    expect(duplicate?.position.x).toBeGreaterThan(100);
    expect(duplicate?.position.y).toBeGreaterThan(100);
    store.destroy();
  });

  it('adds and removes tags cleanly', () => {
    const store = new NotesStore();
    const note = store.createNote({ title: 'Tagged note', tags: ['first'] });

    store.addTag(note.id, 'second');
    let updated = store.getNote(note.id);
    expect(updated?.tags).toEqual(['first', 'second']);

    // Avoid duplicates and trim #
    store.addTag(note.id, '#second');
    updated = store.getNote(note.id);
    expect(updated?.tags).toEqual(['first', 'second']);

    store.removeTag(note.id, 'first');
    updated = store.getNote(note.id);
    expect(updated?.tags).toEqual(['second']);
    store.destroy();
  });

  it('exports and imports notes via JSON safely', () => {
    const store = new NotesStore();
    store.createNote({ title: 'Export Me', content: 'Special text' });

    const json = store.exportNotesJson();
    expect(json).toContain('Export Me');

    // Clear and re-import
    const store2 = new NotesStore();
    const success = store2.importNotesJson(json);
    expect(success).toBe(true);
    expect(store2.getNotes().some((n) => n.title === 'Export Me')).toBe(true);
    store.destroy();
    store2.destroy();
  });

  it('auto-arranges note positions to fit viewport', () => {
    const store = new NotesStore();
    store.createNote({ position: { x: 9999, y: 9999 } });

    store.autoArrangePositions(400);
    const arranged = store.getNotes();
    expect(arranged[0].position.x).toBeLessThan(400);
    expect(arranged[0].position.y).toBeGreaterThanOrEqual(20);
    store.destroy();
  });

  it('notifies subscribers with new array references on updates', () => {
    const store = new NotesStore();
    const snapshots: Array<readonly unknown[]> = [];
    const unsub = store.subscribe((notes) => {
      snapshots.push(notes);
    });

    const note = store.createNote({ title: 'Reactive note' });
    store.updateNote(note.id, { title: 'Updated reactive note' });

    expect(snapshots.length).toBeGreaterThanOrEqual(3);
    // Crucial for React useState: each snapshot must be a distinct array reference
    expect(snapshots[1]).not.toBe(snapshots[2]);
    unsub();
    store.destroy();
  });
});
