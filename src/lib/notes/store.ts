import { Note, ChecklistItem } from './types';

const STORAGE_KEY = 'stick_up_notes_v1';
const SYNC_CHANNEL_NAME = 'stick_up_notes_sync';

export class NotesStore {
  private notes: Note[] = [];
  private listeners: Set<(notes: Note[]) => void> = new Set();
  private channel: BroadcastChannel | null = null;

  constructor() {
    this.notes = this.load();
    this.initSyncChannel();
  }

  private initSyncChannel(): void {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event.data?.type === 'NOTES_UPDATED') {
            this.notes = this.load();
            this.notify(false);
          }
        };
      } catch (e) {
        console.warn('Failed to initialize sync channel:', e);
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEY) {
          this.notes = this.load();
          this.notify(false);
        }
      });
    }
  }

  public getDefaultNotes(): Note[] {
    const now = new Date().toISOString();
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const pos1 = isMobile ? { x: 16, y: 20 } : { x: 30, y: 30 };
    const pos2 = isMobile ? { x: 20, y: 310 } : { x: 360, y: 50 };
    const pos3 = isMobile ? { x: 24, y: 600 } : { x: 690, y: 40 };

    return [
      {
        id: 'welcome-cream-crimson',
        title: 'Welcome to Stick Up Notes 📌',
        content: 'Your aesthetic offline-first sticky-note board in Cream × Crimson.\n\n• Drag notes anywhere on the canvas\n• Use the overlay button in the header to float notes on desktop Linux and Android!\n• Offline always, fast and private.',
        color: 'cream',
        isPinned: true,
        isArchived: false,
        position: pos1,
        zIndex: 10,
        checklist: [
          { id: 'item-1', text: 'Try dragging this sticky note', completed: false },
          { id: 'item-2', text: 'Test floating overlay in Settings', completed: false },
          { id: 'item-3', text: 'Create your first custom note', completed: false },
        ],
        reminder: null,
        tags: ['welcome', 'stickup'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'project-ideas',
        title: 'Ideas & Brainstorming 💡',
        content: 'Jot down thoughts and quick inspirations. Switch to Grid View anytime for a neat mobile-friendly layout.',
        color: 'terracotta',
        isPinned: false,
        isArchived: false,
        position: pos2,
        zIndex: 5,
        checklist: [],
        reminder: null,
        tags: ['ideas'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'quick-capture-note',
        title: 'Everyday Checklist 📝',
        content: 'Keep track of daily routines.',
        color: 'sage',
        isPinned: false,
        isArchived: false,
        position: pos3,
        zIndex: 4,
        checklist: [
          { id: 'c-1', text: 'Morning coffee & review notes', completed: true },
          { id: 'c-2', text: 'Check floating overlay status', completed: false },
          { id: 'c-3', text: 'Organize workspace', completed: false },
        ],
        reminder: null,
        tags: ['todo'],
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  public normalizeNote(raw: Partial<Note>, index: number): Note {
    const now = new Date().toISOString();
    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : `note-${Date.now()}-${index}`,
      title: typeof raw.title === 'string' ? raw.title : '',
      content: typeof raw.content === 'string' ? raw.content : '',
      color: typeof raw.color === 'string' ? raw.color : 'cream',
      isPinned: Boolean(raw.isPinned),
      isArchived: Boolean(raw.isArchived),
      position: raw.position && typeof raw.position.x === 'number' && Number.isFinite(raw.position.x) && typeof raw.position.y === 'number' && Number.isFinite(raw.position.y)
        ? { x: Math.round(raw.position.x), y: Math.round(raw.position.y) }
        : { x: 30 + (index % 6) * 50, y: 30 + (index % 4) * 40 },
      zIndex: typeof raw.zIndex === 'number' && Number.isFinite(raw.zIndex) ? raw.zIndex : index + 1,
      checklist: Array.isArray(raw.checklist)
        ? raw.checklist
            .filter((item): item is ChecklistItem => Boolean(item && typeof item.id === 'string'))
            .map((item) => ({
              id: item.id,
              text: typeof item.text === 'string' ? item.text : '',
              completed: Boolean(item.completed),
            }))
        : [],
      reminder: typeof raw.reminder === 'string' && !Number.isNaN(new Date(raw.reminder).getTime()) ? raw.reminder : null,
      tags: Array.isArray(raw.tags)
        ? Array.from(new Set(raw.tags.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0).map(t => t.trim().replace(/^#+/, ''))))
        : [],
      createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : now,
      updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : now,
    };
  }

  private load(): Note[] {
    if (typeof localStorage !== 'undefined') {
      try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((note, index) => this.normalizeNote(note, index));
          }
        }
      } catch (e) {
        console.warn('Failed to load notes from localStorage:', e);
      }
    }
    const defaults = this.getDefaultNotes();
    this.saveDirect(defaults);
    return defaults;
  }

  private saveDirect(notes: Note[]): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
      } catch (e) {
        console.warn('Failed to save notes to localStorage:', e);
      }
    }
  }

  private persist(broadcast = true): void {
    this.saveDirect(this.notes);
    if (broadcast && this.channel) {
      try {
        this.channel.postMessage({ type: 'NOTES_UPDATED', timestamp: Date.now() });
      } catch (e) {
        // channel error
      }
    }
    this.notify();
  }

  private notify(persistState = true): void {
    const snapshot = [...this.notes];
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  public getNotes(): Note[] {
    return [...this.notes];
  }

  public getNote(id: string): Note | undefined {
    return this.notes.find((n) => n.id === id);
  }

  /**
   * Safe overlay retrieval API:
   * Returns requested note if available, else first unarchived or fallback note.
   */
  public getOverlayNote(noteId: string | null): Note | undefined {
    if (noteId) {
      const match = this.getNote(noteId);
      if (match) return match;
    }
    // Fallback: first pinned note or first unarchived note
    const active = this.notes.filter((n) => !n.isArchived);
    return active.find((n) => n.isPinned) || active[0];
  }

  public createNote(partial: Partial<Note> = {}): Note {
    const now = new Date().toISOString();
    const newNote: Note = {
      id: partial.id || `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: partial.title || '',
      content: partial.content || '',
      color: partial.color || 'cream',
      isPinned: partial.isPinned ?? false,
      isArchived: partial.isArchived ?? false,
      position: partial.position || {
        x: 30 + (this.notes.length % 5) * 40,
        y: 40 + (this.notes.length % 4) * 35,
      },
      zIndex: this.getNextZIndex(),
      checklist: partial.checklist || [],
      reminder: partial.reminder || null,
      tags: partial.tags || [],
      createdAt: now,
      updatedAt: now,
    };

    this.notes = [newNote, ...this.notes];
    this.persist();
    return newNote;
  }

  /**
   * Specifically for quick overlay note capture
   */
  public createOverlayNote(partial: Partial<Note> = {}): Note {
    return this.createNote({
      ...partial,
      color: partial.color || 'cream',
    });
  }

  public updateNote(id: string, patch: Partial<Note>): Note | undefined {
    const index = this.notes.findIndex((n) => n.id === id);
    if (index === -1) return undefined;

    const existing = this.notes[index];
    const updated: Note = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    this.notes = this.notes.map((n, i) => (i === index ? updated : n));
    this.persist();
    return updated;
  }

  /**
   * Clones a note with fresh IDs and slightly offset position.
   */
  public duplicateNote(id: string): Note | undefined {
    const original = this.getNote(id);
    if (!original) return undefined;

    const now = new Date().toISOString();
    const duplicated: Note = {
      ...original,
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: `${original.title || 'Untitled Note'} (Copy)`,
      position: {
        x: original.position.x + 30,
        y: original.position.y + 30,
      },
      zIndex: this.getNextZIndex(),
      checklist: original.checklist.map((item) => ({
        ...item,
        id: `check-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      })),
      createdAt: now,
      updatedAt: now,
    };

    this.notes = [duplicated, ...this.notes];
    this.persist();
    return duplicated;
  }

  public addTag(id: string, tag: string): Note | undefined {
    const cleanTag = tag.trim().replace(/^#+/, '');
    if (!cleanTag) return undefined;

    const note = this.getNote(id);
    if (!note) return undefined;

    if (note.tags.includes(cleanTag)) return note;
    return this.updateNote(id, { tags: [...note.tags, cleanTag] });
  }

  public removeTag(id: string, tag: string): Note | undefined {
    const note = this.getNote(id);
    if (!note) return undefined;

    const updatedTags = note.tags.filter((t) => t !== tag && t !== `#${tag}`);
    return this.updateNote(id, { tags: updatedTags });
  }

  /**
   * Applies an overlay patch immediately.
   * Never deletes the note!
   */
  public applyOverlayPatch(noteId: string, patch: Partial<Note>): Note | undefined {
    return this.updateNote(noteId, patch);
  }

  public deleteNote(id: string): boolean {
    const initialLen = this.notes.length;
    this.notes = this.notes.filter((n) => n.id !== id);
    if (this.notes.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  public togglePin(id: string): boolean {
    const note = this.getNote(id);
    if (note) {
      this.updateNote(id, { isPinned: !note.isPinned });
      return true;
    }
    return false;
  }

  public toggleArchive(id: string): boolean {
    const note = this.getNote(id);
    if (note) {
      this.updateNote(id, { isArchived: !note.isArchived });
      return true;
    }
    return false;
  }

  public updatePosition(id: string, position: { x: number; y: number }): void {
    this.updateNote(id, { position });
  }

  public bringToFront(id: string): void {
    const nextZ = this.getNextZIndex();
    this.updateNote(id, { zIndex: nextZ });
  }

  private getNextZIndex(): number {
    const maxZ = this.notes.reduce((max, n) => Math.max(max, n.zIndex || 0), 1);
    return maxZ + 1;
  }

  /**
   * Rearranges all active notes so they neatly fit within viewport bounds.
   */
  public autoArrangePositions(viewportWidth: number = 800): void {
    const noteWidth = 300;
    const padding = 20;
    const availableWidth = Math.max(320, viewportWidth - 40);
    const cols = Math.max(1, Math.floor(availableWidth / (noteWidth + padding)));

    const colHeights = new Array(cols).fill(20);

    this.notes = this.notes.map((note) => {
      // Find shortest column
      let minCol = 0;
      for (let c = 1; c < cols; c++) {
        if (colHeights[c] < colHeights[minCol]) {
          minCol = c;
        }
      }

      const x = padding + minCol * (noteWidth + padding);
      const y = colHeights[minCol];
      colHeights[minCol] += 260 + padding;

      return {
        ...note,
        position: { x, y },
      };
    });

    this.persist();
  }

  public exportNotesJson(): string {
    return JSON.stringify(this.notes, null, 2);
  }

  public importNotesJson(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!Array.isArray(parsed)) return false;

      const normalized = parsed.map((item, idx) => this.normalizeNote(item, idx));
      if (normalized.length === 0) return false;

      this.notes = normalized;
      this.persist();
      return true;
    } catch {
      return false;
    }
  }

  public resetToDefaults(): Note[] {
    const defaults = this.getDefaultNotes();
    this.notes = defaults;
    this.persist();
    return defaults;
  }

  public subscribe(listener: (notes: Note[]) => void): () => void {
    this.listeners.add(listener);
    listener([...this.notes]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public destroy(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
  }
}

let defaultNotesStore: NotesStore | null = null;

export function getNotesStore(): NotesStore {
  if (!defaultNotesStore) {
    defaultNotesStore = new NotesStore();
  }
  return defaultNotesStore;
}
