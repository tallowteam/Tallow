//! Transfers panel

/// Transfers panel widget
#[derive(Debug)]
pub struct TransfersPanel;

impl TransfersPanel {
    /// Create a new transfers panel
    pub fn new() -> Self {
        Self
    }

    /// Render the transfers panel
    pub fn render(&self) {
        todo!("Implement transfers panel rendering")
    }
}

impl Default for TransfersPanel {
    fn default() -> Self {
        Self::new()
    }
}
