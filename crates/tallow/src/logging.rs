//! Logging initialization using tracing-subscriber

use std::io;
use tracing_subscriber::EnvFilter;

/// Initialize logging based on verbosity level
///
/// Maps CLI flags to tracing levels:
/// - 0 (default): warn
/// - 1 (-v): info
/// - 2 (-vv): debug
/// - 3+ (-vvv): trace
///
/// When quiet mode is enabled, only errors are shown.
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
    let filter = EnvFilter::try_from_env("TALLOW_LOG")
        .unwrap_or_else(|_| {
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
