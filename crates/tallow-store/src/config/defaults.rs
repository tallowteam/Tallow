//! Default configuration values

use super::schema::*;
use std::path::PathBuf;

impl Default for NetworkConfig {
    fn default() -> Self {
        Self {
            enable_mdns: true,
            enable_relay: true,
            relay_servers: vec!["relay.tallow.app:443".to_string()],
            stun_servers: vec!["stun.l.google.com:19302".to_string()],
            turn_servers: Vec::new(),
        }
    }
}

impl Default for TransferConfig {
    fn default() -> Self {
        Self {
            download_dir: PathBuf::from("~/Downloads"),
            auto_accept_trusted: false,
            enable_compression: true,
            chunk_size: 256 * 1024, // 256 KB
        }
    }
}

impl Default for PrivacyConfig {
    fn default() -> Self {
        Self {
            strip_metadata: true,
            encrypt_filenames: false,
            enable_onion_routing: false,
            use_doh: false,
        }
    }
}

impl Default for UiConfig {
    fn default() -> Self {
        Self {
            theme: "auto".to_string(),
            show_notifications: true,
            language: "en".to_string(),
        }
    }
}
