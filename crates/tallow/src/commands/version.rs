//! Version command

/// Execute version command
pub fn execute() {
    println!("tallow {}", env!("CARGO_PKG_VERSION"));
    println!("commit: {} (stub)", "unknown");
    println!("build date: {} (stub)", "unknown");
    println!("rust version: {}", env!("CARGO_PKG_RUST_VERSION"));
}
