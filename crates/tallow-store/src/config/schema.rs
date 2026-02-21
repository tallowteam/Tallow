//! Configuration schema

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
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
    /// Path aliases for quick directory access
    #[serde(default)]
    pub aliases: HashMap<String, PathBuf>,
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

/// Default number of words in a generated code phrase
fn default_word_count() -> u8 {
    4
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
    /// Default bandwidth throttle (e.g., "10MB", empty = unlimited)
    #[serde(default)]
    pub default_throttle: String,
    /// Default number of words in code phrase (3-8)
    #[serde(default = "default_word_count")]
    pub default_words: u8,
    /// Default exclude patterns (comma-separated, gitignore syntax)
    #[serde(default)]
    pub default_exclude: String,
    /// Respect .gitignore by default when sending directories
    #[serde(default)]
    pub default_gitignore: bool,
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
    /// Default SOCKS5 proxy address (e.g., "socks5://127.0.0.1:9050")
    #[serde(default)]
    pub default_proxy: String,
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
