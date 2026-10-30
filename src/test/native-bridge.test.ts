import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getNativeBridge, registerNativeAdapter } from '../lib/platform/native-bridge';

describe('Native Bridge', () => {
  beforeEach(() => {
    // Reset to default
    registerNativeAdapter(null);
    delete (window as any).__STICK_UP_ANDROID_BRIDGE__;
    delete (window as any).__TAURI_INTERNALS__;
  });

  it('provides safe unsupported fallbacks in browser environment', async () => {
    const bridge = getNativeBridge();
    expect(bridge.isSupported()).toBe(false);

    const permission = await bridge.getPermission();
    expect(permission).toBe('unsupported');

    const reqResult = await bridge.requestPermission();
    expect(reqResult).toBe('unsupported');

    const showResult = await bridge.showOverlay('note-123');
    expect(showResult).toBe(false);

    const hideResult = await bridge.hideOverlay();
    expect(hideResult).toBe(false);

    const minResult = await bridge.setMinimized(true);
    expect(minResult).toBe(false);

    const openResult = await bridge.openMainWindow();
    expect(openResult).toBe(false);
  });

  it('delegates to registered native adapter when available', async () => {
    const mockAdapter = {
      isSupported: vi.fn().mockReturnValue(true),
      getPermission: vi.fn().mockResolvedValue('granted' as const),
      requestPermission: vi.fn().mockResolvedValue('granted' as const),
      showOverlay: vi.fn().mockResolvedValue(true),
      hideOverlay: vi.fn().mockResolvedValue(true),
      setMinimized: vi.fn().mockResolvedValue(true),
      openMainWindow: vi.fn().mockResolvedValue(true),
    };

    registerNativeAdapter(mockAdapter);

    const bridge = getNativeBridge();
    expect(bridge.isSupported()).toBe(true);
    expect(await bridge.getPermission()).toBe('granted');
    expect(await bridge.requestPermission()).toBe('granted');
    expect(await bridge.showOverlay('test-note')).toBe(true);
    expect(mockAdapter.showOverlay).toHaveBeenCalledWith('test-note');
    expect(await bridge.setMinimized(true)).toBe(true);
    expect(mockAdapter.setMinimized).toHaveBeenCalledWith(true);
    expect(await bridge.hideOverlay()).toBe(true);
    expect(await bridge.openMainWindow()).toBe(true);
  });
});
