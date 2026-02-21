//! Tallow relay server
//!
//! Self-hostable relay that pairs peers by room code and forwards
//! encrypted bytes without inspection. Zero-knowledge design.

#![forbid(unsafe_code)]

mod auth;
mod config;
mod rate_limit;
mod room;
mod server;

use clap::{Parser, Subcommand};
use config::RelayConfig;
use server::RelayServer;
use tracing::{info, warn};

#[derive(Parser)]
#[command(name = "tallow-relay")]
#[command(about = "Tallow Relay Server — zero-knowledge encrypted file transfer relay")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Start the relay server
    Serve {
        /// Server bind address
        #[arg(short, long, default_value = "0.0.0.0:4433")]
        addr: String,

        /// Configuration file (TOML)
        #[arg(short, long)]
        config: Option<String>,

        /// Maximum concurrent rooms
        #[arg(long, default_value = "5000")]
        max_rooms: usize,

        /// Room timeout in seconds
        #[arg(long, default_value = "60")]
        room_timeout: u64,

        /// Maximum peers per multi-peer room (default: 10, max: 20)
        #[arg(long, default_value = "10")]
        max_peers_per_room: u8,

        /// Relay password (use TALLOW_RELAY_PASS env var for production)
        #[arg(long = "pass", env = "TALLOW_RELAY_PASS", hide_env_values = true)]
        pass: Option<String>,
    },
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info")),
        )
        .init();

    let cli = Cli::parse();

    info!("Tallow Relay Server v{}", env!("CARGO_PKG_VERSION"));

    match cli.command {
        Commands::Serve {
            addr,
            config,
            max_rooms,
            room_timeout,
            max_peers_per_room,
            pass,
        } => {
            let mut relay_config = if let Some(cfg_path) = config {
                let content = tokio::fs::read_to_string(&cfg_path).await?;
                toml::from_str(&content)?
            } else {
                RelayConfig::default()
            };

            // CLI overrides
            relay_config.bind_addr = addr;
            relay_config.max_rooms = max_rooms;
            relay_config.room_timeout_secs = room_timeout;
            relay_config.max_peers_per_room = max_peers_per_room.min(20);

            // Warn if running as open relay
            if pass.is_none() && relay_config.password.is_empty() {
                warn!(
                    "No relay password configured — running as OPEN relay. \
                     Set --pass or TALLOW_RELAY_PASS to require authentication."
                );
            }

            relay_config.password = pass.unwrap_or_default();

            let server = RelayServer::new(relay_config);
            server.start().await?;
        }
    }

    Ok(())
}
