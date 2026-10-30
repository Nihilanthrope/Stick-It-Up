# Stick Up Notes - Agent Developer Guidelines

## Architectural Philosophy & Identity
Stick Up Notes is an aesthetic offline-first sticky-note board with a Cream × Crimson physical paper aesthetic.

### Core Non-Negotiable Tenets:
1. **Never Destroy Notes on Overlay Close**:
   - Closing an overlay window or minimizing a floating note hides the window view. It MUST NEVER delete the note.
   - Deletion is exclusively an explicit user action via the trash button on the note card.
2. **Single Source of Truth (`NotesStore`)**:
   - The overlay view and main board communicate through `NotesStore` and `OverlayNoteSync` via BroadcastChannel and localStorage events.
   - Any patch applied in an overlay immediately updates the board and vice versa.
3. **Graceful Platform Degradation**:
   - Browser / Web Preview: Detects lack of native OS windowing and explicitly marks overlay capability as `unsupported` in Settings with an informative banner.
   - Desktop Linux (Tauri 2): Creates a frameless, always-on-top, draggable, editable floating sticky note window with custom titlebar.
   - Android: Implements a real `SYSTEM_ALERT_WINDOW` floating service (`StickUpOverlayService`) using Android's `WindowManager`. Explicitly requests permission; never attempts silent grant.

## Directory Structure
- `src/lib/overlay/`: Platform-independent contract (`types.ts`, `controller.ts`, `note-sync.ts`)
- `src/lib/platform/`: Detection and bridge adapters (`capabilities.ts`, `native-bridge.ts`)
- `src/lib/notes/`: Store, models, and localStorage persistence (`store.ts`, `types.ts`)
- `src/components/`: Shared UI components (`Header.tsx`, `StickyNote.tsx`, `FreeformCanvas.tsx`, `GridView.tsx`, `SettingsModal.tsx`)
- `src/views/`: Dedicated views (`FloatingOverlayView.tsx` for frameless overlay window)
- `src-tauri/`: Tauri 2 desktop shell configuration and Rust IPC handlers (`src/lib.rs`, `tauri.conf.json`)
- `android/`: Native Android overlay service, permission helper, and WebView bridge
