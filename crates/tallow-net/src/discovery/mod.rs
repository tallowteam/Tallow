//! Peer discovery mechanisms

pub mod mdns;
pub mod dns_sd;

pub use mdns::MdnsDiscovery;
pub use dns_sd::DnsServiceRecord;
