//! Interactive file browser widget for selecting and navigating files and directories.
//!
//! Provides a tree-based file browser with multi-select capabilities, directory expansion,
//! and hidden file filtering. Optimized for keyboard-driven navigation.

use crossterm::event::{KeyCode, KeyEvent};
use ratatui::{
    buffer::Buffer,
    layout::Rect,
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, List, ListItem, StatefulWidget, Widget},
};
use std::path::PathBuf;

/// Represents a single file or directory entry in the browser.
#[derive(Debug, Clone)]
pub struct FileEntry {
    /// Entry name (not full path)
    pub name: String,
    /// True if this entry is a directory
    pub is_dir: bool,
    /// File size in bytes (0 for directories)
    pub size: u64,
    /// Whether this entry is selected for operations
    pub is_selected: bool,
    /// Whether this directory is expanded (only for directories)
    pub is_expanded: bool,
    /// Depth level in the tree (0 = root)
    pub depth: usize,
    /// Full path to the entry
    pub path: PathBuf,
}

impl FileEntry {
    /// Creates a new file entry.
    pub fn new(name: String, is_dir: bool, size: u64, depth: usize, path: PathBuf) -> Self {
        Self {
            name,
            is_dir,
            size,
            is_selected: false,
            is_expanded: false,
            depth,
            path,
        }
    }

    /// Formats file size in human-readable format (KB/MB/GB).
    pub fn format_size(&self) -> String {
        if self.is_dir {
            return String::from("DIR");
        }

        let size = self.size as f64;
        if size < 1024.0 {
            format!("{}B", self.size)
        } else if size < 1024.0 * 1024.0 {
            format!("{:.1}KB", size / 1024.0)
        } else if size < 1024.0 * 1024.0 * 1024.0 {
            format!("{:.1}MB", size / (1024.0 * 1024.0))
        } else {
            format!("{:.1}GB", size / (1024.0 * 1024.0 * 1024.0))
        }
    }

    /// Returns the icon for this entry.
    pub fn icon(&self) -> &'static str {
        if self.is_dir {
            if self.is_expanded {
                "📂"
            } else {
                "📁"
            }
        } else {
            "📄"
        }
    }

    /// Returns the checkbox representation for selection state.
    pub fn checkbox(&self) -> &'static str {
        if self.is_selected {
            "[x]"
        } else {
            "[ ]"
        }
    }
}

/// Interactive file browser with tree navigation and multi-select.
#[derive(Debug)]
pub struct FileBrowser {
    /// Visible entries in the current view
    pub entries: Vec<FileEntry>,
    /// Current cursor position (index in entries)
    pub cursor: usize,
    /// Scroll offset for large lists
    pub scroll_offset: usize,
    /// Current directory path
    pub current_path: PathBuf,
    /// Whether to show hidden files (starting with '.')
    pub show_hidden: bool,
}

impl FileBrowser {
    /// Creates a new file browser starting at the given path.
    pub fn new(current_path: PathBuf) -> Self {
        let mut browser = Self {
            entries: Vec::new(),
            cursor: 0,
            scroll_offset: 0,
            current_path,
            show_hidden: false,
        };
        browser.refresh();
        browser
    }

    /// Refreshes the file list from the current directory.
    pub fn refresh(&mut self) {
        self.entries.clear();

        // Add parent directory entry if not at root
        if let Some(parent) = self.current_path.parent() {
            self.entries.push(FileEntry::new(
                String::from(".."),
                true,
                0,
                0,
                parent.to_path_buf(),
            ));
        }

        // Read directory contents
        if let Ok(read_dir) = std::fs::read_dir(&self.current_path) {
            let mut entries: Vec<FileEntry> = read_dir
                .filter_map(|entry| entry.ok())
                .filter(|entry| {
                    // Filter hidden files if not showing them
                    if !self.show_hidden {
                        if let Some(name) = entry.file_name().to_str() {
                            !name.starts_with('.')
                        } else {
                            true
                        }
                    } else {
                        true
                    }
                })
                .map(|entry| {
                    let path = entry.path();
                    let metadata = entry.metadata().ok();
                    let is_dir = metadata.as_ref().map(|m| m.is_dir()).unwrap_or(false);
                    let size = metadata.as_ref().map(|m| m.len()).unwrap_or(0);
                    let name = entry.file_name().to_string_lossy().to_string();

                    FileEntry::new(name, is_dir, size, 0, path)
                })
                .collect();

            // Sort: directories first, then alphabetically
            entries.sort_by(|a, b| {
                match (a.is_dir, b.is_dir) {
                    (true, false) => std::cmp::Ordering::Less,
                    (false, true) => std::cmp::Ordering::Greater,
                    _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
                }
            });

            self.entries.extend(entries);
        }

        // Reset cursor if out of bounds
        if self.cursor >= self.entries.len() && !self.entries.is_empty() {
            self.cursor = self.entries.len() - 1;
        }
    }

    /// Toggles selection of the current entry.
    pub fn toggle_select(&mut self) {
        if let Some(entry) = self.entries.get_mut(self.cursor) {
            entry.is_selected = !entry.is_selected;
        }
    }

    /// Toggles expansion of the current directory or enters it.
    pub fn toggle_expand(&mut self) {
        if let Some(entry) = self.entries.get(self.cursor).cloned() {
            if entry.is_dir {
                if entry.name == ".." {
                    // Navigate to parent
                    self.current_path = entry.path;
                    self.cursor = 0;
                    self.scroll_offset = 0;
                    self.refresh();
                } else {
                    // Enter directory
                    self.current_path = entry.path;
                    self.cursor = 0;
                    self.scroll_offset = 0;
                    self.refresh();
                }
            }
        }
    }

    /// Navigates cursor up.
    pub fn navigate_up(&mut self) {
        if self.cursor > 0 {
            self.cursor -= 1;
            // Adjust scroll if needed
            if self.cursor < self.scroll_offset {
                self.scroll_offset = self.cursor;
            }
        }
    }

    /// Navigates cursor down.
    pub fn navigate_down(&mut self) {
        if self.cursor + 1 < self.entries.len() {
            self.cursor += 1;
        }
    }

    /// Toggles visibility of hidden files.
    pub fn toggle_hidden(&mut self) {
        self.show_hidden = !self.show_hidden;
        self.refresh();
    }

    /// Returns all selected file paths.
    pub fn get_selected_paths(&self) -> Vec<PathBuf> {
        self.entries
            .iter()
            .filter(|e| e.is_selected)
            .map(|e| e.path.clone())
            .collect()
    }

    /// Handles keyboard input events.
    pub fn handle_key(&mut self, key: KeyEvent) {
        match key.code {
            KeyCode::Up | KeyCode::Char('k') => self.navigate_up(),
            KeyCode::Down | KeyCode::Char('j') => self.navigate_down(),
            KeyCode::Char(' ') => self.toggle_select(),
            KeyCode::Enter => self.toggle_expand(),
            KeyCode::Char('h') => self.toggle_hidden(),
            _ => {}
        }
    }

    /// Renders the file browser into the given area.
    pub fn render(&mut self, area: Rect, buf: &mut Buffer) {
        let block = Block::default()
            .borders(Borders::ALL)
            .title(format!(" 📁 {} ", self.current_path.display()))
            .style(Style::default().fg(Color::Cyan));

        let inner = block.inner(area);
        block.render(area, buf);

        // Calculate visible range
        let visible_height = inner.height as usize;

        // Adjust scroll offset to keep cursor visible
        if self.cursor >= self.scroll_offset + visible_height {
            self.scroll_offset = self.cursor - visible_height + 1;
        }
        if self.cursor < self.scroll_offset {
            self.scroll_offset = self.cursor;
        }

        let visible_entries = self
            .entries
            .iter()
            .skip(self.scroll_offset)
            .take(visible_height);

        let items: Vec<ListItem> = visible_entries
            .enumerate()
            .map(|(idx, entry)| {
                let global_idx = idx + self.scroll_offset;
                let is_cursor = global_idx == self.cursor;

                let indent = "  ".repeat(entry.depth);
                let checkbox = entry.checkbox();
                let icon = entry.icon();
                let size = entry.format_size();

                let line = Line::from(vec![
                    Span::raw(indent),
                    Span::styled(
                        format!("{} ", checkbox),
                        if entry.is_selected {
                            Style::default().fg(Color::Green)
                        } else {
                            Style::default()
                        },
                    ),
                    Span::raw(format!("{} ", icon)),
                    Span::styled(
                        format!("{:<30}", entry.name),
                        if is_cursor {
                            Style::default()
                                .fg(Color::Yellow)
                                .add_modifier(Modifier::BOLD)
                        } else if entry.is_dir {
                            Style::default().fg(Color::Cyan)
                        } else {
                            Style::default()
                        },
                    ),
                    Span::styled(
                        format!("{:>8}", size),
                        Style::default().fg(Color::DarkGray),
                    ),
                ]);

                ListItem::new(line)
            })
            .collect();

        let list = List::new(items);
        list.render(inner, buf);

        // Render scrollbar indicator if needed
        if self.entries.len() > visible_height {
            let scrollbar_height = inner.height;
            let scrollbar_pos = if self.entries.len() > 1 {
                (self.cursor * scrollbar_height as usize) / (self.entries.len() - 1)
            } else {
                0
            };

            if scrollbar_pos < scrollbar_height as usize {
                let x = inner.right() - 1;
                let y = inner.top() + scrollbar_pos as u16;
                if let Some(cell) = buf.cell_mut((x, y)) {
                    cell.set_symbol("█").set_style(Style::default().fg(Color::Cyan));
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_file_entry_format_size() {
        let entry = FileEntry::new("test.txt".into(), false, 1024, 0, PathBuf::from("test.txt"));
        assert_eq!(entry.format_size(), "1.0KB");

        let entry = FileEntry::new("large.bin".into(), false, 1024 * 1024, 0, PathBuf::from("large.bin"));
        assert_eq!(entry.format_size(), "1.0MB");

        let entry = FileEntry::new("dir".into(), true, 0, 0, PathBuf::from("dir"));
        assert_eq!(entry.format_size(), "DIR");
    }

    #[test]
    fn test_file_browser_navigation() {
        let mut browser = FileBrowser::new(PathBuf::from("."));
        let initial_count = browser.entries.len();

        if initial_count > 1 {
            browser.navigate_down();
            assert_eq!(browser.cursor, 1);

            browser.navigate_up();
            assert_eq!(browser.cursor, 0);
        }
    }

    #[test]
    fn test_toggle_select() {
        let mut browser = FileBrowser::new(PathBuf::from("."));

        if !browser.entries.is_empty() {
            browser.toggle_select();
            assert!(browser.entries[browser.cursor].is_selected);

            browser.toggle_select();
            assert!(!browser.entries[browser.cursor].is_selected);
        }
    }
}
