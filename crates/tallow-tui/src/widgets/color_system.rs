//! Terminal color capability detection and adaptation system.
//!
//! This module provides color capability detection based on environment variables
//! and automatically downgrades colors for terminals with limited color support.
//!
//! # Examples
//!
//! ```no_run
//! use tallow_tui::widgets::color_system::{detect_color_capability, adapt_color};
//! use ratatui::style::Color;
//!
//! let capability = detect_color_capability();
//! let true_color = Color::Rgb(123, 45, 67);
//! let adapted = adapt_color(true_color, capability);
//! ```

use ratatui::style::Color;
use std::env;

/// Terminal color capability levels.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ColorCapability {
    /// Basic 16-color ANSI support (3/4-bit).
    Basic16,
    /// Extended 256-color support (8-bit).
    Extended256,
    /// True color 24-bit RGB support.
    TrueColor,
}

/// Detects the terminal's color capability based on environment variables.
///
/// Checks `NO_COLOR`, `COLORTERM`, and `TERM` environment variables in order:
/// - `NO_COLOR` set: returns `Basic16` with minimal colors
/// - `COLORTERM=truecolor|24bit`: returns `TrueColor`
/// - `TERM` contains `256color`: returns `Extended256`
/// - Otherwise: returns `Basic16`
///
/// # Examples
///
/// ```no_run
/// # use tallow_tui::widgets::color_system::{detect_color_capability, ColorCapability};
/// let capability = detect_color_capability();
/// match capability {
///     ColorCapability::TrueColor => println!("24-bit color support"),
///     ColorCapability::Extended256 => println!("256-color support"),
///     ColorCapability::Basic16 => println!("16-color support"),
/// }
/// ```
pub fn detect_color_capability() -> ColorCapability {
    // Respect NO_COLOR environment variable (https://no-color.org)
    if env::var("NO_COLOR").is_ok() {
        return ColorCapability::Basic16;
    }

    // Check COLORTERM for truecolor support
    if let Ok(colorterm) = env::var("COLORTERM") {
        let colorterm_lower = colorterm.to_lowercase();
        if colorterm_lower.contains("truecolor") || colorterm_lower.contains("24bit") {
            return ColorCapability::TrueColor;
        }
    }

    // Check TERM for 256color support
    if let Ok(term) = env::var("TERM") {
        if term.contains("256color") {
            return ColorCapability::Extended256;
        }
    }

    // Default to basic 16-color support
    ColorCapability::Basic16
}

/// Adapts a color to the specified terminal capability.
///
/// Downgrades colors from higher bit-depth to lower when necessary:
/// - TrueColor RGB → 256-color palette → 16-color ANSI
///
/// # Arguments
///
/// * `color` - The original color to adapt
/// * `capability` - Target color capability level
///
/// # Examples
///
/// ```no_run
/// # use tallow_tui::widgets::color_system::{adapt_color, ColorCapability};
/// # use ratatui::style::Color;
/// let original = Color::Rgb(123, 45, 67);
/// let adapted = adapt_color(original, ColorCapability::Extended256);
/// ```
pub fn adapt_color(color: Color, capability: ColorCapability) -> Color {
    match capability {
        ColorCapability::TrueColor => color,
        ColorCapability::Extended256 => match color {
            Color::Rgb(r, g, b) => rgb_to_256(r, g, b),
            _ => color,
        },
        ColorCapability::Basic16 => match color {
            Color::Rgb(r, g, b) => rgb_to_16(r, g, b),
            Color::Indexed(idx) => indexed_to_16(idx),
            _ => color,
        },
    }
}

/// Converts RGB color to nearest 256-color palette index.
///
/// Uses the standard xterm 256-color palette mapping:
/// - 0-15: Basic ANSI colors
/// - 16-231: 6x6x6 RGB cube
/// - 232-255: Grayscale ramp
fn rgb_to_256(r: u8, g: u8, b: u8) -> Color {
    // Check if grayscale (all components within threshold)
    let avg = (r as u16 + g as u16 + b as u16) / 3;
    let is_gray = (r as i16 - avg as i16).abs() < 10
        && (g as i16 - avg as i16).abs() < 10
        && (b as i16 - avg as i16).abs() < 10;

    if is_gray {
        // Map to grayscale ramp (232-255)
        let gray_index = ((avg * 24) / 256) as u8;
        return Color::Indexed(232 + gray_index);
    }

    // Map to 6x6x6 RGB cube (16-231)
    let r_index = ((r as u16 * 6) / 256) as u8;
    let g_index = ((g as u16 * 6) / 256) as u8;
    let b_index = ((b as u16 * 6) / 256) as u8;

    let index = 16 + 36 * r_index + 6 * g_index + b_index;
    Color::Indexed(index)
}

/// Converts RGB color to nearest 16-color ANSI code.
fn rgb_to_16(r: u8, g: u8, b: u8) -> Color {
    // Simple brightness-based mapping
    let brightness = (r as u16 + g as u16 + b as u16) / 3;
    let bright = brightness > 128;

    // Determine dominant color
    let max_component = r.max(g).max(b);
    let min_component = r.min(g).min(b);
    let saturation = if max_component > 0 {
        ((max_component - min_component) as f32 / max_component as f32)
    } else {
        0.0
    };

    // Grayscale colors
    if saturation < 0.2 {
        return if brightness < 32 {
            Color::Black
        } else if brightness < 96 {
            Color::DarkGray
        } else if brightness < 192 {
            Color::Gray
        } else {
            Color::White
        };
    }

    // Chromatic colors
    if r >= g && r >= b {
        if bright {
            Color::LightRed
        } else {
            Color::Red
        }
    } else if g >= r && g >= b {
        if bright {
            Color::LightGreen
        } else {
            Color::Green
        }
    } else if bright {
        Color::LightBlue
    } else {
        Color::Blue
    }
}

/// Converts 256-color index to nearest 16-color ANSI code.
fn indexed_to_16(idx: u8) -> Color {
    match idx {
        0 => Color::Black,
        1 => Color::Red,
        2 => Color::Green,
        3 => Color::Yellow,
        4 => Color::Blue,
        5 => Color::Magenta,
        6 => Color::Cyan,
        7 => Color::Gray,
        8 => Color::DarkGray,
        9 => Color::LightRed,
        10 => Color::LightGreen,
        11 => Color::LightYellow,
        12 => Color::LightBlue,
        13 => Color::LightMagenta,
        14 => Color::LightCyan,
        15 => Color::White,
        16..=231 => {
            // RGB cube - extract approximate RGB and convert
            let adjusted = idx - 16;
            let r = (adjusted / 36) * 51;
            let g = ((adjusted % 36) / 6) * 51;
            let b = (adjusted % 6) * 51;
            rgb_to_16(r, g, b)
        }
        232..=255 => {
            // Grayscale ramp
            let gray_level = (idx - 232) * 11;
            if gray_level < 64 {
                Color::Black
            } else if gray_level < 128 {
                Color::DarkGray
            } else if gray_level < 192 {
                Color::Gray
            } else {
                Color::White
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rgb_to_256_pure_colors() {
        assert_eq!(rgb_to_256(255, 0, 0), Color::Indexed(196)); // Pure red
        assert_eq!(rgb_to_256(0, 255, 0), Color::Indexed(46)); // Pure green
        assert_eq!(rgb_to_256(0, 0, 255), Color::Indexed(21)); // Pure blue
    }

    #[test]
    fn test_rgb_to_16_basic_colors() {
        match rgb_to_16(255, 0, 0) {
            Color::LightRed | Color::Red => {}
            _ => panic!("Expected red variant"),
        }
        match rgb_to_16(0, 255, 0) {
            Color::LightGreen | Color::Green => {}
            _ => panic!("Expected green variant"),
        }
    }

    #[test]
    fn test_adapt_color_preserves_truecolor() {
        let color = Color::Rgb(123, 45, 67);
        assert_eq!(adapt_color(color, ColorCapability::TrueColor), color);
    }

    #[test]
    fn test_adapt_color_downgrades_to_256() {
        let color = Color::Rgb(255, 0, 0);
        match adapt_color(color, ColorCapability::Extended256) {
            Color::Indexed(_) => {}
            _ => panic!("Expected indexed color"),
        }
    }
}
