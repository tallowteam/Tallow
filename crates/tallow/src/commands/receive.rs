//! Receive command implementation

use crate::cli::ReceiveArgs;
use std::io;

/// Execute receive command
pub async fn execute(_args: ReceiveArgs) -> io::Result<()> {
    println!("Receive command not yet implemented");
    todo!("Implement file receiving")
}
