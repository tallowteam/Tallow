//! DNS-over-HTTPS resolver

use crate::Result;
use std::net::IpAddr;

/// DNS-over-HTTPS resolver
#[derive(Debug)]
pub struct DohResolver {
    #[allow(dead_code)]
    endpoint: String,
}

impl DohResolver {
    /// Create a new DoH resolver
    pub fn new(endpoint: String) -> Self {
        Self { endpoint }
    }

    /// Resolve a hostname via DoH
    pub async fn resolve(&self, _hostname: &str) -> Result<Vec<IpAddr>> {
        todo!("Implement DoH resolution")
    }
}
