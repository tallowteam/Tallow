//! TUI display modes

/// TUI display mode
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TuiMode {
    /// Full dashboard with all panels
    Dashboard,
    /// Minimal mode (transfers only)
    Minimal,
    /// Zen mode (focus on current transfer)
    Zen,
    /// Monitor mode (passive watching)
    Monitor,
}

impl TuiMode {
    /// Check if mode shows status panel
    pub fn shows_status(&self) -> bool {
        matches!(self, TuiMode::Dashboard | TuiMode::Monitor)
    }

    /// Check if mode shows devices panel
    pub fn shows_devices(&self) -> bool {
        matches!(self, TuiMode::Dashboard)
    }
}
