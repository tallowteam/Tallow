//! Transfer pipeline and state management
//!
//! Handles file sending, receiving, chunking, compression,
//! encryption, progress tracking, and resume.

pub mod chunking;
pub mod exclusion;
pub mod manifest;
pub mod progress;
pub mod queue;
pub mod receive;
pub mod resume;
pub mod sanitize;
pub mod send;
pub mod state_machine;
pub mod sync;
pub mod watch;

pub use chunking::{ChunkConfig, DEFAULT_CHUNK_SIZE};
pub use exclusion::ExclusionConfig;
pub use manifest::FileManifest;
pub use progress::TransferProgress;
pub use queue::{QueueHandle, TransferQueue};
pub use receive::ReceivePipeline;
pub use resume::ResumeState;
pub use send::SendPipeline;
pub use state_machine::{TransferState, TransferStateMachine};
pub use watch::{WatchConfig, WatchEvent, WatchHandle};
