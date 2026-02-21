//! Application state

use crate::modes::TuiMode;
use crate::widgets::spinner::Spinner;
use std::collections::HashMap;
use std::path::PathBuf;
use std::time::{Duration, Instant};

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

/// Actions sent from background tasks to the TUI main loop
#[derive(Debug, Clone)]
pub enum TuiAction {
    /// A transfer has started
    TransferStarted {
        /// Transfer ID
        id: [u8; 16],
        /// Filename
        filename: String,
        /// Total bytes to transfer
        total_bytes: u64,
        /// Transfer direction
        direction: TransferDirection,
    },
    /// Transfer progress update
    TransferProgress {
        /// Transfer ID
        id: [u8; 16],
        /// Bytes completed
        bytes_done: u64,
        /// Current speed in bytes per second
        speed_bps: u64,
    },
    /// Transfer completed successfully
    TransferComplete {
        /// Transfer ID
        id: [u8; 16],
        /// Total elapsed time
        elapsed: Duration,
    },
    /// Transfer failed with an error
    TransferError {
        /// Transfer ID
        id: [u8; 16],
        /// Error description
        error: String,
    },

    /// Connected to relay
    RelayConnected {
        /// Relay address
        addr: String,
    },
    /// Disconnected from relay
    RelayDisconnected,
    /// A peer joined the room
    PeerJoined {
        /// Room code
        room_code: String,
    },
    /// A peer left the room
    PeerLeft,

    /// User wants to send files (forwarded to background tasks)
    InitiateSend {
        /// Files to send
        files: Vec<PathBuf>,
        /// Relay address
        relay: String,
    },
    /// User wants to receive files (forwarded to background tasks)
    InitiateReceive {
        /// Code phrase
        code: String,
        /// Relay address
        relay: String,
    },

    /// Quit the TUI
    Quit,
}

/// Stackable overlay types
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Overlay {
    /// Help overlay showing keybindings
    Help,
    /// Identity detail overlay
    IdentityDetail,
    /// Transfer confirmation dialog
    TransferConfirm {
        /// Filename to confirm
        filename: String,
        /// File size in bytes
        size: u64,
    },
}

/// Status of an active transfer
#[derive(Debug, Clone)]
pub enum TransferStatus {
    /// Preparing transfer
    Preparing,
    /// Waiting for peer to connect
    WaitingForPeer,
    /// Transfer in progress
    InProgress,
    /// Transfer completed
    Complete {
        /// Elapsed time
        elapsed: Duration,
    },
    /// Transfer failed
    Failed {
        /// Error description
        error: String,
    },
}

/// Expanded transfer state, keyed by transfer ID
#[derive(Debug, Clone)]
pub struct ActiveTransfer {
    /// Transfer ID
    pub id: [u8; 16],
    /// Filename being transferred
    pub filename: String,
    /// Total bytes to transfer
    pub total_bytes: u64,
    /// Bytes completed so far
    pub bytes_done: u64,
    /// Current speed in bytes per second
    pub speed_bps: u64,
    /// Transfer direction
    pub direction: TransferDirection,
    /// Current status
    pub status: TransferStatus,
    /// When the transfer started
    pub started_at: Instant,
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
    /// Show help overlay (kept for backward compatibility)
    pub show_help: bool,
    /// Active transfers (legacy display format)
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
    /// Overlay stack (bottom to top)
    pub overlays: Vec<Overlay>,
    /// Identity fingerprint loaded from store
    pub identity_fingerprint: Option<String>,
    /// Active transfers keyed by transfer ID
    pub active_transfers: HashMap<[u8; 16], ActiveTransfer>,
    /// Tick counter for animations
    pub tick_count: u64,
    /// Spinner for animated status indicator
    pub spinner: Spinner,
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
            overlays: Vec::new(),
            identity_fingerprint: None,
            active_transfers: HashMap::new(),
            tick_count: 0,
            spinner: Spinner::with_label(""),
        }
    }

    /// Quit the application
    pub fn quit(&mut self) {
        self.running = false;
    }

    /// Toggle help overlay (backward-compatible)
    pub fn toggle_help(&mut self) {
        if self.show_help {
            // Remove Help from overlay stack
            self.overlays.retain(|o| *o != Overlay::Help);
            self.show_help = false;
        } else {
            self.push_overlay(Overlay::Help);
            self.show_help = true;
        }
    }

    /// Cycle focused panel
    pub fn next_panel(&mut self) {
        self.focused_panel = self.focused_panel.next();
    }

    /// Push an overlay onto the stack (no duplicates)
    pub fn push_overlay(&mut self, overlay: Overlay) {
        if !self.overlays.contains(&overlay) {
            self.overlays.push(overlay.clone());
            // Keep show_help in sync
            if overlay == Overlay::Help {
                self.show_help = true;
            }
        }
    }

    /// Pop the topmost overlay
    pub fn pop_overlay(&mut self) {
        if let Some(removed) = self.overlays.pop() {
            // Keep show_help in sync
            if removed == Overlay::Help {
                self.show_help = false;
            }
        }
    }

    /// Peek at the topmost overlay
    pub fn top_overlay(&self) -> Option<&Overlay> {
        self.overlays.last()
    }

    /// Advance tick counter and spinner
    pub fn tick(&mut self) {
        self.tick_count += 1;
        self.spinner.tick();
    }

    /// Process an incoming TuiAction
    pub fn apply_action(&mut self, action: TuiAction) {
        match action {
            TuiAction::TransferStarted {
                id,
                filename,
                total_bytes,
                direction,
            } => {
                let transfer = ActiveTransfer {
                    id,
                    filename,
                    total_bytes,
                    bytes_done: 0,
                    speed_bps: 0,
                    direction,
                    status: TransferStatus::InProgress,
                    started_at: Instant::now(),
                };
                self.active_transfers.insert(id, transfer);
                self.sync_transfer_info();
            }
            TuiAction::TransferProgress {
                id,
                bytes_done,
                speed_bps,
            } => {
                if let Some(t) = self.active_transfers.get_mut(&id) {
                    t.bytes_done = bytes_done;
                    t.speed_bps = speed_bps;
                    // Update session totals
                    match t.direction {
                        TransferDirection::Send => self.bytes_sent = bytes_done,
                        TransferDirection::Receive => self.bytes_received = bytes_done,
                    }
                }
                self.sync_transfer_info();
            }
            TuiAction::TransferComplete { id, elapsed } => {
                if let Some(t) = self.active_transfers.get_mut(&id) {
                    t.status = TransferStatus::Complete { elapsed };
                    t.bytes_done = t.total_bytes;
                }
                self.sync_transfer_info();
            }
            TuiAction::TransferError { id, error } => {
                if let Some(t) = self.active_transfers.get_mut(&id) {
                    t.status = TransferStatus::Failed { error };
                }
                self.sync_transfer_info();
            }
            TuiAction::RelayConnected { addr } => {
                self.connected = true;
                self.relay_addr = Some(addr);
                self.status_message = "Connected".to_string();
            }
            TuiAction::RelayDisconnected => {
                self.connected = false;
                self.status_message = "Disconnected".to_string();
            }
            TuiAction::PeerJoined { room_code } => {
                self.room_code = Some(room_code);
            }
            TuiAction::PeerLeft => {
                self.room_code = None;
            }
            TuiAction::Quit => {
                self.running = false;
            }
            // InitiateSend / InitiateReceive are handled by spawning tasks
            TuiAction::InitiateSend { .. } | TuiAction::InitiateReceive { .. } => {}
        }
    }

    /// Sync active_transfers into the legacy transfers vec for panel rendering
    pub fn sync_transfer_info(&mut self) {
        self.transfers = self
            .active_transfers
            .values()
            .map(|at| {
                let progress = if at.total_bytes > 0 {
                    at.bytes_done as f64 / at.total_bytes as f64
                } else {
                    0.0
                };
                let status = match &at.status {
                    TransferStatus::Preparing => "Preparing".to_string(),
                    TransferStatus::WaitingForPeer => "Waiting".to_string(),
                    TransferStatus::InProgress => "Transferring".to_string(),
                    TransferStatus::Complete { .. } => "Complete".to_string(),
                    TransferStatus::Failed { error } => format!("Failed: {}", error),
                };
                TransferInfo {
                    filename: at.filename.clone(),
                    progress,
                    speed_bps: at.speed_bps,
                    direction: at.direction,
                    status,
                }
            })
            .collect();
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_app_new_defaults() {
        let app = App::new();
        assert!(app.running);
        assert!(!app.show_help);
        assert!(app.overlays.is_empty());
        assert!(app.transfers.is_empty());
        assert!(app.active_transfers.is_empty());
        assert_eq!(app.tick_count, 0);
        assert!(app.identity_fingerprint.is_none());
    }

    #[test]
    fn test_overlay_push_pop() {
        let mut app = App::new();

        app.push_overlay(Overlay::Help);
        app.push_overlay(Overlay::IdentityDetail);
        assert_eq!(app.overlays.len(), 2);
        assert_eq!(app.overlays[0], Overlay::Help);
        assert_eq!(app.overlays[1], Overlay::IdentityDetail);

        app.pop_overlay();
        assert_eq!(app.overlays.len(), 1);
        assert_eq!(app.overlays[0], Overlay::Help);

        app.pop_overlay();
        assert!(app.overlays.is_empty());
    }

    #[test]
    fn test_overlay_no_duplicates() {
        let mut app = App::new();
        app.push_overlay(Overlay::Help);
        app.push_overlay(Overlay::Help);
        assert_eq!(app.overlays.len(), 1);
    }

    #[test]
    fn test_toggle_help_syncs_overlay() {
        let mut app = App::new();

        app.toggle_help();
        assert!(app.show_help);
        assert_eq!(app.overlays.len(), 1);
        assert_eq!(app.overlays[0], Overlay::Help);

        app.toggle_help();
        assert!(!app.show_help);
        assert!(app.overlays.is_empty());
    }

    #[test]
    fn test_top_overlay() {
        let mut app = App::new();
        assert!(app.top_overlay().is_none());

        app.push_overlay(Overlay::Help);
        assert_eq!(app.top_overlay(), Some(&Overlay::Help));

        app.push_overlay(Overlay::IdentityDetail);
        assert_eq!(app.top_overlay(), Some(&Overlay::IdentityDetail));
    }

    #[test]
    fn test_tick_advances_spinner() {
        let mut app = App::new();
        let initial_tick = app.tick_count;
        let initial_char = app.spinner.current_char();

        app.tick();
        assert_eq!(app.tick_count, initial_tick + 1);
        // Spinner frame should have advanced
        let next_char = app.spinner.current_char();
        assert_ne!(initial_char, next_char);
    }

    #[test]
    fn test_apply_action_transfer_lifecycle() {
        let mut app = App::new();
        let id = [1u8; 16];

        app.apply_action(TuiAction::TransferStarted {
            id,
            filename: "test.txt".into(),
            total_bytes: 1000,
            direction: TransferDirection::Send,
        });
        assert_eq!(app.transfers.len(), 1);
        assert_eq!(app.transfers[0].filename, "test.txt");

        app.apply_action(TuiAction::TransferProgress {
            id,
            bytes_done: 500,
            speed_bps: 100,
        });
        assert!((app.transfers[0].progress - 0.5).abs() < 0.01);

        app.apply_action(TuiAction::TransferComplete {
            id,
            elapsed: Duration::from_secs(10),
        });
        assert!(app.transfers[0].status.contains("Complete"));
    }

    #[test]
    fn test_apply_action_transfer_error() {
        let mut app = App::new();
        let id = [2u8; 16];

        app.apply_action(TuiAction::TransferStarted {
            id,
            filename: "bad.txt".into(),
            total_bytes: 500,
            direction: TransferDirection::Receive,
        });

        app.apply_action(TuiAction::TransferError {
            id,
            error: "connection lost".into(),
        });
        assert!(app.transfers[0].status.contains("Failed"));
        assert!(app.transfers[0].status.contains("connection lost"));
    }

    #[test]
    fn test_apply_action_relay_connection() {
        let mut app = App::new();

        app.apply_action(TuiAction::RelayConnected {
            addr: "127.0.0.1:4433".into(),
        });
        assert!(app.connected);
        assert_eq!(app.relay_addr.as_deref(), Some("127.0.0.1:4433"));

        app.apply_action(TuiAction::RelayDisconnected);
        assert!(!app.connected);
    }

    #[test]
    fn test_apply_action_peer_joined() {
        let mut app = App::new();

        app.apply_action(TuiAction::PeerJoined {
            room_code: "abc-def".into(),
        });
        assert_eq!(app.room_code.as_deref(), Some("abc-def"));

        app.apply_action(TuiAction::PeerLeft);
        assert!(app.room_code.is_none());
    }

    #[test]
    fn test_apply_action_quit() {
        let mut app = App::new();
        assert!(app.running);
        app.apply_action(TuiAction::Quit);
        assert!(!app.running);
    }

    #[test]
    fn test_sync_transfer_info() {
        let mut app = App::new();
        let id = [3u8; 16];

        app.active_transfers.insert(
            id,
            ActiveTransfer {
                id,
                filename: "sync_test.bin".into(),
                total_bytes: 2000,
                bytes_done: 1000,
                speed_bps: 500,
                direction: TransferDirection::Send,
                status: TransferStatus::InProgress,
                started_at: Instant::now(),
            },
        );

        app.sync_transfer_info();
        assert_eq!(app.transfers.len(), 1);
        assert_eq!(app.transfers[0].filename, "sync_test.bin");
        assert!((app.transfers[0].progress - 0.5).abs() < 0.01);
        assert_eq!(app.transfers[0].speed_bps, 500);
    }

    #[test]
    fn test_full_transfer_round_trip() {
        let mut app = App::new();
        let id = [42u8; 16];

        // Start
        app.apply_action(TuiAction::TransferStarted {
            id,
            filename: "photo.jpg".into(),
            total_bytes: 10_000_000,
            direction: TransferDirection::Receive,
        });
        assert_eq!(app.active_transfers.len(), 1);
        assert_eq!(app.transfers.len(), 1);
        assert!((app.transfers[0].progress - 0.0).abs() < 0.01);

        // Progress updates
        for i in 1..=10 {
            app.apply_action(TuiAction::TransferProgress {
                id,
                bytes_done: i * 1_000_000,
                speed_bps: 5_000_000,
            });
        }
        assert!((app.transfers[0].progress - 1.0).abs() < 0.01);

        // Complete
        app.apply_action(TuiAction::TransferComplete {
            id,
            elapsed: Duration::from_secs(2),
        });
        assert!(app.transfers[0].status.contains("Complete"));
    }
}
