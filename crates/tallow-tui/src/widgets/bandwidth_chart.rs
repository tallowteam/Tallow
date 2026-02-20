//! Multi-line bandwidth/throughput chart for Tallow TUI
//!
//! Provides time-series visualization with:
//! - Auto-scaled Y-axis (KB/s, MB/s, GB/s)
//! - Time-based X-axis
//! - Multiple data series support
//! - Grid lines and labels

use ratatui::{
    buffer::Buffer,
    layout::Rect,
    style::{Color, Style},
    symbols,
    text::Span,
    widgets::{Axis, Block, Chart, Dataset, GraphType, Widget},
};

/// Data point for bandwidth chart (timestamp, value)
pub type DataPoint = (f64, f64);

/// Bandwidth chart widget
#[derive(Debug, Clone)]
pub struct BandwidthChart<'a> {
    /// Data points as (time_seconds, bytes_per_second)
    data_points: &'a [DataPoint],
    /// Chart title
    title: Option<&'a str>,
    /// Time window in seconds (for X-axis)
    time_window: f64,
    /// Block around the widget
    block: Option<Block<'a>>,
    /// Style for the chart
    style: Style,
    /// Color for the line
    line_color: Color,
    /// Show grid lines
    show_grid: bool,
}

impl<'a> BandwidthChart<'a> {
    /// Create a new bandwidth chart
    pub fn new(data_points: &'a [DataPoint]) -> Self {
        Self {
            data_points,
            title: None,
            time_window: 60.0, // Default: last 60 seconds
            block: None,
            style: Style::default(),
            line_color: Color::Cyan,
            show_grid: true,
        }
    }

    /// Set the chart title
    pub fn title(mut self, title: &'a str) -> Self {
        self.title = Some(title);
        self
    }

    /// Set the time window in seconds
    pub fn time_window(mut self, seconds: f64) -> Self {
        self.time_window = seconds;
        self
    }

    /// Set the block
    pub fn block(mut self, block: Block<'a>) -> Self {
        self.block = Some(block);
        self
    }

    /// Set the style
    pub fn style(mut self, style: Style) -> Self {
        self.style = style;
        self
    }

    /// Set line color
    pub fn line_color(mut self, color: Color) -> Self {
        self.line_color = color;
        self
    }

    /// Set whether to show grid
    pub fn show_grid(mut self, show: bool) -> Self {
        self.show_grid = show;
        self
    }

    /// Calculate Y-axis bounds and label
    fn calculate_y_bounds(&self) -> (f64, f64, String) {
        if self.data_points.is_empty() {
            return (0.0, 100.0, "B/s".to_string());
        }

        let max_value = self
            .data_points
            .iter()
            .map(|(_, v)| *v)
            .max_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal))
            .unwrap_or(0.0);

        // Add 10% headroom
        let max = max_value * 1.1;

        // Determine scale
        let (scale, unit) = if max >= 1_000_000_000.0 {
            (1_000_000_000.0, "GB/s")
        } else if max >= 1_000_000.0 {
            (1_000_000.0, "MB/s")
        } else if max >= 1_000.0 {
            (1_000.0, "KB/s")
        } else {
            (1.0, "B/s")
        };

        let max_scaled = (max / scale).ceil();

        (0.0, max_scaled * scale, unit.to_string())
    }

    /// Calculate X-axis bounds based on time window
    fn calculate_x_bounds(&self) -> (f64, f64) {
        if self.data_points.is_empty() {
            return (0.0, self.time_window);
        }

        let max_time = self
            .data_points
            .iter()
            .map(|(t, _)| *t)
            .max_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal))
            .unwrap_or(0.0);

        let min_time = (max_time - self.time_window).max(0.0);

        (min_time, max_time)
    }

    /// Format Y-axis labels
    fn format_y_label(&self, value: f64, unit: &str) -> String {
        let scale = match unit {
            "GB/s" => 1_000_000_000.0,
            "MB/s" => 1_000_000.0,
            "KB/s" => 1_000.0,
            _ => 1.0,
        };

        let scaled = value / scale;
        if scaled >= 100.0 {
            format!("{:.0}", scaled)
        } else if scaled >= 10.0 {
            format!("{:.1}", scaled)
        } else {
            format!("{:.2}", scaled)
        }
    }

    /// Generate Y-axis labels
    fn y_axis_labels(&self, min: f64, max: f64, unit: &str) -> Vec<Span<'a>> {
        let steps = 5;
        let step = (max - min) / steps as f64;

        (0..=steps)
            .map(|i| {
                let value = min + step * i as f64;
                let label = self.format_y_label(value, unit);
                Span::styled(label, Style::default().fg(Color::Gray))
            })
            .collect()
    }

    /// Generate X-axis labels (time)
    fn x_axis_labels(&self, min: f64, max: f64) -> Vec<Span<'a>> {
        let range = max - min;
        let steps = 5;
        let step = range / steps as f64;

        (0..=steps)
            .map(|i| {
                let time = min + step * i as f64;
                let label = if range > 3600.0 {
                    format!("{:.1}h", time / 3600.0)
                } else if range > 60.0 {
                    format!("{:.0}m", time / 60.0)
                } else {
                    format!("{:.0}s", time)
                };
                Span::styled(label, Style::default().fg(Color::Gray))
            })
            .collect()
    }

    /// Filter data points to visible window
    fn filter_data(&self, min_time: f64, max_time: f64) -> Vec<DataPoint> {
        self.data_points
            .iter()
            .filter(|(t, _)| *t >= min_time && *t <= max_time)
            .copied()
            .collect()
    }
}

impl<'a> Widget for BandwidthChart<'a> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        if area.width < 20 || area.height < 10 {
            // Too small to render
            if let Some(block) = self.block {
                block.render(area, buf);
            }
            return;
        }

        // Calculate bounds
        let (y_min, y_max, y_unit) = self.calculate_y_bounds();
        let (x_min, x_max) = self.calculate_x_bounds();

        // Filter data to visible window
        let visible_data = self.filter_data(x_min, x_max);

        // Create dataset
        let dataset = Dataset::default()
            .name("Throughput")
            .marker(symbols::Marker::Braille)
            .graph_type(GraphType::Line)
            .style(Style::default().fg(self.line_color))
            .data(&visible_data);

        // Create axes
        let y_labels = self.y_axis_labels(y_min, y_max, &y_unit);
        let x_labels = self.x_axis_labels(x_min, x_max);

        let y_axis = Axis::default()
            .title(Span::styled(
                y_unit,
                Style::default().fg(Color::White),
            ))
            .style(Style::default().fg(Color::Gray))
            .bounds([y_min, y_max])
            .labels(y_labels);

        let x_axis = Axis::default()
            .title(Span::styled("Time", Style::default().fg(Color::White)))
            .style(Style::default().fg(Color::Gray))
            .bounds([x_min, x_max])
            .labels(x_labels);

        // Create chart
        let mut chart = Chart::new(vec![dataset])
            .x_axis(x_axis)
            .y_axis(y_axis)
            .style(self.style);

        if let Some(block) = self.block {
            chart = chart.block(block);
        }

        chart.render(area, buf);
    }
}

/// Helper to create sample data for testing
pub fn generate_sample_data(duration: f64, frequency: f64) -> Vec<DataPoint> {
    let num_points = (duration * frequency) as usize;
    (0..num_points)
        .map(|i| {
            let t = i as f64 / frequency;
            let value = 5_000_000.0 * (1.0 + (t * 0.5).sin()) * (1.0 + (t * 0.1).cos());
            (t, value)
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_chart_creation() {
        let data = vec![(0.0, 100.0), (1.0, 200.0), (2.0, 150.0)];
        let chart = BandwidthChart::new(&data);
        assert_eq!(chart.data_points.len(), 3);
        assert_eq!(chart.time_window, 60.0);
    }

    #[test]
    fn test_y_bounds_calculation() {
        let data = vec![
            (0.0, 500.0),
            (1.0, 1_500.0),
            (2.0, 2_500_000.0),
        ];
        let chart = BandwidthChart::new(&data);
        let (min, max, unit) = chart.calculate_y_bounds();
        assert_eq!(min, 0.0);
        assert!(max > 2_500_000.0); // Should have headroom
        assert_eq!(unit, "MB/s");
    }

    #[test]
    fn test_x_bounds_calculation() {
        let data = vec![
            (0.0, 100.0),
            (30.0, 200.0),
            (60.0, 150.0),
        ];
        let chart = BandwidthChart::new(&data);
        let (min, max) = chart.calculate_x_bounds();
        assert_eq!(min, 0.0);
        assert_eq!(max, 60.0);
    }

    #[test]
    fn test_data_filtering() {
        let data = vec![
            (0.0, 100.0),
            (30.0, 200.0),
            (60.0, 150.0),
            (90.0, 180.0),
        ];
        let chart = BandwidthChart::new(&data).time_window(60.0);
        let filtered = chart.filter_data(30.0, 90.0);
        assert_eq!(filtered.len(), 3); // Should exclude first point
    }

    #[test]
    fn test_format_y_label() {
        let data = vec![(0.0, 100.0)];
        let chart = BandwidthChart::new(&data);

        assert_eq!(chart.format_y_label(1_500.0, "KB/s"), "1.50");
        assert_eq!(chart.format_y_label(1_500_000.0, "KB/s"), "1500");
        assert_eq!(chart.format_y_label(1_500_000.0, "MB/s"), "1.50");
    }

    #[test]
    fn test_generate_sample_data() {
        let data = generate_sample_data(10.0, 2.0);
        assert_eq!(data.len(), 20); // 10 seconds * 2 Hz
        assert!(data[0].1 > 0.0); // Should have positive values
    }
}
