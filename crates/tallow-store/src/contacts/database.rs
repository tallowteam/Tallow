//! Contact database

use crate::Result;
use serde::{Deserialize, Serialize};

/// Contact entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Contact {
    /// Contact ID
    pub id: String,
    /// Display name
    pub name: String,
    /// Public key
    pub public_key: Vec<u8>,
    /// Groups
    pub groups: Vec<String>,
}

/// Contact database
#[derive(Debug)]
pub struct ContactDatabase {
    contacts: Vec<Contact>,
}

impl ContactDatabase {
    /// Create a new contact database
    pub fn new() -> Self {
        Self {
            contacts: Vec::new(),
        }
    }

    /// Add a contact
    pub fn add(&mut self, contact: Contact) -> Result<()> {
        self.contacts.push(contact);
        Ok(())
    }

    /// Remove a contact
    pub fn remove(&mut self, id: &str) -> Result<()> {
        self.contacts.retain(|c| c.id != id);
        Ok(())
    }

    /// List all contacts
    pub fn list(&self) -> &[Contact] {
        &self.contacts
    }

    /// Find contact by ID
    pub fn find(&self, id: &str) -> Option<&Contact> {
        self.contacts.iter().find(|c| c.id == id)
    }
}

impl Default for ContactDatabase {
    fn default() -> Self {
        Self::new()
    }
}
