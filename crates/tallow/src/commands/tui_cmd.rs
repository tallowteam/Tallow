//! TUI command implementation

use crate::cli::TuiArgs;
use std::io;

/// Execute TUI command
pub async fn execute(args: TuiArgs) -> io::Result<()> {
    #[cfg(feature = "tui")]
    {
        // Determine initial mode from CLI args
        let initial_mode = if args.minimal {
            tallow_tui::modes::TuiMode::Minimal
        } else if args.zen {
            tallow_tui::modes::TuiMode::Zen
        } else if args.monitor {
            tallow_tui::modes::TuiMode::Monitor
        } else {
            tallow_tui::modes::TuiMode::Dashboard
        };

        // Try to load identity fingerprint from store
        let identity_fingerprint = {
            let mut store = tallow_store::identity::IdentityStore::new();
            match store.load("") {
                Ok(()) => store.fingerprint(),
                Err(_) => None,
            }
        };

        tallow_tui::run_async(identity_fingerprint, initial_mode).await?;
    }

    #[cfg(not(feature = "tui"))]
    {
        let _ = args;
        eprintln!("TUI feature not enabled. Compile with: cargo build --features tui");
    }

    Ok(())
}
