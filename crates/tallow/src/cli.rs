//! CLI argument parsing

use clap::{Args, Parser, Subcommand};
use std::path::PathBuf;

#[derive(Parser)]
#[command(name = "tallow")]
#[command(author, version, about = "Secure P2P file transfer", long_about = None)]
pub struct Cli {
    /// Verbose output (-v, -vv, -vvv)
    #[arg(short, long, action = clap::ArgAction::Count, global = true)]
    pub verbose: u8,

    /// Suppress non-essential output
    #[arg(short, long, global = true)]
    pub quiet: bool,

    /// Output in JSON format (machine-readable)
    #[arg(long, global = true)]
    pub json: bool,

    #[command(subcommand)]
    pub command: Commands,
}

#[derive(Subcommand)]
pub enum Commands {
    /// Send files to a peer
    Send(SendArgs),

    /// Receive files from a peer
    Receive(ReceiveArgs),

    /// Start a chat session
    Chat(ChatArgs),

    /// Sync a folder with a peer
    Sync(SendArgs),

    /// Watch a folder for changes and auto-send
    Watch(ReceiveArgs),

    /// Stream data to a peer
    Stream(SendArgs),

    /// Start interactive TUI
    Tui(TuiArgs),

    /// Connect through a specific relay
    Relay(SendArgs),

    /// List and probe relay servers
    Relays,

    /// Manage contacts
    Contacts(ContactsArgs),

    /// Manage trust database
    Trust(TrustArgs),

    /// Manage identity keys
    Identity(IdentityArgs),

    /// Manage configuration
    Config(ConfigArgs),

    /// Run diagnostic checks
    Doctor,

    /// Run performance benchmarks
    Benchmark(BenchmarkArgs),

    /// Generate shell completions
    Completions(CompletionsArgs),

    /// Show version and build info
    Version,
}

#[derive(Args)]
pub struct SendArgs {
    /// Files or directories to send
    #[arg(required = true)]
    pub files: Vec<PathBuf>,

    /// Target peer ID or device name
    #[arg(short, long)]
    pub to: Option<String>,

    /// Room code for internet transfer
    #[arg(short, long)]
    pub room: Option<String>,

    /// Compression algorithm (auto/zstd/brotli/lz4/lzma/none)
    #[arg(short, long, default_value = "auto")]
    pub compress: String,

    /// Strip metadata from files
    #[arg(long)]
    pub strip_metadata: bool,

    /// Encrypt filenames
    #[arg(long)]
    pub encrypt_filenames: bool,

    /// Relay server address
    #[arg(long, default_value = "129.146.114.5:4433")]
    pub relay: String,

    /// SOCKS5 proxy address (e.g., socks5://127.0.0.1:9050)
    #[arg(long)]
    pub proxy: Option<String>,

    /// Discover peers on LAN via mDNS
    #[arg(long)]
    pub discover: bool,
}

#[derive(Args)]
pub struct ReceiveArgs {
    /// Code phrase to join
    #[arg()]
    pub code: Option<String>,

    /// Output directory
    #[arg(short, long)]
    pub output: Option<PathBuf>,

    /// Auto-accept from trusted peers
    #[arg(long)]
    pub auto_accept: bool,

    /// Relay server address
    #[arg(long, default_value = "129.146.114.5:4433")]
    pub relay: String,

    /// SOCKS5 proxy address
    #[arg(long)]
    pub proxy: Option<String>,

    /// Advertise on LAN via mDNS for peer discovery
    #[arg(long)]
    pub advertise: bool,

    /// Resume a previous transfer by ID
    #[arg(long)]
    pub resume_id: Option<String>,
}

#[derive(Args)]
pub struct ChatArgs {
    /// Peer ID or device name
    pub peer: Option<String>,

    /// Room code to join
    #[arg(short, long)]
    pub room: Option<String>,
}

#[derive(Args)]
pub struct TuiArgs {
    /// Start in minimal mode
    #[arg(short, long)]
    pub minimal: bool,

    /// Start in zen mode
    #[arg(short, long)]
    pub zen: bool,

    /// Start in monitor mode
    #[arg(long)]
    pub monitor: bool,
}

#[derive(Args)]
pub struct ContactsArgs {
    #[command(subcommand)]
    pub command: Option<ContactsCommands>,
}

#[derive(Subcommand)]
pub enum ContactsCommands {
    /// Add a contact
    Add {
        /// Contact name
        name: String,
        /// Public key (hex or file path)
        #[arg(short, long)]
        key: String,
    },
    /// Remove a contact
    Remove {
        /// Contact ID or name
        id: String,
    },
    /// List all contacts
    List,
    /// Show contact details
    Show {
        /// Contact ID or name
        id: String,
    },
}

#[derive(Args)]
pub struct TrustArgs {
    #[command(subcommand)]
    pub command: Option<TrustCommands>,
}

#[derive(Subcommand)]
pub enum TrustCommands {
    /// Mark a peer as trusted
    Trust {
        /// Peer ID
        peer_id: String,
    },
    /// Remove trust from a peer
    Untrust {
        /// Peer ID
        peer_id: String,
    },
    /// Verify a peer's key
    Verify {
        /// Peer ID
        peer_id: String,
        /// Fingerprint to compare
        fingerprint: String,
    },
    /// List all trusted peers
    List,
}

#[derive(Args)]
pub struct IdentityArgs {
    #[command(subcommand)]
    pub command: Option<IdentityCommands>,
}

#[derive(Subcommand)]
pub enum IdentityCommands {
    /// Generate a new identity
    Generate {
        /// Overwrite existing identity
        #[arg(short, long)]
        force: bool,
    },
    /// Show current identity
    Show,
    /// Export identity to file
    Export {
        /// Output file
        #[arg(short, long)]
        output: PathBuf,
    },
    /// Import identity from file
    Import {
        /// Input file
        file: PathBuf,
    },
    /// Show fingerprint
    Fingerprint {
        /// Use emoji format
        #[arg(short, long)]
        emoji: bool,
    },
}

#[derive(Args)]
pub struct ConfigArgs {
    #[command(subcommand)]
    pub command: Option<ConfigCommands>,
}

#[derive(Subcommand)]
pub enum ConfigCommands {
    /// Show current configuration
    Show,
    /// Edit configuration in $EDITOR
    Edit,
    /// Set a configuration value
    Set {
        /// Config key (e.g., network.enable_mdns)
        key: String,
        /// Config value
        value: String,
    },
    /// Get a configuration value
    Get {
        /// Config key
        key: String,
    },
    /// List all configuration keys and values
    List,
    /// Reset to defaults
    Reset {
        /// Skip confirmation
        #[arg(short, long)]
        yes: bool,
    },
}

#[derive(Args)]
pub struct BenchmarkArgs {
    /// Benchmark type (crypto/network/compression/all)
    #[arg(default_value = "all")]
    pub bench_type: String,

    /// Duration in seconds
    #[arg(short, long, default_value = "10")]
    pub duration: u64,
}

#[derive(Args)]
pub struct CompletionsArgs {
    /// Shell type
    #[arg(value_enum)]
    pub shell: clap_complete::Shell,
}
