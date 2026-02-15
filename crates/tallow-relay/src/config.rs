//! Relay server configuration

use serde::{Deserialize, Serialize};

/// Relay server configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RelayConfig {
    /// Server bind address
    pub bind_addr: String,
    /// Maximum connections
    pub max_connections: usize,
    /// Rate limit (requests per second)
    pub rate_limit: u32,
    /// TLS certificate path
    pub tls_cert: Option<String>,
    /// TLS key path
    pub tls_key: Option<String>,
}

impl Default for RelayConfig {
    fn default() -> Self {
        Self {
            bind_addr: "0.0.0.0:443".to_string(),
            max_connections: 10000,
            rate_limit: 100,
            tls_cert: None,
            tls_key: None,
        }
    }
}
