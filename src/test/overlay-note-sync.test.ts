import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NotesStore } from '../lib/notes/store';
import { OverlayNoteSync } from '../lib/overlay/note-sync';

describe('Overlay Note Sync', () => {
  let store: NotesStore;
  let sync: OverlayNoteSync;

  beforeEach(() => {
    localStorage.clear();
    store = new NotesStore();
    sync = new OverlayNoteSync(store);
  });

  afterEach(() => {
    sync.destroy();
  });

  it('retrieves an existing note via getOverlayNote', () => {
    const note = store.createNote({
      title: 'Meeting Notes',
      content: 'Discuss quarterly plans',
      color: 'cream',
      isPinned: true,
    });

    const overlayNote = store.getOverlayNote(note.id);
    expect(overlayNote).toBeDefined();
    expect(overlayNote?.title).toBe('Meeting Notes');
    expect(overlayNote?.isPinned).toBe(true);
  });

  it('creates an overlay note using createOverlayNote and preserves defaults', () => {
    const note = store.createOverlayNote({
      title: 'Quick Float Note',
      content: 'Created directly from overlay',
    });

    expect(note.id).toBeDefined();
    expect(note.title).toBe('Quick Float Note');
    expect(note.color).toBe('cream');
    expect(note.isPinned).toBe(false);

    // Verify it is in the main store
    const inStore = store.getNote(note.id);
    expect(inStore).toBeDefined();
    expect(inStore?.content).toBe('Created directly from overlay');
  });

  it('applies patches immediately via applyOverlayPatch without overwriting unrelated fields', () => {
    const note = store.createNote({
      title: 'Original Title',
      content: 'Original Content',
      color: 'yellow',
      checklist: [{ id: '1', text: 'Item 1', completed: false }],
    });

    store.applyOverlayPatch(note.id, {
      content: 'Updated from overlay',
      checklist: [{ id: '1', text: 'Item 1', completed: true }],
    });

    const updated = store.getNote(note.id);
    expect(updated?.title).toBe('Original Title');
    expect(updated?.content).toBe('Updated from overlay');
    expect(updated?.checklist[0].completed).toBe(true);
    expect(updated?.color).toBe('yellow');
  });

  it('broadcasts note changes across sync channels and notifies listeners', () => {
    const remoteListener = vi.fn();
    sync.onSync(remoteListener);

    // Create a note through store
    const note = store.createNote({ title: 'Broadcast test' });

    // Patch it through overlay sync
    sync.broadcastPatch(note.id, { title: 'Updated Broadcast' });

    expect(remoteListener).toHaveBeenCalled();
    const event = remoteListener.mock.calls[0][0];
    expect(event.type).toBe('NOTE_PATCHED');
    expect(event.noteId).toBe(note.id);
    expect(event.patch.title).toBe('Updated Broadcast');
  });

  it('closing overlay does not delete the note', () => {
    const note = store.createNote({ title: 'Safe Note' });

    // Simulate overlay closing
    sync.handleOverlayClosed(note.id);

    // Note must still exist in the store!
    const noteStillExists = store.getNote(note.id);
    expect(noteStillExists).toBeDefined();
    expect(noteStillExists?.title).toBe('Safe Note');
  });
});
