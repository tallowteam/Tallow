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
    /// TLS certificate path (optional -- self-signed if absent)
    pub tls_cert: Option<String>,
    /// TLS key path (optional)
    pub tls_key: Option<String>,
    /// Maximum peers per multi-peer room (default: 10, max: 20)
    #[serde(default = "default_max_peers_per_room")]
    pub max_peers_per_room: u8,
    /// Relay password (empty = open relay, no authentication required)
    #[serde(default)]
    pub password: String,
    /// WebSocket bind address for browser clients (e.g., "0.0.0.0:4434")
    /// Set to empty string to disable WebSocket listener
    #[serde(default = "default_ws_bind_addr")]
    pub ws_bind_addr: String,
}

fn default_max_peers_per_room() -> u8 {
    10
}

fn default_ws_bind_addr() -> String {
    "0.0.0.0:4434".to_string()
}

impl RelayConfig {
    /// Minimum room timeout in seconds (prevents accidental zero = never-expire)
    const MIN_ROOM_TIMEOUT: u64 = 10;

    /// Validate and clamp configuration values
    pub fn validate(&mut self) {
        if self.room_timeout_secs < Self::MIN_ROOM_TIMEOUT {
            self.room_timeout_secs = Self::MIN_ROOM_TIMEOUT;
        }
        self.max_peers_per_room = self.max_peers_per_room.min(20);

        // Validate ws_bind_addr parses as SocketAddr when non-empty
        if !self.ws_bind_addr.is_empty()
            && self.ws_bind_addr.parse::<std::net::SocketAddr>().is_err()
        {
            tracing::warn!(
                "invalid ws_bind_addr '{}', disabling WebSocket listener",
                self.ws_bind_addr
            );
            self.ws_bind_addr.clear();
        }
    }
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
            max_peers_per_room: 10,
            password: String::new(),
            ws_bind_addr: "0.0.0.0:4434".to_string(),
        }
    }
}
