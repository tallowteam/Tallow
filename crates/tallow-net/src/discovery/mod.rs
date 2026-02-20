//! Peer discovery mechanisms

pub mod dns_sd;
pub mod mdns;

pub use dns_sd::DnsServiceRecord;
pub use mdns::{DiscoveredPeer, MdnsDiscovery};
