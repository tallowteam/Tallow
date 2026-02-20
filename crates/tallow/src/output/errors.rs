//! Smart error diagnosis with actionable guidance

/// Provide context-aware guidance for common error patterns.
///
/// Returns `Some(hint)` if the error message matches a known pattern,
/// providing the user with actionable steps to resolve the issue.
pub fn diagnose(err: &dyn std::fmt::Display) -> Option<String> {
    let msg = err.to_string();
    let lower = msg.to_lowercase();

    if lower.contains("connection refused") {
        return Some(
            "The relay server may be down or unreachable. Try:\n  \
             1. Check your internet connection\n  \
             2. Try a different relay: tallow send --relay <address> <file>\n  \
             3. Run 'tallow doctor' to diagnose"
                .to_string(),
        );
    }
    if lower.contains("address already in use") {
        return Some(
            "Another instance of tallow or tallow-relay may be running.\n  \
             Check with: lsof -i :4433 (Unix) or netstat -an | findstr 4433 (Windows)"
                .to_string(),
        );
    }
    if lower.contains("permission denied") {
        return Some(
            "Permission denied. Try:\n  \
             1. Check file/directory permissions\n  \
             2. Specify a different output directory: tallow receive -o ~/Downloads <code>"
                .to_string(),
        );
    }
    if lower.contains("no such file or directory") || lower.contains("not found") {
        return Some(
            "File or directory not found. Verify the path exists and is spelled correctly."
                .to_string(),
        );
    }
    if lower.contains("timed out") || lower.contains("timeout") {
        return Some(
            "Connection timed out. The peer may not be connected yet, or the relay may be slow.\n  \
             Try again, or check 'tallow doctor' for connectivity issues."
                .to_string(),
        );
    }
    if lower.contains("no space left on device") || lower.contains("disk full") {
        return Some(
            "Disk full. Free up space or specify a different output directory: \
             tallow receive -o /path/with/space <code>"
                .to_string(),
        );
    }
    if lower.contains("broken pipe") {
        return Some("The connection was interrupted. The peer may have disconnected.".to_string());
    }
    if lower.contains("authentication") || lower.contains("auth failed") {
        return Some(
            "Authentication failed. Check your relay password:\n  \
             1. Set TALLOW_RELAY_PASS environment variable\n  \
             2. Or use --relay-pass <password>"
                .to_string(),
        );
    }

    None
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io;

    #[test]
    fn test_connection_refused() {
        let err = io::Error::new(io::ErrorKind::ConnectionRefused, "Connection refused");
        let hint = diagnose(&err);
        assert!(hint.is_some());
        assert!(hint.unwrap().contains("relay"));
    }

    #[test]
    fn test_permission_denied() {
        let err = io::Error::new(io::ErrorKind::PermissionDenied, "Permission denied");
        let hint = diagnose(&err);
        assert!(hint.is_some());
        assert!(hint.unwrap().contains("permissions"));
    }

    #[test]
    fn test_timeout() {
        let err = io::Error::new(io::ErrorKind::TimedOut, "operation timed out");
        let hint = diagnose(&err);
        assert!(hint.is_some());
        assert!(hint.unwrap().contains("doctor"));
    }

    #[test]
    fn test_unknown_error_returns_none() {
        let err = io::Error::new(io::ErrorKind::Other, "unknown error xyz");
        assert!(diagnose(&err).is_none());
    }

    #[test]
    fn test_disk_full() {
        let err = io::Error::new(io::ErrorKind::Other, "no space left on device");
        let hint = diagnose(&err);
        assert!(hint.is_some());
        assert!(hint.unwrap().contains("space"));
    }

    #[test]
    fn test_broken_pipe() {
        let err = io::Error::new(io::ErrorKind::BrokenPipe, "broken pipe");
        let hint = diagnose(&err);
        assert!(hint.is_some());
        assert!(hint.unwrap().contains("disconnected"));
    }

    #[test]
    fn test_auth_failed() {
        let err = io::Error::new(io::ErrorKind::Other, "Authentication failed");
        let hint = diagnose(&err);
        assert!(hint.is_some());
        assert!(hint.unwrap().contains("TALLOW_RELAY_PASS"));
    }
}
