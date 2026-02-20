//! File preview widget for displaying file contents and metadata.
//!
//! Supports previewing text files, images (metadata), archives, and binary files.
//! Provides intelligent preview based on file type detection.

use ratatui::{
    buffer::Buffer,
    layout::Rect,
    style::{Color, Style},
    text::{Line, Span},
    widgets::{Block, Borders, Paragraph, Widget, Wrap},
};
use std::path::{Path, PathBuf};

/// File type categories for preview rendering.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FileType {
    /// Plain text file
    Text,
    /// Image file (jpg, png, gif, etc.)
    Image,
    /// Archive file (zip, tar, gz, etc.)
    Archive,
    /// Binary executable or data
    Binary,
    /// Unknown or unsupported type
    Unknown,
}

impl FileType {
    /// Detects file type from extension.
    pub fn from_path(path: &Path) -> Self {
        let extension = path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();

        match extension.as_str() {
            "txt" | "md" | "rs" | "toml" | "json" | "yaml" | "yml" | "xml" | "html" | "css"
            | "js" | "ts" | "py" | "c" | "cpp" | "h" | "hpp" | "sh" | "bash" | "zsh" => {
                FileType::Text
            }
            "jpg" | "jpeg" | "png" | "gif" | "bmp" | "svg" | "webp" | "ico" => FileType::Image,
            "zip" | "tar" | "gz" | "bz2" | "xz" | "7z" | "rar" | "tgz" | "tbz2" => {
                FileType::Archive
            }
            "exe" | "dll" | "so" | "dylib" | "bin" | "dat" => FileType::Binary,
            _ => FileType::Unknown,
        }
    }

    /// Returns the icon for this file type.
    pub fn icon(&self) -> &'static str {
        match self {
            FileType::Text => "📝",
            FileType::Image => "🖼️",
            FileType::Archive => "📦",
            FileType::Binary => "⚙️",
            FileType::Unknown => "❓",
        }
    }
}

/// File preview widget displaying file contents and metadata.
#[derive(Debug, Clone)]
pub struct FilePreview {
    /// Path to the file being previewed (None if no file selected)
    pub path: Option<PathBuf>,
    /// Preview content as text
    pub content_preview: String,
    /// Detected file type
    pub file_type: FileType,
    /// File size in bytes
    pub file_size: u64,
}

impl FilePreview {
    /// Creates an empty file preview.
    pub fn new() -> Self {
        Self {
            path: None,
            content_preview: String::from("No file selected"),
            file_type: FileType::Unknown,
            file_size: 0,
        }
    }

    /// Updates the preview for a new file path.
    pub fn set_path(&mut self, path: Option<PathBuf>) {
        self.path = path.clone();

        if let Some(ref p) = path {
            self.file_type = FileType::from_path(p);
            self.file_size = std::fs::metadata(p).map(|m| m.len()).unwrap_or(0);
            self.content_preview = self.generate_preview(p);
        } else {
            self.content_preview = String::from("No file selected");
            self.file_type = FileType::Unknown;
            self.file_size = 0;
        }
    }

    /// Generates preview content based on file type.
    fn generate_preview(&self, path: &Path) -> String {
        match self.file_type {
            FileType::Text => self.preview_text(path),
            FileType::Image => self.preview_image(path),
            FileType::Archive => self.preview_archive(path),
            FileType::Binary => self.preview_binary(path),
            FileType::Unknown => self.preview_unknown(path),
        }
    }

    /// Previews text files (first N lines).
    ///
    /// Uses BufReader to avoid reading the entire file into memory.
    fn preview_text(&self, path: &Path) -> String {
        use std::io::BufRead;
        match std::fs::File::open(path) {
            Ok(file) => {
                let reader = std::io::BufReader::new(file);
                let mut lines = Vec::new();
                let mut total_lines = 0;
                for line_result in reader.lines() {
                    match line_result {
                        Ok(line) => {
                            total_lines += 1;
                            if lines.len() < 20 {
                                lines.push(line);
                            }
                        }
                        Err(_) => break,
                    }
                    // Stop counting after a reasonable limit
                    if total_lines > 10_000 {
                        break;
                    }
                }
                let preview = lines.join("\n");
                if total_lines > 20 {
                    let remaining = if total_lines > 10_000 {
                        "10,000+".to_string()
                    } else {
                        (total_lines - 20).to_string()
                    };
                    format!("{}\n\n... ({} more lines)", preview, remaining)
                } else {
                    preview
                }
            }
            Err(e) => format!("Error reading file: {}", e),
        }
    }

    /// Previews image metadata.
    fn preview_image(&self, path: &Path) -> String {
        let size = self.format_size();
        let extension = path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("unknown")
            .to_uppercase();

        format!(
            "Image File\n\nFormat: {}\nSize: {}\n\nPreview not available in terminal.\nOpen with an image viewer to see contents.",
            extension, size
        )
    }

    /// Previews archive contents.
    fn preview_archive(&self, path: &Path) -> String {
        let size = self.format_size();
        let extension = path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("unknown")
            .to_uppercase();

        // For ZIP files, show basic info
        if extension == "ZIP" {
            return format!(
                "Archive File\n\nFormat: {}\nTotal Size: {}\n\n(ZIP contents listing requires the zip crate)",
                extension, size
            );
        }

        format!(
            "Archive File\n\nFormat: {}\nSize: {}\n\nUse an archive tool to view contents.",
            extension, size
        )
    }

    /// Previews binary files (hex dump header).
    ///
    /// Only reads the first 128 bytes instead of the entire file.
    fn preview_binary(&self, path: &Path) -> String {
        use std::io::Read;
        match std::fs::File::open(path) {
            Ok(mut file) => {
                let size = self.format_size();
                let mut preview_bytes = vec![0u8; 128];
                let bytes_read = file.read(&mut preview_bytes).unwrap_or(0);
                preview_bytes.truncate(bytes_read);

                let mut hex_dump = String::from("Binary File\n\nHex Dump (first 128 bytes):\n\n");

                for (i, chunk) in preview_bytes.chunks(16).enumerate() {
                    hex_dump.push_str(&format!("{:04x}  ", i * 16));

                    // Hex values
                    for byte in chunk {
                        hex_dump.push_str(&format!("{:02x} ", byte));
                    }

                    // Padding
                    for _ in chunk.len()..16 {
                        hex_dump.push_str("   ");
                    }

                    hex_dump.push_str(" |");

                    // ASCII representation
                    for byte in chunk {
                        if byte.is_ascii_graphic() || *byte == b' ' {
                            hex_dump.push(*byte as char);
                        } else {
                            hex_dump.push('.');
                        }
                    }

                    hex_dump.push_str("|\n");
                }

                hex_dump.push_str(&format!("\nTotal Size: {}", size));
                hex_dump
            }
            Err(e) => format!("Error reading file: {}", e),
        }
    }

    /// Previews unknown file types.
    fn preview_unknown(&self, _path: &Path) -> String {
        let size = self.format_size();
        format!(
            "Unknown File Type\n\nSize: {}\n\nNo preview available.",
            size
        )
    }

    /// Formats file size in human-readable format.
    fn format_size(&self) -> String {
        let size = self.file_size as f64;
        if size < 1024.0 {
            format!("{}B", self.file_size)
        } else if size < 1024.0 * 1024.0 {
            format!("{:.1}KB", size / 1024.0)
        } else if size < 1024.0 * 1024.0 * 1024.0 {
            format!("{:.1}MB", size / (1024.0 * 1024.0))
        } else {
            format!("{:.1}GB", size / (1024.0 * 1024.0 * 1024.0))
        }
    }

    /// Renders the file preview into the given area.
    pub fn render(&self, area: Rect, buf: &mut Buffer) {
        let title = if let Some(ref path) = self.path {
            format!(
                " {} {} ",
                self.file_type.icon(),
                path.file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("Unknown")
            )
        } else {
            String::from(" Preview ")
        };

        let block = Block::default()
            .borders(Borders::ALL)
            .title(title)
            .style(Style::default().fg(Color::Magenta));

        let inner = block.inner(area);
        block.render(area, buf);

        let lines: Vec<Line> = self
            .content_preview
            .lines()
            .map(|line| Line::from(Span::raw(line)))
            .collect();

        let paragraph = Paragraph::new(lines)
            .wrap(Wrap { trim: false })
            .style(Style::default());

        paragraph.render(inner, buf);
    }
}

impl Default for FilePreview {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_file_type_detection() {
        assert_eq!(FileType::from_path(Path::new("test.txt")), FileType::Text);
        assert_eq!(FileType::from_path(Path::new("image.png")), FileType::Image);
        assert_eq!(
            FileType::from_path(Path::new("archive.zip")),
            FileType::Archive
        );
        assert_eq!(
            FileType::from_path(Path::new("binary.exe")),
            FileType::Binary
        );
        assert_eq!(
            FileType::from_path(Path::new("unknown.xyz")),
            FileType::Unknown
        );
    }

    #[test]
    fn test_file_preview_creation() {
        let preview = FilePreview::new();
        assert_eq!(preview.path, None);
        assert_eq!(preview.file_type, FileType::Unknown);
        assert_eq!(preview.content_preview, "No file selected");
    }
}
