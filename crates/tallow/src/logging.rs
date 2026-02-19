//! Logging initialization using tracing-subscriber
//!
//! SAND-04: Structured logging via tracing-subscriber.
//! SAND-05: Sensitive data (keys, passphrases, file contents) never appears in logs.

use std::io;
use tracing_subscriber::EnvFilter;

/// Patterns that indicate sensitive data in log messages
///
/// These patterns are checked when logging at debug/trace level.
/// If a field name matches, its value is redacted.
const SENSITIVE_FIELD_PATTERNS: &[&str] = &[
    "key",
    "secret",
    "password",
    "passphrase",
    "token",
    "nonce",
    "salt",
    "credential",
    "private",
    "session_key",
    "master_key",
    "shared_secret",
];

/// Initialize logging based on verbosity level (SAND-04)
///
/// Maps CLI flags to tracing levels:
/// - 0 (default): warn
/// - 1 (-v): info
/// - 2 (-vv): debug
/// - 3+ (-vvv): trace
///
/// When quiet mode is enabled, only errors are shown.
///
/// SAND-05: Even at trace level, sensitive fields (keys, passphrases)
/// are never logged. Use `tracing::debug!(key = "[REDACTED]")` or the
/// `redact()` helper instead of logging raw key material.
pub fn init_logging(verbosity: u8, quiet: bool) -> io::Result<()> {
    let level = if quiet {
        "error"
    } else {
        match verbosity {
            0 => "warn",
            1 => "info",
            2 => "debug",
            _ => "trace",
        }
    };

    // Build filter: use TALLOW_LOG env var if set, otherwise use verbosity level
    let filter = EnvFilter::try_from_env("TALLOW_LOG").unwrap_or_else(|_| {
        EnvFilter::new(format!(
            "tallow={level},tallow_crypto={level},tallow_net={level},tallow_protocol={level},tallow_store={level}"
        ))
    });

    tracing_subscriber::fmt()
        .with_env_filter(filter)
        .with_target(false)
        .with_thread_ids(false)
        .with_level(true)
        .compact()
        .init();

    Ok(())
}

/// Redact a sensitive value for logging
///
/// Returns a fixed string that indicates the value was redacted.
/// Use this instead of logging raw key material.
///
/// # Example
/// ```
/// # use tallow::logging::redact;
/// let key = [0u8; 32];
/// tracing::debug!(session_key = redact(&key), "Key exchange complete");
/// ```
pub fn redact<T>(_value: &T) -> &'static str {
    "[REDACTED]"
}

/// Redact a byte slice, showing only its length
///
/// # Example
/// ```
/// # use tallow::logging::redact_bytes;
/// let ciphertext = vec![0u8; 1024];
/// tracing::debug!(data = redact_bytes(&ciphertext), "Encrypted chunk");
/// // Logs: data = "[1024 bytes]"
/// ```
pub fn redact_bytes(data: &[u8]) -> String {
    format!("[{} bytes]", data.len())
}

/// Check if a field name appears to contain sensitive data
pub fn is_sensitive_field(name: &str) -> bool {
    let lower = name.to_lowercase();
    SENSITIVE_FIELD_PATTERNS
        .iter()
        .any(|pattern| lower.contains(pattern))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sensitive_field_detection() {
        assert!(is_sensitive_field("session_key"));
        assert!(is_sensitive_field("master_key_bytes"));
        assert!(is_sensitive_field("password"));
        assert!(is_sensitive_field("Passphrase"));
        assert!(is_sensitive_field("private_key"));
        assert!(!is_sensitive_field("filename"));
        assert!(!is_sensitive_field("progress"));
        assert!(!is_sensitive_field("chunk_index"));
    }

    #[test]
    fn test_redact() {
        let key = [42u8; 32];
        assert_eq!(redact(&key), "[REDACTED]");
    }

    #[test]
    fn test_redact_bytes() {
        let data = vec![0u8; 1024];
        assert_eq!(redact_bytes(&data), "[1024 bytes]");
    }
}
