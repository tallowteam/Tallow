//! High contrast rendering overrides for improved visibility
//!
//! Provides style transformations and text processing for high contrast mode,
//! ensuring maximum readability for users with visual impairments.

use ratatui::prelude::*;

/// High contrast color and style overrides
#[derive(Debug, Clone)]
pub struct HighContrastOverrides {
    /// Foreground color (default: White)
    pub fg: Color,
    /// Background color (default: Black)
    pub bg: Color,
    /// Force bold text
    pub force_bold: bool,
    /// Force underline on focusable items
    pub force_underline_focus: bool,
}

impl Default for HighContrastOverrides {
    fn default() -> Self {
        Self {
            fg: Color::White,
            bg: Color::Black,
            force_bold: true,
            force_underline_focus: true,
        }
    }
}

impl HighContrastOverrides {
    /// Create new high contrast overrides with default settings
    pub fn new() -> Self {
        Self::default()
    }

    /// Create with custom foreground and background colors
    pub fn with_colors(fg: Color, bg: Color) -> Self {
        Self {
            fg,
            bg,
            force_bold: true,
            force_underline_focus: true,
        }
    }
}

/// Apply high contrast transformations to a style
///
/// Forces maximum foreground/background contrast and bold text for improved visibility.
///
/// # Examples
///
/// ```
/// use ratatui::prelude::*;
/// use tallow_tui::widgets::high_contrast::apply_high_contrast;
///
/// let original = Style::default().fg(Color::Gray);
/// let high_contrast = apply_high_contrast(original);
/// ```
pub fn apply_high_contrast(style: Style) -> Style {
    apply_high_contrast_with_overrides(style, &HighContrastOverrides::default())
}

/// Apply high contrast with custom overrides
pub fn apply_high_contrast_with_overrides(
    style: Style,
    overrides: &HighContrastOverrides,
) -> Style {
    let mut new_style = style;

    // Force high contrast colors
    new_style = new_style.fg(overrides.fg).bg(overrides.bg);

    // Add bold modifier
    if overrides.force_bold {
        new_style = new_style.add_modifier(Modifier::BOLD);
    }

    new_style
}

/// Apply high contrast to focused element
pub fn apply_high_contrast_focus(style: Style) -> Style {
    let overrides = HighContrastOverrides::default();
    let mut new_style = apply_high_contrast_with_overrides(style, &overrides);

    if overrides.force_underline_focus {
        new_style = new_style.add_modifier(Modifier::UNDERLINED);
    }

    new_style
}

/// Strip decorative characters and replace with text alternatives
///
/// Removes emojis and Unicode decorations, replacing them with ASCII equivalents.
///
/// # Examples
///
/// ```
/// use tallow_tui::widgets::high_contrast::strip_decorative_chars;
///
/// assert_eq!(strip_decorative_chars("✓ Success"), "[CHECK] Success");
/// assert_eq!(strip_decorative_chars("⚠ Warning"), "[WARN] Warning");
/// ```
pub fn strip_decorative_chars(text: &str) -> String {
    let mut result = text.to_string();

    // Common decorative characters and their text equivalents
    let replacements = [
        ("✓", "[CHECK]"),
        ("✔", "[CHECK]"),
        ("✗", "[X]"),
        ("✘", "[X]"),
        ("⚠", "[WARN]"),
        ("⚡", "[FAST]"),
        ("🔒", "[LOCK]"),
        ("🔓", "[UNLOCK]"),
        ("🔑", "[KEY]"),
        ("📁", "[FOLDER]"),
        ("📄", "[FILE]"),
        ("📊", "[CHART]"),
        ("⬆", "[UP]"),
        ("⬇", "[DOWN]"),
        ("⬅", "[LEFT]"),
        ("➡", "[RIGHT]"),
        ("→", "[RIGHT]"),
        ("←", "[LEFT]"),
        ("↑", "[UP]"),
        ("↓", "[DOWN]"),
        ("▶", "[PLAY]"),
        ("⏸", "[PAUSE]"),
        ("⏹", "[STOP]"),
        ("●", "[DOT]"),
        ("○", "[CIRCLE]"),
        ("◆", "[DIAMOND]"),
        ("■", "[SQUARE]"),
        ("□", "[BOX]"),
        ("★", "[STAR]"),
        ("☆", "[STAR]"),
        ("♥", "[HEART]"),
        ("♦", "[DIAMOND]"),
        ("♣", "[CLUB]"),
        ("♠", "[SPADE]"),
        ("∞", "[INFINITY]"),
        ("≈", "[APPROX]"),
        ("≠", "[NOT EQUAL]"),
        ("≤", "[LESS EQUAL]"),
        ("≥", "[GREATER EQUAL]"),
        ("⊕", "[XOR]"),
        ("⊗", "[TENSOR]"),
        // Spinner characters
        ("⠋", "[|]"),
        ("⠙", "[/]"),
        ("⠹", "[-]"),
        ("⠸", "[\\]"),
        ("⠼", "[|]"),
        ("⠴", "[/]"),
        ("⠦", "[-]"),
        ("⠧", "[\\]"),
        ("⠇", "[|]"),
        ("⠏", "[/]"),
        // Progress characters
        ("▁", "[1]"),
        ("▂", "[2]"),
        ("▃", "[3]"),
        ("▄", "[4]"),
        ("▅", "[5]"),
        ("▆", "[6]"),
        ("▇", "[7]"),
        ("█", "[8]"),
        // Box drawing (keep essential structure)
        ("─", "-"),
        ("│", "|"),
        ("┌", "+"),
        ("┐", "+"),
        ("└", "+"),
        ("┘", "+"),
        ("├", "+"),
        ("┤", "+"),
        ("┬", "+"),
        ("┴", "+"),
        ("┼", "+"),
        ("═", "="),
        ("║", "||"),
        ("╔", "++"),
        ("╗", "++"),
        ("╚", "++"),
        ("╝", "++"),
    ];

    for (decorative, replacement) in replacements.iter() {
        result = result.replace(decorative, replacement);
    }

    result
}

/// Get high contrast border style
///
/// Returns a bright white border on black background with bold text.
pub fn high_contrast_border() -> Style {
    Style::default()
        .fg(Color::White)
        .bg(Color::Black)
        .add_modifier(Modifier::BOLD)
}

/// Get high contrast title style
pub fn high_contrast_title() -> Style {
    Style::default()
        .fg(Color::White)
        .bg(Color::Black)
        .add_modifier(Modifier::BOLD | Modifier::UNDERLINED)
}

/// Get high contrast selected item style
pub fn high_contrast_selected() -> Style {
    Style::default()
        .fg(Color::Black)
        .bg(Color::White)
        .add_modifier(Modifier::BOLD)
}

/// Get high contrast error style
pub fn high_contrast_error() -> Style {
    Style::default()
        .fg(Color::White)
        .bg(Color::Black)
        .add_modifier(Modifier::BOLD | Modifier::UNDERLINED)
}

/// Get high contrast success style
pub fn high_contrast_success() -> Style {
    Style::default()
        .fg(Color::White)
        .bg(Color::Black)
        .add_modifier(Modifier::BOLD)
}

/// Get high contrast warning style
pub fn high_contrast_warning() -> Style {
    Style::default()
        .fg(Color::White)
        .bg(Color::Black)
        .add_modifier(Modifier::BOLD | Modifier::UNDERLINED)
}

/// Get high contrast inactive/disabled style
pub fn high_contrast_inactive() -> Style {
    Style::default()
        .fg(Color::Gray)
        .bg(Color::Black)
        .add_modifier(Modifier::DIM)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_high_contrast_overrides_default() {
        let overrides = HighContrastOverrides::default();
        assert_eq!(overrides.fg, Color::White);
        assert_eq!(overrides.bg, Color::Black);
        assert!(overrides.force_bold);
    }

    #[test]
    fn test_apply_high_contrast() {
        let style = Style::default().fg(Color::Gray);
        let high_contrast = apply_high_contrast(style);

        assert_eq!(high_contrast.fg, Some(Color::White));
        assert_eq!(high_contrast.bg, Some(Color::Black));
        assert!(high_contrast.add_modifier.contains(Modifier::BOLD));
    }

    #[test]
    fn test_strip_decorative_chars() {
        assert_eq!(strip_decorative_chars("✓ Success"), "[CHECK] Success");
        assert_eq!(strip_decorative_chars("⚠ Warning"), "[WARN] Warning");
        assert_eq!(strip_decorative_chars("🔒 Locked"), "[LOCK] Locked");
        assert_eq!(strip_decorative_chars("→ Next"), "[RIGHT] Next");
    }

    #[test]
    fn test_strip_multiple_decorative_chars() {
        let input = "✓ Success ⚠ Warning → Next";
        let expected = "[CHECK] Success [WARN] Warning [RIGHT] Next";
        assert_eq!(strip_decorative_chars(input), expected);
    }

    #[test]
    fn test_strip_box_drawing() {
        assert_eq!(strip_decorative_chars("─┬─"), "-+-");
        assert_eq!(strip_decorative_chars("┌──┐"), "+--+");
    }

    #[test]
    fn test_high_contrast_border() {
        let style = high_contrast_border();
        assert_eq!(style.fg, Some(Color::White));
        assert_eq!(style.bg, Some(Color::Black));
        assert!(style.add_modifier.contains(Modifier::BOLD));
    }

    #[test]
    fn test_high_contrast_selected() {
        let style = high_contrast_selected();
        // Selected should have inverted colors
        assert_eq!(style.fg, Some(Color::Black));
        assert_eq!(style.bg, Some(Color::White));
    }
}
