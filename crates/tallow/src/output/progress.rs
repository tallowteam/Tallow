//! Progress bar for transfers using indicatif

use indicatif::{ProgressBar, ProgressStyle};

/// Transfer progress bar wrapper
pub struct TransferProgressBar {
    bar: ProgressBar,
}

impl TransferProgressBar {
    /// Create a new progress bar for a transfer
    pub fn new(total_bytes: u64) -> Self {
        let bar = ProgressBar::new(total_bytes);
        bar.set_style(
            ProgressStyle::default_bar()
                .template("{spinner:.green} [{elapsed_precise}] [{bar:40.cyan/blue}] {bytes}/{total_bytes} ({bytes_per_sec}, {eta})")
                .unwrap_or_else(|_| ProgressStyle::default_bar())
                .progress_chars("=> "),
        );

        Self { bar }
    }

    /// Update progress to the given byte count
    pub fn update(&self, bytes_transferred: u64) {
        self.bar.set_position(bytes_transferred);
    }

    /// Mark the progress bar as complete
    pub fn finish(&self) {
        self.bar.finish_with_message("done");
    }

    /// Mark the progress bar as failed
    pub fn abandon(&self, msg: &str) {
        self.bar.abandon_with_message(msg.to_string());
    }

    /// Set a message on the progress bar
    pub fn set_message(&self, msg: &str) {
        self.bar.set_message(msg.to_string());
    }
}

impl std::fmt::Debug for TransferProgressBar {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("TransferProgressBar")
            .field("position", &self.bar.position())
            .field("length", &self.bar.length())
            .finish()
    }
}
