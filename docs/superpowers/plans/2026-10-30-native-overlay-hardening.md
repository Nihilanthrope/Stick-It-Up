# Stick Up Notes Native Overlay Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the existing Linux Tauri and Android native overlay implementation actually usable, synchronized with the shared notes model, and verifiable on the user's Arch desktop and connected Android device.

**Architecture:** Keep the existing React notes model as the source of truth. Linux uses the existing Tauri always-on-top overlay window. Android uses a native WindowManager overlay service hosting the same React overlay UI so Android overlay edits use the same WebView/localStorage data model; the native bridge handles permission, visibility, minimization, opening the app, and window movement.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Tauri 2/Rust, Kotlin/Android, WindowManager, WebView, localStorage/BroadcastChannel.

**Spec:** `PROJECT_MEMORY.txt` and the native-overlay requirements established in the conversation.

## Global Constraints

- Preserve the existing Stick Up Notes UI, themes, notes model, and offline-first behavior.
- Closing/hiding an overlay must never delete its note.
- Browser mode must not pretend it has an OS-level overlay.
- Linux is the first desktop target.
- Android overlay requires explicit `SYSTEM_ALERT_WINDOW` permission.
- Verify with tests/builds before claiming completion.

## Review Focus

- Android overlay edits must persist to the same notes store used by the main app.
- Android touch handling must not swallow text input or buttons.
- Overlay close/minimize must preserve the note.
- Quick-create must create a real persisted note.
- Native bridge failures must not corrupt UI state.

### Task 1: Android overlay correctness

**Files:**
- Modify `android/app/src/main/java/com/nihilanthrope/stickupnotes/overlay/StickUpOverlayService.kt`
- Modify `android/app/src/main/java/com/nihilanthrope/stickupnotes/overlay/StickUpNativeBridgeInterface.kt`
- Modify `src/lib/platform/native-bridge.ts`
- Modify `src/views/FloatingOverlayView.tsx`
- Test `src/test/native-bridge.test.ts`

- [ ] Use the shared React `FloatingOverlayView` inside the Android WindowManager overlay instead of a second unsynchronized native note editor.
- [ ] Add native Android window movement support through the bridge for the overlay titlebar.
- [ ] Keep overlay permission and hide/minimize/open commands native.
- [ ] Ensure Android WebView uses the same local app storage and bridge as the main activity.
- [ ] Add bridge tests for the new movement operation.
- [ ] Run the targeted tests and production build.

### Task 2: Linux verification and dependency documentation

**Files:**
- Modify `README.md`
- Modify `PROJECT_MEMORY.txt`

- [ ] Run Tauri formatting/check/build after the required WebKitGTK dependency is available.
- [ ] Record any machine-level prerequisite that cannot be installed automatically.
- [ ] Do not weaken the Tauri dependency just to bypass a missing system library.

### Task 3: Android build/device verification

**Files:**
- Modify Android Gradle files only if verification reveals a real issue.

- [ ] Build the Android APK with a local Gradle/SDK toolchain if available.
- [ ] Install the debug APK to the connected device.
- [ ] Launch it and verify overlay permission flow, floating overlay, editing, minimize/restore, hide, and persistence.
- [ ] Run the final TypeScript/Vitest suite and inspect git diff/status.
