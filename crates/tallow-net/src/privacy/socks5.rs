//! SOCKS5 proxy connector using tokio-socks

use crate::error::NetworkError;
use crate::Result;
use std::net::SocketAddr;
use tokio::net::TcpStream;
use tokio_socks::tcp::Socks5Stream;

/// SOCKS5 proxy connector for Tor integration
#[derive(Debug, Clone)]
pub struct Socks5Connector {
    /// Proxy address (e.g., 127.0.0.1:9050 for Tor)
    proxy_addr: SocketAddr,
    /// Optional username for authentication
    username: Option<String>,
    /// Optional password for authentication
    password: Option<String>,
}

impl Socks5Connector {
    /// Create a new SOCKS5 connector
    pub fn new(proxy_addr: SocketAddr) -> Self {
        Self {
            proxy_addr,
            username: None,
            password: None,
        }
    }

    /// Parse a proxy URL (e.g., "socks5://127.0.0.1:9050")
    pub fn from_url(url: &str) -> Result<Self> {
        let addr_str = url
            .strip_prefix("socks5://")
            .or_else(|| url.strip_prefix("socks5h://"))
            .unwrap_or(url);

        let addr: SocketAddr = addr_str.parse().map_err(|e| {
            NetworkError::ConnectionFailed(format!(
                "Invalid SOCKS5 proxy address '{}': {}",
                addr_str, e
            ))
        })?;

        Ok(Self::new(addr))
    }

    /// Set authentication credentials
    pub fn with_auth(mut self, username: String, password: String) -> Self {
        self.username = Some(username);
        self.password = Some(password);
        self
    }

    /// Connect to a target address through the SOCKS5 proxy
    pub async fn connect(&self, target: SocketAddr) -> Result<TcpStream> {
        let stream = if let (Some(user), Some(pass)) = (&self.username, &self.password) {
            Socks5Stream::connect_with_password(self.proxy_addr, target, user, pass)
                .await
                .map_err(|e| {
                    NetworkError::ConnectionFailed(format!(
                        "SOCKS5 connection to {} via {} failed: {}",
                        target, self.proxy_addr, e
                    ))
                })?
        } else {
            Socks5Stream::connect(self.proxy_addr, target)
                .await
                .map_err(|e| {
                    NetworkError::ConnectionFailed(format!(
                        "SOCKS5 connection to {} via {} failed: {}",
                        target, self.proxy_addr, e
                    ))
                })?
        };

        Ok(stream.into_inner())
    }

    /// Connect to a hostname through the SOCKS5 proxy (DNS resolved by proxy)
    ///
    /// This is the preferred mode for Tor — the hostname is sent to the proxy
    /// so DNS resolution happens inside the Tor network.
    pub async fn connect_hostname(&self, host: &str, port: u16) -> Result<TcpStream> {
        let target = (host, port);

        let stream = if let (Some(user), Some(pass)) = (&self.username, &self.password) {
            Socks5Stream::connect_with_password(self.proxy_addr, target, user, pass)
                .await
                .map_err(|e| {
                    NetworkError::ConnectionFailed(format!(
                        "SOCKS5 connection to {}:{} via {} failed: {}",
                        host, port, self.proxy_addr, e
                    ))
                })?
        } else {
            Socks5Stream::connect(self.proxy_addr, target)
                .await
                .map_err(|e| {
                    NetworkError::ConnectionFailed(format!(
                        "SOCKS5 connection to {}:{} via {} failed: {}",
                        host, port, self.proxy_addr, e
                    ))
                })?
        };

        Ok(stream.into_inner())
    }

    /// Get the proxy address
    pub fn proxy_addr(&self) -> SocketAddr {
        self.proxy_addr
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_from_url() {
        let conn = Socks5Connector::from_url("socks5://127.0.0.1:9050").unwrap();
        assert_eq!(conn.proxy_addr.port(), 9050);
    }

    #[test]
    fn test_from_url_no_prefix() {
        let conn = Socks5Connector::from_url("127.0.0.1:1080").unwrap();
        assert_eq!(conn.proxy_addr.port(), 1080);
    }

    #[test]
    fn test_with_auth() {
        let conn = Socks5Connector::new("127.0.0.1:9050".parse().unwrap())
            .with_auth("user".to_string(), "pass".to_string());
        assert!(conn.username.is_some());
        assert!(conn.password.is_some());
    }
}
