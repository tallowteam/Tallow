//! Room/lobby system for multi-party transfers

pub mod code;
pub mod manager;
pub mod roles;

pub use code::generate_code_phrase;
pub use manager::RoomManager;
pub use roles::RoomRole;
