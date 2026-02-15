//! UPnP/NAT-PMP port mapping

use crate::Result;
use std::net::SocketAddr;

/// Add a UPnP port mapping
pub async fn add_port_mapping(_external_port: u16, _internal_addr: SocketAddr, _description: &str) -> Result<()> {
    todo!("Implement UPnP port mapping")
}

/// Remove a UPnP port mapping
pub async fn remove_port_mapping(_external_port: u16) -> Result<()> {
    todo!("Implement UPnP port unmapping")
}
