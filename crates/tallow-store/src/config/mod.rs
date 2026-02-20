//! Configuration management

pub mod aliases;
pub mod defaults;
pub mod loader;
pub mod schema;

pub use loader::{config_path, get_config_value, load_config, save_config, set_config_value};
pub use schema::{NetworkConfig, PrivacyConfig, TallowConfig, TransferConfig, UiConfig};
