//! Event handling

/// TUI events
#[derive(Debug)]
pub enum Event {
    /// Key press
    Key(KeyEvent),
    /// Mouse event
    Mouse,
    /// Resize event
    Resize(u16, u16),
    /// Tick event
    Tick,
}

/// Key event
#[derive(Debug)]
pub struct KeyEvent {
    /// Key code
    pub code: char,
}

/// Event handler
#[derive(Debug)]
pub struct EventHandler;

impl EventHandler {
    /// Create a new event handler
    pub fn new() -> Self {
        Self
    }

    /// Wait for next event
    pub fn next(&mut self) -> std::io::Result<Event> {
        todo!("Implement event polling with crossterm")
    }
}

impl Default for EventHandler {
    fn default() -> Self {
        Self::new()
    }
}
