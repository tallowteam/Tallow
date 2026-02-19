//! Chat command implementation (deferred to v2)

use crate::cli::ChatArgs;
use std::io;

/// Execute chat command
pub async fn execute(_args: ChatArgs) -> io::Result<()> {
    println!("Chat is planned for Tallow v2.");
    println!("For file transfer, use: tallow send <file>");
    Ok(())
}
