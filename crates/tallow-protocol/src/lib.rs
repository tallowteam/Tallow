//! Tallow wire protocol and transfer logic
//!
//! Defines message formats, transfer pipelines, compression, file manifests,
//! chat protocol, room management, and metadata handling.

pub mod error;
pub mod wire;
pub mod transfer;
pub mod compression;
pub mod chat;
pub mod room;
pub mod metadata;

pub use error::ProtocolError;

/// Result type for protocol operations
pub type Result<T> = std::result::Result<T, ProtocolError>;
