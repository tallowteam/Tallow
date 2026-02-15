//! TUI command implementation

use crate::cli::TuiArgs;
use std::io;

/// Execute TUI command
pub async fn execute(_args: TuiArgs) -> io::Result<()> {
    println!("Starting TUI...");
    todo!("Implement TUI launch with tallow-tui crate")
}
