//! File receiving pipeline

use crate::Result;
use std::path::Path;

/// Receive pipeline for file transfers
#[derive(Debug)]
pub struct ReceivePipeline {
    #[allow(dead_code)]
    transfer_id: String,
    #[allow(dead_code)]
    output_dir: std::path::PathBuf,
}

impl ReceivePipeline {
    /// Create a new receive pipeline
    pub fn new(transfer_id: String, output_dir: impl AsRef<Path>) -> Self {
        Self {
            transfer_id,
            output_dir: output_dir.as_ref().to_path_buf(),
        }
    }

    /// Start receiving files
    pub async fn start(&mut self) -> Result<()> {
        todo!("Implement receive pipeline")
    }
}
