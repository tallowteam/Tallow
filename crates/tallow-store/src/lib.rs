//! Tallow persistent storage layer
//!
//! Manages configuration, identity keypairs, trust database, contacts,
//! transfer history, and encrypted key-value persistence.

#![forbid(unsafe_code)]

pub mod error;
pub mod config;
pub mod identity;
pub mod trust;
pub mod contacts;
pub mod history;
pub mod persistence;

pub use error::StoreError;

/// Result type for store operations
pub type Result<T> = std::result::Result<T, StoreError>;
