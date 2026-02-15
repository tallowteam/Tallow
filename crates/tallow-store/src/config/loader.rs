//! Configuration file loading and saving

use super::TallowConfig;
use crate::Result;
use std::path::PathBuf;

/// Load configuration from file
pub fn load_config() -> Result<TallowConfig> {
    todo!("Implement config loading")
}

/// Save configuration to file
pub fn save_config(_config: &TallowConfig) -> Result<()> {
    todo!("Implement config saving")
}

/// Get configuration file path
pub fn config_path() -> PathBuf {
    // Stub - would use dirs crate in real implementation
    PathBuf::from("tallow.toml")
}
