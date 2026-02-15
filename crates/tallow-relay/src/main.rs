//! Tallow relay server

mod config;
mod server;
mod signaling;
mod rate_limit;
mod auth;

use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "tallow-relay")]
#[command(about = "Tallow Relay Server", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Start the relay server
    Serve {
        /// Server bind address
        #[arg(short, long, default_value = "0.0.0.0:443")]
        addr: String,

        /// Configuration file
        #[arg(short, long)]
        config: Option<String>,
    },
}

#[tokio::main]
async fn main() {
    let cli = Cli::parse();

    println!("Tallow Relay Server v{}", env!("CARGO_PKG_VERSION"));

    match cli.command {
        Commands::Serve { addr, config } => {
            println!("Starting relay server on {}", addr);
            if let Some(cfg) = config {
                println!("Using config: {}", cfg);
            }
            // Stub implementation
            println!("Server ready (stub implementation)");
        }
    }
}
