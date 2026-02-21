//! Desktop notification support for transfer events.
//!
//! Provides optional desktop notifications via `notify-rust` when the
//! `notifications` feature is enabled. Notifications are fire-and-forget:
//! failures are silently discarded so they never block or break transfers.

/// Send a desktop notification for transfer completion.
///
/// Displays the total size and duration in a system notification toast.
/// Does nothing when the `notifications` feature is disabled.
pub fn notify_transfer_complete(file_count: usize, total_size: u64, duration_secs: f64) {
    #[cfg(feature = "notifications")]
    {
        let size_str = super::format_size(total_size);
        let body = if file_count == 1 {
            format!("{} transferred in {:.1}s", size_str, duration_secs)
        } else {
            format!(
                "{} files ({}) transferred in {:.1}s",
                file_count, size_str, duration_secs
            )
        };

        let _ = notify_rust::Notification::new()
            .summary("Tallow \u{2014} Transfer Complete")
            .body(&body)
            .timeout(5000)
            .show();
    }

    // Suppress unused-variable warnings when feature is disabled.
    #[cfg(not(feature = "notifications"))]
    {
        let _ = (file_count, total_size, duration_secs);
    }
}

/// Send a desktop notification for transfer failure.
///
/// Displays the failure reason in a system notification toast with a
/// longer timeout (10 s) so the user has time to notice.
/// Does nothing when the `notifications` feature is disabled.
pub fn notify_transfer_failed(reason: &str) {
    #[cfg(feature = "notifications")]
    {
        let _ = notify_rust::Notification::new()
            .summary("Tallow \u{2014} Transfer Failed")
            .body(reason)
            .timeout(10000)
            .show();
    }

    // Suppress unused-variable warnings when feature is disabled.
    #[cfg(not(feature = "notifications"))]
    {
        let _ = reason;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn notify_complete_does_not_panic() {
        // Verify calling the function never panics, even without a
        // desktop environment (CI). The actual notification is silently
        // discarded via `let _ =`.
        notify_transfer_complete(3, 1_048_576, 2.5);
    }

    #[test]
    fn notify_failed_does_not_panic() {
        notify_transfer_failed("connection lost");
    }
}
