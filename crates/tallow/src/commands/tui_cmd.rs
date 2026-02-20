//! TUI command implementation

use crate::cli::TuiArgs;
use std::io;

/// Execute TUI command
pub async fn execute(_args: TuiArgs) -> io::Result<()> {
    #[cfg(feature = "tui")]
    {
        let mut app = tallow_tui::TuiApp::new()?;
        app.run()?;
    }

    #[cfg(not(feature = "tui"))]
    {
        eprintln!("TUI feature not enabled. Compile with: cargo build --features tui");
    }

    Ok(())
}
