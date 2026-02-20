//! Event handling using crossterm

use crossterm::event::{self, Event as CrosstermEvent, KeyCode, KeyModifiers};
use std::io;
use std::time::Duration;

/// TUI events
#[derive(Debug)]
pub enum Event {
    /// Key press
    Key(KeyEvent),
    /// Mouse event
    Mouse,
    /// Resize event
    Resize(u16, u16),
    /// Tick event (periodic refresh)
    Tick,
}

/// Key event
#[derive(Debug)]
pub struct KeyEvent {
    /// Key code
    pub code: KeyCode,
    /// Modifiers (Ctrl, Alt, Shift)
    pub modifiers: KeyModifiers,
}

/// Event handler that polls crossterm events
#[derive(Debug)]
pub struct EventHandler {
    /// Tick rate in milliseconds
    tick_rate_ms: u64,
}

impl EventHandler {
    /// Create a new event handler with default tick rate (250ms)
    pub fn new() -> Self {
        Self { tick_rate_ms: 250 }
    }

    /// Create with custom tick rate
    pub fn with_tick_rate(tick_rate_ms: u64) -> Self {
        Self { tick_rate_ms }
    }

    /// Wait for the next event
    ///
    /// Returns a Tick event if no input arrives within the tick period.
    pub fn next(&self) -> io::Result<Event> {
        if event::poll(Duration::from_millis(self.tick_rate_ms))? {
            match event::read()? {
                CrosstermEvent::Key(key) => Ok(Event::Key(KeyEvent {
                    code: key.code,
                    modifiers: key.modifiers,
                })),
                CrosstermEvent::Mouse(_) => Ok(Event::Mouse),
                CrosstermEvent::Resize(w, h) => Ok(Event::Resize(w, h)),
                _ => Ok(Event::Tick),
            }
        } else {
            Ok(Event::Tick)
        }
    }
}

impl Default for EventHandler {
    fn default() -> Self {
        Self::new()
    }
}
