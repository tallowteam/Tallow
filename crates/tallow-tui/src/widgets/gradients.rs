//! Gradient color generation for progress indicators and visualizations.
//!
//! Provides utilities for creating smooth color transitions and context-aware
//! color gradients for progress bars, bandwidth charts, and other visualizations.
//!
//! # Examples
//!
//! ```no_run
//! use tallow_tui::widgets::gradients::{Gradient, progress_gradient};
//!
//! // Create a custom gradient
//! let gradient = Gradient::new((0, 0, 255), (255, 0, 0), 10);
//! let colors = gradient.generate();
//!
//! // Get a progress color (green → yellow → red)
//! let color = progress_gradient(0.75); // 75% complete, greenish
//! ```

use ratatui::style::Color;

/// A gradient between two RGB colors with a specified number of steps.
#[derive(Debug, Clone, Copy)]
pub struct Gradient {
    /// Starting RGB color (r, g, b).
    pub start_color: (u8, u8, u8),
    /// Ending RGB color (r, g, b).
    pub end_color: (u8, u8, u8),
    /// Number of interpolation steps.
    pub steps: usize,
}

impl Gradient {
    /// Creates a new gradient between two colors.
    ///
    /// # Arguments
    ///
    /// * `start_color` - RGB tuple for the starting color
    /// * `end_color` - RGB tuple for the ending color
    /// * `steps` - Number of color steps to generate
    ///
    /// # Examples
    ///
    /// ```no_run
    /// # use tallow_tui::widgets::gradients::Gradient;
    /// let gradient = Gradient::new((255, 0, 0), (0, 0, 255), 5);
    /// ```
    pub fn new(start_color: (u8, u8, u8), end_color: (u8, u8, u8), steps: usize) -> Self {
        Self {
            start_color,
            end_color,
            steps: steps.max(2), // Ensure at least 2 steps
        }
    }

    /// Generates a vector of interpolated colors between start and end.
    ///
    /// Uses linear RGB interpolation to create smooth color transitions.
    ///
    /// # Returns
    ///
    /// A vector of `Color::Rgb` values with length equal to `steps`.
    ///
    /// # Examples
    ///
    /// ```no_run
    /// # use tallow_tui::widgets::gradients::Gradient;
    /// let gradient = Gradient::new((0, 0, 0), (255, 255, 255), 10);
    /// let colors = gradient.generate();
    /// assert_eq!(colors.len(), 10);
    /// ```
    pub fn generate(&self) -> Vec<Color> {
        let (sr, sg, sb) = self.start_color;
        let (er, eg, eb) = self.end_color;

        (0..self.steps)
            .map(|i| {
                let t = i as f64 / (self.steps - 1) as f64;
                let r = Self::lerp(sr, er, t);
                let g = Self::lerp(sg, eg, t);
                let b = Self::lerp(sb, eb, t);
                Color::Rgb(r, g, b)
            })
            .collect()
    }

    /// Linear interpolation between two u8 values.
    fn lerp(start: u8, end: u8, t: f64) -> u8 {
        let t = t.clamp(0.0, 1.0);
        let start_f = start as f64;
        let end_f = end as f64;
        (start_f + (end_f - start_f) * t).round() as u8
    }
}

/// Returns a color for a progress indicator based on completion ratio.
///
/// Color mapping:
/// - 1.0 (100%): Green (#9ece6a)
/// - 0.5 (50%): Yellow (#e0af68)
/// - 0.0 (0%): Red (#f7768e)
///
/// Uses linear interpolation between these thresholds.
///
/// # Arguments
///
/// * `ratio` - Progress ratio from 0.0 to 1.0
///
/// # Examples
///
/// ```no_run
/// # use tallow_tui::widgets::gradients::progress_gradient;
/// let color = progress_gradient(0.75); // Greenish-yellow
/// let color = progress_gradient(0.25); // Orange-red
/// ```
pub fn progress_gradient(ratio: f64) -> Color {
    let ratio = ratio.clamp(0.0, 1.0);

    // Define color stops (Tokyo Night palette)
    let red = (247, 118, 142); // #f7768e
    let yellow = (224, 175, 104); // #e0af68
    let green = (158, 206, 106); // #9ece6a

    if ratio >= 0.5 {
        // Interpolate between yellow and green
        let t = (ratio - 0.5) * 2.0; // Normalize to 0.0-1.0
        let r = Gradient::lerp(yellow.0, green.0, t);
        let g = Gradient::lerp(yellow.1, green.1, t);
        let b = Gradient::lerp(yellow.2, green.2, t);
        Color::Rgb(r, g, b)
    } else {
        // Interpolate between red and yellow
        let t = ratio * 2.0; // Normalize to 0.0-1.0
        let r = Gradient::lerp(red.0, yellow.0, t);
        let g = Gradient::lerp(red.1, yellow.1, t);
        let b = Gradient::lerp(red.2, yellow.2, t);
        Color::Rgb(r, g, b)
    }
}

/// Returns a color for a heat map visualization based on intensity.
///
/// Color mapping:
/// - 0.0 (cold): Blue (#7aa2f7)
/// - 0.5 (warm): Cyan (#2ac3de)
/// - 1.0 (hot): Red (#f7768e)
///
/// Useful for bandwidth charts, CPU usage, temperature visualizations.
///
/// # Arguments
///
/// * `value` - Intensity value from 0.0 (cold) to 1.0 (hot)
///
/// # Examples
///
/// ```no_run
/// # use tallow_tui::widgets::gradients::heat_gradient;
/// let color = heat_gradient(0.0); // Blue (cold)
/// let color = heat_gradient(0.5); // Cyan (warm)
/// let color = heat_gradient(1.0); // Red (hot)
/// ```
pub fn heat_gradient(value: f64) -> Color {
    let value = value.clamp(0.0, 1.0);

    // Define color stops (blue → cyan → red)
    let blue = (122, 162, 247); // #7aa2f7
    let cyan = (42, 195, 222); // #2ac3de
    let red = (247, 118, 142); // #f7768e

    if value >= 0.5 {
        // Interpolate between cyan and red
        let t = (value - 0.5) * 2.0;
        let r = Gradient::lerp(cyan.0, red.0, t);
        let g = Gradient::lerp(cyan.1, red.1, t);
        let b = Gradient::lerp(cyan.2, red.2, t);
        Color::Rgb(r, g, b)
    } else {
        // Interpolate between blue and cyan
        let t = value * 2.0;
        let r = Gradient::lerp(blue.0, cyan.0, t);
        let g = Gradient::lerp(blue.1, cyan.1, t);
        let b = Gradient::lerp(blue.2, cyan.2, t);
        Color::Rgb(r, g, b)
    }
}

/// Returns a color for status indicators based on severity level.
///
/// Color mapping:
/// - 0.0: Success (green #9ece6a)
/// - 0.5: Warning (yellow #e0af68)
/// - 1.0: Error (red #f7768e)
///
/// # Arguments
///
/// * `severity` - Severity level from 0.0 (success) to 1.0 (error)
pub fn status_gradient(severity: f64) -> Color {
    progress_gradient(1.0 - severity)
}

/// Returns a rainbow gradient color based on position.
///
/// Cycles through the full color spectrum (HSV hue rotation).
///
/// # Arguments
///
/// * `position` - Position in rainbow from 0.0 to 1.0
///
/// # Examples
///
/// ```no_run
/// # use tallow_tui::widgets::gradients::rainbow_gradient;
/// let colors: Vec<_> = (0..7).map(|i| rainbow_gradient(i as f64 / 6.0)).collect();
/// ```
pub fn rainbow_gradient(position: f64) -> Color {
    let position = position.clamp(0.0, 1.0);
    let hue = position * 360.0;
    hsv_to_rgb(hue, 1.0, 1.0)
}

/// Converts HSV color to RGB.
///
/// # Arguments
///
/// * `h` - Hue in degrees (0-360)
/// * `s` - Saturation (0.0-1.0)
/// * `v` - Value/brightness (0.0-1.0)
fn hsv_to_rgb(h: f64, s: f64, v: f64) -> Color {
    let h = h % 360.0;
    let s = s.clamp(0.0, 1.0);
    let v = v.clamp(0.0, 1.0);

    let c = v * s;
    let x = c * (1.0 - ((h / 60.0) % 2.0 - 1.0).abs());
    let m = v - c;

    let (r_prime, g_prime, b_prime) = match h as u16 {
        0..=59 => (c, x, 0.0),
        60..=119 => (x, c, 0.0),
        120..=179 => (0.0, c, x),
        180..=239 => (0.0, x, c),
        240..=299 => (x, 0.0, c),
        _ => (c, 0.0, x),
    };

    let r = ((r_prime + m) * 255.0).round() as u8;
    let g = ((g_prime + m) * 255.0).round() as u8;
    let b = ((b_prime + m) * 255.0).round() as u8;

    Color::Rgb(r, g, b)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_gradient_generation() {
        let gradient = Gradient::new((0, 0, 0), (255, 255, 255), 5);
        let colors = gradient.generate();
        assert_eq!(colors.len(), 5);
    }

    #[test]
    fn test_gradient_minimum_steps() {
        let gradient = Gradient::new((0, 0, 0), (255, 255, 255), 1);
        assert_eq!(gradient.steps, 2); // Should enforce minimum
    }

    #[test]
    fn test_progress_gradient_bounds() {
        let green = progress_gradient(1.0);
        let yellow = progress_gradient(0.5);
        let red = progress_gradient(0.0);

        // Ensure colors are different
        assert_ne!(green, yellow);
        assert_ne!(yellow, red);
    }

    #[test]
    fn test_heat_gradient_bounds() {
        let blue = heat_gradient(0.0);
        let cyan = heat_gradient(0.5);
        let red = heat_gradient(1.0);

        assert_ne!(blue, cyan);
        assert_ne!(cyan, red);
    }

    #[test]
    fn test_rainbow_gradient() {
        let colors: Vec<_> = (0..7).map(|i| rainbow_gradient(i as f64 / 6.0)).collect();
        assert_eq!(colors.len(), 7);
    }

    #[test]
    fn test_lerp_clamping() {
        assert_eq!(Gradient::lerp(0, 255, -0.5), 0);
        assert_eq!(Gradient::lerp(0, 255, 1.5), 255);
        assert_eq!(Gradient::lerp(0, 255, 0.5), 128);
    }
}
