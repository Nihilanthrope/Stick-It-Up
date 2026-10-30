import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getPlatformCapabilities, detectPlatform } from '../lib/platform/capabilities';

describe('Platform Capabilities', () => {
  const originalWindow = { ...window };

  beforeEach(() => {
    // Reset global indicators
    delete (window as any).__TAURI_INTERNALS__;
    delete (window as any).__STICK_UP_ANDROID_BRIDGE__;
  });

  afterEach(() => {
    delete (window as any).__TAURI_INTERNALS__;
    delete (window as any).__STICK_UP_ANDROID_BRIDGE__;
  });

  it('detects browser / web environment by default', () => {
    const platform = detectPlatform();
    expect(platform).toBe('web');

    const capabilities = getPlatformCapabilities();
    expect(capabilities.platform).toBe('web');
    expect(capabilities.supportsNativeOverlay).toBe(false);
    expect(capabilities.requiresSystemAlertWindow).toBe(false);
    expect(capabilities.explanation).toContain('not supported in browser');
  });

  it('detects desktop-linux when running under Tauri on Linux', () => {
    (window as any).__TAURI_INTERNALS__ = {};
    const originalNavigator = window.navigator.userAgent;
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      configurable: true,
    });

    const platform = detectPlatform();
    expect(platform).toBe('desktop-linux');

    const capabilities = getPlatformCapabilities();
    expect(capabilities.supportsNativeOverlay).toBe(true);
    expect(capabilities.requiresSystemAlertWindow).toBe(false);
    expect(capabilities.explanation).toContain('Linux');

    Object.defineProperty(window.navigator, 'userAgent', {
      value: originalNavigator,
      configurable: true,
    });
  });

  it('detects android when running on Android native bridge or userAgent', () => {
    (window as any).__STICK_UP_ANDROID_BRIDGE__ = { isAvailable: () => true };

    const platform = detectPlatform();
    expect(platform).toBe('android');

    const capabilities = getPlatformCapabilities();
    expect(capabilities.supportsNativeOverlay).toBe(true);
    expect(capabilities.requiresSystemAlertWindow).toBe(true);
    expect(capabilities.explanation).toContain('Android');
  });
});
