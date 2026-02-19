//! Contacts management

pub mod database;
pub mod groups;

pub use database::{Contact, ContactDatabase};
pub use groups::ContactGroup;
