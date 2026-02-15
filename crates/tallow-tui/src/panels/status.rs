//! Status panel

/// Status panel widget
#[derive(Debug)]
pub struct StatusPanel;

impl StatusPanel {
    /// Create a new status panel
    pub fn new() -> Self {
        Self
    }

    /// Render the status panel
    pub fn render(&self) {
        todo!("Implement status panel rendering")
    }
}

impl Default for StatusPanel {
    fn default() -> Self {
        Self::new()
    }
}
