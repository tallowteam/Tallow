//! Configuration management

pub mod schema;
pub mod loader;
pub mod defaults;

pub use schema::{TallowConfig, NetworkConfig, TransferConfig, PrivacyConfig, UiConfig};
pub use loader::{load_config, save_config, config_path, get_config_value, set_config_value};
