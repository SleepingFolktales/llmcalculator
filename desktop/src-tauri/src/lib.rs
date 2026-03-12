use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_shell::ShellExt;

/// Holds the spawned Python backend child process so we can kill it on exit.
struct BackendProcess(Mutex<Option<tauri_plugin_shell::process::CommandChild>>);

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let handle = app.handle().clone();

            // Spawn the Python backend sidecar with PORT=18420.
            // The binary is declared in tauri.conf.json under bundle.externalBin
            // and must exist at src-tauri/binaries/llmcalc-backend-<target-triple>[.exe].
            let sidecar_command = handle
                .shell()
                .sidecar("llmcalc-backend")
                .expect("llmcalc-backend sidecar not found — run the build script first")
                .env("PORT", "18420")
                .env("HOST", "127.0.0.1");

            let (_rx, child) = sidecar_command
                .spawn()
                .expect("Failed to spawn llmcalc-backend sidecar");

            app.manage(BackendProcess(Mutex::new(Some(child))));

            // Brief pause so the Python server is ready before the webview loads.
            std::thread::sleep(std::time::Duration::from_millis(800));

            Ok(())
        })
        .on_window_event(|window, event| {
            // Kill the backend sidecar when the main window is closed.
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                if let Some(state) = window.try_state::<BackendProcess>() {
                    if let Ok(mut guard) = state.0.lock() {
                        if let Some(child) = guard.take() {
                            let _ = child.kill();
                        }
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
