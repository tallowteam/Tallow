//! Relay password authentication
//!
//! BLAKE3-based password verification for relay access control.
//! Passwords are never stored or transmitted in plaintext — only
//! their BLAKE3 hashes are compared using constant-time operations.

use subtle::ConstantTimeEq;

/// Verify a client-provided password hash against the relay's configured password
///
/// # Behavior
///
/// - If `relay_password` is empty, the relay is open — always returns `true`.
/// - If `relay_password` is non-empty and `client_hash` is `None`, returns `false`.
/// - If `relay_password` is non-empty and `client_hash` is `Some`, hashes the
///   relay password with BLAKE3 and compares using constant-time equality.
pub fn verify_relay_password(client_hash: Option<&[u8; 32]>, relay_password: &str) -> bool {
    if relay_password.is_empty() {
        return true;
    }

    let Some(client) = client_hash else {
        return false;
    };

    let expected = hash_relay_password(relay_password);
    client.ct_eq(&expected).into()
}

/// Hash a relay password with BLAKE3
///
/// Returns the 32-byte BLAKE3 digest of the password bytes.
pub fn hash_relay_password(password: &str) -> [u8; 32] {
    blake3::hash(password.as_bytes()).into()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_open_relay_allows_all() {
        let hash = hash_relay_password("anything");
        assert!(verify_relay_password(Some(&hash), ""));
    }

    #[test]
    fn test_open_relay_allows_none() {
        assert!(verify_relay_password(None, ""));
    }

    #[test]
    fn test_correct_password() {
        let hash = hash_relay_password("secretpass");
        assert!(verify_relay_password(Some(&hash), "secretpass"));
    }

    #[test]
    fn test_wrong_password() {
        let hash = hash_relay_password("wrongpass");
        assert!(!verify_relay_password(Some(&hash), "secretpass"));
    }

    #[test]
    fn test_no_password_provided() {
        assert!(!verify_relay_password(None, "secretpass"));
    }

    #[test]
    fn test_hash_deterministic() {
        let a = hash_relay_password("test123");
        let b = hash_relay_password("test123");
        assert_eq!(a, b);
    }

    #[test]
    fn test_hash_different_inputs() {
        let a = hash_relay_password("password1");
        let b = hash_relay_password("password2");
        assert_ne!(a, b);
    }
}
