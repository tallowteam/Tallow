//! Security utilities for TUI

/// Wipe the screen (security feature)
pub fn wipe_screen() {
    todo!("Implement screen wiping")
}

/// Install panic handler that wipes screen
pub fn install_panic_handler() {
    std::panic::set_hook(Box::new(|_| {
        // Would wipe screen on panic
    }));
}
