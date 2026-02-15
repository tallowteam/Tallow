//! Transport protocol negotiation

use crate::Result;

/// Transport protocol types
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TransportProtocol {
    /// QUIC (UDP-based)
    Quic,
    /// TCP with TLS
    TcpTls,
    /// WebRTC data channels
    WebRtc,
}

/// Negotiate transport protocol with peer
pub async fn negotiate(_local_prefs: &[TransportProtocol], _remote_prefs: &[TransportProtocol]) -> Result<TransportProtocol> {
    todo!("Implement protocol negotiation")
}
