//! Peer discovery mechanisms

pub mod dns_sd;
pub mod lan;
pub mod mdns;

pub use dns_sd::DnsServiceRecord;
pub use lan::{LanAdvertiser, discover_all_senders, discover_sender};
pub use mdns::{DiscoveredPeer, MdnsDiscovery};
