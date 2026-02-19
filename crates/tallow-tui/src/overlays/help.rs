//! Help overlay
//!
//! Note: The help overlay rendering is in render.rs (render_help_overlay)
//! since it needs direct frame access for the Clear widget.
//! This module provides the help text data.

/// Help entry
pub struct HelpEntry {
    /// Key binding
    pub key: &'static str,
    /// Description
    pub description: &'static str,
}

/// Get all help entries
pub fn entries() -> Vec<HelpEntry> {
    vec![
        HelpEntry {
            key: "q / Ctrl+C",
            description: "Quit",
        },
        HelpEntry {
            key: "Tab",
            description: "Switch panel focus",
        },
        HelpEntry {
            key: "?",
            description: "Toggle this help",
        },
        HelpEntry {
            key: "1",
            description: "Dashboard mode",
        },
        HelpEntry {
            key: "2",
            description: "Minimal mode",
        },
        HelpEntry {
            key: "3",
            description: "Zen mode",
        },
        HelpEntry {
            key: "4",
            description: "Monitor mode",
        },
        HelpEntry {
            key: "r",
            description: "Refresh",
        },
    ]
}
