import { OverlayPermission } from '../overlay/types';
import { detectPlatform } from './capabilities';

export interface NativeBridge {
  isSupported(): boolean;
  getPermission(): Promise<OverlayPermission>;
  requestPermission(): Promise<OverlayPermission>;
  showOverlay(noteId: string | null): Promise<boolean>;
  hideOverlay(): Promise<boolean>;
  setMinimized(minimized: boolean): Promise<boolean>;
  openMainWindow(): Promise<boolean>;
}

class WebFallbackBridge implements NativeBridge {
  isSupported(): boolean {
    return false;
  }

  async getPermission(): Promise<OverlayPermission> {
    return 'unsupported';
  }

  async requestPermission(): Promise<OverlayPermission> {
    return 'unsupported';
  }

  async showOverlay(_noteId: string | null): Promise<boolean> {
    return false;
  }

  async hideOverlay(): Promise<boolean> {
    return false;
  }

  async setMinimized(_minimized: boolean): Promise<boolean> {
    return false;
  }

  async openMainWindow(): Promise<boolean> {
    return false;
  }
}

class TauriDesktopBridge implements NativeBridge {
  isSupported(): boolean {
    return true;
  }

  async getPermission(): Promise<OverlayPermission> {
    // Desktop Linux / Tauri windows do not require special permission
    return 'granted';
  }

  async requestPermission(): Promise<OverlayPermission> {
    return 'granted';
  }

  async showOverlay(noteId: string | null): Promise<boolean> {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('show_overlay_window', { noteId });
      return true;
    } catch (e) {
      console.warn('Tauri showOverlay failed or not available in this context:', e);
      return false;
    }
  }

  async hideOverlay(): Promise<boolean> {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('hide_overlay_window');
      return true;
    } catch (e) {
      console.warn('Tauri hideOverlay failed:', e);
      return false;
    }
  }

  async setMinimized(minimized: boolean): Promise<boolean> {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('set_overlay_minimized', { minimized });
      return true;
    } catch (e) {
      console.warn('Tauri setMinimized failed:', e);
      return false;
    }
  }

  async openMainWindow(): Promise<boolean> {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('open_main_window');
      return true;
    } catch (e) {
      console.warn('Tauri openMainWindow failed:', e);
      return false;
    }
  }
}

class AndroidNativeBridge implements NativeBridge {
  private get android() {
    return (window as any).__STICK_UP_ANDROID_BRIDGE__;
  }

  isSupported(): boolean {
    return Boolean(this.android || /Android/i.test(navigator.userAgent));
  }

  async getPermission(): Promise<OverlayPermission> {
    if (this.android?.canDrawOverlays) {
      const granted = this.android.canDrawOverlays();
      return granted ? 'granted' : 'denied';
    }
    return 'unknown';
  }

  async requestPermission(): Promise<OverlayPermission> {
    if (this.android?.requestOverlayPermission) {
      const granted = await this.android.requestOverlayPermission();
      return granted ? 'granted' : 'denied';
    }
    return 'denied';
  }

  async showOverlay(noteId: string | null): Promise<boolean> {
    if (this.android?.showOverlay) {
      return Boolean(this.android.showOverlay(noteId));
    }
    return false;
  }

  async hideOverlay(): Promise<boolean> {
    if (this.android?.hideOverlay) {
      return Boolean(this.android.hideOverlay());
    }
    return false;
  }

  async setMinimized(minimized: boolean): Promise<boolean> {
    if (this.android?.setMinimized) {
      return Boolean(this.android.setMinimized(minimized));
    }
    return false;
  }

  async openMainWindow(): Promise<boolean> {
    if (this.android?.openApp) {
      return Boolean(this.android.openApp());
    }
    return false;
  }
}

let customAdapter: NativeBridge | null = null;

export function registerNativeAdapter(adapter: NativeBridge | null): void {
  customAdapter = adapter;
}

export function getNativeBridge(): NativeBridge {
  if (customAdapter) {
    return customAdapter;
  }

  const platform = detectPlatform();
  if (platform === 'android') {
    return new AndroidNativeBridge();
  }
  if (platform === 'desktop-linux' || platform === 'desktop-windows' || platform === 'desktop-macos') {
    return new TauriDesktopBridge();
  }
  return new WebFallbackBridge();
}
