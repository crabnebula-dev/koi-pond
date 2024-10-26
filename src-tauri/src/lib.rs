use mouce::Mouse as OtherMouse;
use mouse_position::mouse_position::Mouse;
use tauri::{AppHandle, Emitter, Manager};
// TODO: If I get rid of MouseButton, then no events?
use mouce::common::{MouseButton, MouseEvent};

#[derive(Clone, serde::Serialize)]
struct Payload {
    x: i32,
    y: i32,
}

fn listen_for_mouse_events(app_handle: AppHandle) {
    let mut mouse_manager = OtherMouse::new();

    mouse_manager
        .hook(Box::new(move |e| {
            match e {
                MouseEvent::AbsoluteMove(x1, y1) => {
                    app_handle
                        .emit("mouse_move", Payload { x: *x1, y: *y1 })
                        .expect("Failed to unwrap Mouse position");
                }
                _ => (),
            }
        }))
        .expect("Failed to listen for Mouse Events");
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![])
        .setup(|app| {
            let window = app.get_webview_window("main").expect("Window failed");
            window
                .set_ignore_cursor_events(true)
                .expect("Failed to set ignore cursor events");
            window.maximize().expect("Could not maximize window");

            let app_handle = app.handle().clone();
            listen_for_mouse_events(app_handle);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
