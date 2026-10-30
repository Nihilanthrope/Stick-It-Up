import { OverlayPlatform, PlatformCapabilities } from '../overlay/types';

export function detectPlatform(): OverlayPlatform {
  if (typeof window === 'undefined') {
    return 'web';
  }

  // Android custom bridge or userAgent check
  if ((window as any).__STICK_UP_ANDROID_BRIDGE__ || /Android/i.test(navigator.userAgent)) {
    return 'android';
  }

  // Tauri check
  const isTauri = Boolean(
    (window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__
  );

  if (isTauri) {
    const ua = navigator.userAgent;
    if (/Linux/i.test(ua)) return 'desktop-linux';
    if (/Win/i.test(ua)) return 'desktop-windows';
    if (/Mac/i.test(ua)) return 'desktop-macos';
    return 'desktop-linux';
  }

  return 'web';
}

export function getPlatformCapabilities(): PlatformCapabilities {
  const platform = detectPlatform();

  switch (platform) {
    case 'desktop-linux':
      return {
        platform,
        supportsNativeOverlay: true,
        requiresSystemAlertWindow: false,
        canRequestOverlayPermission: false,
        explanation: 'Linux Desktop (Tauri 2): Native always-on-top floating sticky note window is supported.',
      };
    case 'android':
      return {
        platform,
        supportsNativeOverlay: true,
        requiresSystemAlertWindow: true,
        canRequestOverlayPermission: true,
        explanation: 'Android: Native floating sticky note overlay requires "Display over other apps" (SYSTEM_ALERT_WINDOW) permission.',
      };
    case 'desktop-windows':
      return {
        platform,
        supportsNativeOverlay: true,
        requiresSystemAlertWindow: false,
        canRequestOverlayPermission: false,
        explanation: 'Windows (Tauri 2): Always-on-top window is supported (experimental / future work).',
      };
    case 'desktop-macos':
      return {
        platform,
        supportsNativeOverlay: true,
        requiresSystemAlertWindow: false,
        canRequestOverlayPermission: false,
        explanation: 'macOS (Tauri 2): Always-on-top window is supported (experimental / future work).',
      };
    case 'web':
    default:
      return {
        platform: 'web',
        supportsNativeOverlay: false,
        requiresSystemAlertWindow: false,
        canRequestOverlayPermission: false,
        explanation: 'Web / Browser preview: Native OS-level floating overlay is not supported in browser mode. Runs natively on Linux desktop and Android.',
      };
  }
}
