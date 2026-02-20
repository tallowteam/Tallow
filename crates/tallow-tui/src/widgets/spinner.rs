//! Configurable Unicode spinners for TUI loading states
//!
//! Provides various spinner styles with support for reduced motion accessibility.

use ratatui::prelude::*;

/// Style of spinner animation
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SpinnerStyle {
    /// Braille dot patterns: ⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏
    Braille,
    /// Small dots: ⠁⠂⠄⡀⢀⠠⠐⠈
    Dots,
    /// Classic line spinner: -\|/
    Line,
    /// Bouncing quadrants: ▖▘▝▗
    Bounce,
    /// Pulsing states (for reduced motion)
    Pulse,
}

impl Default for SpinnerStyle {
    fn default() -> Self {
        Self::Braille
    }
}

/// Animated spinner widget
#[derive(Debug, Clone)]
pub struct Spinner {
    /// The style of spinner to display
    style: SpinnerStyle,
    /// Current animation frame
    frame: usize,
    /// Label to display next to spinner
    label: String,
    /// Whether the spinner is actively animating
    is_active: bool,
    /// Use reduced motion mode (static display)
    reduced_motion: bool,
}

impl Default for Spinner {
    fn default() -> Self {
        Self::new()
    }
}

impl Spinner {
    /// Create a new spinner with default settings
    pub fn new() -> Self {
        Self {
            style: SpinnerStyle::Braille,
            frame: 0,
            label: String::new(),
            is_active: true,
            reduced_motion: false,
        }
    }

    /// Create a spinner with a label
    pub fn with_label(label: impl Into<String>) -> Self {
        Self {
            style: SpinnerStyle::Braille,
            frame: 0,
            label: label.into(),
            is_active: true,
            reduced_motion: false,
        }
    }

    /// Set the spinner style
    pub fn style(mut self, style: SpinnerStyle) -> Self {
        self.style = style;
        self
    }

    /// Set the label
    pub fn label(mut self, label: impl Into<String>) -> Self {
        self.label = label.into();
        self
    }

    /// Set whether spinner is active
    pub fn active(mut self, is_active: bool) -> Self {
        self.is_active = is_active;
        self
    }

    /// Enable reduced motion mode
    pub fn reduced_motion(mut self, reduced_motion: bool) -> Self {
        self.reduced_motion = reduced_motion;
        self
    }

    /// Get the frames for the current spinner style
    fn frames(&self) -> &[char] {
        match self.style {
            SpinnerStyle::Braille => &['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
            SpinnerStyle::Dots => &['⠁', '⠂', '⠄', '⡀', '⢀', '⠠', '⠐', '⠈'],
            SpinnerStyle::Line => &['-', '\\', '|', '/'],
            SpinnerStyle::Bounce => &['▖', '▘', '▝', '▗'],
            SpinnerStyle::Pulse => &['·', '•', '●', '•'],
        }
    }

    /// Advance to the next frame
    pub fn tick(&mut self) {
        if !self.is_active {
            return;
        }
        let frames = self.frames();
        self.frame = (self.frame + 1) % frames.len();
    }

    /// Get the current character to display
    pub fn current_char(&self) -> char {
        if self.reduced_motion {
            // Static display for reduced motion
            return '-';
        }

        if !self.is_active {
            return ' ';
        }

        let frames = self.frames();
        frames[self.frame % frames.len()]
    }

    /// Get the full display text (spinner + label)
    pub fn display_text(&self) -> String {
        if self.label.is_empty() {
            format!("{} ", self.current_char())
        } else {
            format!("{} {}", self.current_char(), self.label)
        }
    }

    /// Reset the spinner to the first frame
    pub fn reset(&mut self) {
        self.frame = 0;
    }
}

impl Widget for Spinner {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let text = self.display_text();
        let span = Span::raw(text);
        let line = Line::from(span);
        line.render(area, buf);
    }
}

impl Widget for &Spinner {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let text = self.display_text();
        let span = Span::raw(text);
        let line = Line::from(span);
        line.render(area, buf);
    }
}

/// Helper to create a styled spinner with color
pub fn styled_spinner(spinner: &Spinner, style: Style) -> Line<'static> {
    let text = spinner.display_text();
    Line::from(Span::styled(text, style))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_spinner_new() {
        let spinner = Spinner::new();
        assert_eq!(spinner.style, SpinnerStyle::Braille);
        assert_eq!(spinner.frame, 0);
        assert!(spinner.is_active);
        assert!(!spinner.reduced_motion);
    }

    #[test]
    fn test_spinner_with_label() {
        let spinner = Spinner::with_label("Loading...");
        assert_eq!(spinner.label, "Loading...");
    }

    #[test]
    fn test_spinner_tick() {
        let mut spinner = Spinner::new();
        let initial_char = spinner.current_char();
        spinner.tick();
        let next_char = spinner.current_char();
        assert_ne!(initial_char, next_char);
    }

    #[test]
    fn test_spinner_frames_loop() {
        let mut spinner = Spinner::new().style(SpinnerStyle::Line);
        let frames = spinner.frames();
        let frame_count = frames.len();

        // Tick through all frames
        for _ in 0..frame_count {
            spinner.tick();
        }

        // Should wrap back to first frame
        assert_eq!(spinner.frame, 0);
    }

    #[test]
    fn test_spinner_reduced_motion() {
        let spinner = Spinner::new().reduced_motion(true);
        assert_eq!(spinner.current_char(), '-');
    }

    #[test]
    fn test_spinner_inactive() {
        let spinner = Spinner::new().active(false);
        assert_eq!(spinner.current_char(), ' ');
    }

    #[test]
    fn test_spinner_display_text() {
        let spinner = Spinner::new().label("Connecting...");
        let text = spinner.display_text();
        assert!(text.contains("Connecting..."));
    }

    #[test]
    fn test_spinner_styles() {
        for style in &[
            SpinnerStyle::Braille,
            SpinnerStyle::Dots,
            SpinnerStyle::Line,
            SpinnerStyle::Bounce,
            SpinnerStyle::Pulse,
        ] {
            let spinner = Spinner::new().style(*style);
            let frames = spinner.frames();
            assert!(!frames.is_empty());
        }
    }

    #[test]
    fn test_spinner_reset() {
        let mut spinner = Spinner::new();
        spinner.tick();
        spinner.tick();
        spinner.tick();
        assert_ne!(spinner.frame, 0);

        spinner.reset();
        assert_eq!(spinner.frame, 0);
    }
}
