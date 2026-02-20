//! Post-transfer summary widget.
//!
//! Displays a summary box with statistics after a transfer completes,
//! including total size, elapsed time, average speed, compression ratio, and file count.

use ratatui::prelude::*;
use ratatui::widgets::*;

use super::transfer_progress::{format_bytes, format_duration};

/// A widget that renders a post-transfer summary with statistics.
///
/// Displays comprehensive transfer statistics in a bordered box.
/// Example output:
/// ```text
/// ┌─ Transfer Complete ─────────────────────────┐
/// │ Files:       15 files                       │
/// │ Total Size:  245.8 MB (compressed: 187.2 MB)│
/// │ Elapsed:     1m 23s                         │
/// │ Avg Speed:   17.8 MB/s                      │
/// │ Compression: 23.8% reduction                │
/// └─────────────────────────────────────────────┘
/// ```
#[derive(Debug, Clone)]
pub struct TransferSummary {
    /// Total bytes transferred (uncompressed)
    pub total_bytes: u64,
    /// Total elapsed time in seconds
    pub elapsed_secs: u64,
    /// Average transfer speed in bytes per second
    pub avg_speed: u64,
    /// Compression ratio (0.0-1.0, where 0.8 means 80% of original size)
    pub compression_ratio: f64,
    /// Number of files transferred
    pub files_count: usize,
}

impl TransferSummary {
    /// Creates a new transfer summary widget.
    pub fn new(
        total_bytes: u64,
        elapsed_secs: u64,
        avg_speed: u64,
        compression_ratio: f64,
        files_count: usize,
    ) -> Self {
        Self {
            total_bytes,
            elapsed_secs,
            avg_speed,
            compression_ratio,
            files_count,
        }
    }

    /// Calculates compressed size in bytes.
    fn compressed_bytes(&self) -> u64 {
        (self.total_bytes as f64 * self.compression_ratio) as u64
    }

    /// Calculates compression percentage reduction.
    fn compression_percent(&self) -> f64 {
        (1.0 - self.compression_ratio) * 100.0
    }

    /// Determines if compression was used (ratio != 1.0).
    fn has_compression(&self) -> bool {
        (self.compression_ratio - 1.0).abs() > 0.001
    }
}

impl Widget for TransferSummary {
    fn render(self, area: Rect, buf: &mut Buffer) {
        if area.height < 7 || area.width < 40 {
            // Not enough space for full summary
            return;
        }

        let block = Block::default()
            .title("Transfer Complete")
            .borders(Borders::ALL)
            .border_style(Style::default().fg(Color::Green))
            .border_type(BorderType::Rounded);

        let inner = block.inner(area);
        block.render(area, buf);

        // Prepare content lines
        let files_line = format!("Files:       {} files", self.files_count);

        let size_line = if self.has_compression() {
            let compressed = format_bytes(self.compressed_bytes());
            let total = format_bytes(self.total_bytes);
            format!("Total Size:  {} (compressed: {})", total, compressed)
        } else {
            format!("Total Size:  {}", format_bytes(self.total_bytes))
        };

        let elapsed_line = format!("Elapsed:     {}", format_duration(self.elapsed_secs));
        let speed_line = format!("Avg Speed:   {}/s", format_bytes(self.avg_speed));

        let compression_line = if self.has_compression() {
            format!("Compression: {:.1}% reduction", self.compression_percent())
        } else {
            "Compression: None".to_string()
        };

        // Render content lines
        let content_style = Style::default().fg(Color::White);
        let mut y = inner.y;

        buf.set_string(inner.x + 1, y, &files_line, content_style);
        y += 1;

        buf.set_string(inner.x + 1, y, &size_line, content_style);
        y += 1;

        buf.set_string(inner.x + 1, y, &elapsed_line, content_style);
        y += 1;

        buf.set_string(inner.x + 1, y, &speed_line, content_style);
        y += 1;

        buf.set_string(inner.x + 1, y, &compression_line, content_style);
    }
}

/// Compact single-line transfer summary variant.
#[derive(Debug, Clone)]
pub struct TransferSummaryCompact {
    /// Total bytes transferred
    pub total_bytes: u64,
    /// Total elapsed time in seconds
    pub elapsed_secs: u64,
    /// Number of files transferred
    pub files_count: usize,
}

impl TransferSummaryCompact {
    /// Creates a new compact transfer summary.
    pub fn new(total_bytes: u64, elapsed_secs: u64, files_count: usize) -> Self {
        Self {
            total_bytes,
            elapsed_secs,
            files_count,
        }
    }

    /// Calculates average speed in bytes per second.
    fn avg_speed(&self) -> u64 {
        if self.elapsed_secs == 0 {
            return 0;
        }
        self.total_bytes / self.elapsed_secs
    }
}

impl Widget for TransferSummaryCompact {
    fn render(self, area: Rect, buf: &mut Buffer) {
        if area.height == 0 || area.width == 0 {
            return;
        }

        let file_plural = if self.files_count == 1 {
            "file"
        } else {
            "files"
        };
        let avg_speed = format_bytes(self.avg_speed());
        let total_size = format_bytes(self.total_bytes);
        let elapsed = format_duration(self.elapsed_secs);

        let line = format!(
            "✅ {} {}  {}  {}/s avg  in {}",
            self.files_count, file_plural, total_size, avg_speed, elapsed
        );

        let style = Style::default()
            .fg(Color::Green)
            .add_modifier(Modifier::BOLD);
        buf.set_string(area.x, area.y, line, style);
    }
}

/// Transfer summary with error information.
#[derive(Debug, Clone)]
pub struct TransferSummaryWithErrors {
    /// Base summary information
    pub summary: TransferSummary,
    /// Number of files that failed to transfer
    pub failed_files: usize,
    /// Number of files that were skipped
    pub skipped_files: usize,
}

impl TransferSummaryWithErrors {
    /// Creates a new transfer summary with error information.
    pub fn new(summary: TransferSummary, failed_files: usize, skipped_files: usize) -> Self {
        Self {
            summary,
            failed_files,
            skipped_files,
        }
    }

    /// Determines overall status color based on errors.
    fn status_color(&self) -> Color {
        if self.failed_files > 0 {
            Color::Red
        } else if self.skipped_files > 0 {
            Color::Yellow
        } else {
            Color::Green
        }
    }

    /// Gets the status title based on errors.
    fn status_title(&self) -> &'static str {
        if self.failed_files > 0 {
            "Transfer Complete (with errors)"
        } else if self.skipped_files > 0 {
            "Transfer Complete (with warnings)"
        } else {
            "Transfer Complete"
        }
    }
}

impl Widget for TransferSummaryWithErrors {
    fn render(self, area: Rect, buf: &mut Buffer) {
        if area.height < 9 || area.width < 40 {
            return;
        }

        let block = Block::default()
            .title(self.status_title())
            .borders(Borders::ALL)
            .border_style(Style::default().fg(self.status_color()))
            .border_type(BorderType::Rounded);

        let inner = block.inner(area);
        block.render(area, buf);

        // Render base summary lines
        let files_line = format!("Files:       {} files", self.summary.files_count);
        let size_line = format!("Total Size:  {}", format_bytes(self.summary.total_bytes));
        let elapsed_line = format!(
            "Elapsed:     {}",
            format_duration(self.summary.elapsed_secs)
        );
        let speed_line = format!("Avg Speed:   {}/s", format_bytes(self.summary.avg_speed));

        // Error lines
        let failed_line = if self.failed_files > 0 {
            format!("Failed:      {} files", self.failed_files)
        } else {
            String::new()
        };

        let skipped_line = if self.skipped_files > 0 {
            format!("Skipped:     {} files", self.skipped_files)
        } else {
            String::new()
        };

        let content_style = Style::default().fg(Color::White);
        let error_style = Style::default().fg(Color::Red);
        let warning_style = Style::default().fg(Color::Yellow);

        let mut y = inner.y;

        buf.set_string(inner.x + 1, y, &files_line, content_style);
        y += 1;

        buf.set_string(inner.x + 1, y, &size_line, content_style);
        y += 1;

        buf.set_string(inner.x + 1, y, &elapsed_line, content_style);
        y += 1;

        buf.set_string(inner.x + 1, y, &speed_line, content_style);
        y += 1;

        if !failed_line.is_empty() {
            buf.set_string(inner.x + 1, y, &failed_line, error_style);
            y += 1;
        }

        if !skipped_line.is_empty() {
            buf.set_string(inner.x + 1, y, &skipped_line, warning_style);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compressed_bytes() {
        let summary = TransferSummary::new(1000, 10, 100, 0.8, 5);
        assert_eq!(summary.compressed_bytes(), 800);
    }

    #[test]
    fn test_compression_percent() {
        let summary = TransferSummary::new(1000, 10, 100, 0.8, 5);
        assert!((summary.compression_percent() - 20.0).abs() < 0.001);

        let summary = TransferSummary::new(1000, 10, 100, 0.5, 5);
        assert!((summary.compression_percent() - 50.0).abs() < 0.001);
    }

    #[test]
    fn test_has_compression() {
        let summary = TransferSummary::new(1000, 10, 100, 0.8, 5);
        assert!(summary.has_compression());

        let summary = TransferSummary::new(1000, 10, 100, 1.0, 5);
        assert!(!summary.has_compression());
    }

    #[test]
    fn test_compact_avg_speed() {
        let summary = TransferSummaryCompact::new(10000, 10, 5);
        assert_eq!(summary.avg_speed(), 1000);

        let summary = TransferSummaryCompact::new(10000, 0, 5);
        assert_eq!(summary.avg_speed(), 0);
    }

    #[test]
    fn test_status_color() {
        let base = TransferSummary::new(1000, 10, 100, 1.0, 5);
        let summary = TransferSummaryWithErrors::new(base.clone(), 0, 0);
        assert_eq!(summary.status_color(), Color::Green);

        let summary = TransferSummaryWithErrors::new(base.clone(), 0, 2);
        assert_eq!(summary.status_color(), Color::Yellow);

        let summary = TransferSummaryWithErrors::new(base, 1, 0);
        assert_eq!(summary.status_color(), Color::Red);
    }
}
