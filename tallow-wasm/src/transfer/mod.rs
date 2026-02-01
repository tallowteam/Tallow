//! High-performance file transfer operations
//!
//! Provides:
//! - Fast file chunking
//! - Parallel hash verification
//! - Encrypted transfer sessions

pub mod chunker;
pub mod hasher;
pub mod session;

// Re-export main interfaces
pub use chunker::*;
pub use hasher::*;
pub use session::*;
