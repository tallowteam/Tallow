//! Emacs-style keybinding system.
//!
//! Provides Emacs-inspired keybindings with extensive use of Control and Meta (Alt)
//! modifiers for navigation and editing commands.
//!
//! # Examples
//!
//! ```no_run
//! use tallow_tui::widgets::emacs_mode::emacs_keymap;
//!
//! let keymap = emacs_keymap();
//! ```

use crate::widgets::keybindings::{Action, InputMode, Keymap};
use crossterm::event::{KeyCode, KeyEvent, KeyModifiers};

/// Creates an Emacs-style keymap.
///
/// Keybindings follow standard Emacs conventions:
///
/// **Navigation:**
/// - `Ctrl+n`: Next line (down)
/// - `Ctrl+p`: Previous line (up)
/// - `Ctrl+f`: Forward character (right)
/// - `Ctrl+b`: Backward character (left)
/// - `Ctrl+a`: Beginning of line (home)
/// - `Ctrl+e`: End of line (end)
/// - `Ctrl+v`: Page down
/// - `Alt+v`: Page up
/// - `Alt+<`: Beginning of buffer (top)
/// - `Alt+>`: End of buffer (bottom)
/// - `Alt+f`: Forward word (right)
/// - `Alt+b`: Backward word (left)
///
/// **Editing:**
/// - `Ctrl+d`: Delete character
/// - `Ctrl+k`: Kill line (delete to end)
/// - `Ctrl+w`: Kill region (cut)
/// - `Alt+w`: Save region (copy)
/// - `Ctrl+y`: Yank (paste)
/// - `Ctrl+/`: Undo
/// - `Ctrl+_`: Undo (alternative)
/// - `Ctrl+space`: Set mark (start selection)
///
/// **Search & Command:**
/// - `Ctrl+s`: Search forward
/// - `Ctrl+r`: Search backward (mapped to Refresh in TUI)
/// - `Alt+x`: Execute command (command palette)
/// - `Ctrl+g`: Cancel/quit command
/// - `Ctrl+h`: Help
///
/// **Transfer:**
/// - `Ctrl+t s`: Send files
/// - `Ctrl+t r`: Receive by code
/// - `Ctrl+t h`: Show history
/// - `Ctrl+t d`: Show devices
///
/// **System:**
/// - `Ctrl+x Ctrl+c`: Quit application
/// - `Ctrl+x Ctrl+s`: Settings (save)
/// - `Ctrl+l`: Refresh screen
///
/// # Examples
///
/// ```no_run
/// # use tallow_tui::widgets::emacs_mode::emacs_keymap;
/// let keymap = emacs_keymap();
/// ```
pub fn emacs_keymap() -> Keymap {
    let mut keymap = Keymap::new(InputMode::Normal);

    // Navigation - Ctrl+n/p/f/b (Next/Previous/Forward/Backward)
    keymap.bind(
        key_event(KeyCode::Char('n'), KeyModifiers::CONTROL),
        Action::NavigateDown,
    );
    keymap.bind(
        key_event(KeyCode::Char('p'), KeyModifiers::CONTROL),
        Action::NavigateUp,
    );
    keymap.bind(
        key_event(KeyCode::Char('f'), KeyModifiers::CONTROL),
        Action::NavigateRight,
    );
    keymap.bind(
        key_event(KeyCode::Char('b'), KeyModifiers::CONTROL),
        Action::NavigateLeft,
    );

    // Arrow keys (standard)
    keymap.bind(
        key_event(KeyCode::Up, KeyModifiers::NONE),
        Action::NavigateUp,
    );
    keymap.bind(
        key_event(KeyCode::Down, KeyModifiers::NONE),
        Action::NavigateDown,
    );
    keymap.bind(
        key_event(KeyCode::Left, KeyModifiers::NONE),
        Action::NavigateLeft,
    );
    keymap.bind(
        key_event(KeyCode::Right, KeyModifiers::NONE),
        Action::NavigateRight,
    );

    // Beginning/End of line - Ctrl+a/e
    keymap.bind_with_description(
        key_event(KeyCode::Char('a'), KeyModifiers::CONTROL),
        Action::NavigateLeft,
        "Jump to start",
    );
    keymap.bind_with_description(
        key_event(KeyCode::Char('e'), KeyModifiers::CONTROL),
        Action::NavigateRight,
        "Jump to end",
    );

    // Page navigation - Ctrl+v / Alt+v
    keymap.bind(
        key_event(KeyCode::Char('v'), KeyModifiers::CONTROL),
        Action::PageDown,
    );
    keymap.bind(
        key_event(KeyCode::Char('v'), KeyModifiers::ALT),
        Action::PageUp,
    );

    // Jump to top/bottom - Alt+< / Alt+>
    keymap.bind(
        key_event(KeyCode::Char('<'), KeyModifiers::ALT),
        Action::JumpTop,
    );
    keymap.bind(
        key_event(KeyCode::Char('>'), KeyModifiers::ALT),
        Action::JumpBottom,
    );

    // Word navigation - Alt+f/b
    keymap.bind_with_description(
        key_event(KeyCode::Char('f'), KeyModifiers::ALT),
        Action::NavigateRight,
        "Forward word",
    );
    keymap.bind_with_description(
        key_event(KeyCode::Char('b'), KeyModifiers::ALT),
        Action::NavigateLeft,
        "Backward word",
    );

    // Editing - Delete
    keymap.bind(
        key_event(KeyCode::Char('d'), KeyModifiers::CONTROL),
        Action::Delete,
    );
    keymap.bind_with_description(
        key_event(KeyCode::Char('k'), KeyModifiers::CONTROL),
        Action::Delete,
        "Kill line",
    );

    // Cut/Copy/Paste - Ctrl+w / Alt+w / Ctrl+y
    keymap.bind_with_description(
        key_event(KeyCode::Char('w'), KeyModifiers::CONTROL),
        Action::Delete,
        "Cut region",
    );
    keymap.bind_with_description(
        key_event(KeyCode::Char('w'), KeyModifiers::ALT),
        Action::Copy,
        "Copy region",
    );
    keymap.bind_with_description(
        key_event(KeyCode::Char('y'), KeyModifiers::CONTROL),
        Action::Paste,
        "Yank (paste)",
    );

    // Undo - Ctrl+/ or Ctrl+_
    keymap.bind(
        key_event(KeyCode::Char('/'), KeyModifiers::CONTROL),
        Action::Undo,
    );
    keymap.bind(
        key_event(KeyCode::Char('_'), KeyModifiers::CONTROL),
        Action::Undo,
    );

    // Selection - Ctrl+space (start mark)
    keymap.bind_with_description(
        key_event(KeyCode::Char(' '), KeyModifiers::CONTROL),
        Action::SelectAll,
        "Set mark",
    );

    // Search - Ctrl+s / Ctrl+r
    keymap.bind_with_description(
        key_event(KeyCode::Char('s'), KeyModifiers::CONTROL),
        Action::Search,
        "Search forward",
    );
    keymap.bind_with_description(
        key_event(KeyCode::Char('r'), KeyModifiers::CONTROL),
        Action::Refresh,
        "Search backward/Refresh",
    );

    // Command palette - Alt+x
    keymap.bind_with_description(
        key_event(KeyCode::Char('x'), KeyModifiers::ALT),
        Action::CommandPalette,
        "Execute command",
    );

    // Cancel - Ctrl+g
    keymap.bind_with_description(
        key_event(KeyCode::Char('g'), KeyModifiers::CONTROL),
        Action::Cancel,
        "Quit/Cancel",
    );

    // Help - Ctrl+h
    keymap.bind(
        key_event(KeyCode::Char('h'), KeyModifiers::CONTROL),
        Action::Help,
    );

    // Refresh screen - Ctrl+l
    keymap.bind_with_description(
        key_event(KeyCode::Char('l'), KeyModifiers::CONTROL),
        Action::Refresh,
        "Refresh screen",
    );

    // Quit - Ctrl+x Ctrl+c (simplified to just show as Ctrl+q for single-key quit)
    keymap.bind_with_description(
        key_event(KeyCode::Char('q'), KeyModifiers::CONTROL),
        Action::Quit,
        "Quit application",
    );

    // Settings - Ctrl+,
    keymap.bind(
        key_event(KeyCode::Char(','), KeyModifiers::CONTROL),
        Action::Settings,
    );

    // Transfer operations
    keymap.bind_with_description(
        key_event(KeyCode::Char('t'), KeyModifiers::ALT),
        Action::SendFiles,
        "Transfer: Send files",
    );

    // Theme toggle
    keymap.bind(
        key_event(KeyCode::Char('t'), KeyModifiers::CONTROL),
        Action::ToggleTheme,
    );

    // Standard actions
    keymap.bind(
        key_event(KeyCode::Enter, KeyModifiers::NONE),
        Action::Confirm,
    );
    keymap.bind(key_event(KeyCode::Esc, KeyModifiers::NONE), Action::Cancel);

    keymap
}

/// Emacs-style state for multi-key commands.
///
/// Tracks prefix keys like `Ctrl+x` for sequences like `Ctrl+x Ctrl+c`.
#[derive(Debug, Clone, Default)]
pub struct EmacsState {
    /// Current prefix key (e.g., "Ctrl+x").
    pub prefix: Option<String>,
    /// Mini-buffer content for commands.
    pub minibuffer: String,
}

impl EmacsState {
    /// Creates a new Emacs state.
    pub fn new() -> Self {
        Self::default()
    }

    /// Resets the state.
    pub fn reset(&mut self) {
        self.prefix = None;
        self.minibuffer.clear();
    }
}

/// Processes a key event in Emacs mode.
///
/// Handles prefix keys and multi-key sequences.
///
/// # Arguments
///
/// * `state` - Mutable Emacs state
/// * `key` - Key event to process
///
/// # Returns
///
/// `Some(Action)` if a complete command is recognized, `None` otherwise.
///
/// # Examples
///
/// ```no_run
/// # use tallow_tui::widgets::emacs_mode::{EmacsState, process_emacs_key};
/// # use crossterm::event::{KeyCode, KeyEvent, KeyModifiers};
/// let mut state = EmacsState::default();
/// let key = KeyEvent::new(KeyCode::Char('n'), KeyModifiers::CONTROL);
/// let action = process_emacs_key(&mut state, key);
/// ```
pub fn process_emacs_key(state: &mut EmacsState, key: KeyEvent) -> Option<Action> {
    // Check for Ctrl+x prefix
    if key.code == KeyCode::Char('x') && key.modifiers.contains(KeyModifiers::CONTROL) {
        state.prefix = Some("C-x".to_string());
        return None;
    }

    // Handle Ctrl+x sequences
    if let Some(ref prefix) = state.prefix {
        if prefix == "C-x" {
            state.reset();

            return match (key.code, key.modifiers) {
                (KeyCode::Char('c'), KeyModifiers::CONTROL) => Some(Action::Quit),
                (KeyCode::Char('s'), KeyModifiers::CONTROL) => Some(Action::Settings),
                (KeyCode::Char('h'), KeyModifiers::CONTROL) => Some(Action::History),
                _ => None,
            };
        }
    }

    // Delegate to keymap lookup
    let keymap = emacs_keymap();
    crate::widgets::keybindings::lookup(&keymap, &key)
}

/// Helper to create key events.
fn key_event(code: KeyCode, modifiers: KeyModifiers) -> KeyEvent {
    KeyEvent::new(code, modifiers)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_emacs_keymap_navigation() {
        let keymap = emacs_keymap();
        let key_down = KeyEvent::new(KeyCode::Char('n'), KeyModifiers::CONTROL);
        let action = crate::widgets::keybindings::lookup(&keymap, &key_down);
        assert_eq!(action, Some(Action::NavigateDown));
    }

    #[test]
    fn test_emacs_keymap_search() {
        let keymap = emacs_keymap();
        let key_search = KeyEvent::new(KeyCode::Char('s'), KeyModifiers::CONTROL);
        let action = crate::widgets::keybindings::lookup(&keymap, &key_search);
        assert_eq!(action, Some(Action::Search));
    }

    #[test]
    fn test_emacs_keymap_page_down() {
        let keymap = emacs_keymap();
        let key = KeyEvent::new(KeyCode::Char('v'), KeyModifiers::CONTROL);
        let action = crate::widgets::keybindings::lookup(&keymap, &key);
        assert_eq!(action, Some(Action::PageDown));
    }

    #[test]
    fn test_emacs_state_default() {
        let state = EmacsState::default();
        assert_eq!(state.prefix, None);
        assert!(state.minibuffer.is_empty());
    }

    #[test]
    fn test_process_emacs_key_prefix() {
        let mut state = EmacsState::default();
        let key = KeyEvent::new(KeyCode::Char('x'), KeyModifiers::CONTROL);
        let action = process_emacs_key(&mut state, key);
        assert_eq!(action, None);
        assert_eq!(state.prefix, Some("C-x".to_string()));
    }

    #[test]
    fn test_process_emacs_key_sequence_quit() {
        let mut state = EmacsState::default();
        state.prefix = Some("C-x".to_string());
        let key = KeyEvent::new(KeyCode::Char('c'), KeyModifiers::CONTROL);
        let action = process_emacs_key(&mut state, key);
        assert_eq!(action, Some(Action::Quit));
        assert_eq!(state.prefix, None);
    }

    #[test]
    fn test_emacs_keymap_help() {
        let keymap = emacs_keymap();
        let key = KeyEvent::new(KeyCode::Char('h'), KeyModifiers::CONTROL);
        let action = crate::widgets::keybindings::lookup(&keymap, &key);
        assert_eq!(action, Some(Action::Help));
    }
}
