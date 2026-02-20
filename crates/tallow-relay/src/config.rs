//! Relay server configuration

use serde::{Deserialize, Serialize};

/// Relay server configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RelayConfig {
    /// Server bind address
    pub bind_addr: String,
    /// Maximum concurrent connections
    pub max_connections: usize,
    /// Maximum concurrent rooms
    pub max_rooms: usize,
    /// Rate limit (requests per second per IP)
    pub rate_limit: u32,
    /// Room timeout in seconds (stale rooms are cleaned up)
    pub room_timeout_secs: u64,
    /// TLS certificate path (optional — self-signed if absent)
    pub tls_cert: Option<String>,
    /// TLS key path (optional)
    pub tls_key: Option<String>,
    /// Relay password (empty = open relay, no authentication required)
    #[serde(default)]
    pub password: String,
}

impl Default for RelayConfig {
    fn default() -> Self {
        Self {
            bind_addr: "0.0.0.0:4433".to_string(),
            max_connections: 10000,
            max_rooms: 5000,
            rate_limit: 100,
            room_timeout_secs: 60,
            tls_cert: None,
            tls_key: None,
            password: String::new(),
        }
    }
}
