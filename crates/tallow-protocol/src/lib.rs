//! Tallow wire protocol and transfer logic
//!
//! Defines message formats, transfer pipelines, compression, file manifests,
//! chat protocol, room management, and metadata handling.

#![forbid(unsafe_code)]

pub mod chat;
pub mod compression;
pub mod error;
pub mod kex;
pub mod metadata;
pub mod room;
pub mod transfer;
pub mod wire;

pub use error::ProtocolError;

/// Result type for protocol operations
pub type Result<T> = std::result::Result<T, ProtocolError>;
