//! SOCKS5 proxy connector

use crate::Result;
use std::net::SocketAddr;

/// SOCKS5 proxy connector
#[derive(Debug)]
pub struct Socks5Connector {
    #[allow(dead_code)]
    proxy_addr: SocketAddr,
    #[allow(dead_code)]
    username: Option<String>,
    #[allow(dead_code)]
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

    /// Set authentication credentials
    pub fn with_auth(mut self, username: String, password: String) -> Self {
        self.username = Some(username);
        self.password = Some(password);
        self
    }

    /// Connect to target through SOCKS5 proxy
    pub async fn connect(&self, _target: SocketAddr) -> Result<()> {
        todo!("Implement SOCKS5 connection")
    }
}
