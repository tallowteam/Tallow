//! Chat message types

use serde::{Deserialize, Serialize};

/// Chat message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    /// Message ID
    pub id: String,
    /// Sender ID
    pub sender: String,
    /// Message text
    pub text: String,
    /// Timestamp (Unix seconds)
    pub timestamp: u64,
    /// Encrypted flag
    pub encrypted: bool,
}

impl ChatMessage {
    /// Create a new chat message
    pub fn new(sender: String, text: String) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            sender,
            text,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            encrypted: false,
        }
    }
}

// Add uuid dependency placeholder
mod uuid {
    pub struct Uuid;
    impl Uuid {
        pub fn new_v4() -> Self {
            Self
        }
    }
    impl std::fmt::Display for Uuid {
        fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
            write!(f, "placeholder-uuid")
        }
    }
}
