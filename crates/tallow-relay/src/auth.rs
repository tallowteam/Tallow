//! Client authentication for relay
//!
//! v1: Open relay — no authentication required (anonymous file transfer).
//! Future versions may add token-based or public-key authentication.

/// Check if a connection should be allowed
///
/// v1: Always allows connections (open relay model).
/// Rate limiting and room limits provide protection against abuse.
pub fn allow_connection() -> bool {
    true
}
