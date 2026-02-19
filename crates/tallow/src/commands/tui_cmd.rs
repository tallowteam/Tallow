//! TUI command implementation (Phase 5)

use crate::cli::TuiArgs;
use std::io;

/// Execute TUI command
pub async fn execute(_args: TuiArgs) -> io::Result<()> {
    #[cfg(feature = "tui")]
    {
        println!("TUI dashboard will be available in Phase 5.");
        println!("For now, use CLI commands: tallow send, tallow receive");
    }

    #[cfg(not(feature = "tui"))]
    {
        println!("TUI feature not enabled. Compile with: cargo build --features tui");
    }

    Ok(())
}
