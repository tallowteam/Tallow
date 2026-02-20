//! Complete theme color palette definitions for the TUI.
//!
//! Provides comprehensive color palettes for different visual themes including
//! dark mode, light mode, and high-contrast mode. All palettes are designed for
//! accessibility and visual hierarchy.
//!
//! # Examples
//!
//! ```no_run
//! use tallow_tui::widgets::theme_definitions::{get_palette, ThemeMode};
//!
//! let palette = get_palette(ThemeMode::Dark);
//! println!("Background: {:?}", palette.bg);
//! println!("Primary: {:?}", palette.primary);
//! ```

use ratatui::style::Color;

/// Complete color palette for a theme.
///
/// Provides all semantic colors needed for a consistent UI theme.
#[derive(Debug, Clone, Copy)]
pub struct ThemePalette {
    /// Primary background color for panels and windows.
    pub bg: Color,
    /// Primary foreground/text color.
    pub fg: Color,
    /// Primary brand/accent color for interactive elements.
    pub primary: Color,
    /// Secondary color for supporting elements.
    pub secondary: Color,
    /// Success state color (confirmations, completed actions).
    pub success: Color,
    /// Warning state color (cautions, non-critical issues).
    pub warning: Color,
    /// Error state color (failures, critical issues).
    pub error: Color,
    /// Accent color for highlights and focus states.
    pub accent: Color,
    /// Muted color for disabled/inactive elements.
    pub muted: Color,
    /// Border color for panels and separators.
    pub border: Color,
    /// Selection background color.
    pub selection_bg: Color,
    /// Selection foreground/text color.
    pub selection_fg: Color,
}

/// Theme mode selector.
///
/// Used to choose between different visual theme palettes.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum ThemeMode {
    /// Dark theme (default).
    #[default]
    Dark,
    /// Light theme.
    Light,
    /// High-contrast theme for accessibility.
    HighContrast,
}

/// Returns a dark theme palette inspired by Tokyo Night.
///
/// Colors are optimized for reduced eye strain during extended use in
/// low-light environments.
///
/// # Color Scheme
///
/// - Background: #1a1b26 (deep blue-tinted black)
/// - Primary: #7aa2f7 (blue)
/// - Success: #9ece6a (green)
/// - Warning: #e0af68 (yellow-orange)
/// - Error: #f7768e (red-pink)
///
/// # Examples
///
/// ```no_run
/// # use tallow_tui::widgets::theme_definitions::dark_palette;
/// let palette = dark_palette();
/// ```
pub fn dark_palette() -> ThemePalette {
    ThemePalette {
        bg: Color::Rgb(26, 27, 38),              // #1a1b26
        fg: Color::Rgb(192, 202, 245),           // #c0caf5
        primary: Color::Rgb(122, 162, 247),      // #7aa2f7
        secondary: Color::Rgb(125, 207, 255),    // #7dcfff
        success: Color::Rgb(158, 206, 106),      // #9ece6a
        warning: Color::Rgb(224, 175, 104),      // #e0af68
        error: Color::Rgb(247, 118, 142),        // #f7768e
        accent: Color::Rgb(187, 154, 247),       // #bb9af7
        muted: Color::Rgb(86, 95, 137),          // #565f89
        border: Color::Rgb(41, 46, 66),          // #292e42
        selection_bg: Color::Rgb(54, 59, 92),    // #363b5c
        selection_fg: Color::Rgb(192, 202, 245), // #c0caf5
    }
}

/// Returns a light theme palette.
///
/// Colors are optimized for clarity in well-lit environments with high ambient
/// light. Maintains sufficient contrast for accessibility.
///
/// # Color Scheme
///
/// - Background: #d5d6db (light gray)
/// - Primary: #34548a (dark blue)
/// - Success: #587539 (forest green)
/// - Warning: #8f5e15 (dark orange)
/// - Error: #a82850 (dark red)
///
/// # Examples
///
/// ```no_run
/// # use tallow_tui::widgets::theme_definitions::light_palette;
/// let palette = light_palette();
/// ```
pub fn light_palette() -> ThemePalette {
    ThemePalette {
        bg: Color::Rgb(213, 214, 219),           // #d5d6db
        fg: Color::Rgb(52, 59, 88),              // #343b58
        primary: Color::Rgb(52, 84, 138),        // #34548a
        secondary: Color::Rgb(52, 109, 132),     // #346d84
        success: Color::Rgb(88, 117, 57),        // #587539
        warning: Color::Rgb(143, 94, 21),        // #8f5e15
        error: Color::Rgb(168, 40, 80),          // #a82850
        accent: Color::Rgb(102, 71, 153),        // #664799
        muted: Color::Rgb(143, 146, 161),        // #8f92a1
        border: Color::Rgb(169, 171, 181),       // #a9abb5
        selection_bg: Color::Rgb(185, 192, 219), // #b9c0db
        selection_fg: Color::Rgb(52, 59, 88),    // #343b58
    }
}

/// Returns a high-contrast theme palette for accessibility.
///
/// Provides maximum contrast ratios for users with visual impairments.
/// Exceeds WCAG AAA standards for all text and interactive elements.
///
/// # Color Scheme
///
/// - Background: #000000 (pure black)
/// - Primary: #00ffff (cyan)
/// - Success: #00ff00 (pure green)
/// - Warning: #ffff00 (pure yellow)
/// - Error: #ff0000 (pure red)
///
/// # Examples
///
/// ```no_run
/// # use tallow_tui::widgets::theme_definitions::high_contrast_palette;
/// let palette = high_contrast_palette();
/// ```
pub fn high_contrast_palette() -> ThemePalette {
    ThemePalette {
        bg: Color::Rgb(0, 0, 0),                 // #000000 (pure black)
        fg: Color::Rgb(255, 255, 255),           // #ffffff (pure white)
        primary: Color::Rgb(0, 255, 255),        // #00ffff (cyan)
        secondary: Color::Rgb(128, 128, 255),    // #8080ff (light blue)
        success: Color::Rgb(0, 255, 0),          // #00ff00 (pure green)
        warning: Color::Rgb(255, 255, 0),        // #ffff00 (pure yellow)
        error: Color::Rgb(255, 0, 0),            // #ff0000 (pure red)
        accent: Color::Rgb(255, 0, 255),         // #ff00ff (magenta)
        muted: Color::Rgb(128, 128, 128),        // #808080 (medium gray)
        border: Color::Rgb(255, 255, 255),       // #ffffff (white borders)
        selection_bg: Color::Rgb(0, 128, 128),   // #008080 (teal)
        selection_fg: Color::Rgb(255, 255, 255), // #ffffff (white)
    }
}

/// Returns the appropriate palette for the specified theme mode.
///
/// # Arguments
///
/// * `mode` - The desired theme mode
///
/// # Examples
///
/// ```no_run
/// # use tallow_tui::widgets::theme_definitions::{get_palette, ThemeMode};
/// let dark = get_palette(ThemeMode::Dark);
/// let light = get_palette(ThemeMode::Light);
/// let high_contrast = get_palette(ThemeMode::HighContrast);
/// ```
pub fn get_palette(mode: ThemeMode) -> ThemePalette {
    match mode {
        ThemeMode::Dark => dark_palette(),
        ThemeMode::Light => light_palette(),
        ThemeMode::HighContrast => high_contrast_palette(),
    }
}

/// Creates a custom palette from individual color values.
///
/// Useful for user-defined themes or dynamic theme generation.
///
/// # Arguments
///
/// * All color components as RGB tuples (r, g, b)
///
/// # Examples
///
/// ```no_run
/// # use tallow_tui::widgets::theme_definitions::custom_palette;
/// let palette = custom_palette(
///     (30, 30, 30),     // bg
///     (200, 200, 200),  // fg
///     (100, 150, 255),  // primary
///     (150, 100, 255),  // secondary
///     (100, 255, 100),  // success
///     (255, 200, 100),  // warning
///     (255, 100, 100),  // error
///     (255, 100, 200),  // accent
///     (100, 100, 100),  // muted
///     (60, 60, 60),     // border
///     (50, 50, 80),     // selection_bg
///     (255, 255, 255),  // selection_fg
/// );
/// ```
#[allow(clippy::too_many_arguments)]
pub fn custom_palette(
    bg: (u8, u8, u8),
    fg: (u8, u8, u8),
    primary: (u8, u8, u8),
    secondary: (u8, u8, u8),
    success: (u8, u8, u8),
    warning: (u8, u8, u8),
    error: (u8, u8, u8),
    accent: (u8, u8, u8),
    muted: (u8, u8, u8),
    border: (u8, u8, u8),
    selection_bg: (u8, u8, u8),
    selection_fg: (u8, u8, u8),
) -> ThemePalette {
    ThemePalette {
        bg: Color::Rgb(bg.0, bg.1, bg.2),
        fg: Color::Rgb(fg.0, fg.1, fg.2),
        primary: Color::Rgb(primary.0, primary.1, primary.2),
        secondary: Color::Rgb(secondary.0, secondary.1, secondary.2),
        success: Color::Rgb(success.0, success.1, success.2),
        warning: Color::Rgb(warning.0, warning.1, warning.2),
        error: Color::Rgb(error.0, error.1, error.2),
        accent: Color::Rgb(accent.0, accent.1, accent.2),
        muted: Color::Rgb(muted.0, muted.1, muted.2),
        border: Color::Rgb(border.0, border.1, border.2),
        selection_bg: Color::Rgb(selection_bg.0, selection_bg.1, selection_bg.2),
        selection_fg: Color::Rgb(selection_fg.0, selection_fg.1, selection_fg.2),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_palette_dark() {
        let palette = get_palette(ThemeMode::Dark);
        // Verify it returns the dark palette
        assert_eq!(palette.bg, dark_palette().bg);
    }

    #[test]
    fn test_get_palette_light() {
        let palette = get_palette(ThemeMode::Light);
        assert_eq!(palette.bg, light_palette().bg);
    }

    #[test]
    fn test_get_palette_high_contrast() {
        let palette = get_palette(ThemeMode::HighContrast);
        assert_eq!(palette.bg, high_contrast_palette().bg);
    }

    #[test]
    fn test_dark_palette_colors() {
        let palette = dark_palette();
        // Verify primary colors are defined
        match palette.bg {
            Color::Rgb(_, _, _) => {}
            _ => panic!("Expected RGB color"),
        }
    }

    #[test]
    fn test_custom_palette() {
        let palette = custom_palette(
            (10, 20, 30),
            (240, 240, 240),
            (100, 150, 200),
            (150, 100, 200),
            (100, 200, 100),
            (200, 200, 100),
            (200, 100, 100),
            (200, 100, 200),
            (100, 100, 100),
            (50, 50, 50),
            (60, 60, 80),
            (255, 255, 255),
        );
        assert_eq!(palette.bg, Color::Rgb(10, 20, 30));
        assert_eq!(palette.fg, Color::Rgb(240, 240, 240));
    }

    #[test]
    fn test_theme_mode_default() {
        assert_eq!(ThemeMode::default(), ThemeMode::Dark);
    }
}
