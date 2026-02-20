//! Keybinding system for the TUI application.
//!
//! Provides a flexible keybinding system with support for multiple input modes,
//! customizable key mappings, and action dispatch.
//!
//! # Examples
//!
//! ```no_run
//! use tallow_tui::widgets::keybindings::{default_keymap, lookup, Action};
//! use crossterm::event::{KeyCode, KeyEvent, KeyModifiers};
//!
//! let keymap = default_keymap();
//! let key_event = KeyEvent::new(KeyCode::Char('q'), KeyModifiers::NONE);
//! if let Some(Action::Quit) = lookup(&keymap, &key_event) {
//!     println!("Quit action triggered");
//! }
//! ```

use crossterm::event::{KeyCode, KeyEvent, KeyModifiers};

/// Actions that can be triggered by keybindings.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Action {
    /// Quit the application.
    Quit,
    /// Show help/keybinding overlay.
    Help,
    /// Switch focus between panels.
    SwitchPanel,
    /// Navigate up in lists/menus.
    NavigateUp,
    /// Navigate down in lists/menus.
    NavigateDown,
    /// Navigate left in tabs/horizontal menus.
    NavigateLeft,
    /// Navigate right in tabs/horizontal menus.
    NavigateRight,
    /// Confirm/select current item.
    Confirm,
    /// Cancel/go back.
    Cancel,
    /// Open command palette.
    CommandPalette,
    /// Initiate file send.
    SendFiles,
    /// Receive files by room code.
    ReceiveByCode,
    /// Toggle theme mode.
    ToggleTheme,
    /// Select all items.
    SelectAll,
    /// Open search.
    Search,
    /// Scroll page up.
    PageUp,
    /// Scroll page down.
    PageDown,
    /// Jump to top.
    JumpTop,
    /// Jump to bottom.
    JumpBottom,
    /// Delete/remove item.
    Delete,
    /// Refresh current view.
    Refresh,
    /// Open settings.
    Settings,
    /// Copy to clipboard.
    Copy,
    /// Paste from clipboard.
    Paste,
    /// Undo last action.
    Undo,
    /// Show transfer history.
    History,
    /// Show device list.
    Devices,
    /// Toggle dark/light mode.
    ToggleColorScheme,
}

impl Action {
    /// Returns a human-readable description of the action.
    pub fn description(&self) -> &'static str {
        match self {
            Self::Quit => "Quit application",
            Self::Help => "Show help",
            Self::SwitchPanel => "Switch panel focus",
            Self::NavigateUp => "Navigate up",
            Self::NavigateDown => "Navigate down",
            Self::NavigateLeft => "Navigate left",
            Self::NavigateRight => "Navigate right",
            Self::Confirm => "Confirm/Select",
            Self::Cancel => "Cancel/Go back",
            Self::CommandPalette => "Command palette",
            Self::SendFiles => "Send files",
            Self::ReceiveByCode => "Receive by code",
            Self::ToggleTheme => "Toggle theme",
            Self::SelectAll => "Select all",
            Self::Search => "Search",
            Self::PageUp => "Page up",
            Self::PageDown => "Page down",
            Self::JumpTop => "Jump to top",
            Self::JumpBottom => "Jump to bottom",
            Self::Delete => "Delete item",
            Self::Refresh => "Refresh view",
            Self::Settings => "Open settings",
            Self::Copy => "Copy",
            Self::Paste => "Paste",
            Self::Undo => "Undo",
            Self::History => "Show history",
            Self::Devices => "Show devices",
            Self::ToggleColorScheme => "Toggle color scheme",
        }
    }

    /// Returns the category/group for this action.
    pub fn category(&self) -> &'static str {
        match self {
            Self::NavigateUp
            | Self::NavigateDown
            | Self::NavigateLeft
            | Self::NavigateRight
            | Self::PageUp
            | Self::PageDown
            | Self::JumpTop
            | Self::JumpBottom => "Navigation",

            Self::SendFiles | Self::ReceiveByCode | Self::History | Self::Devices => "Transfer",

            Self::ToggleTheme
            | Self::ToggleColorScheme
            | Self::SwitchPanel
            | Self::Settings
            | Self::Refresh => "UI",

            Self::Quit | Self::Help | Self::CommandPalette => "System",

            Self::Confirm
            | Self::Cancel
            | Self::SelectAll
            | Self::Search
            | Self::Delete
            | Self::Copy
            | Self::Paste
            | Self::Undo => "Actions",
        }
    }
}

/// A single keybinding mapping a key event to an action.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct KeyBinding {
    /// The key event that triggers this binding.
    pub key: KeyEvent,
    /// The action to perform.
    pub action: Action,
    /// Human-readable description.
    pub description: String,
}

impl KeyBinding {
    /// Creates a new keybinding.
    pub fn new(key: KeyEvent, action: Action) -> Self {
        Self {
            key,
            action,
            description: action.description().to_string(),
        }
    }

    /// Creates a keybinding with a custom description.
    pub fn with_description(key: KeyEvent, action: Action, description: impl Into<String>) -> Self {
        Self {
            key,
            action,
            description: description.into(),
        }
    }
}

/// Input mode for the application.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum InputMode {
    /// Normal mode (default, for navigation).
    Normal,
    /// Insert mode (text input).
    Insert,
    /// Command mode (command palette).
    Command,
}

impl Default for InputMode {
    fn default() -> Self {
        Self::Normal
    }
}

/// Complete keymap with all keybindings for an input mode.
#[derive(Debug, Clone)]
pub struct Keymap {
    /// All keybindings in this keymap.
    pub bindings: Vec<KeyBinding>,
    /// Current input mode.
    pub mode: InputMode,
}

impl Keymap {
    /// Creates a new empty keymap.
    pub fn new(mode: InputMode) -> Self {
        Self {
            bindings: Vec::new(),
            mode,
        }
    }

    /// Adds a keybinding to the keymap.
    pub fn bind(&mut self, key: KeyEvent, action: Action) -> &mut Self {
        self.bindings.push(KeyBinding::new(key, action));
        self
    }

    /// Adds a keybinding with a custom description.
    pub fn bind_with_description(
        &mut self,
        key: KeyEvent,
        action: Action,
        description: impl Into<String>,
    ) -> &mut Self {
        self.bindings
            .push(KeyBinding::with_description(key, action, description));
        self
    }
}

/// Creates the default keymap for normal mode.
///
/// Keybindings:
/// - `q`: Quit
/// - `?`: Help
/// - `Tab`: Switch panel
/// - `j`/`Down`: Navigate down
/// - `k`/`Up`: Navigate up
/// - `h`/`Left`: Navigate left
/// - `l`/`Right`: Navigate right
/// - `Enter`: Confirm
/// - `Esc`: Cancel
/// - `Ctrl+k`: Command palette
/// - `s`: Send files
/// - `r`: Receive by code
/// - `t`: Toggle theme
/// - `Ctrl+a`: Select all
/// - `/`: Search
/// - `Page Up`: Page up
/// - `Page Down`: Page down
/// - `g`: Jump to top
/// - `G`: Jump to bottom
/// - `d`: Delete
/// - `R`: Refresh (Shift+r)
/// - `,`: Settings
/// - `y`: Copy
/// - `p`: Paste
/// - `u`: Undo
/// - `H`: History (Shift+h)
/// - `D`: Devices (Shift+d)
/// - `c`: Toggle color scheme
///
/// # Examples
///
/// ```no_run
/// # use tallow_tui::widgets::keybindings::default_keymap;
/// let keymap = default_keymap();
/// ```
pub fn default_keymap() -> Keymap {
    let mut keymap = Keymap::new(InputMode::Normal);

    // System
    keymap.bind(key_event(KeyCode::Char('q'), KeyModifiers::NONE), Action::Quit);
    keymap.bind(key_event(KeyCode::Char('?'), KeyModifiers::NONE), Action::Help);
    keymap.bind(
        key_event(KeyCode::Char('k'), KeyModifiers::CONTROL),
        Action::CommandPalette,
    );

    // Navigation
    keymap.bind(key_event(KeyCode::Tab, KeyModifiers::NONE), Action::SwitchPanel);
    keymap.bind(key_event(KeyCode::Char('j'), KeyModifiers::NONE), Action::NavigateDown);
    keymap.bind(key_event(KeyCode::Down, KeyModifiers::NONE), Action::NavigateDown);
    keymap.bind(key_event(KeyCode::Char('k'), KeyModifiers::NONE), Action::NavigateUp);
    keymap.bind(key_event(KeyCode::Up, KeyModifiers::NONE), Action::NavigateUp);
    keymap.bind(key_event(KeyCode::Char('h'), KeyModifiers::NONE), Action::NavigateLeft);
    keymap.bind(key_event(KeyCode::Left, KeyModifiers::NONE), Action::NavigateLeft);
    keymap.bind(key_event(KeyCode::Char('l'), KeyModifiers::NONE), Action::NavigateRight);
    keymap.bind(key_event(KeyCode::Right, KeyModifiers::NONE), Action::NavigateRight);
    keymap.bind(key_event(KeyCode::PageUp, KeyModifiers::NONE), Action::PageUp);
    keymap.bind(key_event(KeyCode::PageDown, KeyModifiers::NONE), Action::PageDown);
    keymap.bind(key_event(KeyCode::Char('g'), KeyModifiers::NONE), Action::JumpTop);
    keymap.bind(key_event(KeyCode::Char('G'), KeyModifiers::SHIFT), Action::JumpBottom);

    // Actions
    keymap.bind(key_event(KeyCode::Enter, KeyModifiers::NONE), Action::Confirm);
    keymap.bind(key_event(KeyCode::Esc, KeyModifiers::NONE), Action::Cancel);
    keymap.bind(
        key_event(KeyCode::Char('a'), KeyModifiers::CONTROL),
        Action::SelectAll,
    );
    keymap.bind(key_event(KeyCode::Char('/'), KeyModifiers::NONE), Action::Search);
    keymap.bind(key_event(KeyCode::Char('d'), KeyModifiers::NONE), Action::Delete);
    keymap.bind(key_event(KeyCode::Char('y'), KeyModifiers::NONE), Action::Copy);
    keymap.bind(key_event(KeyCode::Char('p'), KeyModifiers::NONE), Action::Paste);
    keymap.bind(key_event(KeyCode::Char('u'), KeyModifiers::NONE), Action::Undo);

    // Transfer
    keymap.bind(key_event(KeyCode::Char('s'), KeyModifiers::NONE), Action::SendFiles);
    keymap.bind(key_event(KeyCode::Char('r'), KeyModifiers::NONE), Action::ReceiveByCode);
    keymap.bind(key_event(KeyCode::Char('H'), KeyModifiers::SHIFT), Action::History);
    keymap.bind(key_event(KeyCode::Char('D'), KeyModifiers::SHIFT), Action::Devices);

    // UI
    keymap.bind(key_event(KeyCode::Char('t'), KeyModifiers::NONE), Action::ToggleTheme);
    keymap.bind(key_event(KeyCode::Char('c'), KeyModifiers::NONE), Action::ToggleColorScheme);
    keymap.bind(key_event(KeyCode::Char('R'), KeyModifiers::SHIFT), Action::Refresh);
    keymap.bind(key_event(KeyCode::Char(','), KeyModifiers::NONE), Action::Settings);

    keymap
}

/// Looks up a keybinding in the keymap.
///
/// # Arguments
///
/// * `keymap` - The keymap to search
/// * `event` - The key event to look up
///
/// # Returns
///
/// `Some(Action)` if a matching binding is found, `None` otherwise.
///
/// # Examples
///
/// ```no_run
/// # use tallow_tui::widgets::keybindings::{default_keymap, lookup};
/// # use crossterm::event::{KeyCode, KeyEvent, KeyModifiers};
/// let keymap = default_keymap();
/// let key = KeyEvent::new(KeyCode::Char('q'), KeyModifiers::NONE);
/// let action = lookup(&keymap, &key);
/// ```
pub fn lookup(keymap: &Keymap, event: &KeyEvent) -> Option<Action> {
    keymap
        .bindings
        .iter()
        .find(|binding| binding.key == *event)
        .map(|binding| binding.action)
}

/// Creates a `KeyEvent` from a `KeyCode` and modifiers.
///
/// Helper function to make keybinding definitions more concise.
fn key_event(code: KeyCode, modifiers: KeyModifiers) -> KeyEvent {
    KeyEvent::new(code, modifiers)
}

/// Formats a key event as a human-readable string.
///
/// # Examples
///
/// ```no_run
/// # use tallow_tui::widgets::keybindings::format_key;
/// # use crossterm::event::{KeyCode, KeyEvent, KeyModifiers};
/// let key = KeyEvent::new(KeyCode::Char('q'), KeyModifiers::NONE);
/// assert_eq!(format_key(&key), "q");
///
/// let key = KeyEvent::new(KeyCode::Char('k'), KeyModifiers::CONTROL);
/// assert_eq!(format_key(&key), "Ctrl+k");
/// ```
pub fn format_key(event: &KeyEvent) -> String {
    let mut parts = Vec::new();

    if event.modifiers.contains(KeyModifiers::CONTROL) {
        parts.push("Ctrl");
    }
    if event.modifiers.contains(KeyModifiers::ALT) {
        parts.push("Alt");
    }
    if event.modifiers.contains(KeyModifiers::SHIFT) && !matches!(event.code, KeyCode::Char(_)) {
        parts.push("Shift");
    }

    let key_str = match event.code {
        KeyCode::Char(c) => {
            if event.modifiers.contains(KeyModifiers::SHIFT) {
                c.to_uppercase().to_string()
            } else {
                c.to_string()
            }
        }
        KeyCode::Enter => "Enter".to_string(),
        KeyCode::Tab => "Tab".to_string(),
        KeyCode::Esc => "Esc".to_string(),
        KeyCode::Backspace => "Backspace".to_string(),
        KeyCode::Delete => "Del".to_string(),
        KeyCode::Up => "↑".to_string(),
        KeyCode::Down => "↓".to_string(),
        KeyCode::Left => "←".to_string(),
        KeyCode::Right => "→".to_string(),
        KeyCode::PageUp => "PgUp".to_string(),
        KeyCode::PageDown => "PgDn".to_string(),
        KeyCode::Home => "Home".to_string(),
        KeyCode::End => "End".to_string(),
        KeyCode::F(n) => format!("F{}", n),
        _ => format!("{:?}", event.code),
    };

    parts.push(&key_str);
    parts.join("+")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_keymap_contains_quit() {
        let keymap = default_keymap();
        let quit_key = KeyEvent::new(KeyCode::Char('q'), KeyModifiers::NONE);
        assert_eq!(lookup(&keymap, &quit_key), Some(Action::Quit));
    }

    #[test]
    fn test_lookup_returns_none_for_unbound_key() {
        let keymap = default_keymap();
        let unbound_key = KeyEvent::new(KeyCode::Char('z'), KeyModifiers::CONTROL | KeyModifiers::SHIFT);
        assert_eq!(lookup(&keymap, &unbound_key), None);
    }

    #[test]
    fn test_action_description() {
        assert_eq!(Action::Quit.description(), "Quit application");
        assert_eq!(Action::Help.description(), "Show help");
    }

    #[test]
    fn test_action_category() {
        assert_eq!(Action::NavigateUp.category(), "Navigation");
        assert_eq!(Action::SendFiles.category(), "Transfer");
        assert_eq!(Action::Quit.category(), "System");
    }

    #[test]
    fn test_format_key_simple() {
        let key = KeyEvent::new(KeyCode::Char('q'), KeyModifiers::NONE);
        assert_eq!(format_key(&key), "q");
    }

    #[test]
    fn test_format_key_with_control() {
        let key = KeyEvent::new(KeyCode::Char('k'), KeyModifiers::CONTROL);
        assert_eq!(format_key(&key), "Ctrl+k");
    }

    #[test]
    fn test_format_key_with_shift() {
        let key = KeyEvent::new(KeyCode::Char('H'), KeyModifiers::SHIFT);
        assert_eq!(format_key(&key), "H");
    }
}
