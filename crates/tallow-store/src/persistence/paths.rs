//! Platform-specific paths

use std::path::PathBuf;

/// Get configuration directory
pub fn config_dir() -> PathBuf {
    // Stub - would use dirs crate
    PathBuf::from("~/.config/tallow")
}

/// Get data directory
pub fn data_dir() -> PathBuf {
    // Stub - would use dirs crate
    PathBuf::from("~/.local/share/tallow")
}

/// Get cache directory
pub fn cache_dir() -> PathBuf {
    // Stub - would use dirs crate
    PathBuf::from("~/.cache/tallow")
}
