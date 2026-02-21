//! Shared proxy configuration builder
//!
//! Constructs a `ProxyConfig` from CLI flags, environment variables,
//! and config file settings. Used by all transfer commands (send,
//! receive, sync, watch, clip) to avoid duplicated proxy logic.

use std::io;
use tallow_net::privacy::ProxyConfig;

/// Build ProxyConfig from CLI flags, env vars, and config
///
/// Priority (highest first):
/// 1. `--tor` (forces `socks5://127.0.0.1:9050` + `tor_mode`)
/// 2. `--proxy <url>`
/// 3. `TALLOW_PROXY` env var (handled by clap `env` attribute on `--proxy`)
/// 4. `privacy.default_proxy` in config file
/// 5. `None` (direct connection)
pub async fn build_proxy_config(
    tor: bool,
    proxy: &Option<String>,
    json: bool,
) -> io::Result<Option<ProxyConfig>> {
    // Priority 1: --tor flag
    if tor {
        // Verify Tor is running by probing the SOCKS5 port
        let tor_reachable = tokio::time::timeout(
            std::time::Duration::from_secs(2),
            tokio::net::TcpStream::connect("127.0.0.1:9050"),
        )
        .await;

        match tor_reachable {
            Ok(Ok(_stream)) => {
                return Ok(Some(ProxyConfig::tor_default()));
            }
            _ => {
                let msg = "Tor is not running on 127.0.0.1:9050.\n\
                           Install Tor and start the service:\n\
                           - Linux/macOS: sudo systemctl start tor  (or  brew services start tor)\n\
                           - Windows: Start Tor Browser or Tor Expert Bundle\n\
                           Or use --proxy to specify a custom SOCKS5 proxy.";
                if json {
                    println!(
                        "{}",
                        serde_json::json!({
                            "event": "error",
                            "message": "Tor not running on 127.0.0.1:9050",
                        })
                    );
                }
                return Err(io::Error::new(io::ErrorKind::ConnectionRefused, msg));
            }
        }
    }

    // Priority 2/3: --proxy flag (or TALLOW_PROXY env var, handled by clap)
    if let Some(ref url) = proxy {
        let mut config = ProxyConfig::from_url(url)
            .map_err(|e| io::Error::other(format!("Invalid proxy URL '{}': {}", url, e)))?;

        // Heuristic: if the proxy is localhost:9050, treat it as Tor
        if config.socks5_addr.ip().is_loopback() && config.socks5_addr.port() == 9050 {
            config.tor_mode = true;
        }

        return Ok(Some(config));
    }

    // Priority 4: config file default_proxy
    if let Ok(cfg) = tallow_store::config::load_config() {
        if !cfg.privacy.default_proxy.is_empty() {
            let mut config = ProxyConfig::from_url(&cfg.privacy.default_proxy).map_err(|e| {
                io::Error::other(format!(
                    "Invalid default_proxy in config '{}': {}",
                    cfg.privacy.default_proxy, e
                ))
            })?;

            // Same localhost:9050 heuristic
            if config.socks5_addr.ip().is_loopback() && config.socks5_addr.port() == 9050 {
                config.tor_mode = true;
            }

            return Ok(Some(config));
        }
    }

    // Priority 5: no proxy
    Ok(None)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_no_flags_returns_none() {
        let result = build_proxy_config(false, &None, false).await.unwrap();
        assert!(result.is_none());
    }

    #[tokio::test]
    async fn test_proxy_flag_parses_url() {
        let proxy_url = Some("socks5://127.0.0.1:1080".to_string());
        let result = build_proxy_config(false, &proxy_url, false).await.unwrap();
        assert!(result.is_some());
        let cfg = result.unwrap();
        assert_eq!(cfg.socks5_addr.port(), 1080);
        assert!(!cfg.tor_mode);
    }

    #[tokio::test]
    async fn test_proxy_flag_localhost_9050_is_tor() {
        let proxy_url = Some("socks5://127.0.0.1:9050".to_string());
        let result = build_proxy_config(false, &proxy_url, false).await.unwrap();
        assert!(result.is_some());
        let cfg = result.unwrap();
        assert!(cfg.tor_mode);
    }

    #[tokio::test]
    async fn test_tor_flag_without_tor_running() {
        // --tor without Tor running should return an error
        let result = build_proxy_config(true, &None, false).await;
        // This will error because Tor is not running in test env
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_invalid_proxy_url() {
        let proxy_url = Some("not-a-valid-url".to_string());
        let result = build_proxy_config(false, &proxy_url, false).await;
        assert!(result.is_err());
    }
}
