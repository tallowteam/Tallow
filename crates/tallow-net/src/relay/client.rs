//! Relay client for connecting through relay servers
//!
//! Connects to a relay server via QUIC (default) or TCP+TLS through
//! a SOCKS5 proxy, joins a room by code hash, and forwards encrypted
//! data to/from the paired peer.

use crate::privacy::ProxyConfig;
use crate::{NetworkError, Result};
use std::net::SocketAddr;
use tracing::info;

/// Transport backing for the relay connection
///
/// Dispatches to QUIC (default, no proxy) or proxied TCP+TLS (when proxy active).
enum RelayTransport {
    /// QUIC transport (default, direct connection)
    #[cfg(feature = "quic")]
    Quic(crate::transport::QuicTransport),
    /// TCP+TLS routed through a SOCKS5 proxy
    Proxied(Box<crate::transport::ProxiedTcpTlsTransport>),
}

/// Relay client for connecting through relay servers
pub struct RelayClient {
    relay_addr: SocketAddr,
    transport: Option<RelayTransport>,
    /// Whether the peer was already in the room when we joined
    peer_present: bool,
    /// Optional proxy configuration for SOCKS5/Tor routing
    proxy_config: Option<ProxyConfig>,
    /// Relay hostname (for Tor DNS-via-proxy)
    relay_hostname: Option<String>,
}

impl std::fmt::Debug for RelayClient {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("RelayClient")
            .field("relay_addr", &self.relay_addr)
            .field("peer_present", &self.peer_present)
            .field("has_proxy", &self.proxy_config.is_some())
            .finish()
    }
}

impl RelayClient {
    /// Create a new relay client targeting the given relay address (direct, no proxy)
    pub fn new(relay_addr: SocketAddr) -> Self {
        Self {
            relay_addr,
            transport: None,
            peer_present: false,
            proxy_config: None,
            relay_hostname: None,
        }
    }

    /// Create a new relay client that routes through a SOCKS5 proxy
    ///
    /// For Tor mode, the hostname is sent to the proxy for DNS resolution
    /// inside the Tor network (no local DNS leak).
    pub fn new_with_proxy(relay_host: &str, relay_port: u16, proxy: ProxyConfig) -> Self {
        // In Tor/hostname mode we don't have an IP yet; use a placeholder
        // that will be overridden by connect_proxied() hostname mode.
        let relay_addr = SocketAddr::from(([0, 0, 0, 0], relay_port));
        Self {
            relay_addr,
            transport: None,
            peer_present: false,
            proxy_config: Some(proxy),
            relay_hostname: Some(relay_host.to_string()),
        }
    }

    /// Set proxy configuration on an existing relay client
    ///
    /// Used when the relay is an IP literal but should still be routed
    /// through SOCKS5.
    pub fn set_proxy(&mut self, proxy: ProxyConfig) {
        self.proxy_config = Some(proxy);
    }

    /// Connect to the relay server and join a room
    ///
    /// # Arguments
    ///
    /// * `room_id` - BLAKE3 hash of the code phrase (32 bytes)
    /// * `password_hash` - Optional BLAKE3 hash of relay password
    ///
    /// # Returns
    ///
    /// Whether the peer was already waiting in the room
    ///
    /// # Errors
    ///
    /// Returns `NetworkError::AuthenticationFailed` if the relay rejects the password.
    pub async fn connect(
        &mut self,
        room_id: &[u8; 32],
        password_hash: Option<&[u8; 32]>,
    ) -> Result<bool> {
        use crate::Transport;

        // Build the RoomJoin payload (shared between transport types)
        let join_payload = build_room_join_payload(room_id, password_hash);

        if let Some(ref proxy) = self.proxy_config {
            // Proxy path: TCP+TLS through SOCKS5
            let mut transport = crate::transport::ProxiedTcpTlsTransport::new(
                proxy,
                self.relay_hostname.clone(),
                self.relay_addr.port(),
            );
            transport.connect(self.relay_addr).await?;
            info!(
                "connected to relay via SOCKS5 proxy at {}",
                proxy.socks5_addr
            );

            transport.send(&join_payload).await?;

            // Read response
            let mut buf = [0u8; 256];
            let n = transport.receive(&mut buf).await?;

            if n >= 1 && buf[0] == 0xFF {
                transport.close().await?;
                return Err(NetworkError::AuthenticationFailed);
            }

            if n >= 1 {
                self.peer_present = buf[0] == 1;
            }

            info!("joined room via proxy, peer_present={}", self.peer_present);
            self.transport = Some(RelayTransport::Proxied(Box::new(transport)));
            Ok(self.peer_present)
        } else {
            // Direct path: QUIC (original behavior)
            #[cfg(feature = "quic")]
            {
                let mut transport = crate::transport::QuicTransport::new();
                transport.connect(self.relay_addr).await?;
                info!("connected to relay at {}", self.relay_addr);

                transport.send(&join_payload).await?;

                let mut buf = [0u8; 256];
                let n = transport.receive(&mut buf).await?;

                if n >= 1 && buf[0] == 0xFF {
                    transport.close().await;
                    return Err(NetworkError::AuthenticationFailed);
                }

                if n >= 1 {
                    self.peer_present = buf[0] == 1;
                }

                info!("joined room, peer_present={}", self.peer_present);
                self.transport = Some(RelayTransport::Quic(transport));
                Ok(self.peer_present)
            }

            #[cfg(not(feature = "quic"))]
            {
                Err(NetworkError::ConnectionFailed(
                    "no transport available: QUIC feature disabled and no proxy configured"
                        .to_string(),
                ))
            }
        }
    }

    /// Connect to the relay server with a raw join payload.
    ///
    /// Establishes the transport, sends the provided bytes (e.g. a
    /// postcard-serialized `RoomJoinMulti`), and returns the raw response.
    /// The caller is responsible for serializing the join message and
    /// interpreting the response.
    ///
    /// Returns `Err(AuthenticationFailed)` if the relay rejects authentication.
    pub async fn connect_raw(&mut self, join_payload: &[u8]) -> Result<Vec<u8>> {
        use crate::Transport;

        if let Some(ref proxy) = self.proxy_config {
            let mut transport = crate::transport::ProxiedTcpTlsTransport::new(
                proxy,
                self.relay_hostname.clone(),
                self.relay_addr.port(),
            );
            transport.connect(self.relay_addr).await?;
            info!(
                "connected to relay via SOCKS5 proxy at {}",
                proxy.socks5_addr
            );

            transport.send(join_payload).await?;

            let mut buf = vec![0u8; 16384];
            let n = transport.receive(&mut buf).await?;

            if n >= 1 && buf[0] == 0xFF {
                transport.close().await?;
                return Err(NetworkError::AuthenticationFailed);
            }

            buf.truncate(n);
            self.transport = Some(RelayTransport::Proxied(Box::new(transport)));
            Ok(buf)
        } else {
            #[cfg(feature = "quic")]
            {
                let mut transport = crate::transport::QuicTransport::new();
                transport.connect(self.relay_addr).await?;
                info!("connected to relay at {}", self.relay_addr);

                transport.send(join_payload).await?;

                let mut buf = vec![0u8; 16384];
                let n = transport.receive(&mut buf).await?;

                if n >= 1 && buf[0] == 0xFF {
                    transport.close().await;
                    return Err(NetworkError::AuthenticationFailed);
                }

                buf.truncate(n);
                self.transport = Some(RelayTransport::Quic(transport));
                Ok(buf)
            }

            #[cfg(not(feature = "quic"))]
            {
                Err(NetworkError::ConnectionFailed(
                    "no transport available: QUIC feature disabled and no proxy configured"
                        .to_string(),
                ))
            }
        }
    }

    /// Wait for the peer to arrive (blocks until PeerArrived notification)
    pub async fn wait_for_peer(&mut self) -> Result<()> {
        if self.peer_present {
            return Ok(());
        }

        use crate::Transport;
        let mut buf = [0u8; 256];

        let n = match self.transport.as_mut() {
            #[cfg(feature = "quic")]
            Some(RelayTransport::Quic(t)) => t.receive(&mut buf).await?,
            Some(RelayTransport::Proxied(t)) => t.receive(&mut buf).await?,
            None => {
                return Err(NetworkError::ConnectionFailed("not connected".to_string()));
            }
        };

        if n >= 1 && buf[0] == 2 {
            info!("peer arrived");
            self.peer_present = true;
        }

        Ok(())
    }

    /// Send data to the paired peer through the relay
    pub async fn forward(&mut self, data: &[u8]) -> Result<()> {
        use crate::Transport;

        match self.transport.as_mut() {
            #[cfg(feature = "quic")]
            Some(RelayTransport::Quic(t)) => {
                t.send(data).await?;
            }
            Some(RelayTransport::Proxied(t)) => {
                t.send(data).await?;
            }
            None => {
                return Err(NetworkError::ConnectionFailed("not connected".to_string()));
            }
        }
        Ok(())
    }

    /// Receive data from the paired peer through the relay
    pub async fn receive(&mut self, buf: &mut [u8]) -> Result<usize> {
        use crate::Transport;

        match self.transport.as_mut() {
            #[cfg(feature = "quic")]
            Some(RelayTransport::Quic(t)) => t.receive(buf).await,
            Some(RelayTransport::Proxied(t)) => t.receive(buf).await,
            None => Err(NetworkError::ConnectionFailed("not connected".to_string())),
        }
    }

    /// Close the relay connection
    pub async fn close(&mut self) {
        match self.transport.take() {
            #[cfg(feature = "quic")]
            Some(RelayTransport::Quic(mut t)) => t.close().await,
            Some(RelayTransport::Proxied(mut t)) => {
                let _ = t.close().await;
            }
            None => {}
        }
    }

    /// Check if peer is present
    pub fn peer_present(&self) -> bool {
        self.peer_present
    }

    /// Get the relay address
    pub fn relay_addr(&self) -> SocketAddr {
        self.relay_addr
    }
}

/// Build the RoomJoin payload for the relay protocol
///
/// Format: [discriminant(1)][varint_len(1)][room_id(32)][option_disc(1)][...hash]
fn build_room_join_payload(room_id: &[u8; 32], password_hash: Option<&[u8; 32]>) -> Vec<u8> {
    let capacity = if password_hash.is_some() { 68 } else { 35 };
    let mut join_payload = Vec::with_capacity(capacity);
    join_payload.push(3); // RoomJoin discriminant (matches wire::Message enum position)
    join_payload.push(32); // varint length of room_id
    join_payload.extend_from_slice(room_id);

    match password_hash {
        None => {
            join_payload.push(0x00); // Option::None
        }
        Some(hash) => {
            join_payload.push(0x01); // Option::Some
            join_payload.push(32); // varint length of hash
            join_payload.extend_from_slice(hash);
        }
    }

    join_payload
}

/// `PeerChannel` implementation for relay connections.
///
/// Delegates to `forward()` and `receive()` methods, allowing relay connections
/// to be used interchangeably with direct LAN connections via `Box<dyn PeerChannel>`.
impl crate::transport::PeerChannel for RelayClient {
    async fn send_message(&mut self, data: &[u8]) -> Result<()> {
        self.forward(data).await
    }

    async fn receive_message(&mut self, buf: &mut [u8]) -> Result<usize> {
        self.receive(buf).await
    }

    async fn close(&mut self) {
        RelayClient::close(self).await;
    }

    fn transport_description(&self) -> String {
        if self.proxy_config.is_some() {
            format!("relay via proxy ({})", self.relay_addr)
        } else {
            format!("relay ({})", self.relay_addr)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_relay_client_new_unchanged() {
        let addr: SocketAddr = "127.0.0.1:4433".parse().unwrap();
        let client = RelayClient::new(addr);
        assert_eq!(client.relay_addr(), addr);
        assert!(!client.peer_present());
        assert!(client.proxy_config.is_none());
    }

    #[test]
    fn test_relay_client_new_with_proxy() {
        let proxy = ProxyConfig::tor_default();
        let client = RelayClient::new_with_proxy("relay.example.com", 4433, proxy);
        assert_eq!(client.relay_addr().port(), 4433);
        assert!(client.proxy_config.is_some());
        assert_eq!(client.relay_hostname.as_deref(), Some("relay.example.com"));
    }

    #[test]
    fn test_relay_client_set_proxy() {
        let addr: SocketAddr = "129.146.114.5:4433".parse().unwrap();
        let mut client = RelayClient::new(addr);
        assert!(client.proxy_config.is_none());

        client.set_proxy(ProxyConfig::tor_default());
        assert!(client.proxy_config.is_some());
    }

    #[test]
    fn test_build_room_join_payload_no_password() {
        let room_id = [0xAB; 32];
        let payload = build_room_join_payload(&room_id, None);
        assert_eq!(payload.len(), 35);
        assert_eq!(payload[0], 3); // discriminant
        assert_eq!(payload[1], 32); // varint len
        assert_eq!(&payload[2..34], &room_id);
        assert_eq!(payload[34], 0x00); // Option::None
    }

    #[test]
    fn test_build_room_join_payload_with_password() {
        let room_id = [0xAB; 32];
        let pw_hash = [0xCD; 32];
        let payload = build_room_join_payload(&room_id, Some(&pw_hash));
        assert_eq!(payload.len(), 68);
        assert_eq!(payload[0], 3);
        assert_eq!(payload[34], 0x01); // Option::Some
        assert_eq!(payload[35], 32); // varint len
        assert_eq!(&payload[36..68], &pw_hash);
    }
}
