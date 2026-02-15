//! Signaling handler for relay

/// Signaling message handler
#[derive(Debug)]
pub struct SignalingHandler;

impl SignalingHandler {
    /// Create a new signaling handler
    pub fn new() -> Self {
        Self
    }

    /// Handle incoming signaling message
    pub async fn handle(&self, _msg: &[u8]) {
        todo!("Implement signaling handler")
    }
}

impl Default for SignalingHandler {
    fn default() -> Self {
        Self::new()
    }
}
