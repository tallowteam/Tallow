//! Hotkey bar panel

/// Hotkey bar widget
#[derive(Debug)]
pub struct HotkeyBar;

impl HotkeyBar {
    /// Create a new hotkey bar
    pub fn new() -> Self {
        Self
    }

    /// Render the hotkey bar
    pub fn render(&self) {
        todo!("Implement hotkey bar rendering")
    }
}

impl Default for HotkeyBar {
    fn default() -> Self {
        Self::new()
    }
}
