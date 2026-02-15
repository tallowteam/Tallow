//! Room/lobby system for multi-party transfers

pub mod manager;
pub mod code;
pub mod roles;

pub use manager::RoomManager;
pub use code::generate_code_phrase;
pub use roles::RoomRole;
