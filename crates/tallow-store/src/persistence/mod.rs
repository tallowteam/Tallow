//! Persistent storage utilities

pub mod encrypted_kv;
pub mod paths;

pub use encrypted_kv::EncryptedKv;
pub use paths::{config_dir, data_dir, cache_dir};
