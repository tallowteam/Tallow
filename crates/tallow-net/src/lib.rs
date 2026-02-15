//! Network layer for Tallow secure file transfer
//!
//! Provides transport abstractions, NAT traversal, discovery, privacy-preserving
//! networking, relay support, and signaling protocols.

pub mod error;
pub mod transport;
pub mod nat;
pub mod discovery;
pub mod privacy;
pub mod relay;
pub mod signaling;

// Re-exports
pub use error::NetworkError;
pub use transport::Transport;

/// Result type for network operations
pub type Result<T> = std::result::Result<T, NetworkError>;
