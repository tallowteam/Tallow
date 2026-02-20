//! Platform-specific paths using XDG conventions

use std::path::PathBuf;

/// Get configuration directory (~/.config/tallow or platform equivalent)
pub fn config_dir() -> PathBuf {
    dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("tallow")
}

/// Get data directory (~/.local/share/tallow or platform equivalent)
pub fn data_dir() -> PathBuf {
    dirs::data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("tallow")
}

/// Get cache directory (~/.cache/tallow or platform equivalent)
pub fn cache_dir() -> PathBuf {
    dirs::cache_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("tallow")
}

/// Get the config file path
pub fn config_file() -> PathBuf {
    config_dir().join("config.toml")
}

/// Get the identity file path
pub fn identity_file() -> PathBuf {
    config_dir().join("identity.enc")
}

/// Get the trust database path
pub fn trust_file() -> PathBuf {
    data_dir().join("trust.json")
}

/// Get the transfer history path
pub fn history_file() -> PathBuf {
    data_dir().join("history.json")
}

/// Get the clipboard history file path
pub fn clipboard_history_file() -> PathBuf {
    data_dir().join("clipboard_history.json")
}

/// Get the clipboard images directory path
pub fn clipboard_images_dir() -> PathBuf {
    data_dir().join("clipboard_images")
}

/// Ensure all required directories exist
pub fn ensure_dirs() -> std::io::Result<()> {
    std::fs::create_dir_all(config_dir())?;
    std::fs::create_dir_all(data_dir())?;
    std::fs::create_dir_all(cache_dir())?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_paths_contain_tallow() {
        assert!(config_dir().ends_with("tallow"));
        assert!(data_dir().ends_with("tallow"));
        assert!(cache_dir().ends_with("tallow"));
    }

    #[test]
    fn test_config_file_path() {
        let path = config_file();
        assert!(path.ends_with("config.toml"));
    }

    #[test]
    fn test_identity_file_path() {
        let path = identity_file();
        assert!(path.ends_with("identity.enc"));
    }
}
