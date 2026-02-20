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

    /// Sync a directory with a remote peer (one-way: local -> remote)
    Sync(SyncArgs),

    /// Watch a directory for changes and auto-send to connected peer
    Watch(WatchArgs),

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

    /// Internal: complete code phrase words (used by shell completion scripts)
    #[command(hide = true)]
    CompleteCode {
        /// Partial word to complete
        prefix: String,
    },
}

#[derive(Args)]
pub struct SendArgs {
    /// Files or directories to send
    #[arg()]
    pub files: Vec<PathBuf>,

    /// Send text directly instead of files
    #[arg(short = 't', long)]
    pub text: Option<String>,

    /// Use a custom code phrase
    #[arg(short = 'c', long = "code")]
    pub custom_code: Option<String>,

    /// Number of words in generated code phrase (default: 4)
    #[arg(long)]
    pub words: Option<usize>,

    /// Display QR code for the receive command
    #[arg(long)]
    pub qr: bool,

    /// Do not copy receive command to clipboard
    #[arg(long)]
    pub no_clipboard: bool,

    /// Ignore piped stdin (force file mode)
    #[arg(long)]
    pub ignore_stdin: bool,

    /// Target peer ID or device name
    #[arg(long)]
    pub to: Option<String>,

    /// Room code for internet transfer (also reads TALLOW_CODE env var)
    #[arg(short, long, env = "TALLOW_CODE")]
    pub room: Option<String>,

    /// Compression algorithm (auto/zstd/brotli/lz4/lzma/none)
    #[arg(short = 'x', long, default_value = "auto")]
    pub compress: String,

    /// Strip metadata from files
    #[arg(long)]
    pub strip_metadata: bool,

    /// Encrypt filenames
    #[arg(long)]
    pub encrypt_filenames: bool,

    /// Relay server address (also reads TALLOW_RELAY env var)
    #[arg(long, default_value = "129.146.114.5:4433", env = "TALLOW_RELAY")]
    pub relay: String,

    /// Relay password (also reads TALLOW_RELAY_PASS env var)
    #[arg(long = "relay-pass", env = "TALLOW_RELAY_PASS", hide_env_values = true)]
    pub relay_pass: Option<String>,

    /// SOCKS5 proxy address (e.g., socks5://127.0.0.1:9050)
    #[arg(long)]
    pub proxy: Option<String>,

    /// Discover peers on LAN via mDNS
    #[arg(long)]
    pub discover: bool,

    /// Exclude patterns (comma-separated, gitignore syntax)
    #[arg(long)]
    pub exclude: Option<String>,

    /// Respect .gitignore files when sending directories
    #[arg(long)]
    pub git: bool,

    /// Bandwidth throttle limit (e.g., "10MB", "500KB", "1GB")
    #[arg(long)]
    pub throttle: Option<String>,

    /// Prompt sender for confirmation before starting transfer
    #[arg(long)]
    pub ask: bool,

    /// Display verification string after key exchange for MITM detection
    #[arg(long)]
    pub verify: bool,
}

#[derive(Args)]
pub struct ReceiveArgs {
    /// Code phrase to join (also reads TALLOW_CODE env var)
    #[arg(env = "TALLOW_CODE")]
    pub code: Option<String>,

    /// Output directory
    #[arg(short, long)]
    pub output: Option<PathBuf>,

    /// Auto-accept incoming transfers without prompting
    #[arg(short = 'y', long)]
    pub yes: bool,

    /// Overwrite existing files without prompting
    #[arg(long)]
    pub overwrite: bool,

    /// Auto-accept from trusted peers
    #[arg(long)]
    pub auto_accept: bool,

    /// Relay server address (also reads TALLOW_RELAY env var)
    #[arg(long, default_value = "129.146.114.5:4433", env = "TALLOW_RELAY")]
    pub relay: String,

    /// Relay password (also reads TALLOW_RELAY_PASS env var)
    #[arg(long = "relay-pass", env = "TALLOW_RELAY_PASS", hide_env_values = true)]
    pub relay_pass: Option<String>,

    /// SOCKS5 proxy address
    #[arg(long)]
    pub proxy: Option<String>,

    /// Advertise on LAN via mDNS for peer discovery
    #[arg(long)]
    pub advertise: bool,

    /// Resume a previous transfer by ID
    #[arg(long)]
    pub resume_id: Option<String>,

    /// Display verification string after key exchange for MITM detection
    #[arg(long)]
    pub verify: bool,
}

#[derive(Args)]
pub struct SyncArgs {
    /// Directory to sync
    pub dir: PathBuf,

    /// Code phrase for the sync session
    #[arg(short = 'c', long)]
    pub code: Option<String>,

    /// Delete remote files not present locally
    #[arg(long)]
    pub delete: bool,

    /// Exclude patterns (comma-separated, gitignore syntax)
    #[arg(long)]
    pub exclude: Option<String>,

    /// Respect .gitignore files
    #[arg(long)]
    pub git: bool,

    /// Bandwidth throttle (e.g., "10MB")
    #[arg(long)]
    pub throttle: Option<String>,

    /// Relay server address (also reads TALLOW_RELAY env var)
    #[arg(long, default_value = "129.146.114.5:4433", env = "TALLOW_RELAY")]
    pub relay: String,

    /// Relay password (also reads TALLOW_RELAY_PASS env var)
    #[arg(long = "relay-pass", env = "TALLOW_RELAY_PASS", hide_env_values = true)]
    pub relay_pass: Option<String>,

    /// SOCKS5 proxy address
    #[arg(long)]
    pub proxy: Option<String>,
}

#[derive(Args)]
pub struct WatchArgs {
    /// Directory to watch
    pub dir: PathBuf,

    /// Code phrase for the watch session
    #[arg(short = 'c', long)]
    pub code: Option<String>,

    /// Debounce duration in seconds (default: 2)
    #[arg(long, default_value = "2")]
    pub debounce: u64,

    /// Exclude patterns (comma-separated, gitignore syntax)
    #[arg(long)]
    pub exclude: Option<String>,

    /// Respect .gitignore files
    #[arg(long)]
    pub git: bool,

    /// Bandwidth throttle (e.g., "10MB")
    #[arg(long)]
    pub throttle: Option<String>,

    /// Relay server address (also reads TALLOW_RELAY env var)
    #[arg(long, default_value = "129.146.114.5:4433", env = "TALLOW_RELAY")]
    pub relay: String,

    /// Relay password (also reads TALLOW_RELAY_PASS env var)
    #[arg(long = "relay-pass", env = "TALLOW_RELAY_PASS", hide_env_values = true)]
    pub relay_pass: Option<String>,

    /// SOCKS5 proxy address
    #[arg(long)]
    pub proxy: Option<String>,
}

#[derive(Args)]
pub struct ChatArgs {
    /// Peer ID or device name
    pub peer: Option<String>,

    /// Room code to join
    #[arg(short, long)]
    pub room: Option<String>,

    /// Relay password (also reads TALLOW_RELAY_PASS env var)
    #[arg(long = "relay-pass", env = "TALLOW_RELAY_PASS", hide_env_values = true)]
    pub relay_pass: Option<String>,
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
    /// Manage path aliases
    Alias {
        #[command(subcommand)]
        command: AliasCommands,
    },
}

#[derive(Subcommand)]
pub enum AliasCommands {
    /// Add a path alias
    Add {
        /// Alias name (e.g., "nas")
        name: String,
        /// Target directory path (absolute)
        path: PathBuf,
    },
    /// Remove a path alias
    Remove {
        /// Alias name
        name: String,
    },
    /// List all path aliases
    List,
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
