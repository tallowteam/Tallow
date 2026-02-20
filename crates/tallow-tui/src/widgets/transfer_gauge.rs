//! Overall transfer gauge widget.
//!
//! Displays aggregate progress across all files being transferred,
//! including file count, total bytes, and average speed.

use ratatui::prelude::*;
#[allow(unused_imports)]
use ratatui::widgets::*;

use super::transfer_progress::{format_bytes, format_duration};

/// A widget that renders overall transfer progress across multiple files.
///
/// Displays aggregate statistics including file count, total progress bar,
/// percentage, and average speed.
/// Example output:
/// ```text
/// Overall: 2/3 files  [████████████████░░░░] 78%  12.8 MB/s avg
/// ```
#[derive(Debug, Clone)]
pub struct TransferGauge {
    /// Number of files completed
    pub completed_files: usize,
    /// Total number of files being transferred
    pub total_files: usize,
    /// Total bytes transferred across all files
    pub bytes_done: u64,
    /// Total bytes to transfer across all files
    pub bytes_total: u64,
    /// Average transfer speed in bytes per second
    pub avg_speed: u64,
}

impl TransferGauge {
    /// Creates a new transfer gauge widget.
    pub fn new(
        completed_files: usize,
        total_files: usize,
        bytes_done: u64,
        bytes_total: u64,
        avg_speed: u64,
    ) -> Self {
        Self {
            completed_files,
            total_files,
            bytes_done,
            bytes_total,
            avg_speed,
        }
    }

    /// Calculates the overall progress percentage (0-100).
    fn progress_percent(&self) -> u8 {
        if self.bytes_total == 0 {
            return 0;
        }
        ((self.bytes_done as f64 / self.bytes_total as f64) * 100.0) as u8
    }

    /// Renders the progress bar using Unicode block characters.
    fn render_progress_bar(&self, width: u16) -> String {
        const BLOCKS: &[char] = &['▏', '▎', '▍', '▌', '▋', '▊', '▉', '█'];
        const EMPTY: char = '░';

        if width == 0 || self.bytes_total == 0 {
            return String::new();
        }

        let progress = self.bytes_done as f64 / self.bytes_total as f64;
        let filled_width = progress * width as f64;
        let full_blocks = filled_width.floor() as usize;
        let remainder = filled_width - filled_width.floor();

        let mut bar = String::with_capacity(width as usize);

        // Full blocks
        for _ in 0..full_blocks.min(width as usize) {
            bar.push('█');
        }

        // Partial block
        if full_blocks < width as usize && remainder > 0.0 {
            let block_index = ((remainder * 8.0).floor() as usize).min(7);
            bar.push(BLOCKS[block_index]);
        }

        // Empty blocks
        while bar.len() < width as usize {
            bar.push(EMPTY);
        }

        bar
    }

    /// Calculates estimated time remaining based on average speed.
    fn eta_seconds(&self) -> u64 {
        if self.avg_speed == 0 || self.bytes_done >= self.bytes_total {
            return 0;
        }
        let bytes_remaining = self.bytes_total.saturating_sub(self.bytes_done);
        bytes_remaining / self.avg_speed
    }
}

impl Widget for TransferGauge {
    fn render(self, area: Rect, buf: &mut Buffer) {
        if area.height == 0 || area.width == 0 {
            return;
        }

        // Format: Overall: 2/3 files  [progress_bar] 78%  12.8 MB/s avg  ETA 5m
        let percent = self.progress_percent();
        let speed_str = format_bytes(self.avg_speed);
        let eta = self.eta_seconds();
        let eta_str = if eta > 0 {
            format!("  ETA {}", format_duration(eta))
        } else {
            String::new()
        };

        // Calculate space for progress bar
        let file_count = format!("{}/{}", self.completed_files, self.total_files);
        // "Overall: " (9) + file_count + " files  [" (9) + bar + "] " (2) + "100%" (4) + "  " (2) + speed + " avg" (4) + eta
        let overhead = 9 + file_count.len() + 9 + 2 + 4 + 2 + 4;
        let speed_len = speed_str.len();
        let eta_len = eta_str.len();
        let used_space = overhead + speed_len + eta_len;

        let bar_width = if used_space < area.width as usize {
            (area.width as usize - used_space).max(20)
        } else {
            20
        };

        let progress_bar = self.render_progress_bar(bar_width as u16);

        let line = format!(
            "Overall: {} files  [{}] {:3}%  {}/s avg{}",
            file_count, progress_bar, percent, speed_str, eta_str
        );

        let style = Style::default()
            .fg(Color::Green)
            .add_modifier(Modifier::BOLD);
        buf.set_string(area.x, area.y, line, style);
    }
}

/// Widget variant that shows completion status instead of progress.
#[derive(Debug, Clone)]
pub struct TransferGaugeComplete {
    /// Total number of files transferred
    pub total_files: usize,
    /// Total bytes transferred
    pub total_bytes: u64,
    /// Total elapsed time in seconds
    pub elapsed_seconds: u64,
}

impl TransferGaugeComplete {
    /// Creates a new completed transfer gauge.
    pub fn new(total_files: usize, total_bytes: u64, elapsed_seconds: u64) -> Self {
        Self {
            total_files,
            total_bytes,
            elapsed_seconds,
        }
    }

    /// Calculates average speed in bytes per second.
    fn avg_speed(&self) -> u64 {
        if self.elapsed_seconds == 0 {
            return 0;
        }
        self.total_bytes / self.elapsed_seconds
    }
}

impl Widget for TransferGaugeComplete {
    fn render(self, area: Rect, buf: &mut Buffer) {
        if area.height == 0 || area.width == 0 {
            return;
        }

        let avg_speed = format_bytes(self.avg_speed());
        let total_size = format_bytes(self.total_bytes);
        let elapsed = format_duration(self.elapsed_seconds);

        let line = format!(
            "✅ Complete: {} files ({})  {} avg  in {}",
            self.total_files, total_size, avg_speed, elapsed
        );

        let style = Style::default()
            .fg(Color::Green)
            .add_modifier(Modifier::BOLD);
        buf.set_string(area.x, area.y, line, style);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_progress_percent() {
        let gauge = TransferGauge::new(1, 3, 500, 1000, 100);
        assert_eq!(gauge.progress_percent(), 50);

        let gauge = TransferGauge::new(0, 3, 0, 1000, 0);
        assert_eq!(gauge.progress_percent(), 0);

        let gauge = TransferGauge::new(3, 3, 1000, 1000, 100);
        assert_eq!(gauge.progress_percent(), 100);
    }

    #[test]
    fn test_eta_calculation() {
        let gauge = TransferGauge::new(1, 3, 5000, 10000, 1000); // 5000 bytes remaining at 1000 B/s
        assert_eq!(gauge.eta_seconds(), 5);

        let gauge = TransferGauge::new(1, 3, 10000, 10000, 1000); // Complete
        assert_eq!(gauge.eta_seconds(), 0);

        let gauge = TransferGauge::new(1, 3, 5000, 10000, 0); // No speed
        assert_eq!(gauge.eta_seconds(), 0);
    }

    #[test]
    fn test_complete_avg_speed() {
        let gauge = TransferGaugeComplete::new(3, 10000, 10); // 10000 bytes in 10 seconds
        assert_eq!(gauge.avg_speed(), 1000);

        let gauge = TransferGaugeComplete::new(3, 10000, 0); // Zero time
        assert_eq!(gauge.avg_speed(), 0);
    }
}
