//! Configuration schema

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Main Tallow configuration
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct TallowConfig {
    /// Network settings
    pub network: NetworkConfig,
    /// Transfer settings
    pub transfer: TransferConfig,
    /// Privacy settings
    pub privacy: PrivacyConfig,
    /// UI settings
    pub ui: UiConfig,
}

/// Network configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkConfig {
    /// Enable local network discovery
    pub enable_mdns: bool,
    /// Enable relay fallback
    pub enable_relay: bool,
    /// Custom relay servers
    pub relay_servers: Vec<String>,
    /// STUN servers
    pub stun_servers: Vec<String>,
    /// TURN servers
    pub turn_servers: Vec<String>,
}

/// Transfer configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransferConfig {
    /// Default download directory
    pub download_dir: PathBuf,
    /// Auto-accept from trusted contacts
    pub auto_accept_trusted: bool,
    /// Enable compression
    pub enable_compression: bool,
    /// Chunk size in bytes
    pub chunk_size: usize,
}

/// Privacy configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrivacyConfig {
    /// Strip metadata from files
    pub strip_metadata: bool,
    /// Encrypt filenames
    pub encrypt_filenames: bool,
    /// Enable onion routing
    pub enable_onion_routing: bool,
    /// Use DoH for DNS
    pub use_doh: bool,
}

/// UI configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UiConfig {
    /// Theme (dark/light/auto)
    pub theme: String,
    /// Show transfer notifications
    pub show_notifications: bool,
    /// Language code
    pub language: String,
}
