//! Transfer pipeline and state management
//!
//! Handles file sending, receiving, chunking, compression,
//! encryption, progress tracking, and resume.

pub mod chunking;
pub mod manifest;
pub mod progress;
pub mod receive;
pub mod resume;
pub mod send;
pub mod state_machine;

pub use chunking::{ChunkConfig, DEFAULT_CHUNK_SIZE};
pub use manifest::FileManifest;
pub use progress::TransferProgress;
pub use receive::ReceivePipeline;
pub use resume::ResumeState;
pub use send::SendPipeline;
pub use state_machine::{TransferState, TransferStateMachine};
