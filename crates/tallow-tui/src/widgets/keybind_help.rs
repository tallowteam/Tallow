//! Help overlay widget displaying all available keybindings.
//!
//! Provides a formatted help screen showing all keybindings grouped by category,
//! with support for different keybinding modes (default, Vim, Emacs).
//!
//! # Examples
//!
//! ```no_run
//! use tallow_tui::widgets::keybind_help::KeybindHelp;
//! use tallow_tui::widgets::keybindings::default_keymap;
//! use ratatui::backend::CrosstermBackend;
//! use ratatui::Terminal;
//!
//! let keymap = default_keymap();
//! let help = KeybindHelp::new(keymap);
//! // Render with: frame.render_widget(help, area);
//! ```

use crate::widgets::keybindings::{format_key, Action, Keymap};
use ratatui::{
    buffer::Buffer,
    layout::{Alignment, Constraint, Layout, Rect},
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, Paragraph, Widget, Wrap},
};
use std::collections::HashMap;

/// Help widget displaying all keybindings.
#[derive(Debug, Clone)]
pub struct KeybindHelp {
    /// The keymap to display.
    keymap: Keymap,
    /// Whether the help overlay is visible.
    visible: bool,
    /// Title for the help screen.
    title: String,
    /// Background color.
    bg_color: Color,
    /// Foreground color.
    fg_color: Color,
    /// Border color.
    border_color: Color,
    /// Highlight color for key names.
    key_color: Color,
}

impl KeybindHelp {
    /// Creates a new help widget.
    ///
    /// # Arguments
    ///
    /// * `keymap` - The keymap to display bindings from
    ///
    /// # Examples
    ///
    /// ```no_run
    /// # use tallow_tui::widgets::keybind_help::KeybindHelp;
    /// # use tallow_tui::widgets::keybindings::default_keymap;
    /// let help = KeybindHelp::new(default_keymap());
    /// ```
    pub fn new(keymap: Keymap) -> Self {
        Self {
            keymap,
            visible: true,
            title: "Keyboard Shortcuts".to_string(),
            bg_color: Color::Rgb(26, 27, 38),      // Dark background
            fg_color: Color::Rgb(192, 202, 245),   // Light foreground
            border_color: Color::Rgb(122, 162, 247), // Blue border
            key_color: Color::Rgb(158, 206, 106),  // Green for keys
        }
    }

    /// Sets the visibility of the help overlay.
    pub fn visible(mut self, visible: bool) -> Self {
        self.visible = visible;
        self
    }

    /// Sets a custom title.
    pub fn title(mut self, title: impl Into<String>) -> Self {
        self.title = title.into();
        self
    }

    /// Sets the background color.
    pub fn bg_color(mut self, color: Color) -> Self {
        self.bg_color = color;
        self
    }

    /// Sets the foreground color.
    pub fn fg_color(mut self, color: Color) -> Self {
        self.fg_color = color;
        self
    }

    /// Sets the border color.
    pub fn border_color(mut self, color: Color) -> Self {
        self.border_color = color;
        self
    }

    /// Sets the key highlight color.
    pub fn key_color(mut self, color: Color) -> Self {
        self.key_color = color;
        self
    }

    /// Toggles visibility.
    pub fn toggle(&mut self) {
        self.visible = !self.visible;
    }

    /// Groups keybindings by category.
    fn group_by_category(&self) -> HashMap<String, Vec<(String, String)>> {
        let mut groups: HashMap<String, Vec<(String, String)>> = HashMap::new();

        for binding in &self.keymap.bindings {
            let category = binding.action.category().to_string();
            let key_str = format_key(&binding.key);
            let desc = binding.description.clone();

            groups
                .entry(category)
                .or_default()
                .push((key_str, desc));
        }

        // Sort entries within each category
        for entries in groups.values_mut() {
            entries.sort_by(|a, b| a.0.cmp(&b.0));
        }

        groups
    }

    /// Generates formatted lines for the help screen.
    fn generate_help_lines(&self) -> Vec<Line<'static>> {
        let mut lines = Vec::new();

        // Header
        lines.push(Line::from(vec![
            Span::styled(
                "Press ",
                Style::default().fg(self.fg_color),
            ),
            Span::styled(
                "?",
                Style::default()
                    .fg(self.key_color)
                    .add_modifier(Modifier::BOLD),
            ),
            Span::styled(
                " or ",
                Style::default().fg(self.fg_color),
            ),
            Span::styled(
                "Esc",
                Style::default()
                    .fg(self.key_color)
                    .add_modifier(Modifier::BOLD),
            ),
            Span::styled(
                " to close",
                Style::default().fg(self.fg_color),
            ),
        ]));
        lines.push(Line::from(""));

        let groups = self.group_by_category();

        // Define category order for consistent display
        let category_order = [
            "Navigation",
            "Transfer",
            "Actions",
            "UI",
            "System",
        ];

        for category in &category_order {
            if let Some(entries) = groups.get(*category) {
                // Category header
                lines.push(Line::from(Span::styled(
                    format!("╭─ {} ", category),
                    Style::default()
                        .fg(self.border_color)
                        .add_modifier(Modifier::BOLD),
                )));

                // Entries
                for (key, desc) in entries {
                    lines.push(Line::from(vec![
                        Span::raw("│ "),
                        Span::styled(
                            format!("{:12}", key),
                            Style::default()
                                .fg(self.key_color)
                                .add_modifier(Modifier::BOLD),
                        ),
                        Span::raw(" "),
                        Span::styled(
                            desc.clone(),
                            Style::default().fg(self.fg_color),
                        ),
                    ]));
                }

                lines.push(Line::from(Span::styled(
                    "╰─",
                    Style::default().fg(self.border_color),
                )));
                lines.push(Line::from(""));
            }
        }

        // Add any remaining categories not in the predefined order
        for (category, entries) in &groups {
            if !category_order.contains(&category.as_str()) {
                lines.push(Line::from(Span::styled(
                    format!("╭─ {} ", category),
                    Style::default()
                        .fg(self.border_color)
                        .add_modifier(Modifier::BOLD),
                )));

                for (key, desc) in entries {
                    lines.push(Line::from(vec![
                        Span::raw("│ "),
                        Span::styled(
                            format!("{:12}", key),
                            Style::default()
                                .fg(self.key_color)
                                .add_modifier(Modifier::BOLD),
                        ),
                        Span::raw(" "),
                        Span::styled(
                            desc.clone(),
                            Style::default().fg(self.fg_color),
                        ),
                    ]));
                }

                lines.push(Line::from(Span::styled(
                    "╰─",
                    Style::default().fg(self.border_color),
                )));
                lines.push(Line::from(""));
            }
        }

        lines
    }
}

impl Widget for KeybindHelp {
    fn render(self, area: Rect, buf: &mut Buffer) {
        if !self.visible {
            return;
        }

        // Create centered overlay
        let popup_width = area.width.min(80);
        let popup_height = area.height.min(40);
        let popup_x = (area.width.saturating_sub(popup_width)) / 2;
        let popup_y = (area.height.saturating_sub(popup_height)) / 2;

        let popup_area = Rect {
            x: area.x + popup_x,
            y: area.y + popup_y,
            width: popup_width,
            height: popup_height,
        };

        // Clear background
        for y in popup_area.top()..popup_area.bottom() {
            for x in popup_area.left()..popup_area.right() {
                if let Some(cell) = buf.cell_mut((x, y)) {
                    cell.set_bg(self.bg_color);
                }
            }
        }

        // Create block with border
        let block = Block::default()
            .title(self.title.clone())
            .borders(Borders::ALL)
            .border_style(Style::default().fg(self.border_color))
            .style(Style::default().bg(self.bg_color).fg(self.fg_color));

        let inner_area = block.inner(popup_area);
        block.render(popup_area, buf);

        // Generate help content
        let lines = self.generate_help_lines();

        // Render content with scrolling support
        let paragraph = Paragraph::new(lines)
            .style(Style::default().bg(self.bg_color).fg(self.fg_color))
            .wrap(Wrap { trim: false });

        paragraph.render(inner_area, buf);
    }
}

/// Helper widget for multi-column keybinding display.
#[derive(Debug, Clone)]
pub struct KeybindColumns {
    /// Left column keybindings.
    left: Vec<(String, String)>,
    /// Right column keybindings.
    right: Vec<(String, String)>,
    /// Foreground color.
    fg_color: Color,
    /// Key highlight color.
    key_color: Color,
}

impl KeybindColumns {
    /// Creates a new two-column keybinding display.
    pub fn new(bindings: Vec<(String, String)>) -> Self {
        let mid = (bindings.len() + 1) / 2;
        let (left, right) = bindings.split_at(mid);

        Self {
            left: left.to_vec(),
            right: right.to_vec(),
            fg_color: Color::Rgb(192, 202, 245),
            key_color: Color::Rgb(158, 206, 106),
        }
    }

    /// Sets colors.
    pub fn colors(mut self, fg: Color, key: Color) -> Self {
        self.fg_color = fg;
        self.key_color = key;
        self
    }
}

impl Widget for KeybindColumns {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let chunks = Layout::default()
            .direction(ratatui::layout::Direction::Horizontal)
            .constraints([Constraint::Percentage(50), Constraint::Percentage(50)])
            .split(area);

        // Render left column
        let left_lines: Vec<Line> = self
            .left
            .iter()
            .map(|(key, desc)| {
                Line::from(vec![
                    Span::styled(
                        format!("{:12}", key),
                        Style::default()
                            .fg(self.key_color)
                            .add_modifier(Modifier::BOLD),
                    ),
                    Span::raw(" "),
                    Span::styled(desc.clone(), Style::default().fg(self.fg_color)),
                ])
            })
            .collect();

        let left_para = Paragraph::new(left_lines);
        left_para.render(chunks[0], buf);

        // Render right column
        let right_lines: Vec<Line> = self
            .right
            .iter()
            .map(|(key, desc)| {
                Line::from(vec![
                    Span::styled(
                        format!("{:12}", key),
                        Style::default()
                            .fg(self.key_color)
                            .add_modifier(Modifier::BOLD),
                    ),
                    Span::raw(" "),
                    Span::styled(desc.clone(), Style::default().fg(self.fg_color)),
                ])
            })
            .collect();

        let right_para = Paragraph::new(right_lines);
        right_para.render(chunks[1], buf);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::widgets::keybindings::default_keymap;

    #[test]
    fn test_keybind_help_new() {
        let keymap = default_keymap();
        let help = KeybindHelp::new(keymap);
        assert!(help.visible);
        assert_eq!(help.title, "Keyboard Shortcuts");
    }

    #[test]
    fn test_keybind_help_toggle() {
        let keymap = default_keymap();
        let mut help = KeybindHelp::new(keymap);
        assert!(help.visible);
        help.toggle();
        assert!(!help.visible);
        help.toggle();
        assert!(help.visible);
    }

    #[test]
    fn test_group_by_category() {
        let keymap = default_keymap();
        let help = KeybindHelp::new(keymap);
        let groups = help.group_by_category();

        assert!(groups.contains_key("Navigation"));
        assert!(groups.contains_key("Transfer"));
        assert!(groups.contains_key("System"));
    }

    #[test]
    fn test_generate_help_lines() {
        let keymap = default_keymap();
        let help = KeybindHelp::new(keymap);
        let lines = help.generate_help_lines();

        assert!(!lines.is_empty());
    }

    #[test]
    fn test_keybind_columns() {
        let bindings = vec![
            ("q".to_string(), "Quit".to_string()),
            ("h".to_string(), "Help".to_string()),
            ("j".to_string(), "Down".to_string()),
            ("k".to_string(), "Up".to_string()),
        ];
        let columns = KeybindColumns::new(bindings);
        assert_eq!(columns.left.len(), 2);
        assert_eq!(columns.right.len(), 2);
    }
}
