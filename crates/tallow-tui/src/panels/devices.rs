//! Devices panel

/// Devices panel widget
#[derive(Debug)]
pub struct DevicesPanel;

impl DevicesPanel {
    /// Create a new devices panel
    pub fn new() -> Self {
        Self
    }

    /// Render the devices panel
    pub fn render(&self) {
        todo!("Implement devices panel rendering")
    }
}

impl Default for DevicesPanel {
    fn default() -> Self {
        Self::new()
    }
}
