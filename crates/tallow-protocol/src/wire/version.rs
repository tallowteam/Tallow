//! Protocol version negotiation

use crate::{ProtocolError, Result};

/// Current protocol version
pub const PROTOCOL_VERSION: u32 = 1;

/// Minimum supported protocol version
pub const MIN_PROTOCOL_VERSION: u32 = 1;

/// Negotiate protocol version with peer
pub fn negotiate_version(local: u32, remote: u32) -> Result<u32> {
    if remote < MIN_PROTOCOL_VERSION {
        return Err(ProtocolError::VersionMismatch { local, remote });
    }

    Ok(local.min(remote))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_negotiate_same_version() {
        assert_eq!(negotiate_version(1, 1).unwrap(), 1);
    }

    #[test]
    fn test_negotiate_lower_remote() {
        assert_eq!(negotiate_version(2, 1).unwrap(), 1);
    }

    #[test]
    fn test_negotiate_lower_local() {
        assert_eq!(negotiate_version(1, 2).unwrap(), 1);
    }
}
