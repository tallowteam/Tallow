//! Network quality indicator widget for Tallow TUI
//!
//! Displays real-time network metrics:
//! - Latency (ping time) with color coding
//! - Packet loss percentage
//! - Jitter (latency variation)
//! - Connection quality rating

use ratatui::{
    buffer::Buffer,
    layout::Rect,
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Paragraph, Widget},
};

/// Network quality metrics
#[derive(Debug, Clone, Copy)]
pub struct NetworkMetrics {
    /// Latency in milliseconds
    pub latency_ms: f64,
    /// Packet loss percentage (0.0-100.0)
    pub packet_loss_pct: f64,
    /// Jitter in milliseconds
    pub jitter_ms: f64,
}

impl NetworkMetrics {
    /// Create new network metrics
    pub fn new(latency_ms: f64, packet_loss_pct: f64, jitter_ms: f64) -> Self {
        Self {
            latency_ms,
            packet_loss_pct: packet_loss_pct.clamp(0.0, 100.0),
            jitter_ms,
        }
    }

    /// Create default "no data" metrics
    pub fn none() -> Self {
        Self {
            latency_ms: 0.0,
            packet_loss_pct: 0.0,
            jitter_ms: 0.0,
        }
    }

    /// Get latency color based on thresholds
    pub fn latency_color(&self) -> Color {
        if self.latency_ms < 50.0 {
            Color::Green // Excellent
        } else if self.latency_ms < 100.0 {
            Color::Yellow // Good
        } else if self.latency_ms < 200.0 {
            Color::Rgb(255, 165, 0) // Orange - Fair
        } else {
            Color::Red // Poor
        }
    }

    /// Get packet loss color
    pub fn loss_color(&self) -> Color {
        if self.packet_loss_pct < 0.5 {
            Color::Green
        } else if self.packet_loss_pct < 2.0 {
            Color::Yellow
        } else if self.packet_loss_pct < 5.0 {
            Color::Rgb(255, 165, 0)
        } else {
            Color::Red
        }
    }

    /// Get jitter color
    pub fn jitter_color(&self) -> Color {
        if self.jitter_ms < 10.0 {
            Color::Green
        } else if self.jitter_ms < 30.0 {
            Color::Yellow
        } else {
            Color::Red
        }
    }

    /// Get overall quality rating
    pub fn quality_rating(&self) -> QualityRating {
        // Weighted scoring
        let latency_score = if self.latency_ms < 50.0 {
            100
        } else if self.latency_ms < 100.0 {
            80
        } else if self.latency_ms < 200.0 {
            50
        } else {
            20
        };

        let loss_score = if self.packet_loss_pct < 0.5 {
            100
        } else if self.packet_loss_pct < 2.0 {
            75
        } else if self.packet_loss_pct < 5.0 {
            40
        } else {
            10
        };

        let jitter_score = if self.jitter_ms < 10.0 {
            100
        } else if self.jitter_ms < 30.0 {
            70
        } else {
            30
        };

        // Weighted average (latency 50%, loss 30%, jitter 20%)
        let overall = (latency_score * 50 + loss_score * 30 + jitter_score * 20) / 100;

        match overall {
            90..=100 => QualityRating::Excellent,
            70..=89 => QualityRating::Good,
            50..=69 => QualityRating::Fair,
            30..=49 => QualityRating::Poor,
            _ => QualityRating::Critical,
        }
    }
}

impl Default for NetworkMetrics {
    fn default() -> Self {
        Self::none()
    }
}

/// Overall network quality rating
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum QualityRating {
    /// 90-100: Excellent connection
    Excellent,
    /// 70-89: Good connection
    Good,
    /// 50-69: Fair connection
    Fair,
    /// 30-49: Poor connection
    Poor,
    /// 0-29: Critical connection issues
    Critical,
}

impl QualityRating {
    /// Get the display string
    pub fn as_str(&self) -> &'static str {
        match self {
            QualityRating::Excellent => "Excellent",
            QualityRating::Good => "Good",
            QualityRating::Fair => "Fair",
            QualityRating::Poor => "Poor",
            QualityRating::Critical => "Critical",
        }
    }

    /// Get the color
    pub fn color(&self) -> Color {
        match self {
            QualityRating::Excellent => Color::Green,
            QualityRating::Good => Color::Cyan,
            QualityRating::Fair => Color::Yellow,
            QualityRating::Poor => Color::Rgb(255, 165, 0),
            QualityRating::Critical => Color::Red,
        }
    }

    /// Get the indicator emoji/symbol
    pub fn indicator(&self) -> &'static str {
        match self {
            QualityRating::Excellent => "●●●●●",
            QualityRating::Good => "●●●●○",
            QualityRating::Fair => "●●●○○",
            QualityRating::Poor => "●●○○○",
            QualityRating::Critical => "●○○○○",
        }
    }
}

/// Network quality display widget
pub struct NetworkQuality<'a> {
    /// Network metrics to display
    metrics: NetworkMetrics,
    /// Block around the widget
    block: Option<Block<'a>>,
    /// Show detailed view (if false, show compact)
    detailed: bool,
    /// Show quality rating
    show_rating: bool,
}

impl<'a> NetworkQuality<'a> {
    /// Create a new network quality widget
    pub fn new(metrics: NetworkMetrics) -> Self {
        Self {
            metrics,
            block: None,
            detailed: false,
            show_rating: true,
        }
    }

    /// Set the block
    pub fn block(mut self, block: Block<'a>) -> Self {
        self.block = Some(block);
        self
    }

    /// Set detailed mode
    pub fn detailed(mut self, detailed: bool) -> Self {
        self.detailed = detailed;
        self
    }

    /// Set whether to show quality rating
    pub fn show_rating(mut self, show: bool) -> Self {
        self.show_rating = show;
        self
    }

    /// Build compact view line
    fn build_compact_line(&self) -> Line<'a> {
        let mut spans = vec![
            Span::raw("Latency: "),
            Span::styled(
                format!("{:.0}ms", self.metrics.latency_ms),
                Style::default()
                    .fg(self.metrics.latency_color())
                    .add_modifier(Modifier::BOLD),
            ),
            Span::raw("  Loss: "),
            Span::styled(
                format!("{:.1}%", self.metrics.packet_loss_pct),
                Style::default()
                    .fg(self.metrics.loss_color())
                    .add_modifier(Modifier::BOLD),
            ),
            Span::raw("  Jitter: "),
            Span::styled(
                format!("{:.0}ms", self.metrics.jitter_ms),
                Style::default()
                    .fg(self.metrics.jitter_color())
                    .add_modifier(Modifier::BOLD),
            ),
        ];

        if self.show_rating {
            let rating = self.metrics.quality_rating();
            spans.push(Span::raw("  "));
            spans.push(Span::styled(
                rating.indicator(),
                Style::default().fg(rating.color()),
            ));
        }

        Line::from(spans)
    }

    /// Build detailed view lines
    fn build_detailed_lines(&self) -> Vec<Line<'a>> {
        let mut lines = vec![
            Line::from(vec![
                Span::raw("Latency:     "),
                Span::styled(
                    format!("{:.1} ms", self.metrics.latency_ms),
                    Style::default()
                        .fg(self.metrics.latency_color())
                        .add_modifier(Modifier::BOLD),
                ),
            ]),
            Line::from(vec![
                Span::raw("Packet Loss: "),
                Span::styled(
                    format!("{:.2}%", self.metrics.packet_loss_pct),
                    Style::default()
                        .fg(self.metrics.loss_color())
                        .add_modifier(Modifier::BOLD),
                ),
            ]),
            Line::from(vec![
                Span::raw("Jitter:      "),
                Span::styled(
                    format!("{:.1} ms", self.metrics.jitter_ms),
                    Style::default()
                        .fg(self.metrics.jitter_color())
                        .add_modifier(Modifier::BOLD),
                ),
            ]),
        ];

        if self.show_rating {
            let rating = self.metrics.quality_rating();
            lines.push(Line::from(Span::raw(""))); // Blank line
            lines.push(Line::from(vec![
                Span::raw("Quality: "),
                Span::styled(
                    rating.indicator(),
                    Style::default().fg(rating.color()),
                ),
                Span::raw(" "),
                Span::styled(
                    rating.as_str(),
                    Style::default()
                        .fg(rating.color())
                        .add_modifier(Modifier::BOLD),
                ),
            ]));
        }

        lines
    }
}

impl<'a> Widget for NetworkQuality<'a> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let inner = if let Some(ref block) = self.block {
            let i = block.inner(area);
            block.clone().render(area, buf);
            i
        } else {
            area
        };

        if inner.width < 10 || inner.height < 1 {
            return;
        }

        let paragraph = if self.detailed {
            Paragraph::new(self.build_detailed_lines())
        } else {
            Paragraph::new(self.build_compact_line())
        };

        paragraph.render(inner, buf);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_metrics_creation() {
        let metrics = NetworkMetrics::new(42.5, 0.1, 3.2);
        assert_eq!(metrics.latency_ms, 42.5);
        assert_eq!(metrics.packet_loss_pct, 0.1);
        assert_eq!(metrics.jitter_ms, 3.2);
    }

    #[test]
    fn test_latency_colors() {
        assert_eq!(
            NetworkMetrics::new(30.0, 0.0, 0.0).latency_color(),
            Color::Green
        );
        assert_eq!(
            NetworkMetrics::new(75.0, 0.0, 0.0).latency_color(),
            Color::Yellow
        );
        assert_eq!(
            NetworkMetrics::new(250.0, 0.0, 0.0).latency_color(),
            Color::Red
        );
    }

    #[test]
    fn test_quality_rating() {
        let excellent = NetworkMetrics::new(20.0, 0.1, 2.0);
        assert_eq!(excellent.quality_rating(), QualityRating::Excellent);

        let poor = NetworkMetrics::new(150.0, 4.0, 35.0);
        assert_eq!(poor.quality_rating(), QualityRating::Poor);
    }

    #[test]
    fn test_packet_loss_clamping() {
        let metrics = NetworkMetrics::new(50.0, 150.0, 5.0);
        assert_eq!(metrics.packet_loss_pct, 100.0);

        let metrics = NetworkMetrics::new(50.0, -10.0, 5.0);
        assert_eq!(metrics.packet_loss_pct, 0.0);
    }

    #[test]
    fn test_quality_rating_display() {
        assert_eq!(QualityRating::Excellent.as_str(), "Excellent");
        assert_eq!(QualityRating::Poor.as_str(), "Poor");
    }

    #[test]
    fn test_quality_indicators() {
        assert_eq!(QualityRating::Excellent.indicator(), "●●●●●");
        assert_eq!(QualityRating::Critical.indicator(), "●○○○○");
    }
}
