//! Tallow persistent storage layer
//!
//! Manages configuration, identity keypairs, trust database, contacts,
//! transfer history, and encrypted key-value persistence.

#![forbid(unsafe_code)]

pub mod config;
pub mod contacts;
pub mod error;
pub mod history;
pub mod identity;
pub mod persistence;
pub mod trust;

pub use error::StoreError;

/// Result type for store operations
pub type Result<T> = std::result::Result<T, StoreError>;
