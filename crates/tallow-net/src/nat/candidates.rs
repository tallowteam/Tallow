//! ICE-like candidate gathering for P2P direct connection
//!
//! Gathers local host addresses and STUN server-reflexive addresses
//! for exchanging with the remote peer via the relay.

use crate::error::NetworkError;
use crate::Result;
use std::net::{IpAddr, Ipv4Addr, SocketAddr};

/// Candidate type for P2P connection
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CandidateType {
    /// Local network interface address
    Host = 0,
    /// STUN server-reflexive (public) address
    ServerReflexive = 1,
    /// UPnP port-mapped address
    UPnP = 2,
}

/// A network candidate for P2P direct connection
#[derive(Debug, Clone)]
pub struct Candidate {
    /// Socket address (IP + port)
    pub addr: SocketAddr,
    /// Type of candidate
    pub candidate_type: CandidateType,
    /// Priority (higher = preferred). Host=100, SRFLX=50, UPnP=30.
    pub priority: u32,
}

/// Gather all available candidates for P2P connection.
///
/// Binds to `local_port` for STUN discovery so the discovered public address
/// maps to the same port the quinn Endpoint will use.
///
/// Returns candidates sorted by priority (highest first).
pub async fn gather_candidates(local_port: u16) -> Vec<Candidate> {
    let mut candidates = Vec::new();

    // 1. Host candidates: local network interfaces
    if let Ok(ip) = get_local_ip() {
        candidates.push(Candidate {
            addr: SocketAddr::new(ip, local_port),
            candidate_type: CandidateType::Host,
            priority: 100,
        });
    }

    // 2. Server-reflexive candidate: STUN discovery from the same port
    match crate::nat::stun::StunClient::from_hostname(crate::nat::stun::GOOGLE_STUN).await {
        Ok(client) => match client.discover_from_port(local_port).await {
            Ok(result) => {
                candidates.push(Candidate {
                    addr: result.mapped_addr,
                    candidate_type: CandidateType::ServerReflexive,
                    priority: 50,
                });
            }
            Err(e) => {
                tracing::warn!("STUN discovery failed: {}", e);
            }
        },
        Err(e) => {
            tracing::warn!("STUN client creation failed: {}", e);
        }
    }

    // Sort by priority descending
    candidates.sort_by(|a, b| b.priority.cmp(&a.priority));
    candidates
}

/// Get the primary local IP address (non-loopback, non-link-local).
fn get_local_ip() -> Result<IpAddr> {
    // Bind a UDP socket to an external address to discover the default route IP
    let socket = std::net::UdpSocket::bind("0.0.0.0:0")
        .map_err(|e| NetworkError::NatTraversal(format!("bind failed: {}", e)))?;
    socket
        .connect("8.8.8.8:80")
        .map_err(|e| NetworkError::NatTraversal(format!("connect failed: {}", e)))?;
    let addr = socket
        .local_addr()
        .map_err(|e| NetworkError::NatTraversal(format!("local_addr failed: {}", e)))?;
    Ok(addr.ip())
}

/// Validate a candidate address is safe to connect to.
///
/// Rejects loopback, link-local, broadcast, multicast, and unspecified addresses.
/// Prevents an attacker from redirecting connections to unintended addresses.
pub fn validate_candidate_addr(addr: &SocketAddr) -> bool {
    let ip = addr.ip();
    if ip.is_loopback() || ip.is_multicast() || ip.is_unspecified() {
        return false;
    }
    // Check link-local
    match ip {
        IpAddr::V4(v4) => {
            // 169.254.0.0/16 link-local
            if v4.octets()[0] == 169 && v4.octets()[1] == 254 {
                return false;
            }
            // 255.255.255.255 broadcast
            if v4 == Ipv4Addr::BROADCAST {
                return false;
            }
        }
        IpAddr::V6(v6) => {
            // fe80::/10 link-local
            let segments = v6.segments();
            if segments[0] & 0xffc0 == 0xfe80 {
                return false;
            }
        }
    }
    // Port must be valid (1-65535)
    addr.port() > 0
}

/// Encode a SocketAddr into bytes for wire transport.
///
/// IPv4: 6 bytes (4 IP + 2 port). IPv6: 18 bytes (16 IP + 2 port).
pub fn encode_socket_addr(addr: SocketAddr) -> Vec<u8> {
    let mut buf = Vec::new();
    match addr.ip() {
        IpAddr::V4(v4) => {
            buf.extend_from_slice(&v4.octets());
            buf.extend_from_slice(&addr.port().to_be_bytes());
        }
        IpAddr::V6(v6) => {
            buf.extend_from_slice(&v6.octets());
            buf.extend_from_slice(&addr.port().to_be_bytes());
        }
    }
    buf
}

/// Decode a SocketAddr from bytes. Inverse of `encode_socket_addr`.
pub fn decode_socket_addr(bytes: &[u8]) -> Result<SocketAddr> {
    match bytes.len() {
        6 => {
            let ip = Ipv4Addr::new(bytes[0], bytes[1], bytes[2], bytes[3]);
            let port = u16::from_be_bytes([bytes[4], bytes[5]]);
            Ok(SocketAddr::new(IpAddr::V4(ip), port))
        }
        18 => {
            let mut octets = [0u8; 16];
            octets.copy_from_slice(&bytes[..16]);
            let ip = std::net::Ipv6Addr::from(octets);
            let port = u16::from_be_bytes([bytes[16], bytes[17]]);
            Ok(SocketAddr::new(IpAddr::V6(ip), port))
        }
        n => Err(NetworkError::NatTraversal(format!(
            "Invalid candidate address length: {} (expected 6 or 18)",
            n
        ))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encode_decode_ipv4() {
        let addr: SocketAddr = "192.168.1.42:8080".parse().unwrap();
        let encoded = encode_socket_addr(addr);
        assert_eq!(encoded.len(), 6);
        let decoded = decode_socket_addr(&encoded).unwrap();
        assert_eq!(decoded, addr);
    }

    #[test]
    fn test_encode_decode_ipv6() {
        let addr: SocketAddr = "[::1]:4433".parse().unwrap();
        let encoded = encode_socket_addr(addr);
        assert_eq!(encoded.len(), 18);
        let decoded = decode_socket_addr(&encoded).unwrap();
        assert_eq!(decoded, addr);
    }

    #[test]
    fn test_validate_rejects_loopback() {
        assert!(!validate_candidate_addr(
            &"127.0.0.1:1234".parse().unwrap()
        ));
        assert!(!validate_candidate_addr(&"[::1]:1234".parse().unwrap()));
    }

    #[test]
    fn test_validate_rejects_link_local() {
        assert!(!validate_candidate_addr(
            &"169.254.1.1:1234".parse().unwrap()
        ));
    }

    #[test]
    fn test_validate_rejects_broadcast() {
        assert!(!validate_candidate_addr(
            &"255.255.255.255:1234".parse().unwrap()
        ));
    }

    #[test]
    fn test_validate_rejects_multicast() {
        assert!(!validate_candidate_addr(
            &"224.0.0.1:1234".parse().unwrap()
        ));
    }

    #[test]
    fn test_validate_rejects_unspecified() {
        assert!(!validate_candidate_addr(
            &"0.0.0.0:1234".parse().unwrap()
        ));
    }

    #[test]
    fn test_validate_rejects_port_zero() {
        assert!(!validate_candidate_addr(
            &"192.168.1.1:0".parse().unwrap()
        ));
    }

    #[test]
    fn test_validate_accepts_valid() {
        assert!(validate_candidate_addr(
            &"192.168.1.42:8080".parse().unwrap()
        ));
        assert!(validate_candidate_addr(
            &"8.8.8.8:4433".parse().unwrap()
        ));
    }

    #[test]
    fn test_decode_invalid_length() {
        assert!(decode_socket_addr(&[1, 2, 3]).is_err());
    }
}
