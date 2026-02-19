//! NAT traversal implementations

pub mod stun;
pub mod turn;
pub mod hole_punch;
pub mod upnp;
pub mod detection;

pub use detection::NatType;
pub use stun::{StunClient, StunResult};
