//! Speed indicator widget.
//!
//! Displays current, average, and peak transfer speeds with visual indicators.

use ratatui::prelude::*;
use ratatui::widgets::*;

use super::transfer_progress::format_bytes;

/// A widget that displays transfer speed statistics.
///
/// Shows current speed with visual indicator, plus average and peak speeds.
/// Example output:
/// ```text
/// Speed: ↓ 14.2 MB/s  avg 12.8 MB/s  peak 18.1 MB/s
/// ```
#[derive(Debug, Clone, Default)]
pub struct SpeedIndicator {
    /// Current instantaneous transfer speed in bytes per second
    pub current_speed: u64,
    /// Average transfer speed over the session in bytes per second
    pub avg_speed: u64,
    /// Peak transfer speed observed in bytes per second
    pub peak_speed: u64,
}

impl SpeedIndicator {
    /// Creates a new speed indicator widget.
    pub fn new(current_speed: u64, avg_speed: u64, peak_speed: u64) -> Self {
        Self {
            current_speed,
            avg_speed,
            peak_speed,
        }
    }

    /// Returns the appropriate speed indicator arrow based on current vs average speed.
    fn speed_arrow(&self) -> &'static str {
        if self.avg_speed == 0 {
            return "→";
        }

        let ratio = self.current_speed as f64 / self.avg_speed as f64;
        if ratio > 1.2 {
            "↑" // Faster than average
        } else if ratio < 0.8 {
            "↓" // Slower than average
        } else {
            "→" // Around average
        }
    }

    /// Returns the color for the current speed display.
    fn speed_color(&self) -> Color {
        if self.avg_speed == 0 {
            return Color::White;
        }

        let ratio = self.current_speed as f64 / self.avg_speed as f64;
        if ratio > 1.2 {
            Color::Green // Faster than average
        } else if ratio < 0.8 {
            Color::Yellow // Slower than average
        } else {
            Color::Cyan // Around average
        }
    }

    /// Formats the speed display with appropriate unit and precision.
    fn format_speed(speed: u64) -> String {
        format_bytes(speed)
    }
}

impl Widget for SpeedIndicator {
    fn render(self, area: Rect, buf: &mut Buffer) {
        if area.height == 0 || area.width == 0 {
            return;
        }

        let arrow = self.speed_arrow();
        let current = Self::format_speed(self.current_speed);
        let avg = Self::format_speed(self.avg_speed);
        let peak = Self::format_speed(self.peak_speed);

        let _line = format!(
            "Speed: {} {}/s  avg {}/s  peak {}/s",
            arrow, current, avg, peak
        );

        // Render with dynamic color for current speed
        let base_style = Style::default();
        let speed_color = self.speed_color();

        // Render the parts with different styles
        let prefix = "Speed: ";
        let mut x = area.x;

        // "Speed: " in default style
        buf.set_string(x, area.y, prefix, base_style);
        x += prefix.len() as u16;

        // Arrow and current speed in dynamic color
        let current_part = format!("{} {}/s", arrow, current);
        buf.set_string(x, area.y, &current_part, base_style.fg(speed_color));
        x += current_part.len() as u16;

        // Rest in default style
        let rest = format!("  avg {}/s  peak {}/s", avg, peak);
        buf.set_string(x, area.y, rest, base_style.fg(Color::Gray));
    }
}

/// Compact variant of speed indicator showing only current speed.
#[derive(Debug, Clone, Default)]
pub struct SpeedIndicatorCompact {
    /// Current transfer speed in bytes per second
    pub current_speed: u64,
    /// Direction indicator (true for receiving, false for sending)
    pub is_receiving: bool,
}

impl SpeedIndicatorCompact {
    /// Creates a new compact speed indicator.
    pub fn new(current_speed: u64, is_receiving: bool) -> Self {
        Self {
            current_speed,
            is_receiving,
        }
    }

    /// Returns the direction arrow.
    fn direction_arrow(&self) -> &'static str {
        if self.is_receiving {
            "↓"
        } else {
            "↑"
        }
    }

    /// Returns the color based on speed magnitude.
    fn speed_color(&self) -> Color {
        const MB: u64 = 1_048_576;
        match self.current_speed {
            0 => Color::DarkGray,
            s if s < MB => Color::Yellow,     // < 1 MB/s
            s if s < 10 * MB => Color::Cyan,  // 1-10 MB/s
            s if s < 50 * MB => Color::Green, // 10-50 MB/s
            _ => Color::LightGreen,           // > 50 MB/s
        }
    }
}

impl Widget for SpeedIndicatorCompact {
    fn render(self, area: Rect, buf: &mut Buffer) {
        if area.height == 0 || area.width == 0 {
            return;
        }

        let arrow = self.direction_arrow();
        let speed = format_bytes(self.current_speed);
        let line = format!("{} {}/s", arrow, speed);

        let style = Style::default()
            .fg(self.speed_color())
            .add_modifier(Modifier::BOLD);

        buf.set_string(area.x, area.y, line, style);
    }
}

/// A sparkline-style speed graph widget (optional visual enhancement).
#[derive(Debug, Clone)]
pub struct SpeedGraph {
    /// Historical speed samples in bytes per second (most recent last)
    pub samples: Vec<u64>,
    /// Maximum number of samples to display
    pub max_samples: usize,
}

impl SpeedGraph {
    /// Creates a new speed graph widget.
    pub fn new(samples: Vec<u64>, max_samples: usize) -> Self {
        Self {
            samples,
            max_samples,
        }
    }

    /// Gets the display samples (last N samples).
    fn display_samples(&self) -> &[u64] {
        let start = self.samples.len().saturating_sub(self.max_samples);
        &self.samples[start..]
    }
}

impl Widget for SpeedGraph {
    fn render(self, area: Rect, buf: &mut Buffer) {
        if area.height == 0 || area.width == 0 {
            return;
        }

        let samples = self.display_samples();
        if samples.is_empty() {
            return;
        }

        // Create sparkline data
        let data: Vec<u64> = samples.to_vec();
        let sparkline = Sparkline::default()
            .data(&data)
            .style(Style::default().fg(Color::Cyan))
            .max(samples.iter().max().copied().unwrap_or(1));

        sparkline.render(area, buf);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_speed_arrow() {
        let indicator = SpeedIndicator::new(1300, 1000, 1500);
        assert_eq!(indicator.speed_arrow(), "↑"); // 1.3x average (> 1.2)

        let indicator = SpeedIndicator::new(700, 1000, 1500);
        assert_eq!(indicator.speed_arrow(), "↓"); // 0.7x average (< 0.8)

        let indicator = SpeedIndicator::new(950, 1000, 1500);
        assert_eq!(indicator.speed_arrow(), "→"); // ~1.0x average

        let indicator = SpeedIndicator::new(1000, 0, 1500);
        assert_eq!(indicator.speed_arrow(), "→"); // Zero average edge case
    }

    #[test]
    fn test_speed_color() {
        let indicator = SpeedIndicator::new(1300, 1000, 1500);
        assert_eq!(indicator.speed_color(), Color::Green); // 1.3x (> 1.2)

        let indicator = SpeedIndicator::new(700, 1000, 1500);
        assert_eq!(indicator.speed_color(), Color::Yellow); // 0.7x (< 0.8)

        let indicator = SpeedIndicator::new(950, 1000, 1500);
        assert_eq!(indicator.speed_color(), Color::Cyan); // ~1.0x
    }

    #[test]
    fn test_compact_direction() {
        let indicator = SpeedIndicatorCompact::new(1000, true);
        assert_eq!(indicator.direction_arrow(), "↓");

        let indicator = SpeedIndicatorCompact::new(1000, false);
        assert_eq!(indicator.direction_arrow(), "↑");
    }

    #[test]
    fn test_compact_color() {
        let indicator = SpeedIndicatorCompact::new(0, true);
        assert_eq!(indicator.speed_color(), Color::DarkGray);

        let indicator = SpeedIndicatorCompact::new(500_000, true);
        assert_eq!(indicator.speed_color(), Color::Yellow);

        let indicator = SpeedIndicatorCompact::new(5_000_000, true);
        assert_eq!(indicator.speed_color(), Color::Cyan);

        let indicator = SpeedIndicatorCompact::new(20_000_000, true);
        assert_eq!(indicator.speed_color(), Color::Green);

        let indicator = SpeedIndicatorCompact::new(60_000_000, true);
        assert_eq!(indicator.speed_color(), Color::LightGreen);
    }
}
