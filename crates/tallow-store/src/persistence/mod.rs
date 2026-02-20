//! Persistent storage utilities

pub mod encrypted_kv;
pub mod paths;

pub use encrypted_kv::EncryptedKv;
pub use paths::{
    cache_dir, config_dir, config_file, data_dir, ensure_dirs, history_file, identity_file,
    trust_file,
};
