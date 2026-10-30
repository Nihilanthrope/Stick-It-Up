import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OverlayController } from '../lib/overlay/controller';
import { NativeBridge } from '../lib/platform/native-bridge';

describe('OverlayController', () => {
  let mockBridge: NativeBridge;
  let controller: OverlayController;

  beforeEach(() => {
    localStorage.clear();
    mockBridge = {
      isSupported: vi.fn().mockReturnValue(true),
      getPermission: vi.fn().mockResolvedValue('granted'),
      requestPermission: vi.fn().mockResolvedValue('granted'),
      showOverlay: vi.fn().mockResolvedValue(true),
      hideOverlay: vi.fn().mockResolvedValue(true),
      setMinimized: vi.fn().mockResolvedValue(true),
      openMainWindow: vi.fn().mockResolvedValue(true),
      moveOverlay: vi.fn().mockResolvedValue(true),
    };
    controller = new OverlayController(mockBridge);
  });

  it('initializes with default overlay state', () => {
    const state = controller.getState();
    expect(state.visible).toBe(false);
    expect(state.enabled).toBe(false);
    expect(state.noteId).toBeNull();
    expect(state.minimized).toBe(false);
  });

  it('shows overlay with specified noteId', async () => {
    await controller.show('note-abc');
    const state = controller.getState();
    expect(state.visible).toBe(true);
    expect(state.enabled).toBe(true);
    expect(state.noteId).toBe('note-abc');
    expect(state.minimized).toBe(false);
    expect(mockBridge.showOverlay).toHaveBeenCalledWith('note-abc');
  });

  it('does not mark overlay visible when the native show operation fails', async () => {
    mockBridge.showOverlay = vi.fn().mockResolvedValue(false);

    const result = await controller.show('note-failed');

    expect(result).toBe(false);
    expect(controller.getState().visible).toBe(false);
    expect(controller.getState().enabled).toBe(false);
    expect(controller.getState().noteId).toBeNull();
  });

  it('minimizes and restores overlay state', async () => {
    await controller.show('note-abc');
    await controller.minimize();
    expect(controller.getState().minimized).toBe(true);
    expect(mockBridge.setMinimized).toHaveBeenCalledWith(true);

    await controller.restore();
    expect(controller.getState().minimized).toBe(false);
    expect(mockBridge.setMinimized).toHaveBeenCalledWith(false);
  });

  it('hides overlay on close without affecting note data', async () => {
    await controller.show('note-abc');
    await controller.close();

    const state = controller.getState();
    expect(state.visible).toBe(false);
    // noteId is preserved for quick re-opening
    expect(state.noteId).toBe('note-abc');
    expect(mockBridge.hideOverlay).toHaveBeenCalled();
  });

  it('toggles visibility correctly', async () => {
    await controller.toggle('note-1');
    expect(controller.getState().visible).toBe(true);

    await controller.toggle();
    expect(controller.getState().visible).toBe(false);
  });

  it('requests permission through the bridge', async () => {
    const perm = await controller.requestPermission();
    expect(perm).toBe('granted');
    expect(controller.getState().permission).toBe('granted');
    expect(mockBridge.requestPermission).toHaveBeenCalled();
  });

  it('notifies subscribers of state changes', async () => {
    const listener = vi.fn();
    const unsubscribe = controller.subscribe(listener);

    await controller.show('note-xyz');
    expect(listener).toHaveBeenCalled();
    const lastCallArg = listener.mock.calls[listener.mock.calls.length - 1][0];
    expect(lastCallArg.visible).toBe(true);
    expect(lastCallArg.noteId).toBe('note-xyz');

    unsubscribe();
  });
});
