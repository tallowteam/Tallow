//! Unicode braille sparkline widget for Tallow TUI
//!
//! Provides compact data visualization using:
//! - Unicode braille characters (U+2800–U+28FF) for high-resolution graphs
//! - Block character fallback (▁▂▃▄▅▆▇█)
//! - Auto-scaling based on data range
//! - Optional labels and current value display

use ratatui::{
    buffer::Buffer,
    layout::Rect,
    style::{Color, Style},
    text::{Line, Span},
    widgets::{Block, Widget},
};

/// Braille pattern dots for sparkline rendering
///
/// Braille characters are 2x4 dot matrices:
/// ```text
/// ⡀ ⢀
/// ⠠ ⢠
/// ⠄ ⢄
/// ⠁ ⢁
/// ```
const BRAILLE_OFFSET: u32 = 0x2800;

// Dot positions in braille character
const BRAILLE_LEFT: [u8; 4] = [0x01, 0x02, 0x04, 0x40];
const BRAILLE_RIGHT: [u8; 4] = [0x08, 0x10, 0x20, 0x80];

/// Block characters for fallback mode
const BLOCKS: [char; 8] = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

/// Display mode for sparkline
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SparklineMode {
    /// Use Unicode braille characters (2x4 resolution per cell)
    Braille,
    /// Use block characters (8 levels per cell)
    Blocks,
}

/// Unicode sparkline widget
#[derive(Debug, Clone)]
pub struct Sparkline<'a> {
    /// Data points to plot
    data: &'a [f64],
    /// Maximum value for scaling (None = auto-scale)
    max_value: Option<f64>,
    /// Minimum value for scaling (None = auto-scale)
    min_value: Option<f64>,
    /// Label to display before the sparkline
    label: Option<&'a str>,
    /// Current value to display after sparkline
    current_value: Option<&'a str>,
    /// Display mode
    mode: SparklineMode,
    /// Block around the widget
    block: Option<Block<'a>>,
    /// Style for the sparkline
    style: Style,
    /// Style for the label
    label_style: Style,
    /// Style for the value
    value_style: Style,
}

impl<'a> Sparkline<'a> {
    /// Create a new sparkline from data
    pub fn new(data: &'a [f64]) -> Self {
        Self {
            data,
            max_value: None,
            min_value: None,
            label: None,
            current_value: None,
            mode: SparklineMode::Braille,
            block: None,
            style: Style::default().fg(Color::Cyan),
            label_style: Style::default().fg(Color::Gray),
            value_style: Style::default().fg(Color::White),
        }
    }

    /// Set the maximum value for scaling
    pub fn max_value(mut self, max: f64) -> Self {
        self.max_value = Some(max);
        self
    }

    /// Set the minimum value for scaling
    pub fn min_value(mut self, min: f64) -> Self {
        self.min_value = Some(min);
        self
    }

    /// Set both min and max values
    pub fn range(self, min: f64, max: f64) -> Self {
        self.min_value(min).max_value(max)
    }

    /// Set the label
    pub fn label(mut self, label: &'a str) -> Self {
        self.label = Some(label);
        self
    }

    /// Set the current value display
    pub fn current_value(mut self, value: &'a str) -> Self {
        self.current_value = Some(value);
        self
    }

    /// Set display mode
    pub fn mode(mut self, mode: SparklineMode) -> Self {
        self.mode = mode;
        self
    }

    /// Set the block
    pub fn block(mut self, block: Block<'a>) -> Self {
        self.block = Some(block);
        self
    }

    /// Set the sparkline style
    pub fn style(mut self, style: Style) -> Self {
        self.style = style;
        self
    }

    /// Set label style
    pub fn label_style(mut self, style: Style) -> Self {
        self.label_style = style;
        self
    }

    /// Set value style
    pub fn value_style(mut self, style: Style) -> Self {
        self.value_style = style;
        self
    }

    /// Calculate the display range
    fn calculate_range(&self) -> (f64, f64) {
        let min = self.min_value.unwrap_or_else(|| {
            self.data
                .iter()
                .copied()
                .min_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal))
                .unwrap_or(0.0)
        });

        let max = self.max_value.unwrap_or_else(|| {
            self.data
                .iter()
                .copied()
                .max_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal))
                .unwrap_or(1.0)
        });

        // Ensure max > min
        let max = if max <= min { min + 1.0 } else { max };

        (min, max)
    }

    /// Normalize a value to 0.0-1.0 range
    fn normalize(&self, value: f64, min: f64, max: f64) -> f64 {
        if max == min {
            0.5
        } else {
            ((value - min) / (max - min)).clamp(0.0, 1.0)
        }
    }

    /// Generate braille character for two data points
    fn braille_char(&self, left: f64, right: Option<f64>) -> char {
        let mut pattern: u8 = 0;

        // Left column (4 dots)
        let left_height = (left * 3.999).floor() as usize;
        for dot in &BRAILLE_LEFT[..=left_height.min(3)] {
            pattern |= dot;
        }

        // Right column if present
        if let Some(right_val) = right {
            let right_height = (right_val * 3.999).floor() as usize;
            for dot in &BRAILLE_RIGHT[..=right_height.min(3)] {
                pattern |= dot;
            }
        }

        char::from_u32(BRAILLE_OFFSET + pattern as u32).unwrap_or('⠀')
    }

    /// Generate block character for a data point
    fn block_char(&self, value: f64) -> char {
        let index = (value * 7.999).floor() as usize;
        BLOCKS[index.min(7)]
    }

    /// Render the sparkline
    fn render_sparkline(&self, width: usize, min: f64, max: f64) -> String {
        if self.data.is_empty() {
            return String::new();
        }

        match self.mode {
            SparklineMode::Braille => {
                let mut result = String::new();
                let points_per_char = 2;
                let num_chars = (width).min(self.data.len() / points_per_char + 1);

                for i in 0..num_chars {
                    let left_idx = i * points_per_char;
                    let right_idx = left_idx + 1;

                    if left_idx >= self.data.len() {
                        break;
                    }

                    let left = self.normalize(self.data[left_idx], min, max);
                    let right = if right_idx < self.data.len() {
                        Some(self.normalize(self.data[right_idx], min, max))
                    } else {
                        None
                    };

                    result.push(self.braille_char(left, right));
                }

                result
            }
            SparklineMode::Blocks => {
                let step = if self.data.len() > width {
                    self.data.len() / width
                } else {
                    1
                };

                self.data
                    .iter()
                    .step_by(step)
                    .take(width)
                    .map(|&val| {
                        let normalized = self.normalize(val, min, max);
                        self.block_char(normalized)
                    })
                    .collect()
            }
        }
    }
}

impl<'a> Widget for Sparkline<'a> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let area = match self.block {
            Some(ref b) => {
                let inner = b.inner(area);
                b.clone().render(area, buf);
                inner
            }
            None => area,
        };

        if area.width < 3 || area.height < 1 {
            return;
        }

        // Calculate available width for sparkline
        let label_width = self.label.map(|l| l.len() + 1).unwrap_or(0);
        let value_width = self.current_value.map(|v| v.len() + 2).unwrap_or(0);
        let sparkline_width = (area.width as usize).saturating_sub(label_width + value_width);

        if sparkline_width < 2 {
            return;
        }

        // Calculate range and render sparkline
        let (min, max) = self.calculate_range();
        let sparkline_str = self.render_sparkline(sparkline_width, min, max);

        // Build the line
        let mut spans = Vec::new();

        if let Some(label) = self.label {
            spans.push(Span::styled(format!("{} ", label), self.label_style));
        }

        spans.push(Span::styled(sparkline_str, self.style));

        if let Some(value) = self.current_value {
            spans.push(Span::styled(format!("  {}", value), self.value_style));
        }

        let line = Line::from(spans);
        buf.set_line(area.x, area.y, &line, area.width);
    }
}

/// Helper function to format bandwidth values
pub fn format_bandwidth(bytes_per_sec: f64) -> String {
    if bytes_per_sec >= 1_000_000_000.0 {
        format!("{:.1} GB/s", bytes_per_sec / 1_000_000_000.0)
    } else if bytes_per_sec >= 1_000_000.0 {
        format!("{:.1} MB/s", bytes_per_sec / 1_000_000.0)
    } else if bytes_per_sec >= 1_000.0 {
        format!("{:.1} KB/s", bytes_per_sec / 1_000.0)
    } else {
        format!("{:.0} B/s", bytes_per_sec)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sparkline_creation() {
        let data = [1.0, 2.0, 3.0, 4.0, 5.0];
        let sparkline = Sparkline::new(&data);
        assert_eq!(sparkline.data.len(), 5);
    }

    #[test]
    fn test_range_calculation() {
        let data = [1.0, 5.0, 3.0, 7.0, 2.0];
        let sparkline = Sparkline::new(&data);
        let (min, max) = sparkline.calculate_range();
        assert_eq!(min, 1.0);
        assert_eq!(max, 7.0);
    }

    #[test]
    fn test_normalize() {
        let data = [1.0];
        let sparkline = Sparkline::new(&data);
        assert_eq!(sparkline.normalize(1.0, 0.0, 2.0), 0.5);
        assert_eq!(sparkline.normalize(0.0, 0.0, 2.0), 0.0);
        assert_eq!(sparkline.normalize(2.0, 0.0, 2.0), 1.0);
    }

    #[test]
    fn test_format_bandwidth() {
        assert_eq!(format_bandwidth(500.0), "500 B/s");
        assert_eq!(format_bandwidth(1500.0), "1.5 KB/s");
        assert_eq!(format_bandwidth(1_500_000.0), "1.5 MB/s");
        assert_eq!(format_bandwidth(1_500_000_000.0), "1.5 GB/s");
    }

    #[test]
    fn test_braille_char() {
        let data = [0.5];
        let sparkline = Sparkline::new(&data);
        let ch = sparkline.braille_char(1.0, None);
        assert!(ch != '⠀'); // Should not be empty braille
    }

    #[test]
    fn test_block_char() {
        let data = [0.5];
        let sparkline = Sparkline::new(&data);
        assert_eq!(sparkline.block_char(0.0), '▁');
        assert_eq!(sparkline.block_char(1.0), '█');
    }
}
