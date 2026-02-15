//! Progress bar for transfers

/// Transfer progress bar wrapper
#[derive(Debug)]
pub struct TransferProgressBar {
    #[allow(dead_code)]
    total_bytes: u64,
}

impl TransferProgressBar {
    /// Create a new progress bar
    pub fn new(total_bytes: u64) -> Self {
        Self { total_bytes }
    }

    /// Update progress
    pub fn update(&mut self, _bytes_transferred: u64) {
        // Would use indicatif crate
    }

    /// Finish and clear
    pub fn finish(&mut self) {
        // Would finish indicatif progress bar
    }
}
