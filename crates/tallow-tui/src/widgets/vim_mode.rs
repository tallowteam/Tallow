//! Vim-style modal keybinding system.
//!
//! Provides Vim-inspired modal editing with Normal, Insert, Command, and Visual modes.
//! Supports standard Vim navigation (hjkl), commands (dd, yy, gg, G), and mode switching.
//!
//! # Examples
//!
//! ```no_run
//! use tallow_tui::widgets::vim_mode::{VimState, process_vim_key};
//! use crossterm::event::{KeyCode, KeyEvent, KeyModifiers};
//!
//! let mut state = VimState::default();
//! let key = KeyEvent::new(KeyCode::Char('j'), KeyModifiers::NONE);
//! if let Some(action) = process_vim_key(&mut state, key) {
//!     println!("Action: {:?}", action);
//! }
//! ```

use crate::widgets::keybindings::{Action, InputMode, KeyBinding, Keymap};
use crossterm::event::{KeyCode, KeyEvent, KeyModifiers};

/// Vim input modes.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum VimMode {
    /// Normal mode for navigation and commands.
    Normal,
    /// Insert mode for text input.
    Insert,
    /// Command mode for ex commands.
    Command,
    /// Visual mode for selection.
    Visual,
}

impl Default for VimMode {
    fn default() -> Self {
        Self::Normal
    }
}

/// State for Vim modal editing.
#[derive(Debug, Clone)]
pub struct VimState {
    /// Current Vim mode.
    pub mode: VimMode,
    /// Command buffer for multi-key commands (e.g., "dd", "gg").
    pub command_buffer: String,
    /// Repeat count (e.g., "3j" -> count = 3).
    pub count: Option<usize>,
    /// Command line buffer (for : commands).
    pub command_line: String,
    /// Search buffer (for / commands).
    pub search_buffer: String,
}

impl Default for VimState {
    fn default() -> Self {
        Self {
            mode: VimMode::Normal,
            command_buffer: String::new(),
            count: None,
            command_line: String::new(),
            search_buffer: String::new(),
        }
    }
}

impl VimState {
    /// Creates a new Vim state in normal mode.
    pub fn new() -> Self {
        Self::default()
    }

    /// Resets the command buffer and count.
    pub fn reset_command(&mut self) {
        self.command_buffer.clear();
        self.count = None;
    }

    /// Switches to a different mode.
    pub fn switch_mode(&mut self, mode: VimMode) {
        self.mode = mode;
        self.reset_command();
        if mode == VimMode::Command {
            self.command_line.clear();
        } else if mode == VimMode::Normal {
            self.search_buffer.clear();
        }
    }
}

/// Creates a Vim-style keymap for normal mode.
///
/// Keybindings:
/// - `h`, `j`, `k`, `l`: Navigation (left, down, up, right)
/// - `i`: Enter insert mode
/// - `v`: Enter visual mode
/// - `Esc`: Return to normal mode
/// - `/`: Search
/// - `:`: Command mode
/// - `gg`: Jump to top
/// - `G`: Jump to bottom
/// - `dd`: Delete line
/// - `yy`: Yank/copy line
/// - `p`: Paste
/// - `u`: Undo
/// - `Ctrl+r`: Redo (mapped to Refresh)
/// - `Ctrl+d`: Page down
/// - `Ctrl+u`: Page up
/// - `w`: Navigate right (word)
/// - `b`: Navigate left (word)
/// - `0`: Jump to start of line
/// - `$`: Jump to end of line
/// - `ZZ`: Save and quit
///
/// # Examples
///
/// ```no_run
/// # use tallow_tui::widgets::vim_mode::vim_keymap;
/// let keymap = vim_keymap();
/// ```
pub fn vim_keymap() -> Keymap {
    let mut keymap = Keymap::new(InputMode::Normal);

    // Basic navigation (hjkl)
    keymap.bind(key_event(KeyCode::Char('h'), KeyModifiers::NONE), Action::NavigateLeft);
    keymap.bind(key_event(KeyCode::Char('j'), KeyModifiers::NONE), Action::NavigateDown);
    keymap.bind(key_event(KeyCode::Char('k'), KeyModifiers::NONE), Action::NavigateUp);
    keymap.bind(key_event(KeyCode::Char('l'), KeyModifiers::NONE), Action::NavigateRight);

    // Arrow keys
    keymap.bind(key_event(KeyCode::Left, KeyModifiers::NONE), Action::NavigateLeft);
    keymap.bind(key_event(KeyCode::Down, KeyModifiers::NONE), Action::NavigateDown);
    keymap.bind(key_event(KeyCode::Up, KeyModifiers::NONE), Action::NavigateUp);
    keymap.bind(key_event(KeyCode::Right, KeyModifiers::NONE), Action::NavigateRight);

    // Page navigation
    keymap.bind(
        key_event(KeyCode::Char('d'), KeyModifiers::CONTROL),
        Action::PageDown,
    );
    keymap.bind(
        key_event(KeyCode::Char('u'), KeyModifiers::CONTROL),
        Action::PageUp,
    );

    // Actions
    keymap.bind(key_event(KeyCode::Enter, KeyModifiers::NONE), Action::Confirm);
    keymap.bind(key_event(KeyCode::Esc, KeyModifiers::NONE), Action::Cancel);
    keymap.bind(key_event(KeyCode::Char('p'), KeyModifiers::NONE), Action::Paste);
    keymap.bind(key_event(KeyCode::Char('u'), KeyModifiers::NONE), Action::Undo);

    // Search and command
    keymap.bind(key_event(KeyCode::Char('/'), KeyModifiers::NONE), Action::Search);

    // System
    keymap.bind(key_event(KeyCode::Char('?'), KeyModifiers::NONE), Action::Help);

    // Transfer
    keymap.bind(key_event(KeyCode::Char('s'), KeyModifiers::NONE), Action::SendFiles);
    keymap.bind(key_event(KeyCode::Char('r'), KeyModifiers::NONE), Action::ReceiveByCode);

    // UI
    keymap.bind(key_event(KeyCode::Char('t'), KeyModifiers::NONE), Action::ToggleTheme);

    keymap
}

/// Processes a key event in Vim mode and returns an action.
///
/// Handles modal editing, command buffers, and repeat counts.
///
/// # Arguments
///
/// * `state` - Mutable Vim state
/// * `key` - Key event to process
///
/// # Returns
///
/// `Some(Action)` if a complete command is recognized, `None` otherwise.
///
/// # Examples
///
/// ```no_run
/// # use tallow_tui::widgets::vim_mode::{VimState, process_vim_key};
/// # use crossterm::event::{KeyCode, KeyEvent, KeyModifiers};
/// let mut state = VimState::default();
/// let key = KeyEvent::new(KeyCode::Char('j'), KeyModifiers::NONE);
/// let action = process_vim_key(&mut state, key);
/// ```
pub fn process_vim_key(state: &mut VimState, key: KeyEvent) -> Option<Action> {
    match state.mode {
        VimMode::Normal => process_normal_mode(state, key),
        VimMode::Insert => process_insert_mode(state, key),
        VimMode::Command => process_command_mode(state, key),
        VimMode::Visual => process_visual_mode(state, key),
    }
}

/// Processes a key in normal mode.
fn process_normal_mode(state: &mut VimState, key: KeyEvent) -> Option<Action> {
    // Handle numbers for repeat count
    if let KeyCode::Char(c) = key.code {
        if c.is_ascii_digit() && (state.count.is_some() || c != '0') {
            let digit = c.to_digit(10).unwrap() as usize;
            state.count = Some(state.count.unwrap_or(0) * 10 + digit);
            return None;
        }
    }

    // Mode switches
    match key.code {
        KeyCode::Char('i') if key.modifiers == KeyModifiers::NONE => {
            state.switch_mode(VimMode::Insert);
            return None;
        }
        KeyCode::Char('v') if key.modifiers == KeyModifiers::NONE => {
            state.switch_mode(VimMode::Visual);
            return None;
        }
        KeyCode::Char(':') if key.modifiers == KeyModifiers::NONE => {
            state.switch_mode(VimMode::Command);
            return None;
        }
        KeyCode::Char('/') if key.modifiers == KeyModifiers::NONE => {
            return Some(Action::Search);
        }
        _ => {}
    }

    // Handle multi-key commands
    if let KeyCode::Char(c) = key.code {
        state.command_buffer.push(c);

        let action = match state.command_buffer.as_str() {
            // Navigation
            "h" => Some(Action::NavigateLeft),
            "j" => Some(Action::NavigateDown),
            "k" => Some(Action::NavigateUp),
            "l" => Some(Action::NavigateRight),
            "w" => Some(Action::NavigateRight),
            "b" => Some(Action::NavigateLeft),

            // Jumping
            "gg" => Some(Action::JumpTop),
            "G" => Some(Action::JumpBottom),

            // Deletion
            "dd" => Some(Action::Delete),
            "d" if state.command_buffer.len() == 1 => return None, // Wait for second key

            // Yanking (copy)
            "yy" => Some(Action::Copy),
            "y" if state.command_buffer.len() == 1 => return None, // Wait for second key

            // Actions
            "p" => Some(Action::Paste),
            "u" => Some(Action::Undo),
            "x" => Some(Action::Delete),

            // Transfer
            "s" => Some(Action::SendFiles),
            "r" => Some(Action::ReceiveByCode),

            // UI
            "t" => Some(Action::ToggleTheme),

            // System
            "q" => Some(Action::Quit),
            "?" => Some(Action::Help),

            // Special sequences
            "ZZ" => Some(Action::Quit), // Save and quit

            _ => {
                // Invalid command, reset
                state.reset_command();
                None
            }
        };

        if action.is_some() {
            state.reset_command();
        }

        return action;
    }

    // Handle special keys
    let action = match key.code {
        KeyCode::Enter => Some(Action::Confirm),
        KeyCode::Esc => Some(Action::Cancel),
        KeyCode::Char('d') if key.modifiers.contains(KeyModifiers::CONTROL) => {
            Some(Action::PageDown)
        }
        KeyCode::Char('u') if key.modifiers.contains(KeyModifiers::CONTROL) => {
            Some(Action::PageUp)
        }
        KeyCode::Char('r') if key.modifiers.contains(KeyModifiers::CONTROL) => {
            Some(Action::Refresh)
        }
        _ => None,
    };

    if action.is_some() {
        state.reset_command();
    }

    action
}

/// Processes a key in insert mode.
fn process_insert_mode(state: &mut VimState, key: KeyEvent) -> Option<Action> {
    match key.code {
        KeyCode::Esc => {
            state.switch_mode(VimMode::Normal);
            None
        }
        _ => None, // Pass through to text input handler
    }
}

/// Processes a key in command mode.
fn process_command_mode(state: &mut VimState, key: KeyEvent) -> Option<Action> {
    match key.code {
        KeyCode::Esc => {
            state.switch_mode(VimMode::Normal);
            None
        }
        KeyCode::Enter => {
            let action = parse_command(&state.command_line);
            state.switch_mode(VimMode::Normal);
            action
        }
        KeyCode::Backspace => {
            state.command_line.pop();
            None
        }
        KeyCode::Char(c) => {
            state.command_line.push(c);
            None
        }
        _ => None,
    }
}

/// Processes a key in visual mode.
fn process_visual_mode(state: &mut VimState, key: KeyEvent) -> Option<Action> {
    match key.code {
        KeyCode::Esc => {
            state.switch_mode(VimMode::Normal);
            None
        }
        KeyCode::Char('y') => {
            state.switch_mode(VimMode::Normal);
            Some(Action::Copy)
        }
        KeyCode::Char('d') => {
            state.switch_mode(VimMode::Normal);
            Some(Action::Delete)
        }
        // Navigation in visual mode
        KeyCode::Char('h') | KeyCode::Left => Some(Action::NavigateLeft),
        KeyCode::Char('j') | KeyCode::Down => Some(Action::NavigateDown),
        KeyCode::Char('k') | KeyCode::Up => Some(Action::NavigateUp),
        KeyCode::Char('l') | KeyCode::Right => Some(Action::NavigateRight),
        _ => None,
    }
}

/// Parses a command line string into an action.
fn parse_command(cmd: &str) -> Option<Action> {
    match cmd.trim() {
        "q" | "quit" => Some(Action::Quit),
        "w" | "write" => None, // Not applicable in TUI context
        "wq" => Some(Action::Quit),
        "h" | "help" => Some(Action::Help),
        "set" => Some(Action::Settings),
        "refresh" => Some(Action::Refresh),
        "theme" => Some(Action::ToggleTheme),
        "send" => Some(Action::SendFiles),
        "receive" => Some(Action::ReceiveByCode),
        "history" => Some(Action::History),
        "devices" => Some(Action::Devices),
        _ => None,
    }
}

/// Helper to create key events.
fn key_event(code: KeyCode, modifiers: KeyModifiers) -> KeyEvent {
    KeyEvent::new(code, modifiers)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vim_state_default() {
        let state = VimState::default();
        assert_eq!(state.mode, VimMode::Normal);
        assert!(state.command_buffer.is_empty());
        assert_eq!(state.count, None);
    }

    #[test]
    fn test_mode_switch_to_insert() {
        let mut state = VimState::default();
        let key = KeyEvent::new(KeyCode::Char('i'), KeyModifiers::NONE);
        process_vim_key(&mut state, key);
        assert_eq!(state.mode, VimMode::Insert);
    }

    #[test]
    fn test_mode_switch_from_insert() {
        let mut state = VimState::default();
        state.mode = VimMode::Insert;
        let key = KeyEvent::new(KeyCode::Esc, KeyModifiers::NONE);
        process_vim_key(&mut state, key);
        assert_eq!(state.mode, VimMode::Normal);
    }

    #[test]
    fn test_normal_mode_navigation() {
        let mut state = VimState::default();
        let key = KeyEvent::new(KeyCode::Char('j'), KeyModifiers::NONE);
        let action = process_vim_key(&mut state, key);
        assert_eq!(action, Some(Action::NavigateDown));
    }

    #[test]
    fn test_multi_key_command_gg() {
        let mut state = VimState::default();
        process_vim_key(&mut state, KeyEvent::new(KeyCode::Char('g'), KeyModifiers::NONE));
        let action = process_vim_key(&mut state, KeyEvent::new(KeyCode::Char('g'), KeyModifiers::NONE));
        assert_eq!(action, Some(Action::JumpTop));
    }

    #[test]
    fn test_multi_key_command_dd() {
        let mut state = VimState::default();
        process_vim_key(&mut state, KeyEvent::new(KeyCode::Char('d'), KeyModifiers::NONE));
        let action = process_vim_key(&mut state, KeyEvent::new(KeyCode::Char('d'), KeyModifiers::NONE));
        assert_eq!(action, Some(Action::Delete));
    }

    #[test]
    fn test_command_mode_quit() {
        let mut state = VimState::default();
        state.switch_mode(VimMode::Command);
        state.command_line = "q".to_string();
        let action = process_vim_key(&mut state, KeyEvent::new(KeyCode::Enter, KeyModifiers::NONE));
        assert_eq!(action, Some(Action::Quit));
        assert_eq!(state.mode, VimMode::Normal);
    }

    #[test]
    fn test_visual_mode_yank() {
        let mut state = VimState::default();
        state.switch_mode(VimMode::Visual);
        let action = process_vim_key(&mut state, KeyEvent::new(KeyCode::Char('y'), KeyModifiers::NONE));
        assert_eq!(action, Some(Action::Copy));
        assert_eq!(state.mode, VimMode::Normal);
    }

    #[test]
    fn test_count_parsing() {
        let mut state = VimState::default();
        process_vim_key(&mut state, KeyEvent::new(KeyCode::Char('3'), KeyModifiers::NONE));
        assert_eq!(state.count, Some(3));
        process_vim_key(&mut state, KeyEvent::new(KeyCode::Char('5'), KeyModifiers::NONE));
        assert_eq!(state.count, Some(35));
    }
}
