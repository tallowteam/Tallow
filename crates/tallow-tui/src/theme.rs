//! TUI theming

/// Theme mode
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ThemeMode {
    /// Dark theme
    Dark,
    /// Light theme
    Light,
    /// High contrast theme
    HighContrast,
}

/// Theme configuration
#[derive(Debug, Clone)]
pub struct Theme {
    /// Theme mode
    pub mode: ThemeMode,
}

impl Theme {
    /// Create a new theme
    pub fn new(mode: ThemeMode) -> Self {
        Self { mode }
    }

    /// Get default theme
    pub fn default_theme() -> Self {
        Self {
            mode: ThemeMode::Dark,
        }
    }
}

impl Default for Theme {
    fn default() -> Self {
        Self::default_theme()
    }
}
