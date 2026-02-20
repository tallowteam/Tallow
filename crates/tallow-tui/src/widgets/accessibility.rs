//! Accessibility mode coordination for TUI
//!
//! Provides detection and configuration for accessibility features including
//! screen readers, high contrast mode, reduced motion, and large text.

use std::env;
use std::io::{self, Write};

/// Accessibility mode configuration
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct AccessibilityMode {
    /// Whether a screen reader is actively being used
    pub screen_reader_active: bool,
    /// High contrast mode enabled
    pub high_contrast: bool,
    /// Reduced motion for animations
    pub reduced_motion: bool,
    /// Large text rendering
    pub large_text: bool,
}

impl Default for AccessibilityMode {
    fn default() -> Self {
        Self {
            screen_reader_active: false,
            high_contrast: false,
            reduced_motion: false,
            large_text: false,
        }
    }
}

impl AccessibilityMode {
    /// Create a new accessibility mode with all features disabled
    pub fn new() -> Self {
        Self::default()
    }

    /// Enable all accessibility features
    pub fn full() -> Self {
        Self {
            screen_reader_active: true,
            high_contrast: true,
            reduced_motion: true,
            large_text: true,
        }
    }
}

/// Detect accessibility requirements from environment variables and terminal settings
///
/// Checks the following environment variables:
/// - `TERM_PROGRAM`: Terminal emulator identifier
/// - `ACCESSIBILITY`: Explicit accessibility flag
/// - `SCREEN_READER`: Screen reader active flag
/// - `HIGH_CONTRAST`: High contrast mode flag
/// - `REDUCED_MOTION`: Reduced motion preference
/// - `LARGE_TEXT`: Large text preference
pub fn detect_accessibility() -> AccessibilityMode {
    let screen_reader_active = env::var("SCREEN_READER")
        .unwrap_or_default()
        .eq_ignore_ascii_case("true")
        || env::var("ACCESSIBILITY")
            .unwrap_or_default()
            .eq_ignore_ascii_case("true");

    let high_contrast = env::var("HIGH_CONTRAST")
        .unwrap_or_default()
        .eq_ignore_ascii_case("true")
        || env::var("TERM_PROGRAM")
            .unwrap_or_default()
            .contains("HighContrast");

    let reduced_motion = env::var("REDUCED_MOTION")
        .unwrap_or_default()
        .eq_ignore_ascii_case("true")
        || screen_reader_active; // Screen readers typically prefer reduced motion

    let large_text = env::var("LARGE_TEXT")
        .unwrap_or_default()
        .eq_ignore_ascii_case("true");

    AccessibilityMode {
        screen_reader_active,
        high_contrast,
        reduced_motion,
        large_text,
    }
}

/// Check if text alternatives should be used instead of decorative characters
///
/// Returns true if screen reader is active or high contrast mode is enabled
pub fn should_use_text_alternatives(mode: &AccessibilityMode) -> bool {
    mode.screen_reader_active || mode.high_contrast
}

/// Announce a message for screen reader output
///
/// Writes to stderr with a special prefix that screen readers can detect.
/// This follows accessibility best practices for CLI applications.
///
/// # Examples
///
/// ```no_run
/// use tallow_tui::widgets::accessibility::announce;
///
/// announce("Transfer started");
/// announce("File received successfully");
/// ```
pub fn announce(message: &str) {
    // Write to stderr with ARIA-like prefix for screen readers
    let _ = writeln!(io::stderr(), "[ANNOUNCE] {}", message);
}

/// Announce with explicit role for better screen reader context
pub fn announce_with_role(message: &str, role: &str) {
    let _ = writeln!(io::stderr(), "[ANNOUNCE:{}] {}", role, message);
}

/// Announce an error message
pub fn announce_error(message: &str) {
    announce_with_role(message, "error");
}

/// Announce a success message
pub fn announce_success(message: &str) {
    announce_with_role(message, "success");
}

/// Announce a status update
pub fn announce_status(message: &str) {
    announce_with_role(message, "status");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_accessibility_mode_default() {
        let mode = AccessibilityMode::default();
        assert!(!mode.screen_reader_active);
        assert!(!mode.high_contrast);
        assert!(!mode.reduced_motion);
        assert!(!mode.large_text);
    }

    #[test]
    fn test_accessibility_mode_full() {
        let mode = AccessibilityMode::full();
        assert!(mode.screen_reader_active);
        assert!(mode.high_contrast);
        assert!(mode.reduced_motion);
        assert!(mode.large_text);
    }

    #[test]
    fn test_should_use_text_alternatives() {
        let mode = AccessibilityMode {
            screen_reader_active: true,
            ..Default::default()
        };
        assert!(should_use_text_alternatives(&mode));

        let mode = AccessibilityMode {
            high_contrast: true,
            ..Default::default()
        };
        assert!(should_use_text_alternatives(&mode));

        let mode = AccessibilityMode::default();
        assert!(!should_use_text_alternatives(&mode));
    }
}
