//! Security utilities for TUI
//!
//! Ensures no sensitive data remains visible on screen after exit or panic.

/// Wipe the screen buffer (security feature)
///
/// Clears all content from the terminal including scrollback buffer
/// so no transfer data remains visible after exit.
pub fn wipe_screen() {
    // Clear the screen
    let _ = crossterm::execute!(
        std::io::stdout(),
        crossterm::terminal::Clear(crossterm::terminal::ClearType::All),
        crossterm::cursor::MoveTo(0, 0)
    );

    // Also try clearscreen for more thorough wiping
    let _ = clearscreen::clear();
}

/// Restore terminal to normal state
///
/// Disables raw mode and shows the cursor.
pub fn restore_terminal() {
    let _ = crossterm::terminal::disable_raw_mode();
    let _ = crossterm::execute!(
        std::io::stdout(),
        crossterm::terminal::LeaveAlternateScreen,
        crossterm::cursor::Show
    );
}

/// Install panic handler that restores terminal and wipes screen
///
/// Without this, a panic in TUI mode leaves the terminal in raw mode
/// with residual transfer data visible.
pub fn install_panic_handler() {
    let default_hook = std::panic::take_hook();

    std::panic::set_hook(Box::new(move |panic_info| {
        // Restore terminal first
        restore_terminal();
        // Wipe screen
        wipe_screen();
        // Then print the panic info normally
        default_hook(panic_info);
    }));
}
