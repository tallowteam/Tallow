//! Clipboard history storage and content type management
//!
//! Persists clipboard entries as JSON with image data stored as separate files
//! in the data directory. Follows the same pattern as [`crate::history::TransferLog`].

pub mod detect;
pub mod preview;

use crate::persistence::paths;
use crate::Result;
use crate::StoreError;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Content type of a clipboard entry
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ContentType {
    /// Plain text
    PlainText,
    /// URL / link
    Url,
    /// Source code
    Code,
    /// HTML markup
    Html,
    /// Image data
    Image {
        /// Detected image format
        format: ImageFormat,
    },
    /// Rich text (RTF or similar)
    RichText,
    /// Multiple clipboard items (text + image)
    Multiple,
}

impl std::fmt::Display for ContentType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::PlainText => write!(f, "Text"),
            Self::Url => write!(f, "URL"),
            Self::Code => write!(f, "Code"),
            Self::Html => write!(f, "HTML"),
            Self::Image { format } => write!(f, "Image ({})", format),
            Self::RichText => write!(f, "Rich Text"),
            Self::Multiple => write!(f, "Multiple"),
        }
    }
}

/// Image format detected via magic bytes
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ImageFormat {
    /// PNG image
    Png,
    /// JPEG image
    Jpeg,
    /// GIF image
    Gif,
    /// BMP bitmap
    Bmp,
    /// WebP image
    Webp,
    /// SVG vector graphic
    Svg,
    /// TIFF image
    Tiff,
    /// ICO icon
    Ico,
    /// Unknown or unrecognized format
    Unknown,
}

impl std::fmt::Display for ImageFormat {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Png => write!(f, "PNG"),
            Self::Jpeg => write!(f, "JPEG"),
            Self::Gif => write!(f, "GIF"),
            Self::Bmp => write!(f, "BMP"),
            Self::Webp => write!(f, "WebP"),
            Self::Svg => write!(f, "SVG"),
            Self::Tiff => write!(f, "TIFF"),
            Self::Ico => write!(f, "ICO"),
            Self::Unknown => write!(f, "Unknown"),
        }
    }
}

impl ImageFormat {
    /// File extension for this image format
    pub fn extension(&self) -> &str {
        match self {
            Self::Png => "png",
            Self::Jpeg => "jpg",
            Self::Gif => "gif",
            Self::Bmp => "bmp",
            Self::Webp => "webp",
            Self::Svg => "svg",
            Self::Tiff => "tiff",
            Self::Ico => "ico",
            Self::Unknown => "bin",
        }
    }
}

/// A single clipboard history entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipboardEntry {
    /// Unique entry ID (hex-encoded BLAKE3 hash)
    pub id: String,
    /// Content type
    pub content_type: ContentType,
    /// Short preview string for display
    pub preview: String,
    /// Size in bytes of the original content
    pub size: u64,
    /// Timestamp (seconds since epoch)
    pub timestamp: u64,
    /// BLAKE3 hash of the content (hex-encoded)
    pub blake3_hash: String,
    /// Path to stored image file (relative to data dir), if image
    pub image_path: Option<PathBuf>,
    /// Full text content (only for text entries, not images)
    pub text_content: Option<String>,
}

/// Clipboard history log with JSON file persistence
///
/// Entries are unlimited in count. Image data is stored as separate files
/// in `data_dir()/clipboard_images/` to keep the JSON file small.
#[derive(Debug)]
pub struct ClipboardHistory {
    entries: Vec<ClipboardEntry>,
    path: Option<PathBuf>,
}

impl ClipboardHistory {
    /// Create a new in-memory clipboard history
    pub fn new() -> Self {
        Self {
            entries: Vec::new(),
            path: None,
        }
    }

    /// Open persistent clipboard history at the default path
    pub fn open() -> Result<Self> {
        Self::open_at(paths::clipboard_history_file())
    }

    /// Open persistent clipboard history at a custom path
    pub fn open_at(path: PathBuf) -> Result<Self> {
        let mut history = Self {
            entries: Vec::new(),
            path: Some(path),
        };

        if let Some(ref p) = history.path {
            if p.exists() {
                let data = std::fs::read_to_string(p)?;
                history.entries = serde_json::from_str(&data).map_err(|e| {
                    StoreError::SerializationError(format!(
                        "Failed to parse clipboard history: {}",
                        e
                    ))
                })?;
            }
        }

        Ok(history)
    }

    /// Append an entry and persist
    pub fn append(&mut self, entry: ClipboardEntry) -> Result<()> {
        self.entries.push(entry);
        self.save()
    }

    /// Get all entries
    pub fn query(&self) -> &[ClipboardEntry] {
        &self.entries
    }

    /// Search entries by keyword (case-insensitive match on preview and text content)
    pub fn search(&self, keyword: &str) -> Vec<&ClipboardEntry> {
        let kw = keyword.to_lowercase();
        self.entries
            .iter()
            .filter(|e| {
                e.preview.to_lowercase().contains(&kw)
                    || e.text_content
                        .as_deref()
                        .is_some_and(|t| t.to_lowercase().contains(&kw))
            })
            .collect()
    }

    /// Get the most recent N entries
    pub fn recent(&self, count: usize) -> &[ClipboardEntry] {
        let start = self.entries.len().saturating_sub(count);
        &self.entries[start..]
    }

    /// Clear all entries and persist
    pub fn clear(&mut self) -> Result<()> {
        // Also remove image files
        let images_dir = paths::clipboard_images_dir();
        if images_dir.exists() {
            if let Err(e) = std::fs::remove_dir_all(&images_dir) {
                tracing::warn!("Failed to remove clipboard images: {}", e);
            }
        }
        self.entries.clear();
        self.save()
    }

    /// Total number of entries
    pub fn len(&self) -> usize {
        self.entries.len()
    }

    /// Whether the history is empty
    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }

    /// Check if a BLAKE3 hash already exists in history
    pub fn contains_hash(&self, hash: &str) -> bool {
        self.entries.iter().any(|e| e.blake3_hash == hash)
    }

    /// Save to disk if persistent
    fn save(&self) -> Result<()> {
        if let Some(ref path) = self.path {
            if let Some(parent) = path.parent() {
                std::fs::create_dir_all(parent)?;
            }
            let data = serde_json::to_string_pretty(&self.entries).map_err(|e| {
                StoreError::SerializationError(format!(
                    "Failed to serialize clipboard history: {}",
                    e
                ))
            })?;
            std::fs::write(path, data)?;
        }
        Ok(())
    }
}

impl Default for ClipboardHistory {
    fn default() -> Self {
        Self::new()
    }
}

/// Save image data to the clipboard images directory, returning the relative path.
///
/// The `hash` parameter must be a hex-encoded string (alphanumeric only).
/// Path separators and other special characters are rejected to prevent traversal.
pub fn save_clipboard_image(data: &[u8], hash: &str, format: &ImageFormat) -> Result<PathBuf> {
    // Validate hash contains only safe characters (hex digits)
    if hash.is_empty() || !hash.chars().all(|c| c.is_ascii_alphanumeric()) {
        return Err(crate::StoreError::PersistenceError(
            "Invalid hash for clipboard image filename".to_string(),
        ));
    }

    let images_dir = paths::clipboard_images_dir();
    std::fs::create_dir_all(&images_dir)?;

    let filename = format!("{}.{}", hash, format.extension());
    let full_path = images_dir.join(&filename);
    std::fs::write(&full_path, data)?;

    Ok(PathBuf::from(filename))
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn test_entry(id: &str) -> ClipboardEntry {
        ClipboardEntry {
            id: id.to_string(),
            content_type: ContentType::PlainText,
            preview: "Hello world".to_string(),
            size: 11,
            timestamp: 1708300000,
            blake3_hash: "abc123".to_string(),
            image_path: None,
            text_content: Some("Hello world".to_string()),
        }
    }

    #[test]
    fn test_append_and_query() {
        let mut history = ClipboardHistory::new();
        history.append(test_entry("e1")).unwrap();
        assert_eq!(history.query().len(), 1);
        assert_eq!(history.len(), 1);
    }

    #[test]
    fn test_persistence() {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("clipboard_history.json");

        {
            let mut history = ClipboardHistory::open_at(path.clone()).unwrap();
            history.append(test_entry("e1")).unwrap();
            history.append(test_entry("e2")).unwrap();
        }

        {
            let history = ClipboardHistory::open_at(path).unwrap();
            assert_eq!(history.query().len(), 2);
            assert_eq!(history.query()[0].id, "e1");
        }
    }

    #[test]
    fn test_search() {
        let mut history = ClipboardHistory::new();
        history.append(test_entry("e1")).unwrap();

        let mut e2 = test_entry("e2");
        e2.preview = "Rust code snippet".to_string();
        e2.text_content = Some("fn main() { println!(\"hi\"); }".to_string());
        history.append(e2).unwrap();

        let results = history.search("rust");
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].id, "e2");

        let results = history.search("hello");
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].id, "e1");
    }

    #[test]
    fn test_recent() {
        let mut history = ClipboardHistory::new();
        for i in 0..10 {
            history.append(test_entry(&format!("e{}", i))).unwrap();
        }

        let recent = history.recent(3);
        assert_eq!(recent.len(), 3);
        assert_eq!(recent[0].id, "e7");
    }

    #[test]
    fn test_clear() {
        let mut history = ClipboardHistory::new();
        history.append(test_entry("e1")).unwrap();
        history.clear().unwrap();
        assert!(history.is_empty());
    }

    #[test]
    fn test_contains_hash() {
        let mut history = ClipboardHistory::new();
        history.append(test_entry("e1")).unwrap();
        assert!(history.contains_hash("abc123"));
        assert!(!history.contains_hash("xyz789"));
    }

    #[test]
    fn test_content_type_display() {
        assert_eq!(format!("{}", ContentType::PlainText), "Text");
        assert_eq!(format!("{}", ContentType::Url), "URL");
        assert_eq!(format!("{}", ContentType::Code), "Code");
        assert_eq!(
            format!(
                "{}",
                ContentType::Image {
                    format: ImageFormat::Png
                }
            ),
            "Image (PNG)"
        );
    }

    #[test]
    fn test_image_format_extension() {
        assert_eq!(ImageFormat::Png.extension(), "png");
        assert_eq!(ImageFormat::Jpeg.extension(), "jpg");
        assert_eq!(ImageFormat::Gif.extension(), "gif");
        assert_eq!(ImageFormat::Webp.extension(), "webp");
        assert_eq!(ImageFormat::Unknown.extension(), "bin");
    }
}
