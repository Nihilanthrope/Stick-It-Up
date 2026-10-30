export type OverlayPermission = 'unknown' | 'granted' | 'denied' | 'unsupported';

export type OverlayPlatform =
  | 'desktop-linux'
  | 'desktop-windows'
  | 'desktop-macos'
  | 'android'
  | 'web';

export interface OverlayState {
  enabled: boolean;
  visible: boolean;
  noteId: string | null;
  minimized: boolean;
  permission: OverlayPermission;
}

export type OverlayCommand =
  | 'show'
  | 'hide'
  | 'toggle'
  | 'minimize'
  | 'restore'
  | 'close'
  | 'requestPermission';

export interface PlatformCapabilities {
  platform: OverlayPlatform;
  supportsNativeOverlay: boolean;
  requiresSystemAlertWindow: boolean;
  canRequestOverlayPermission: boolean;
  explanation: string;
}
