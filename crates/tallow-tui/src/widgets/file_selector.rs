//! Multi-select file picker combining browser and preview panels.
//!
//! Provides a split-pane interface with file browser on the left and preview on the right.
//! Supports multi-selection, sorting, and keyboard navigation.

use super::file_browser::{FileBrowser, FileEntry};
use super::file_preview::FilePreview;
use crossterm::event::{KeyCode, KeyEvent, KeyModifiers};
use ratatui::{
    buffer::Buffer,
    layout::{Constraint, Direction, Layout, Rect},
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, Paragraph, Widget},
};
use std::path::PathBuf;

/// Focus state for the file selector.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Focus {
    /// Browser panel is focused
    Browser,
    /// Preview panel is focused
    Preview,
}

/// Sort mode for file listing.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SortMode {
    /// Sort by name (alphabetical)
    Name,
    /// Sort by size (largest first)
    Size,
    /// Sort by modification date (newest first)
    Date,
}

impl SortMode {
    /// Returns the next sort mode in the cycle.
    pub fn next(self) -> Self {
        match self {
            SortMode::Name => SortMode::Size,
            SortMode::Size => SortMode::Date,
            SortMode::Date => SortMode::Name,
        }
    }

    /// Returns a display string for this sort mode.
    pub fn display(&self) -> &'static str {
        match self {
            SortMode::Name => "Name",
            SortMode::Size => "Size",
            SortMode::Date => "Date",
        }
    }
}

/// Multi-select file picker with browser and preview.
#[derive(Debug)]
pub struct FileSelector {
    /// File browser component
    pub browser: FileBrowser,
    /// File preview component
    pub preview: FilePreview,
    /// List of selected file paths
    pub selected_files: Vec<PathBuf>,
    /// Current focus state
    pub focus: Focus,
    /// Current sort mode
    pub sort_mode: SortMode,
}

impl FileSelector {
    /// Creates a new file selector starting at the given path.
    pub fn new(start_path: PathBuf) -> Self {
        let browser = FileBrowser::new(start_path);
        let preview = FilePreview::new();

        Self {
            browser,
            preview,
            selected_files: Vec::new(),
            focus: Focus::Browser,
            sort_mode: SortMode::Name,
        }
    }

    /// Switches focus between browser and preview.
    pub fn toggle_focus(&mut self) {
        self.focus = match self.focus {
            Focus::Browser => Focus::Preview,
            Focus::Preview => Focus::Browser,
        };
    }

    /// Updates the preview based on current cursor position.
    pub fn update_preview(&mut self) {
        if let Some(entry) = self.browser.entries.get(self.browser.cursor) {
            if !entry.is_dir {
                self.preview.set_path(Some(entry.path.clone()));
            } else {
                self.preview.set_path(None);
            }
        } else {
            self.preview.set_path(None);
        }
    }

    /// Toggles selection of the current file and updates the selected files list.
    pub fn toggle_selection(&mut self) {
        self.browser.toggle_select();
        self.sync_selected_files();
    }

    /// Synchronizes the selected_files list with browser selections.
    fn sync_selected_files(&mut self) {
        self.selected_files = self.browser.get_selected_paths();
    }

    /// Cycles through sort modes.
    pub fn cycle_sort_mode(&mut self) {
        self.sort_mode = self.sort_mode.next();
        self.apply_sort();
    }

    /// Applies the current sort mode to the browser entries.
    fn apply_sort(&mut self) {
        let parent_entry = if !self.browser.entries.is_empty()
            && self.browser.entries[0].name == ".."
        {
            Some(self.browser.entries.remove(0))
        } else {
            None
        };

        match self.sort_mode {
            SortMode::Name => {
                self.browser.entries.sort_by(|a, b| {
                    match (a.is_dir, b.is_dir) {
                        (true, false) => std::cmp::Ordering::Less,
                        (false, true) => std::cmp::Ordering::Greater,
                        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
                    }
                });
            }
            SortMode::Size => {
                self.browser.entries.sort_by(|a, b| {
                    match (a.is_dir, b.is_dir) {
                        (true, false) => std::cmp::Ordering::Less,
                        (false, true) => std::cmp::Ordering::Greater,
                        (true, true) => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
                        (false, false) => b.size.cmp(&a.size), // Largest first
                    }
                });
            }
            SortMode::Date => {
                // For date sorting, we'd need to read file metadata
                // For now, fall back to name sorting
                self.browser.entries.sort_by(|a, b| {
                    match (a.is_dir, b.is_dir) {
                        (true, false) => std::cmp::Ordering::Less,
                        (false, true) => std::cmp::Ordering::Greater,
                        _ => {
                            // Try to get modification times
                            let a_time = std::fs::metadata(&a.path)
                                .and_then(|m| m.modified())
                                .ok();
                            let b_time = std::fs::metadata(&b.path)
                                .and_then(|m| m.modified())
                                .ok();

                            match (a_time, b_time) {
                                (Some(at), Some(bt)) => bt.cmp(&at), // Newest first
                                (Some(_), None) => std::cmp::Ordering::Less,
                                (None, Some(_)) => std::cmp::Ordering::Greater,
                                (None, None) => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
                            }
                        }
                    }
                });
            }
        }

        // Re-add parent entry at the top
        if let Some(parent) = parent_entry {
            self.browser.entries.insert(0, parent);
        }
    }

    /// Selects all files in the current directory.
    pub fn select_all(&mut self) {
        for entry in &mut self.browser.entries {
            if !entry.is_dir && entry.name != ".." {
                entry.is_selected = true;
            }
        }
        self.sync_selected_files();
    }

    /// Deselects all files.
    pub fn deselect_all(&mut self) {
        for entry in &mut self.browser.entries {
            entry.is_selected = false;
        }
        self.selected_files.clear();
    }

    /// Handles keyboard input events.
    pub fn handle_key(&mut self, key: KeyEvent) -> bool {
        match self.focus {
            Focus::Browser => {
                match key.code {
                    KeyCode::Tab => {
                        self.toggle_focus();
                        return true;
                    }
                    KeyCode::Char('s') => {
                        self.cycle_sort_mode();
                        return true;
                    }
                    KeyCode::Char('a') if key.modifiers.contains(KeyModifiers::CONTROL) => {
                        self.select_all();
                        return true;
                    }
                    KeyCode::Char('d') if key.modifiers.contains(KeyModifiers::CONTROL) => {
                        self.deselect_all();
                        return true;
                    }
                    KeyCode::Char(' ') => {
                        self.toggle_selection();
                        self.update_preview();
                        return true;
                    }
                    KeyCode::Up | KeyCode::Char('k') => {
                        self.browser.navigate_up();
                        self.update_preview();
                        return true;
                    }
                    KeyCode::Down | KeyCode::Char('j') => {
                        self.browser.navigate_down();
                        self.update_preview();
                        return true;
                    }
                    KeyCode::Enter => {
                        self.browser.toggle_expand();
                        self.update_preview();
                        return true;
                    }
                    KeyCode::Char('h') => {
                        self.browser.toggle_hidden();
                        return true;
                    }
                    _ => return false,
                }
            }
            Focus::Preview => {
                if key.code == KeyCode::Tab {
                    self.toggle_focus();
                    return true;
                }
                return false;
            }
        }
    }

    /// Renders the file selector with browser and preview panels.
    pub fn render(&mut self, area: Rect, buf: &mut Buffer) {
        // Split the area into browser (60%) and preview (40%)
        let chunks = Layout::default()
            .direction(Direction::Horizontal)
            .constraints([Constraint::Percentage(60), Constraint::Percentage(40)])
            .split(area);

        // Render browser
        let browser_block = Block::default()
            .borders(Borders::ALL)
            .border_style(if self.focus == Focus::Browser {
                Style::default().fg(Color::Cyan).add_modifier(Modifier::BOLD)
            } else {
                Style::default().fg(Color::DarkGray)
            });

        let browser_inner = browser_block.inner(chunks[0]);
        browser_block.render(chunks[0], buf);
        self.browser.render(browser_inner, buf);

        // Render preview
        let preview_block = Block::default()
            .borders(Borders::ALL)
            .border_style(if self.focus == Focus::Preview {
                Style::default().fg(Color::Magenta).add_modifier(Modifier::BOLD)
            } else {
                Style::default().fg(Color::DarkGray)
            });

        let preview_inner = preview_block.inner(chunks[1]);
        preview_block.render(chunks[1], buf);
        self.preview.render(preview_inner, buf);

        // Render status bar at the bottom
        self.render_status_bar(area, buf);
    }

    /// Renders the status bar with file count and keybindings.
    fn render_status_bar(&self, area: Rect, buf: &mut Buffer) {
        let status_y = area.bottom() - 1;

        if status_y >= area.top() {
            let selected_count = self.selected_files.len();
            let total_count = self.browser.entries.iter().filter(|e| !e.is_dir).count();

            let status_text = format!(
                " Selected: {}/{} | Sort: {} | Tab: Switch | Space: Select | s: Sort | h: Hidden | Ctrl+A: Select All ",
                selected_count, total_count, self.sort_mode.display()
            );

            let status_line = Line::from(vec![Span::styled(
                status_text,
                Style::default()
                    .fg(Color::Black)
                    .bg(Color::Cyan)
                    .add_modifier(Modifier::BOLD),
            )]);

            let status_area = Rect {
                x: area.x,
                y: status_y,
                width: area.width,
                height: 1,
            };

            let paragraph = Paragraph::new(status_line);
            paragraph.render(status_area, buf);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sort_mode_cycle() {
        assert_eq!(SortMode::Name.next(), SortMode::Size);
        assert_eq!(SortMode::Size.next(), SortMode::Date);
        assert_eq!(SortMode::Date.next(), SortMode::Name);
    }

    #[test]
    fn test_focus_toggle() {
        let mut selector = FileSelector::new(PathBuf::from("."));
        assert_eq!(selector.focus, Focus::Browser);

        selector.toggle_focus();
        assert_eq!(selector.focus, Focus::Preview);

        selector.toggle_focus();
        assert_eq!(selector.focus, Focus::Browser);
    }

    #[test]
    fn test_file_selector_creation() {
        let selector = FileSelector::new(PathBuf::from("."));
        assert_eq!(selector.selected_files.len(), 0);
        assert_eq!(selector.focus, Focus::Browser);
        assert_eq!(selector.sort_mode, SortMode::Name);
    }
}
