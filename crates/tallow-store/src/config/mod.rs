//! Configuration management

pub mod schema;
pub mod loader;
pub mod defaults;

pub use schema::TallowConfig;
pub use loader::{load_config, save_config, config_path};
