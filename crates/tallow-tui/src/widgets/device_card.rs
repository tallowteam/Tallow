//! Device card widget.
//!
//! Displays a peer device with platform icon, trust level badge,
//! online status, and cryptographic fingerprint.

use ratatui::prelude::*;
use ratatui::widgets::*;

/// Platform type for a peer device.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Platform {
    /// Linux operating system
    Linux,
    /// macOS operating system
    MacOS,
    /// Windows operating system
    Windows,
    /// Android mobile OS
    Android,
    /// iOS mobile OS
    IOS,
    /// Unknown or unspecified platform
    Unknown,
}

impl Platform {
    /// Returns the emoji icon for this platform.
    pub fn icon(&self) -> &'static str {
        match self {
            Platform::Linux => "🐧",
            Platform::MacOS => "🍎",
            Platform::Windows => "🪟",
            Platform::Android => "🤖",
            Platform::IOS => "📱",
            Platform::Unknown => "💻",
        }
    }

    /// Returns the display name for this platform.
    pub fn name(&self) -> &'static str {
        match self {
            Platform::Linux => "Linux",
            Platform::MacOS => "macOS",
            Platform::Windows => "Windows",
            Platform::Android => "Android",
            Platform::IOS => "iOS",
            Platform::Unknown => "Unknown",
        }
    }
}

/// Trust level for a peer device.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum TrustLevel {
    /// Device has never been seen before
    Unknown,
    /// Device has been seen at least once
    Seen,
    /// Device has been marked as trusted by user
    Trusted,
    /// Device has been cryptographically verified
    Verified,
}

impl TrustLevel {
    /// Returns the emoji icon for this trust level.
    pub fn icon(&self) -> &'static str {
        match self {
            TrustLevel::Unknown => "🔓",
            TrustLevel::Seen => "👁️",
            TrustLevel::Trusted => "🤝",
            TrustLevel::Verified => "✅",
        }
    }

    /// Returns the display name for this trust level.
    pub fn name(&self) -> &'static str {
        match self {
            TrustLevel::Unknown => "Unknown",
            TrustLevel::Seen => "Seen",
            TrustLevel::Trusted => "Trusted",
            TrustLevel::Verified => "Verified",
        }
    }

    /// Returns the color for this trust level.
    pub fn color(&self) -> Color {
        match self {
            TrustLevel::Unknown => Color::Gray,
            TrustLevel::Seen => Color::Yellow,
            TrustLevel::Trusted => Color::Blue,
            TrustLevel::Verified => Color::Green,
        }
    }
}

/// A widget that displays a peer device card.
///
/// Shows device name, platform icon, trust badge, online status, and
/// a truncated cryptographic fingerprint.
///
/// Example output:
/// ```text
/// ┌────────────────────────────┐
/// │ 🍎 Alice's MacBook Pro     │
/// │ ✅ Verified  ● Online      │
/// │ FP: A3F5...B8C2            │
/// └────────────────────────────┘
/// ```
#[derive(Debug, Clone)]
pub struct DeviceCard {
    /// Human-readable device name
    pub name: String,
    /// Operating system platform
    pub platform: Platform,
    /// Trust level for this device
    pub trust_level: TrustLevel,
    /// Whether the device is currently online/reachable
    pub is_online: bool,
    /// Truncated cryptographic fingerprint (e.g., "A3F5...B8C2")
    pub fingerprint_prefix: String,
}

impl DeviceCard {
    /// Creates a new device card widget.
    pub fn new(
        name: impl Into<String>,
        platform: Platform,
        trust_level: TrustLevel,
        is_online: bool,
        fingerprint_prefix: impl Into<String>,
    ) -> Self {
        Self {
            name: name.into(),
            platform,
            trust_level,
            is_online,
            fingerprint_prefix: fingerprint_prefix.into(),
        }
    }

    /// Returns the online status indicator.
    fn status_indicator(&self) -> (&'static str, Color) {
        if self.is_online {
            ("●", Color::Green)
        } else {
            ("○", Color::Gray)
        }
    }

    /// Returns the online status text.
    fn status_text(&self) -> &'static str {
        if self.is_online {
            "Online"
        } else {
            "Offline"
        }
    }

    /// Truncates the device name to fit within a given width.
    fn truncate_name(&self, max_width: usize) -> String {
        // Account for platform icon (2 chars including space)
        let available = max_width.saturating_sub(3);
        let char_count: usize = self.name.chars().count();
        if char_count <= available {
            self.name.clone()
        } else {
            let truncated: String = self
                .name
                .chars()
                .take(available.saturating_sub(3))
                .collect();
            format!("{}...", truncated)
        }
    }
}

impl Widget for DeviceCard {
    fn render(self, area: Rect, buf: &mut Buffer) {
        if area.height < 4 || area.width < 20 {
            return;
        }

        let block = Block::default()
            .borders(Borders::ALL)
            .border_style(Style::default().fg(self.trust_level.color()))
            .border_type(BorderType::Rounded);

        let inner = block.inner(area);
        block.render(area, buf);

        if inner.height < 3 {
            return;
        }

        let mut y = inner.y;

        // Line 1: Platform icon + Device name
        let name_width = (inner.width as usize).saturating_sub(2);
        let display_name = self.truncate_name(name_width);
        let line1 = format!("{} {}", self.platform.icon(), display_name);
        buf.set_string(
            inner.x + 1,
            y,
            &line1,
            Style::default()
                .fg(Color::White)
                .add_modifier(Modifier::BOLD),
        );
        y += 1;

        // Line 2: Trust badge + Online status
        let trust_badge = format!("{} {}", self.trust_level.icon(), self.trust_level.name());
        let (status_icon, status_color) = self.status_indicator();

        let mut x = inner.x + 1;
        // Trust icon and name
        buf.set_string(
            x,
            y,
            &trust_badge,
            Style::default().fg(self.trust_level.color()),
        );
        x += trust_badge.len() as u16 + 2;

        // Status indicator
        buf.set_string(x, y, status_icon, Style::default().fg(status_color));
        x += status_icon.len() as u16 + 1;

        // Status text
        buf.set_string(x, y, self.status_text(), Style::default().fg(Color::Gray));
        y += 1;

        // Line 3: Fingerprint
        let fp_line = format!("FP: {}", self.fingerprint_prefix);
        buf.set_string(
            inner.x + 1,
            y,
            &fp_line,
            Style::default()
                .fg(Color::DarkGray)
                .add_modifier(Modifier::DIM),
        );
    }
}

/// Compact single-line device card variant.
#[derive(Debug, Clone)]
pub struct DeviceCardCompact {
    /// Device information
    pub name: String,
    /// Platform type
    pub platform: Platform,
    /// Trust level
    pub trust_level: TrustLevel,
    /// Online status
    pub is_online: bool,
}

impl DeviceCardCompact {
    /// Creates a new compact device card.
    pub fn new(
        name: impl Into<String>,
        platform: Platform,
        trust_level: TrustLevel,
        is_online: bool,
    ) -> Self {
        Self {
            name: name.into(),
            platform,
            trust_level,
            is_online,
        }
    }

    /// Returns the status indicator.
    fn status_indicator(&self) -> &'static str {
        if self.is_online {
            "●"
        } else {
            "○"
        }
    }
}

impl Widget for DeviceCardCompact {
    fn render(self, area: Rect, buf: &mut Buffer) {
        if area.height == 0 || area.width == 0 {
            return;
        }

        // Format: 🍎 ✅ ● Alice's MacBook
        let status_indicator = self.status_indicator();
        let status_color = if self.is_online {
            Color::Green
        } else {
            Color::Gray
        };

        // Render with different colors for different parts
        let mut x = area.x;

        // Platform icon
        buf.set_string(x, area.y, self.platform.icon(), Style::default());
        x += 2;

        // Trust icon
        buf.set_string(
            x,
            area.y,
            self.trust_level.icon(),
            Style::default().fg(self.trust_level.color()),
        );
        x += 2;

        // Status indicator
        buf.set_string(
            x,
            area.y,
            status_indicator,
            Style::default().fg(status_color),
        );
        x += 2;

        // Device name
        buf.set_string(x, area.y, &self.name, Style::default().fg(Color::White));
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_platform_icon() {
        assert_eq!(Platform::Linux.icon(), "🐧");
        assert_eq!(Platform::MacOS.icon(), "🍎");
        assert_eq!(Platform::Windows.icon(), "🪟");
        assert_eq!(Platform::Android.icon(), "🤖");
        assert_eq!(Platform::IOS.icon(), "📱");
        assert_eq!(Platform::Unknown.icon(), "💻");
    }

    #[test]
    fn test_trust_level_ordering() {
        assert!(TrustLevel::Unknown < TrustLevel::Seen);
        assert!(TrustLevel::Seen < TrustLevel::Trusted);
        assert!(TrustLevel::Trusted < TrustLevel::Verified);
    }

    #[test]
    fn test_trust_level_color() {
        assert_eq!(TrustLevel::Unknown.color(), Color::Gray);
        assert_eq!(TrustLevel::Seen.color(), Color::Yellow);
        assert_eq!(TrustLevel::Trusted.color(), Color::Blue);
        assert_eq!(TrustLevel::Verified.color(), Color::Green);
    }

    #[test]
    fn test_status_indicator() {
        let card = DeviceCard::new("Test", Platform::Linux, TrustLevel::Verified, true, "A3F5");
        let (icon, color) = card.status_indicator();
        assert_eq!(icon, "●");
        assert_eq!(color, Color::Green);

        let card = DeviceCard::new("Test", Platform::Linux, TrustLevel::Verified, false, "A3F5");
        let (icon, color) = card.status_indicator();
        assert_eq!(icon, "○");
        assert_eq!(color, Color::Gray);
    }

    #[test]
    fn test_truncate_name() {
        let card = DeviceCard::new(
            "Very Long Device Name That Should Be Truncated",
            Platform::MacOS,
            TrustLevel::Verified,
            true,
            "A3F5",
        );
        let truncated = card.truncate_name(20);
        assert!(truncated.len() <= 20);
        assert!(truncated.ends_with("..."));
    }
}
