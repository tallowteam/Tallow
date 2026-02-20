//! Per-file transfer progress bar widget.
//!
//! Displays a single file's transfer progress with filename, progress bar,
//! percentage, speed, and ETA. Uses Unicode block characters for sub-character
//! precision in the progress bar.

use ratatui::prelude::*;
#[allow(unused_imports)]
use ratatui::widgets::*;

/// A widget that renders per-file transfer progress.
///
/// Displays a progress bar with file name, transfer stats, speed, and ETA.
/// Example output:
/// ```text
/// 📄 report.pdf  [████████░░░░] 62%  14.2 MB/s  ETA 3s
/// ```
#[derive(Debug, Clone)]
pub struct TransferProgressWidget {
    /// Name of the file being transferred
    pub file_name: String,
    /// Number of bytes transferred so far
    pub bytes_transferred: u64,
    /// Total size of the file in bytes
    pub total_bytes: u64,
    /// Current transfer speed in bytes per second
    pub speed_bytes_per_sec: u64,
    /// Estimated time remaining in seconds
    pub eta_seconds: u64,
}

impl TransferProgressWidget {
    /// Creates a new transfer progress widget.
    pub fn new(
        file_name: impl Into<String>,
        bytes_transferred: u64,
        total_bytes: u64,
        speed_bytes_per_sec: u64,
        eta_seconds: u64,
    ) -> Self {
        Self {
            file_name: file_name.into(),
            bytes_transferred,
            total_bytes,
            speed_bytes_per_sec,
            eta_seconds,
        }
    }

    /// Calculates the progress percentage (0-100).
    fn progress_percent(&self) -> u8 {
        if self.total_bytes == 0 {
            return 0;
        }
        ((self.bytes_transferred as f64 / self.total_bytes as f64) * 100.0) as u8
    }

    /// Renders the progress bar with Unicode block characters for precision.
    fn render_progress_bar(&self, width: u16) -> String {
        const BLOCKS: &[char] = &['▏', '▎', '▍', '▌', '▋', '▊', '▉', '█'];
        const EMPTY: char = '░';

        if width == 0 || self.total_bytes == 0 {
            return String::new();
        }

        let progress = self.bytes_transferred as f64 / self.total_bytes as f64;
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
}

impl Widget for TransferProgressWidget {
    fn render(self, area: Rect, buf: &mut Buffer) {
        if area.height == 0 || area.width == 0 {
            return;
        }

        // Format: 📄 filename  [progress_bar] 62%  14.2 MB/s  ETA 3s
        let percent = self.progress_percent();
        let speed_str = format_bytes(self.speed_bytes_per_sec);
        let eta_str = format_duration(self.eta_seconds);

        // Calculate space for progress bar
        // Format breakdown: "📄 " (3) + filename + "  [" (3) + bar + "] " (2) + "100%" (4) + "  " (2) + speed + "  ETA " (6) + eta
        let overhead = 3 + 3 + 2 + 4 + 2 + 6;
        let filename_display = if self.file_name.len() > 30 {
            format!("{}...", &self.file_name[..27])
        } else {
            self.file_name.clone()
        };

        let speed_eta_len = speed_str.len() + eta_str.len();
        let used_space = overhead + filename_display.len() + speed_eta_len;
        let bar_width = if used_space < area.width as usize {
            (area.width as usize - used_space).max(10)
        } else {
            10
        };

        let progress_bar = self.render_progress_bar(bar_width as u16);

        let line = format!(
            "📄 {}  [{}] {:3}%  {}/s  ETA {}",
            filename_display, progress_bar, percent, speed_str, eta_str
        );

        let style = Style::default().fg(Color::Cyan);
        buf.set_string(area.x, area.y, line, style);
    }
}

/// Formats bytes into human-readable format (KB, MB, GB, etc.).
///
/// # Examples
/// ```
/// use tallow_tui::widgets::transfer_progress::format_bytes;
/// assert_eq!(format_bytes(1024), "1.0 KB");
/// assert_eq!(format_bytes(1_048_576), "1.0 MB");
/// ```
pub fn format_bytes(bytes: u64) -> String {
    const UNITS: &[&str] = &["B", "KB", "MB", "GB", "TB", "PB"];

    if bytes == 0 {
        return "0 B".to_string();
    }

    let bytes_f64 = bytes as f64;
    let exponent = (bytes_f64.log10() / 1024_f64.log10()).floor() as usize;
    let exponent = exponent.min(UNITS.len() - 1);

    let value = bytes_f64 / 1024_f64.powi(exponent as i32);
    let unit = UNITS[exponent];

    if value >= 100.0 {
        format!("{:.0} {}", value, unit)
    } else {
        format!("{:.1} {}", value, unit)
    }
}

/// Formats duration in seconds into human-readable format.
///
/// # Examples
/// ```
/// use tallow_tui::widgets::transfer_progress::format_duration;
/// assert_eq!(format_duration(3), "3s");
/// assert_eq!(format_duration(90), "1m 30s");
/// assert_eq!(format_duration(3661), "1h 1m");
/// ```
pub fn format_duration(secs: u64) -> String {
    if secs < 60 {
        format!("{}s", secs)
    } else if secs < 3600 {
        let mins = secs / 60;
        let remaining_secs = secs % 60;
        if remaining_secs > 0 {
            format!("{}m {}s", mins, remaining_secs)
        } else {
            format!("{}m", mins)
        }
    } else {
        let hours = secs / 3600;
        let mins = (secs % 3600) / 60;
        if mins > 0 {
            format!("{}h {}m", hours, mins)
        } else {
            format!("{}h", hours)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_bytes() {
        assert_eq!(format_bytes(0), "0 B");
        assert_eq!(format_bytes(512), "512 B");
        assert_eq!(format_bytes(1024), "1.0 KB");
        assert_eq!(format_bytes(1_048_576), "1.0 MB");
        assert_eq!(format_bytes(1_073_741_824), "1.0 GB");
    }

    #[test]
    fn test_format_duration() {
        assert_eq!(format_duration(0), "0s");
        assert_eq!(format_duration(30), "30s");
        assert_eq!(format_duration(60), "1m");
        assert_eq!(format_duration(90), "1m 30s");
        assert_eq!(format_duration(3600), "1h");
        assert_eq!(format_duration(3661), "1h 1m");
    }

    #[test]
    fn test_progress_percent() {
        let widget = TransferProgressWidget::new("test.txt", 500, 1000, 100, 5);
        assert_eq!(widget.progress_percent(), 50);

        let widget = TransferProgressWidget::new("test.txt", 0, 1000, 0, 10);
        assert_eq!(widget.progress_percent(), 0);

        let widget = TransferProgressWidget::new("test.txt", 1000, 1000, 100, 0);
        assert_eq!(widget.progress_percent(), 100);
    }
}
