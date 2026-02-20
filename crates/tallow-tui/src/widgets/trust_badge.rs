//! Trust badge widget.
//!
//! Renders trust level indicators with appropriate icons and colors.
//! Used to display cryptographic verification status of peer devices.

use ratatui::prelude::*;
use ratatui::widgets::*;

pub use super::device_card::TrustLevel;

/// A widget that renders a trust level badge with icon and label.
///
/// Displays the trust level with appropriate color coding:
/// - Unknown: Gray with 🔓 icon
/// - Seen: Yellow with 👁️ icon
/// - Trusted: Blue with 🤝 icon
/// - Verified: Green with ✅ icon
///
/// Example output:
/// ```text
/// ✅ Verified
/// ```
#[derive(Debug, Clone)]
pub struct TrustBadge {
    /// The trust level to display
    pub level: TrustLevel,
    /// Whether to show the label text alongside the icon
    pub show_label: bool,
}

impl TrustBadge {
    /// Creates a new trust badge widget with label.
    pub fn new(level: TrustLevel) -> Self {
        Self {
            level,
            show_label: true,
        }
    }

    /// Creates a new trust badge widget with only the icon.
    pub fn icon_only(level: TrustLevel) -> Self {
        Self {
            level,
            show_label: false,
        }
    }

    /// Gets the display text for this badge.
    fn display_text(&self) -> String {
        if self.show_label {
            format!("{} {}", self.level.icon(), self.level.name())
        } else {
            self.level.icon().to_string()
        }
    }

    /// Gets the style for this trust level.
    fn style(&self) -> Style {
        Style::default()
            .fg(self.level.color())
            .add_modifier(Modifier::BOLD)
    }
}

impl Widget for TrustBadge {
    fn render(self, area: Rect, buf: &mut Buffer) {
        if area.height == 0 || area.width == 0 {
            return;
        }

        let text = self.display_text();
        let style = self.style();

        buf.set_string(area.x, area.y, text, style);
    }
}

/// A detailed trust badge that includes additional context information.
#[derive(Debug, Clone)]
pub struct TrustBadgeDetailed {
    /// The trust level to display
    pub level: TrustLevel,
    /// Optional verification timestamp (Unix timestamp)
    pub verified_at: Option<u64>,
    /// Optional verifier information
    pub verified_by: Option<String>,
}

impl TrustBadgeDetailed {
    /// Creates a new detailed trust badge.
    pub fn new(level: TrustLevel) -> Self {
        Self {
            level,
            verified_at: None,
            verified_by: None,
        }
    }

    /// Sets the verification timestamp.
    pub fn with_timestamp(mut self, timestamp: u64) -> Self {
        self.verified_at = Some(timestamp);
        self
    }

    /// Sets the verifier information.
    pub fn with_verifier(mut self, verifier: impl Into<String>) -> Self {
        self.verified_by = Some(verifier.into());
        self
    }

    /// Formats the timestamp into a human-readable date.
    fn format_timestamp(&self) -> Option<String> {
        self.verified_at.map(|ts| {
            // Simple formatting - in production would use chrono
            format!("Verified: {}", ts)
        })
    }
}

impl Widget for TrustBadgeDetailed {
    fn render(self, area: Rect, buf: &mut Buffer) {
        if area.height == 0 || area.width == 0 {
            return;
        }

        let block = Block::default()
            .borders(Borders::ALL)
            .border_style(Style::default().fg(self.level.color()))
            .border_type(BorderType::Rounded);

        let inner = block.inner(area);
        block.render(area, buf);

        if inner.height < 1 {
            return;
        }

        let mut y = inner.y;

        // Main trust level badge
        let badge_text = format!("{} {}", self.level.icon(), self.level.name());
        let badge_style = Style::default()
            .fg(self.level.color())
            .add_modifier(Modifier::BOLD);
        buf.set_string(inner.x + 1, y, &badge_text, badge_style);
        y += 1;

        if y >= inner.y + inner.height {
            return;
        }

        // Verified by information
        if let Some(verifier) = &self.verified_by {
            let verifier_text = format!("By: {}", verifier);
            let verifier_style = Style::default().fg(Color::Gray);
            buf.set_string(inner.x + 1, y, &verifier_text, verifier_style);
            y += 1;
        }

        if y >= inner.y + inner.height {
            return;
        }

        // Timestamp information
        if let Some(timestamp_str) = self.format_timestamp() {
            let timestamp_style = Style::default()
                .fg(Color::DarkGray)
                .add_modifier(Modifier::DIM);
            buf.set_string(inner.x + 1, y, &timestamp_str, timestamp_style);
        }
    }
}

/// Trust level indicator bar showing progression.
///
/// Displays a visual progression bar showing the current trust level
/// in the context of all possible levels.
#[derive(Debug, Clone)]
pub struct TrustProgressBar {
    /// Current trust level
    pub current_level: TrustLevel,
}

impl TrustProgressBar {
    /// Creates a new trust progress bar.
    pub fn new(current_level: TrustLevel) -> Self {
        Self { current_level }
    }

    /// Gets the progression index (0-3).
    fn level_index(&self) -> usize {
        match self.current_level {
            TrustLevel::Unknown => 0,
            TrustLevel::Seen => 1,
            TrustLevel::Trusted => 2,
            TrustLevel::Verified => 3,
        }
    }
}

impl Widget for TrustProgressBar {
    fn render(self, area: Rect, buf: &mut Buffer) {
        if area.height == 0 || area.width < 20 {
            return;
        }

        let index = self.level_index();
        let levels = [
            (TrustLevel::Unknown, "Unknown"),
            (TrustLevel::Seen, "Seen"),
            (TrustLevel::Trusted, "Trusted"),
            (TrustLevel::Verified, "Verified"),
        ];

        // Render progress steps
        let step_width = area.width / 4;
        let mut x = area.x;

        for (i, (level, name)) in levels.iter().enumerate() {
            let is_current = i == index;
            let is_achieved = i <= index;

            let icon = level.icon();
            let style = if is_current {
                Style::default()
                    .fg(level.color())
                    .add_modifier(Modifier::BOLD | Modifier::UNDERLINED)
            } else if is_achieved {
                Style::default().fg(level.color())
            } else {
                Style::default().fg(Color::DarkGray)
            };

            let text = format!("{} {}", icon, name);
            buf.set_string(x, area.y, &text, style);

            x += step_width;
        }
    }
}

/// Compact trust badge list showing multiple devices' trust levels.
#[derive(Debug, Clone)]
pub struct TrustBadgeList {
    /// List of trust levels to display
    pub levels: Vec<TrustLevel>,
}

impl TrustBadgeList {
    /// Creates a new trust badge list.
    pub fn new(levels: Vec<TrustLevel>) -> Self {
        Self { levels }
    }

    /// Counts occurrences of each trust level.
    fn count_levels(&self) -> [usize; 4] {
        let mut counts = [0; 4];
        for level in &self.levels {
            let idx = match level {
                TrustLevel::Unknown => 0,
                TrustLevel::Seen => 1,
                TrustLevel::Trusted => 2,
                TrustLevel::Verified => 3,
            };
            counts[idx] += 1;
        }
        counts
    }
}

impl Widget for TrustBadgeList {
    fn render(self, area: Rect, buf: &mut Buffer) {
        if area.height == 0 || area.width == 0 {
            return;
        }

        let counts = self.count_levels();
        let levels = [
            TrustLevel::Unknown,
            TrustLevel::Seen,
            TrustLevel::Trusted,
            TrustLevel::Verified,
        ];

        let mut parts = Vec::new();
        for (level, count) in levels.iter().zip(counts.iter()) {
            if *count > 0 {
                parts.push(format!("{} {}", level.icon(), count));
            }
        }

        let line = parts.join("  ");
        buf.set_string(area.x, area.y, line, Style::default());
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_trust_badge_display_text() {
        let badge = TrustBadge::new(TrustLevel::Verified);
        assert!(badge.display_text().contains("Verified"));
        assert!(badge.display_text().contains(TrustLevel::Verified.icon()));

        let badge_icon_only = TrustBadge::icon_only(TrustLevel::Verified);
        assert_eq!(badge_icon_only.display_text(), TrustLevel::Verified.icon());
    }

    #[test]
    fn test_trust_badge_style() {
        let badge = TrustBadge::new(TrustLevel::Verified);
        let style = badge.style();
        assert_eq!(style.fg, Some(Color::Green));

        let badge = TrustBadge::new(TrustLevel::Unknown);
        let style = badge.style();
        assert_eq!(style.fg, Some(Color::Gray));
    }

    #[test]
    fn test_trust_progress_level_index() {
        let progress = TrustProgressBar::new(TrustLevel::Unknown);
        assert_eq!(progress.level_index(), 0);

        let progress = TrustProgressBar::new(TrustLevel::Seen);
        assert_eq!(progress.level_index(), 1);

        let progress = TrustProgressBar::new(TrustLevel::Trusted);
        assert_eq!(progress.level_index(), 2);

        let progress = TrustProgressBar::new(TrustLevel::Verified);
        assert_eq!(progress.level_index(), 3);
    }

    #[test]
    fn test_trust_badge_list_count() {
        let levels = vec![
            TrustLevel::Verified,
            TrustLevel::Verified,
            TrustLevel::Trusted,
            TrustLevel::Seen,
            TrustLevel::Unknown,
            TrustLevel::Verified,
        ];

        let list = TrustBadgeList::new(levels);
        let counts = list.count_levels();

        assert_eq!(counts[0], 1); // Unknown
        assert_eq!(counts[1], 1); // Seen
        assert_eq!(counts[2], 1); // Trusted
        assert_eq!(counts[3], 3); // Verified
    }

    #[test]
    fn test_detailed_badge_with_timestamp() {
        let badge = TrustBadgeDetailed::new(TrustLevel::Verified).with_timestamp(1234567890);
        assert_eq!(badge.verified_at, Some(1234567890));
    }

    #[test]
    fn test_detailed_badge_with_verifier() {
        let badge = TrustBadgeDetailed::new(TrustLevel::Verified).with_verifier("Alice");
        assert_eq!(badge.verified_by, Some("Alice".to_string()));
    }
}
