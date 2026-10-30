import { NotesStore } from '../notes/store';
import { Note } from '../notes/types';

export interface OverlaySyncEvent {
  type: 'NOTE_PATCHED' | 'NOTE_CREATED' | 'OVERLAY_CLOSED';
  noteId: string;
  patch: Partial<Note>;
  timestamp: number;
}

export class OverlayNoteSync {
  private store: NotesStore;
  private channel: BroadcastChannel | null = null;
  private syncListeners: Set<(event: OverlaySyncEvent) => void> = new Set();

  constructor(store: NotesStore) {
    this.store = store;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel('stick_up_overlay_sync_events');
        this.channel.onmessage = (msg) => {
          if (msg.data?.type) {
            this.notifyListeners(msg.data);
          }
        };
      } catch (e) {
        console.warn('OverlayNoteSync BroadcastChannel init failed:', e);
      }
    }
  }

  public onSync(listener: (event: OverlaySyncEvent) => void): () => void {
    this.syncListeners.add(listener);
    return () => {
      this.syncListeners.delete(listener);
    };
  }

  private notifyListeners(event: OverlaySyncEvent): void {
    for (const listener of this.syncListeners) {
      listener(event);
    }
  }

  public broadcastPatch(noteId: string, patch: Partial<Note>): void {
    this.store.applyOverlayPatch(noteId, patch);

    const event: OverlaySyncEvent = {
      type: 'NOTE_PATCHED',
      noteId,
      patch,
      timestamp: Date.now(),
    };

    if (this.channel) {
      try {
        this.channel.postMessage(event);
      } catch (e) {
        // channel error
      }
    }
    this.notifyListeners(event);
  }

  /**
   * Non-destructive overlay close handler.
   * Emits an OVERLAY_CLOSED event without modifying or deleting the note.
   */
  public handleOverlayClosed(noteId: string): void {
    const event: OverlaySyncEvent = {
      type: 'OVERLAY_CLOSED',
      noteId,
      patch: {},
      timestamp: Date.now(),
    };

    if (this.channel) {
      try {
        this.channel.postMessage(event);
      } catch (e) {
        // channel error
      }
    }
    this.notifyListeners(event);
  }

  public destroy(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.syncListeners.clear();
  }
}
