//! File sending pipeline

use crate::Result;
use std::path::Path;

/// Send pipeline for file transfers
#[derive(Debug)]
pub struct SendPipeline {
    #[allow(dead_code)]
    transfer_id: String,
}

impl SendPipeline {
    /// Create a new send pipeline
    pub fn new(transfer_id: String) -> Self {
        Self { transfer_id }
    }

    /// Start sending files
    pub async fn start(&mut self, _files: &[impl AsRef<Path>]) -> Result<()> {
        todo!("Implement send pipeline")
    }
}
