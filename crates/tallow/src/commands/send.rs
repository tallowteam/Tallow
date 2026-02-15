//! Send command implementation

use crate::cli::SendArgs;
use std::io;

/// Execute send command
pub async fn execute(_args: SendArgs) -> io::Result<()> {
    println!("Send command not yet implemented");
    todo!("Implement file sending")
}
