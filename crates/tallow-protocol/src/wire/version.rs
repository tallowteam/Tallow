//! Protocol version negotiation

use super::Message;
use crate::{ProtocolError, Result};

/// Current protocol version
pub const PROTOCOL_VERSION: u32 = 2;

/// Minimum supported protocol version
pub const MIN_PROTOCOL_VERSION: u32 = 1;

/// Negotiate protocol version with peer
///
/// Selects the highest version both sides support,
/// or returns an error if no compatible version exists.
pub fn negotiate_version(local: u32, remote: u32) -> Result<u32> {
    if remote < MIN_PROTOCOL_VERSION {
        return Err(ProtocolError::VersionMismatch { local, remote });
    }

    Ok(local.min(remote))
}

/// Create a version request message for the current protocol
pub fn version_request() -> Message {
    Message::VersionRequest {
        supported_versions: vec![1, PROTOCOL_VERSION],
    }
}

/// Process a version request and produce a response
///
/// Returns `Ok(VersionResponse)` with the selected version,
/// or `Ok(VersionReject)` if no compatible version exists.
pub fn process_version_request(their_versions: &[u32]) -> Result<Message> {
    // Find the highest version we both support
    let mut best = None;
    for &v in their_versions {
        if (MIN_PROTOCOL_VERSION..=PROTOCOL_VERSION).contains(&v) {
            best = Some(best.map_or(v, |b: u32| b.max(v)));
        }
    }

    match best {
        Some(version) => Ok(Message::VersionResponse {
            selected_version: version,
        }),
        None => Ok(Message::VersionReject {
            reason: format!(
                "no compatible version: we support {}-{}, peer offers {:?}",
                MIN_PROTOCOL_VERSION, PROTOCOL_VERSION, their_versions
            ),
        }),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_negotiate_same_version() {
        assert_eq!(negotiate_version(2, 2).unwrap(), 2);
    }

    #[test]
    fn test_negotiate_lower_remote() {
        assert_eq!(negotiate_version(2, 1).unwrap(), 1);
    }

    #[test]
    fn test_negotiate_lower_local() {
        assert_eq!(negotiate_version(1, 2).unwrap(), 1);
    }

    #[test]
    fn test_version_request_message() {
        let msg = version_request();
        match msg {
            Message::VersionRequest { supported_versions } => {
                assert!(supported_versions.contains(&PROTOCOL_VERSION));
                assert!(supported_versions.contains(&1));
            }
            _ => panic!("expected VersionRequest"),
        }
    }

    #[test]
    fn test_process_compatible_request() {
        let response = process_version_request(&[1, 2]).unwrap();
        match response {
            Message::VersionResponse { selected_version } => {
                assert_eq!(selected_version, 2);
            }
            _ => panic!("expected VersionResponse"),
        }
    }

    #[test]
    fn test_process_incompatible_request() {
        let response = process_version_request(&[99, 100]).unwrap();
        match response {
            Message::VersionReject { .. } => {}
            _ => panic!("expected VersionReject"),
        }
    }
}
