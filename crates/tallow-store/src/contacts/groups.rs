//! Contact groups

use serde::{Deserialize, Serialize};

/// Contact group
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContactGroup {
    /// Group ID
    pub id: String,
    /// Group name
    pub name: String,
    /// Member contact IDs
    pub members: Vec<String>,
}

impl ContactGroup {
    /// Create a new contact group
    pub fn new(id: String, name: String) -> Self {
        Self {
            id,
            name,
            members: Vec::new(),
        }
    }

    /// Add a member
    pub fn add_member(&mut self, contact_id: String) {
        if !self.members.contains(&contact_id) {
            self.members.push(contact_id);
        }
    }

    /// Remove a member
    pub fn remove_member(&mut self, contact_id: &str) {
        self.members.retain(|id| id != contact_id);
    }
}
