//! Room management

use super::RoomRole;
use crate::Result;

/// Room participant
#[derive(Debug, Clone)]
pub struct Participant {
    /// Participant ID
    pub id: String,
    /// Display name
    pub name: String,
    /// Role in room
    pub role: RoomRole,
}

/// Room manager
#[derive(Debug)]
pub struct RoomManager {
    /// Room code
    pub code: String,
    /// Participants
    participants: Vec<Participant>,
}

impl RoomManager {
    /// Create a new room
    pub fn new(code: String) -> Self {
        Self {
            code,
            participants: Vec::new(),
        }
    }

    /// Join a room
    pub async fn join(&mut self, _participant: Participant) -> Result<()> {
        todo!("Implement room join")
    }

    /// Leave a room
    pub async fn leave(&mut self, _participant_id: &str) -> Result<()> {
        todo!("Implement room leave")
    }

    /// Get participants
    pub fn participants(&self) -> &[Participant] {
        &self.participants
    }
}
