//! Clipboard operations (cross-platform, fail-silent)

/// Copy text to the system clipboard.
///
/// Fails silently on headless systems (SSH, Docker, CI) where no
/// display server is available. Never errors -- clipboard is a
/// convenience feature, not a critical path.
pub fn copy_to_clipboard(text: &str) {
    // On Linux, skip if no display server is detected
    #[cfg(target_os = "linux")]
    {
        let has_display =
            std::env::var("DISPLAY").is_ok() || std::env::var("WAYLAND_DISPLAY").is_ok();
        if !has_display {
            tracing::debug!("No display server; skipping clipboard copy");
            return;
        }
    }

    match arboard::Clipboard::new() {
        Ok(mut cb) => {
            if let Err(e) = cb.set_text(text.to_string()) {
                tracing::debug!("Clipboard copy failed: {e}");
            } else {
                tracing::debug!("Copied to clipboard");
            }
        }
        Err(e) => {
            tracing::debug!("Clipboard unavailable: {e}");
        }
    }
}
