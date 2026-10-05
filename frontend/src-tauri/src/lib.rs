use std::fs;
use std::path::PathBuf;

use tauri::Manager;

/// Pasta padrão dos dados: %APPDATA%\com.cashflow.app (no Windows).
#[tauri::command]
fn default_data_dir(app: tauri::AppHandle) -> Result<String, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    Ok(dir.to_string_lossy().into_owned())
}

/// Conteúdo de um arquivo de texto, ou `None` se ele ainda não existe.
#[tauri::command]
fn read_text_file(path: String) -> Result<Option<String>, String> {
    match fs::read_to_string(&path) {
        Ok(contents) => Ok(Some(contents)),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(e) => Err(format!("Não foi possível ler {path}: {e}")),
    }
}

/// Grava de forma atômica: escreve num arquivo temporário e renomeia por cima.
/// Uma queda no meio da gravação (ou o OneDrive lendo o arquivo) nunca vê um
/// arquivo pela metade.
#[tauri::command]
fn write_text_file(path: String, contents: String) -> Result<(), String> {
    let target = PathBuf::from(&path);
    if let Some(parent) = target.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Não foi possível criar {}: {e}", parent.display()))?;
    }
    let temp = target.with_extension("json.tmp");
    fs::write(&temp, contents).map_err(|e| format!("Não foi possível gravar {}: {e}", temp.display()))?;
    fs::rename(&temp, &target).map_err(|e| format!("Não foi possível gravar {path}: {e}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![default_data_dir, read_text_file, write_text_file])
        .run(tauri::generate_context!())
        .expect("erro ao iniciar o Cashflow");
}
