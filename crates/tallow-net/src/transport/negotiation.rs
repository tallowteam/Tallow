//! Transport protocol negotiation

use crate::{NetworkError, Result};

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

/// Negotiate transport protocol with peer.
///
/// Finds the highest-priority protocol supported by both sides.
/// Priority is determined by position in `local_prefs` (first = highest).
pub async fn negotiate(
    local_prefs: &[TransportProtocol],
    remote_prefs: &[TransportProtocol],
) -> Result<TransportProtocol> {
    // Find the first local preference that the remote also supports
    for local in local_prefs {
        if remote_prefs.contains(local) {
            tracing::debug!("Negotiated transport protocol: {:?}", local);
            return Ok(*local);
        }
    }

    Err(NetworkError::ProtocolNegotiation(
        "No common transport protocol found".to_string(),
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_negotiate_common_protocol() {
        let local = [TransportProtocol::Quic, TransportProtocol::TcpTls];
        let remote = [TransportProtocol::TcpTls, TransportProtocol::Quic];
        let result = negotiate(&local, &remote).await.unwrap();
        assert_eq!(result, TransportProtocol::Quic);
    }

    #[tokio::test]
    async fn test_negotiate_no_common() {
        let local = [TransportProtocol::Quic];
        let remote = [TransportProtocol::TcpTls];
        assert!(negotiate(&local, &remote).await.is_err());
    }

    #[tokio::test]
    async fn test_negotiate_single_match() {
        let local = [TransportProtocol::TcpTls];
        let remote = [TransportProtocol::TcpTls];
        let result = negotiate(&local, &remote).await.unwrap();
        assert_eq!(result, TransportProtocol::TcpTls);
    }

    #[tokio::test]
    async fn test_negotiate_empty_prefs() {
        let local: [TransportProtocol; 0] = [];
        let remote = [TransportProtocol::Quic];
        assert!(negotiate(&local, &remote).await.is_err());
    }
}
