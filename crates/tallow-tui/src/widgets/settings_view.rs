//! Categorized settings browser with split-pane interface.
//!
//! Provides a category list on the left and settings editor on the right.
//! Supports keyboard navigation and category-based organization.

use super::setting_widget::{SettingType, SettingWidget};
use crossterm::event::{KeyCode, KeyEvent};
use ratatui::{
    buffer::Buffer,
    layout::{Constraint, Direction, Layout, Rect},
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, List, ListItem, Paragraph, Widget},
};

/// Settings category enumeration.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SettingsCategory {
    /// Network configuration (ports, protocols, NAT)
    Network,
    /// Privacy settings (metadata stripping, encryption)
    Privacy,
    /// Security settings (authentication, verification)
    Security,
    /// Display and UI settings (theme, notifications)
    Display,
    /// Advanced technical settings
    Advanced,
}

impl SettingsCategory {
    /// Returns all categories in order.
    pub fn all() -> Vec<Self> {
        vec![
            SettingsCategory::Network,
            SettingsCategory::Privacy,
            SettingsCategory::Security,
            SettingsCategory::Display,
            SettingsCategory::Advanced,
        ]
    }

    /// Returns the display name for this category.
    pub fn name(&self) -> &'static str {
        match self {
            SettingsCategory::Network => "Network",
            SettingsCategory::Privacy => "Privacy",
            SettingsCategory::Security => "Security",
            SettingsCategory::Display => "Display",
            SettingsCategory::Advanced => "Advanced",
        }
    }

    /// Returns the icon for this category.
    pub fn icon(&self) -> &'static str {
        match self {
            SettingsCategory::Network => "🌐",
            SettingsCategory::Privacy => "🔒",
            SettingsCategory::Security => "🛡️",
            SettingsCategory::Display => "🎨",
            SettingsCategory::Advanced => "⚙️",
        }
    }

    /// Returns the description for this category.
    pub fn description(&self) -> &'static str {
        match self {
            SettingsCategory::Network => "Configure network ports, protocols, and connectivity",
            SettingsCategory::Privacy => "Control metadata handling and encryption settings",
            SettingsCategory::Security => "Manage authentication and security verification",
            SettingsCategory::Display => "Customize appearance and notifications",
            SettingsCategory::Advanced => "Advanced technical configuration options",
        }
    }
}

/// Categorized settings browser with navigation.
#[derive(Debug)]
pub struct SettingsView {
    /// All setting categories
    pub categories: Vec<SettingsCategory>,
    /// Currently selected category index
    pub selected_category: usize,
    /// Settings widgets for the current category
    pub current_settings: Vec<SettingWidget>,
    /// Currently selected setting index within category
    pub selected_item: usize,
    /// Scroll offset for settings list
    pub scroll_offset: usize,
}

impl SettingsView {
    /// Creates a new settings view.
    pub fn new() -> Self {
        let categories = SettingsCategory::all();
        let current_settings = Self::settings_for_category(categories[0]);

        Self {
            categories,
            selected_category: 0,
            current_settings,
            selected_item: 0,
            scroll_offset: 0,
        }
    }

    /// Returns settings widgets for a given category.
    fn settings_for_category(category: SettingsCategory) -> Vec<SettingWidget> {
        match category {
            SettingsCategory::Network => vec![
                SettingWidget::new(
                    "WebRTC Port",
                    "Port for WebRTC connections",
                    SettingType::Number(9000, 1024, 65535),
                ),
                SettingWidget::new(
                    "Signaling Port",
                    "Port for signaling server",
                    SettingType::Number(8080, 1024, 65535),
                ),
                SettingWidget::new(
                    "Enable IPv6",
                    "Allow IPv6 connections",
                    SettingType::Toggle(true),
                ),
                SettingWidget::new(
                    "NAT Traversal",
                    "Enable STUN/TURN for NAT traversal",
                    SettingType::Toggle(true),
                ),
                SettingWidget::new(
                    "Upload Speed Limit",
                    "Maximum upload speed in MB/s (0 = unlimited)",
                    SettingType::Number(0, 0, 1000),
                ),
                SettingWidget::new(
                    "Download Speed Limit",
                    "Maximum download speed in MB/s (0 = unlimited)",
                    SettingType::Number(0, 0, 1000),
                ),
            ],
            SettingsCategory::Privacy => vec![
                SettingWidget::new(
                    "Strip Metadata",
                    "Remove EXIF and metadata from files",
                    SettingType::Toggle(true),
                ),
                SettingWidget::new(
                    "Encrypt Filenames",
                    "Encrypt filenames during transfer",
                    SettingType::Toggle(false),
                ),
                SettingWidget::new(
                    "Onion Routing",
                    "Route traffic through multiple hops",
                    SettingType::Toggle(false),
                ),
                SettingWidget::new(
                    "Traffic Padding",
                    "Add padding to prevent traffic analysis",
                    SettingType::Toggle(true),
                ),
                SettingWidget::new(
                    "Auto-Delete History",
                    "Automatically clear transfer history",
                    SettingType::Choice(
                        vec![
                            "Never".into(),
                            "After 1 day".into(),
                            "After 7 days".into(),
                            "After 30 days".into(),
                        ],
                        0,
                    ),
                ),
            ],
            SettingsCategory::Security => vec![
                SettingWidget::new(
                    "Require Verification",
                    "Require SAS verification for new devices",
                    SettingType::Toggle(true),
                ),
                SettingWidget::new(
                    "Post-Quantum Crypto",
                    "Use ML-KEM for key exchange",
                    SettingType::Toggle(true),
                ),
                SettingWidget::new(
                    "Biometric Auth",
                    "Enable biometric authentication",
                    SettingType::Toggle(false),
                ),
                SettingWidget::new(
                    "Auto-Reject Unknown",
                    "Automatically reject transfers from unknown devices",
                    SettingType::Toggle(false),
                ),
                SettingWidget::new(
                    "Session Timeout",
                    "Timeout for idle sessions",
                    SettingType::Choice(
                        vec![
                            "5 minutes".into(),
                            "15 minutes".into(),
                            "30 minutes".into(),
                            "Never".into(),
                        ],
                        1,
                    ),
                ),
            ],
            SettingsCategory::Display => vec![
                SettingWidget::new(
                    "Theme",
                    "Application color theme",
                    SettingType::Choice(
                        vec![
                            "Light".into(),
                            "Dark".into(),
                            "Forest".into(),
                            "Ocean".into(),
                        ],
                        1,
                    ),
                ),
                SettingWidget::new(
                    "Notifications",
                    "Show desktop notifications",
                    SettingType::Toggle(true),
                ),
                SettingWidget::new(
                    "Sound Effects",
                    "Play sound on transfer complete",
                    SettingType::Toggle(true),
                ),
                SettingWidget::new(
                    "Display Name",
                    "Your display name for other devices",
                    SettingType::Text("My Device".into()),
                ),
                SettingWidget::new(
                    "Show Transfer Animations",
                    "Display animations during transfers",
                    SettingType::Toggle(true),
                ),
            ],
            SettingsCategory::Advanced => vec![
                SettingWidget::new(
                    "Debug Logging",
                    "Enable verbose debug logs",
                    SettingType::Toggle(false),
                ),
                SettingWidget::new(
                    "Chunk Size",
                    "Transfer chunk size in KB",
                    SettingType::Number(256, 64, 4096),
                ),
                SettingWidget::new(
                    "Max Connections",
                    "Maximum concurrent connections",
                    SettingType::Number(10, 1, 100),
                ),
                SettingWidget::new(
                    "Compression",
                    "Compression algorithm for transfers",
                    SettingType::Choice(
                        vec!["None".into(), "Brotli".into(), "Zstd".into(), "LZ4".into()],
                        2,
                    ),
                ),
                SettingWidget::new(
                    "WebAssembly",
                    "Use WebAssembly for crypto operations",
                    SettingType::Toggle(true),
                ),
            ],
        }
    }

    /// Navigates to the next category.
    pub fn next_category(&mut self) {
        if self.selected_category + 1 < self.categories.len() {
            self.selected_category += 1;
            self.load_category_settings();
        }
    }

    /// Navigates to the previous category.
    pub fn prev_category(&mut self) {
        if self.selected_category > 0 {
            self.selected_category -= 1;
            self.load_category_settings();
        }
    }

    /// Loads settings for the currently selected category.
    fn load_category_settings(&mut self) {
        let category = self.categories[self.selected_category];
        self.current_settings = Self::settings_for_category(category);
        self.selected_item = 0;
        self.scroll_offset = 0;
    }

    /// Navigates to the next setting item.
    pub fn next_item(&mut self) {
        if self.selected_item + 1 < self.current_settings.len() {
            self.selected_item += 1;
        }
    }

    /// Navigates to the previous setting item.
    pub fn prev_item(&mut self) {
        if self.selected_item > 0 {
            self.selected_item -= 1;
        }
    }

    /// Activates the currently selected setting for editing.
    pub fn activate_current_setting(&mut self) {
        if let Some(setting) = self.current_settings.get_mut(self.selected_item) {
            setting.is_focused = true;
        }
    }

    /// Deactivates the currently focused setting.
    pub fn deactivate_current_setting(&mut self) {
        if let Some(setting) = self.current_settings.get_mut(self.selected_item) {
            setting.is_focused = false;
        }
    }

    /// Handles input for the currently focused setting.
    pub fn handle_setting_input(&mut self, key: KeyEvent) {
        if let Some(setting) = self.current_settings.get_mut(self.selected_item) {
            if setting.is_focused {
                setting.handle_input(key);
            }
        }
    }

    /// Handles keyboard input events.
    pub fn handle_key(&mut self, key: KeyEvent) -> bool {
        // Check if a setting is focused
        let is_setting_focused = self
            .current_settings
            .get(self.selected_item)
            .map(|s| s.is_focused)
            .unwrap_or(false);

        if is_setting_focused {
            match key.code {
                KeyCode::Esc => {
                    self.deactivate_current_setting();
                    return true;
                }
                _ => {
                    self.handle_setting_input(key);
                    return true;
                }
            }
        }

        match key.code {
            KeyCode::Tab => {
                self.next_category();
                true
            }
            KeyCode::BackTab => {
                self.prev_category();
                true
            }
            KeyCode::Up | KeyCode::Char('k') => {
                self.prev_item();
                true
            }
            KeyCode::Down | KeyCode::Char('j') => {
                self.next_item();
                true
            }
            KeyCode::Enter | KeyCode::Char(' ') => {
                self.activate_current_setting();
                true
            }
            _ => false,
        }
    }

    /// Renders the settings view.
    pub fn render(&mut self, area: Rect, buf: &mut Buffer) {
        // Split into category list (30%) and settings panel (70%)
        let chunks = Layout::default()
            .direction(Direction::Horizontal)
            .constraints([Constraint::Percentage(30), Constraint::Percentage(70)])
            .split(area);

        self.render_category_list(chunks[0], buf);
        self.render_settings_panel(chunks[1], buf);
    }

    /// Renders the category list on the left.
    fn render_category_list(&self, area: Rect, buf: &mut Buffer) {
        let block = Block::default()
            .borders(Borders::ALL)
            .title(" ⚙️  Categories ")
            .style(Style::default().fg(Color::Cyan));

        let inner = block.inner(area);
        block.render(area, buf);

        let items: Vec<ListItem> = self
            .categories
            .iter()
            .enumerate()
            .map(|(idx, category)| {
                let is_selected = idx == self.selected_category;
                let line = Line::from(vec![
                    Span::raw(format!("{} ", category.icon())),
                    Span::styled(
                        category.name(),
                        if is_selected {
                            Style::default()
                                .fg(Color::Yellow)
                                .add_modifier(Modifier::BOLD)
                        } else {
                            Style::default().fg(Color::White)
                        },
                    ),
                ]);
                ListItem::new(line)
            })
            .collect();

        let list = List::new(items);
        list.render(inner, buf);
    }

    /// Renders the settings panel on the right.
    fn render_settings_panel(&mut self, area: Rect, buf: &mut Buffer) {
        let category = self.categories[self.selected_category];
        let block = Block::default()
            .borders(Borders::ALL)
            .title(format!(" {} {} ", category.icon(), category.name()))
            .style(Style::default().fg(Color::Magenta));

        let inner = block.inner(area);
        block.render(area, buf);

        // Render category description
        let desc_line = Line::from(Span::styled(
            category.description(),
            Style::default()
                .fg(Color::DarkGray)
                .add_modifier(Modifier::ITALIC),
        ));
        let desc_para = Paragraph::new(desc_line);
        let desc_area = Rect {
            x: inner.x,
            y: inner.y,
            width: inner.width,
            height: 2,
        };
        desc_para.render(desc_area, buf);

        // Render settings
        let settings_area = Rect {
            x: inner.x,
            y: inner.y + 3,
            width: inner.width,
            height: inner.height.saturating_sub(3),
        };

        let visible_height = settings_area.height as usize;

        // Adjust scroll offset
        if self.selected_item >= self.scroll_offset + visible_height {
            self.scroll_offset = self.selected_item - visible_height + 1;
        }
        if self.selected_item < self.scroll_offset {
            self.scroll_offset = self.selected_item;
        }

        let visible_settings = self
            .current_settings
            .iter()
            .enumerate()
            .skip(self.scroll_offset)
            .take(visible_height);

        let mut y_offset = 0;
        for (idx, setting) in visible_settings {
            let global_idx = idx + self.scroll_offset;
            let is_selected = global_idx == self.selected_item;

            let setting_area = Rect {
                x: settings_area.x,
                y: settings_area.y + y_offset,
                width: settings_area.width,
                height: 3.min(settings_area.height.saturating_sub(y_offset)),
            };

            setting.render(setting_area, buf, is_selected);
            y_offset += 3;

            if y_offset >= settings_area.height {
                break;
            }
        }
    }
}

impl Default for SettingsView {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_settings_category_all() {
        let categories = SettingsCategory::all();
        assert_eq!(categories.len(), 5);
        assert_eq!(categories[0], SettingsCategory::Network);
    }

    #[test]
    fn test_settings_view_navigation() {
        let mut view = SettingsView::new();
        assert_eq!(view.selected_category, 0);
        assert_eq!(view.selected_item, 0);

        view.next_category();
        assert_eq!(view.selected_category, 1);

        view.prev_category();
        assert_eq!(view.selected_category, 0);
    }

    #[test]
    fn test_item_navigation() {
        let mut view = SettingsView::new();
        let initial_items = view.current_settings.len();

        if initial_items > 1 {
            view.next_item();
            assert_eq!(view.selected_item, 1);

            view.prev_item();
            assert_eq!(view.selected_item, 0);
        }
    }
}
