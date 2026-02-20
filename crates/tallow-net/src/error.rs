//! Network error types

use std::fmt;

/// Network layer errors
#[derive(Debug)]
pub enum NetworkError {
    /// Connection failed to establish
    ConnectionFailed(String),
    /// Operation timed out
    Timeout,
    /// DNS resolution failed
    DnsResolution(String),
    /// NAT traversal failed
    NatTraversal(String),
    /// Relay server error
    RelayError(String),
    /// Protocol negotiation failed
    ProtocolNegotiation(String),
    /// TLS error
    TlsError(String),
    /// Discovery error
    DiscoveryError(String),
    /// Relay authentication failed
    AuthenticationFailed,
    /// IO error
    Io(std::io::Error),
}

impl fmt::Display for NetworkError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::ConnectionFailed(msg) => write!(f, "Connection failed: {}", msg),
            Self::Timeout => write!(f, "Operation timed out"),
            Self::DnsResolution(msg) => write!(f, "DNS resolution failed: {}", msg),
            Self::NatTraversal(msg) => write!(f, "NAT traversal failed: {}", msg),
            Self::RelayError(msg) => write!(f, "Relay error: {}", msg),
            Self::ProtocolNegotiation(msg) => write!(f, "Protocol negotiation failed: {}", msg),
            Self::TlsError(msg) => write!(f, "TLS error: {}", msg),
            Self::DiscoveryError(msg) => write!(f, "Discovery error: {}", msg),
            Self::AuthenticationFailed => write!(f, "Relay authentication failed"),
            Self::Io(err) => write!(f, "IO error: {}", err),
        }
    }
}

impl std::error::Error for NetworkError {}

impl From<std::io::Error> for NetworkError {
    fn from(err: std::io::Error) -> Self {
        Self::Io(err)
    }
}
