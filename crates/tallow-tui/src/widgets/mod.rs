//! Tallow TUI custom widgets
//!
//! This module provides specialized Ratatui widgets for the Tallow terminal interface:
//!
//! ## Chat Widgets
//! - [`chat_view`] - Scrollable chat message display
//! - [`chat_input`] - Multi-line text input with cursor
//! - [`message_bubble`] - Individual message rendering
//!
//! ## Network Visualization
//! - [`sparkline`] - Unicode braille sparklines for compact data display
//! - [`bandwidth_chart`] - Time-series bandwidth/throughput charts
//! - [`network_quality`] - Real-time network metrics display
//!
//! All widgets follow Ratatui 0.29 patterns and support:
//! - Stateful rendering where appropriate
//! - Style customization
//! - Blocks and borders
//! - Responsive layouts

pub mod accessibility;
pub mod bandwidth_chart;
pub mod chat_input;
pub mod chat_view;
pub mod color_system;
pub mod device_card;
pub mod device_list;
pub mod effects;
pub mod emacs_mode;
pub mod file_browser;
pub mod file_preview;
pub mod file_selector;
pub mod gradients;
pub mod high_contrast;
pub mod keybind_help;
pub mod keybindings;
pub mod message_bubble;
pub mod network_quality;
pub mod screen_reader;
pub mod setting_widget;
pub mod settings_actions;
pub mod settings_view;
pub mod sparkline;
pub mod speed_indicator;
pub mod spinner;
pub mod theme_definitions;
pub mod transfer_gauge;
pub mod transfer_progress;
pub mod transfer_summary;
pub mod transitions;
pub mod trust_badge;
pub mod vim_mode;

// Re-export main types for convenience
pub use bandwidth_chart::{BandwidthChart, DataPoint};
pub use chat_input::{ChatInput, ChatInputState};
pub use chat_view::{ChatMessage, ChatView, ChatViewState, MessageStatus};
pub use message_bubble::MessageBubble;
pub use network_quality::{NetworkMetrics, NetworkQuality, QualityRating};
pub use sparkline::{Sparkline, SparklineMode};
