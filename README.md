# Stick Up Notes 📌

An aesthetic, offline-first sticky-note board designed in **Cream × Crimson** with true OS-level floating sticky-note overlays for **Linux Desktop (Tauri 2)** and **Android (`SYSTEM_ALERT_WINDOW`)**.

---

## 🎨 Product Identity & Aesthetics

- **Cream × Crimson Default**: Warm parchment paper tones (`#FFFDF5`), textured canvas grid, and rich crimson accents (`#9E1B32`).
- **Physical Sticky-Note Feel**: Tape headers, realistic paper shadows, and gentle natural tilt.
- **Color Palettes**: Cream × Crimson, Canary Yellow, Sage Mint, Pastel Lavender, Blush Pink, Soft Sky, and Dark Velvet.
- **Offline-First & Private**: Direct browser/native persistence with zero account or cloud lock-in.

---

## 🚀 Features

1. **Freeform Canvas & Responsive Grid**:
   - Freeform Drag mode: Freely drag and arrange notes anywhere across the board with live coordinate persistence.
   - Responsive Grid mode: Organized cards layout optimized for mobile, tablet, or clean overview.
2. **Rich Note Cards**:
   - In-place title & content editing.
   - Interactive Checklists with checkboxes and strike-through.
   - Color picker for the eight built-in paper worlds: Cream × Crimson, Ivory × Forest, Midnight × Burgundy, Paper × Ink, Terracotta × Sand, Lavender × Plum, Sage × Espresso, and Cream × Electric Red.
   - Pin / Unpin, Archive / Restore, and per-note reminder date/time.
3. **Search & Filters**:
   - Real-time search across titles, content, checklist items, and tags.
   - Quick filters: All, Pinned, Checklists, Reminders, Archive.

---

## 🪟 Real OS-Level Floating Sticky Note Overlays

### 1. Linux Desktop (Tauri 2 Shell)
Targeted for Linux environments (tested on Arch Linux + Hyprland):
- **Always-on-Top**: Floats above normal application windows.
- **Draggable Header**: Move the note anywhere using the tape header (`data-tauri-drag-region`).
- **Direct In-Place Editing**: Type text or check off tasks directly from the overlay.
- **Non-Destructive Close (`×`)**: Closes/hides the overlay window **without deleting the note**.
- **Minimize to Compact Bubble**: Shrinks into a sleek floating tab/bubble and restores on click.
- **Quick Capture (`+`)**: Instantly creates a new quick floating sticky note.
- **Open Main Board**: One-click button to bring the full Stick Up Notes board to the front.

#### Hyprland Window Rules (Optional Recommended Configuration)
Add to `~/.config/hypr/hyprland.conf`:
```ini
windowrulev2 = float, class:^(com.nihilanthrope.stickupnotes)$, title:^(Stick Up Note \(Overlay\))$
windowrulev2 = pin, class:^(com.nihilanthrope.stickupnotes)$, title:^(Stick Up Note \(Overlay\))$
windowrulev2 = noborder, class:^(com.nihilanthrope.stickupnotes)$, title:^(Stick Up Note \(Overlay\))$
```

### 2. Android Native Overlay (`SYSTEM_ALERT_WINDOW`)
- **Explicit Permission Flow**: Requests "Display over other apps" via `Settings.ACTION_MANAGE_OVERLAY_PERMISSION`. Never attempts silent grants.
- **Native Movable Window**: Uses `WindowManager` with `TYPE_APPLICATION_OVERLAY`.
- **Touch Gesture Dragging**: Smooth delta-based dragging across the screen.
- **Full Sticky Note & Minimized Bubble**: Toggle between full note and a compact floating bubble badge.
- **Main App Launch**: Intent to launch the main application.
- **Persistent Notes**: Hiding the overlay keeps all notes safely preserved in storage.

### 3. Browser / Web Mode
- Automatically detects web/browser preview.
- Accurately reports native overlay as `unsupported` in Settings with an explanation notice instead of simulating fake OS windows.

---

## 🛠️ Setup & Build Instructions

### Prerequisites
- Node.js 18+ (tested on Node 26) & npm
- For Desktop Linux: Rust & Cargo (`rustc 1.99+`), `webkit2gtk-4.1` (`sudo pacman -S webkit2gtk-4.1` on Arch Linux)
- For Android: Android SDK (API 35), JDK 17/21, Gradle 8.10+

### Web Development & Build
```bash
# Install dependencies
npm install

# Run Vitest test suite
npm run test

# Run TypeScript check
npm run typecheck

# Build web distribution
npm run build

# Start local Vite development server
npm run dev
```

### Desktop Linux (Tauri 2)
```bash
# Ensure webkit2gtk-4.1 is installed on Arch Linux
sudo pacman -S webkit2gtk-4.1

# Run Tauri desktop app with hot reload
npm run dev &
cd src-tauri && cargo run
```

### Android Build
```bash
# Build Android debug APK
cd android
./gradlew assembleDebug
```
The output APK is generated at:
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🧪 Test Coverage & Verification

Run the complete test suite:
```bash
npm run test
```
All unit tests verify:
- `src/test/platform-capabilities.test.ts`: Platform detection (Web, Linux Tauri, Android)
- `src/test/native-bridge.test.ts`: Bridge delegation and safe browser fallback
- `src/test/overlay-controller.test.ts`: State transitions, show/hide/minimize/restore, and non-destructive close
- `src/test/overlay-note-sync.test.ts`: Bidirectional note synchronization across overlay and main board

## Native build notes

### Linux / Hyprland

The desktop overlay is a real Tauri 2 window. On Hyprland, the native shell explicitly floats, pins, and raises the `Stick Up Note (Overlay)` window when it opens; this keeps it from being tiled like the main board. Other Linux window managers rely on Tauri's native always-on-top behavior.

Required Arch package for Tauri's GTK WebView backend: `webkit2gtk-4.1`.

### Android

The Android target uses the same React `FloatingOverlayView` inside a native `WindowManager` overlay service. The service requires `SYSTEM_ALERT_WINDOW`, uses a foreground-service notification, and exposes the native bridge for permission, visibility, minimize/restore, app launch, and titlebar movement. The main app and overlay therefore share the same WebView storage and notes model.

The reproducible Android build uses the checked-in Gradle wrapper (`./gradlew assembleDebug`) and the existing Android SDK configured by `android/local.properties`.
