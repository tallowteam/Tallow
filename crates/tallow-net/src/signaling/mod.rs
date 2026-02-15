//! Signaling protocol for peer coordination

pub mod protocol;
pub mod client;

pub use protocol::SignalingMessage;
pub use client::SignalingClient;
