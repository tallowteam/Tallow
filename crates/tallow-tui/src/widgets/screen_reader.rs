//! Screen reader output and announcement system
//!
//! Provides text descriptions for TUI state changes that can be consumed
//! by screen readers or accessibility tools.

use std::collections::VecDeque;

/// Verbosity level for screen reader announcements
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Verbosity {
    /// Brief announcements, minimal context
    Brief,
    /// Normal announcements with context
    Normal,
    /// Verbose announcements with full details
    Verbose,
}

impl Default for Verbosity {
    fn default() -> Self {
        Self::Normal
    }
}

/// Screen reader output management
#[derive(Debug, Clone)]
pub struct ScreenReaderOutput {
    /// Pending announcements to be read
    announcements: VecDeque<String>,
    /// Verbosity level for announcements
    verbosity: Verbosity,
    /// Maximum number of queued announcements
    max_queue_size: usize,
}

impl Default for ScreenReaderOutput {
    fn default() -> Self {
        Self::new()
    }
}

impl ScreenReaderOutput {
    /// Create a new screen reader output manager
    pub fn new() -> Self {
        Self {
            announcements: VecDeque::new(),
            verbosity: Verbosity::Normal,
            max_queue_size: 50,
        }
    }

    /// Create with specific verbosity
    pub fn with_verbosity(verbosity: Verbosity) -> Self {
        Self {
            announcements: VecDeque::new(),
            verbosity,
            max_queue_size: 50,
        }
    }

    /// Set the verbosity level
    pub fn set_verbosity(&mut self, verbosity: Verbosity) {
        self.verbosity = verbosity;
    }

    /// Queue an announcement
    fn queue_announcement(&mut self, message: String) {
        if self.announcements.len() >= self.max_queue_size {
            self.announcements.pop_front();
        }
        self.announcements.push_back(message);
    }

    /// Announce transfer progress
    ///
    /// # Examples
    ///
    /// ```
    /// use tallow_tui::widgets::screen_reader::ScreenReaderOutput;
    ///
    /// let mut sr = ScreenReaderOutput::new();
    /// sr.announce_transfer_progress("report.pdf", 62, "14 MB/s");
    /// ```
    pub fn announce_transfer_progress(&mut self, file: &str, pct: u8, speed: &str) {
        let message = match self.verbosity {
            Verbosity::Brief => format!("{} {}%", file, pct),
            Verbosity::Normal => format!("{} {} percent, {}", file, pct, speed),
            Verbosity::Verbose => format!(
                "Transfer progress: {} at {} percent complete, transferring at {}",
                file, pct, speed
            ),
        };
        self.queue_announcement(message);
    }

    /// Announce device discovery
    ///
    /// # Examples
    ///
    /// ```
    /// use tallow_tui::widgets::screen_reader::ScreenReaderOutput;
    ///
    /// let mut sr = ScreenReaderOutput::new();
    /// sr.announce_device_discovered("MacBook Pro", "macOS", true);
    /// ```
    pub fn announce_device_discovered(&mut self, name: &str, platform: &str, trusted: bool) {
        let trust_status = if trusted { "trusted" } else { "untrusted" };
        let message = match self.verbosity {
            Verbosity::Brief => format!("Device: {}", name),
            Verbosity::Normal => format!("New device: {}, {}, {}", name, platform, trust_status),
            Verbosity::Verbose => format!(
                "New device discovered: {} running {}, marked as {}",
                name, platform, trust_status
            ),
        };
        self.queue_announcement(message);
    }

    /// Announce navigation between items
    ///
    /// # Examples
    ///
    /// ```
    /// use tallow_tui::widgets::screen_reader::ScreenReaderOutput;
    ///
    /// let mut sr = ScreenReaderOutput::new();
    /// sr.announce_navigation("photos.zip", 3, 10);
    /// ```
    pub fn announce_navigation(&mut self, item: &str, position: usize, total: usize) {
        let message = match self.verbosity {
            Verbosity::Brief => item.to_string(),
            Verbosity::Normal => format!("Item {} of {}: {}", position, total, item),
            Verbosity::Verbose => format!(
                "Navigated to item {} of {} total items: {}",
                position, total, item
            ),
        };
        self.queue_announcement(message);
    }

    /// Announce transfer completion
    pub fn announce_transfer_complete(&mut self, file: &str, size: &str) {
        let message = match self.verbosity {
            Verbosity::Brief => format!("{} complete", file),
            Verbosity::Normal => format!("Transfer complete: {}, {}", file, size),
            Verbosity::Verbose => format!(
                "File transfer completed successfully: {} with total size {}",
                file, size
            ),
        };
        self.queue_announcement(message);
    }

    /// Announce transfer error
    pub fn announce_transfer_error(&mut self, file: &str, error: &str) {
        let message = match self.verbosity {
            Verbosity::Brief => format!("Error: {}", file),
            Verbosity::Normal => format!("Transfer failed: {}, {}", file, error),
            Verbosity::Verbose => format!(
                "File transfer encountered an error: {} failed with reason: {}",
                file, error
            ),
        };
        self.queue_announcement(message);
    }

    /// Announce connection status change
    pub fn announce_connection_status(&mut self, device: &str, connected: bool) {
        let status = if connected {
            "connected"
        } else {
            "disconnected"
        };
        let message = match self.verbosity {
            Verbosity::Brief => format!("{} {}", device, status),
            Verbosity::Normal => format!("Device {} {}", device, status),
            Verbosity::Verbose => format!("Connection status changed: {} is now {}", device, status),
        };
        self.queue_announcement(message);
    }

    /// Announce encryption status
    pub fn announce_encryption_status(&mut self, active: bool) {
        let message = match self.verbosity {
            Verbosity::Brief => {
                if active {
                    "Encrypted"
                } else {
                    "Unencrypted"
                }
                .to_string()
            }
            Verbosity::Normal => {
                if active {
                    "Connection is encrypted"
                } else {
                    "Connection is not encrypted"
                }
                .to_string()
            }
            Verbosity::Verbose => {
                if active {
                    "Secure encrypted connection established using post-quantum cryptography"
                        .to_string()
                } else {
                    "Warning: Connection is not encrypted, data may be visible to others"
                        .to_string()
                }
            }
        };
        self.queue_announcement(message);
    }

    /// Announce mode change
    pub fn announce_mode_change(&mut self, mode: &str) {
        let message = match self.verbosity {
            Verbosity::Brief => mode.to_string(),
            Verbosity::Normal => format!("Switched to {} mode", mode),
            Verbosity::Verbose => format!("Application mode changed to {}", mode),
        };
        self.queue_announcement(message);
    }

    /// Flush all pending announcements and return them
    ///
    /// This drains the internal queue and returns all pending messages.
    pub fn flush_announcements(&mut self) -> Vec<String> {
        self.announcements.drain(..).collect()
    }

    /// Get the current number of pending announcements
    pub fn pending_count(&self) -> usize {
        self.announcements.len()
    }

    /// Clear all pending announcements without returning them
    pub fn clear(&mut self) {
        self.announcements.clear();
    }

    /// Peek at the next announcement without removing it
    pub fn peek(&self) -> Option<&String> {
        self.announcements.front()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_screen_reader_output_new() {
        let sr = ScreenReaderOutput::new();
        assert_eq!(sr.pending_count(), 0);
        assert_eq!(sr.verbosity, Verbosity::Normal);
    }

    #[test]
    fn test_announce_transfer_progress() {
        let mut sr = ScreenReaderOutput::new();
        sr.announce_transfer_progress("test.pdf", 50, "10 MB/s");
        assert_eq!(sr.pending_count(), 1);
        let announcements = sr.flush_announcements();
        assert_eq!(announcements.len(), 1);
        assert!(announcements[0].contains("test.pdf"));
        assert!(announcements[0].contains("50"));
    }

    #[test]
    fn test_announce_device_discovered() {
        let mut sr = ScreenReaderOutput::new();
        sr.announce_device_discovered("iPhone", "iOS", true);
        assert_eq!(sr.pending_count(), 1);
        let announcements = sr.flush_announcements();
        assert!(announcements[0].contains("iPhone"));
        assert!(announcements[0].contains("iOS"));
        assert!(announcements[0].contains("trusted"));
    }

    #[test]
    fn test_announce_navigation() {
        let mut sr = ScreenReaderOutput::new();
        sr.announce_navigation("file.txt", 5, 10);
        let announcements = sr.flush_announcements();
        assert!(announcements[0].contains("5"));
        assert!(announcements[0].contains("10"));
        assert!(announcements[0].contains("file.txt"));
    }

    #[test]
    fn test_verbosity_levels() {
        let mut sr = ScreenReaderOutput::with_verbosity(Verbosity::Brief);
        sr.announce_transfer_progress("test.pdf", 50, "10 MB/s");
        let brief = sr.flush_announcements();

        sr.set_verbosity(Verbosity::Verbose);
        sr.announce_transfer_progress("test.pdf", 50, "10 MB/s");
        let verbose = sr.flush_announcements();

        assert!(brief[0].len() < verbose[0].len());
    }

    #[test]
    fn test_max_queue_size() {
        let mut sr = ScreenReaderOutput::new();
        for i in 0..100 {
            sr.announce_transfer_progress(&format!("file{}.txt", i), 50, "10 MB/s");
        }
        assert!(sr.pending_count() <= sr.max_queue_size);
    }
}
