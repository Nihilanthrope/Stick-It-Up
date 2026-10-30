import { OverlayPermission, OverlayState } from './types';
import { NativeBridge, getNativeBridge } from '../platform/native-bridge';

const STORAGE_KEY = 'stick_up_overlay_state';

export class OverlayController {
  private bridge: NativeBridge;
  private state: OverlayState;
  private listeners: Set<(state: OverlayState) => void> = new Set();

  constructor(bridge?: NativeBridge) {
    this.bridge = bridge || getNativeBridge();
    this.state = this.loadInitialState();
    this.initPermission();
  }

  private loadInitialState(): OverlayState {
    const defaultState: OverlayState = {
      enabled: false,
      visible: false,
      noteId: null,
      minimized: false,
      permission: this.bridge.isSupported() ? 'unknown' : 'unsupported',
    };

    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            ...defaultState,
            ...parsed,
            // Visiblity starts false on app launch unless explicitly restored
            visible: false,
          };
        }
      } catch (e) {
        console.warn('Failed to parse overlay state from localStorage:', e);
      }
    }

    return defaultState;
  }

  private async initPermission(): Promise<void> {
    if (this.bridge.isSupported()) {
      try {
        const permission = await this.bridge.getPermission();
        this.updateState({ permission });
      } catch {
        // keep current
      }
    }
  }

  private saveState(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            enabled: this.state.enabled,
            noteId: this.state.noteId,
            minimized: this.state.minimized,
          })
        );
      } catch (e) {
        console.warn('Failed to save overlay state to localStorage:', e);
      }
    }
  }

  private updateState(patch: Partial<OverlayState>): void {
    this.state = { ...this.state, ...patch };
    this.saveState();
    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  public getState(): OverlayState {
    return { ...this.state };
  }

  public subscribe(listener: (state: OverlayState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public async requestPermission(): Promise<OverlayPermission> {
    const permission = await this.bridge.requestPermission();
    this.updateState({ permission });
    return permission;
  }

  public async refreshPermission(): Promise<OverlayPermission> {
    const permission = await this.bridge.getPermission();
    this.updateState({ permission });
    return permission;
  }

  public async show(noteId?: string): Promise<boolean> {
    const targetNoteId = noteId !== undefined ? noteId : this.state.noteId;
    const success = await this.bridge.showOverlay(targetNoteId);

    if (success) {
      this.updateState({
        enabled: true,
        visible: true,
        noteId: targetNoteId,
        minimized: false,
      });
    }

    return success;
  }

  public async hide(): Promise<boolean> {
    const success = await this.bridge.hideOverlay();
    if (success) {
      this.updateState({ visible: false, minimized: false });
    }
    return success;
  }

  public async toggle(noteId?: string): Promise<boolean> {
    if (this.state.visible) {
      return this.hide();
    } else {
      return this.show(noteId);
    }
  }

  public async minimize(): Promise<boolean> {
    const success = await this.bridge.setMinimized(true);
    if (success) {
      this.updateState({ minimized: true });
    }
    return success;
  }

  public async restore(): Promise<boolean> {
    const success = await this.bridge.setMinimized(false);
    if (success) {
      this.updateState({ minimized: false });
    }
    return success;
  }

  /**
   * Close specifically hides the overlay window without modifying or deleting the underlying note.
   */
  public async close(): Promise<boolean> {
    return this.hide();
  }

  public async openMainWindow(): Promise<boolean> {
    return this.bridge.openMainWindow();
  }
}

// Singleton instance for app use
let defaultController: OverlayController | null = null;

export function getOverlayController(): OverlayController {
  if (!defaultController) {
    defaultController = new OverlayController();
  }
  return defaultController;
}
