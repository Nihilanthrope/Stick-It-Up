use std::process::Command;

use tauri::{AppHandle, Emitter, Manager, PhysicalSize};

#[tauri::command]
fn show_overlay_window(app: AppHandle, note_id: Option<String>) -> Result<(), String> {
    if let Some(overlay_win) = app.get_webview_window("overlay") {
        let _ = overlay_win.set_always_on_top(true);
        let _ = overlay_win.show();
        let _ = overlay_win.set_focus();

        if let Some(id) = note_id {
            let _ = overlay_win.emit("set-overlay-note", id);
        }
        configure_hyprland_overlay();
        let _ = overlay_win.set_size(PhysicalSize::new(320, 380));
        Ok(())
    } else {
        Err("Overlay window not configured".into())
    }
}

#[tauri::command]
fn hide_overlay_window(app: AppHandle) -> Result<(), String> {
    if let Some(overlay_win) = app.get_webview_window("overlay") {
        let _ = overlay_win.hide();
        Ok(())
    } else {
        Err("Overlay window not found".into())
    }
}

#[tauri::command]
fn set_overlay_minimized(app: AppHandle, minimized: bool) -> Result<(), String> {
    if let Some(overlay_win) = app.get_webview_window("overlay") {
        if minimized {
            // Resize to compact bubble/tab size
            let _ = overlay_win.set_size(PhysicalSize::new(260, 56));
        } else {
            // Restore to normal sticky note dimensions
            let _ = overlay_win.set_size(PhysicalSize::new(320, 380));
        }
        Ok(())
    } else {
        Err("Overlay window not found".into())
    }
}

#[tauri::command]
fn configure_hyprland_overlay() {
    if std::env::var_os("HYPRLAND_INSTANCE_SIGNATURE").is_none() {
        return;
    }

    let selector = "title:^(Stick Up Note \\(Overlay\\))$";
    let float = format!(
        "hl.dsp.window.float({{ action = \"set\", window = \"{}\" }})",
        selector
    );
    let pin = format!(
        "hl.dsp.window.pin({{ action = \"set\", window = \"{}\" }})",
        selector
    );
    let zorder = format!(
        "hl.dsp.window.alter_zorder({{ mode = \"top\", window = \"{}\" }})",
        selector
    );

    let _ = Command::new("hyprctl").args(["dispatch", &float]).output();
    let _ = Command::new("hyprctl").args(["dispatch", &pin]).output();
    let _ = Command::new("hyprctl").args(["dispatch", &zorder]).output();
}

#[tauri::command]
fn open_main_window(app: AppHandle) -> Result<(), String> {
    if let Some(main_win) = app.get_webview_window("main") {
        let _ = main_win.show();
        let _ = main_win.unminimize();
        let _ = main_win.set_focus();
        Ok(())
    } else {
        Err("Main window not found".into())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            show_overlay_window,
            hide_overlay_window,
            set_overlay_minimized,
            open_main_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running Stick Up Notes desktop application");
}
