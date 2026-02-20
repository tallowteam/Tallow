//! NAT traversal implementations

pub mod detection;
pub mod hole_punch;
pub mod stun;
pub mod turn;
pub mod upnp;

pub use detection::NatType;
pub use stun::{StunClient, StunResult};
