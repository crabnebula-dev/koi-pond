use mouce::common::{MouseButton, MouseEvent};
use mouce::Mouse as OtherMouse;
use mouse_position::mouse_position::Mouse;
use tauri::{AppHandle, Emitter, Manager};

#[derive(Clone, serde::Serialize)]
struct Payload {
    x: i32,
    y: i32,
}

fn listen_for_mouse_events(app_handle: AppHandle) {
    let mut mouse_manager = OtherMouse::new();

    mouse_manager
        .hook(Box::new(move |e| match e {
            MouseEvent::Press(MouseButton::Left) => {
                let position = Mouse::get_mouse_position();
                match position {
                    Mouse::Position { x, y } => {
                        app_handle
                            .emit("mouse_click", Payload { x, y })
                            .expect("Failed to unwrap Mouse position");
                    }
                    Mouse::Error => println!("Error getting mouse position"),
                }
            }
            _ => (),
        }))
        .expect("Failed to listen for Mouse Events");
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![])
        .setup(|app| {
            let window = app.get_webview_window("main").expect("Window failed");
            window
                .set_ignore_cursor_events(true)
                .expect("Failed to set ignore cursor events");

            #[cfg(not(target_os = "linux"))]
            window.maximize().expect("Could not maximize window");

            let app_handle = app.handle().clone();
            listen_for_mouse_events(app_handle);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
