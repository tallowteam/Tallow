//! Application state

use crate::modes::TuiMode;

/// Panel focus
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FocusedPanel {
    /// Status panel
    Status,
    /// Transfers panel
    Transfers,
    /// Devices panel
    Devices,
}

impl FocusedPanel {
    /// Cycle to next panel
    pub fn next(self) -> Self {
        match self {
            Self::Status => Self::Transfers,
            Self::Transfers => Self::Devices,
            Self::Devices => Self::Status,
        }
    }
}

/// Transfer state for display
#[derive(Debug, Clone)]
pub struct TransferInfo {
    /// Filename being transferred
    pub filename: String,
    /// Progress (0.0 - 1.0)
    pub progress: f64,
    /// Speed in bytes/sec
    pub speed_bps: u64,
    /// Direction
    pub direction: TransferDirection,
    /// Status text
    pub status: String,
}

/// Transfer direction
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TransferDirection {
    /// Sending
    Send,
    /// Receiving
    Receive,
}

/// Discovered peer for device panel
#[derive(Debug, Clone)]
pub struct PeerInfo {
    /// Peer display name
    pub name: String,
    /// Peer address
    pub address: String,
    /// Whether verified via TOFU
    pub verified: bool,
}

/// Application state
#[derive(Debug)]
pub struct App {
    /// Current mode
    pub mode: TuiMode,
    /// Focused panel
    pub focused_panel: FocusedPanel,
    /// Running flag
    pub running: bool,
    /// Show help overlay
    pub show_help: bool,
    /// Active transfers
    pub transfers: Vec<TransferInfo>,
    /// Discovered peers
    pub peers: Vec<PeerInfo>,
    /// Status message
    pub status_message: String,
    /// Connection state
    pub connected: bool,
    /// Relay address
    pub relay_addr: Option<String>,
    /// Room code (if in a room)
    pub room_code: Option<String>,
    /// Total bytes sent this session
    pub bytes_sent: u64,
    /// Total bytes received this session
    pub bytes_received: u64,
}

impl App {
    /// Create a new application state
    pub fn new() -> Self {
        Self {
            mode: TuiMode::Dashboard,
            focused_panel: FocusedPanel::Transfers,
            running: true,
            show_help: false,
            transfers: Vec::new(),
            peers: Vec::new(),
            status_message: "Ready".to_string(),
            connected: false,
            relay_addr: None,
            room_code: None,
            bytes_sent: 0,
            bytes_received: 0,
        }
    }

    /// Quit the application
    pub fn quit(&mut self) {
        self.running = false;
    }

    /// Toggle help overlay
    pub fn toggle_help(&mut self) {
        self.show_help = !self.show_help;
    }

    /// Cycle focused panel
    pub fn next_panel(&mut self) {
        self.focused_panel = self.focused_panel.next();
    }

    /// Format bytes for display
    pub fn format_bytes(bytes: u64) -> String {
        if bytes < 1024 {
            format!("{} B", bytes)
        } else if bytes < 1024 * 1024 {
            format!("{:.1} KB", bytes as f64 / 1024.0)
        } else if bytes < 1024 * 1024 * 1024 {
            format!("{:.1} MB", bytes as f64 / (1024.0 * 1024.0))
        } else {
            format!("{:.2} GB", bytes as f64 / (1024.0 * 1024.0 * 1024.0))
        }
    }

    /// Format speed for display
    pub fn format_speed(bps: u64) -> String {
        if bps < 1024 {
            format!("{} B/s", bps)
        } else if bps < 1024 * 1024 {
            format!("{:.1} KB/s", bps as f64 / 1024.0)
        } else {
            format!("{:.1} MB/s", bps as f64 / (1024.0 * 1024.0))
        }
    }
}

impl Default for App {
    fn default() -> Self {
        Self::new()
    }
}
