//! Help overlay

/// Help overlay widget
#[derive(Debug)]
pub struct HelpOverlay;

impl HelpOverlay {
    /// Create a new help overlay
    pub fn new() -> Self {
        Self
    }

    /// Render the help overlay
    pub fn render(&self) {
        todo!("Implement help overlay rendering")
    }
}

impl Default for HelpOverlay {
    fn default() -> Self {
        Self::new()
    }
}
