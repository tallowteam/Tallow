//! Preview generation for clipboard history display

use super::ImageFormat;

/// Generate a truncated text preview for clipboard history display.
///
/// Strips excess whitespace, normalizes newlines to spaces, and truncates
/// to approximately `max_len` bytes (respecting UTF-8 char boundaries)
/// with an ellipsis suffix.
pub fn generate_preview(text: &str, max_len: usize) -> String {
    // Normalize: collapse whitespace, replace newlines with spaces
    let normalized: String = text
        .chars()
        .map(|c| if c.is_whitespace() { ' ' } else { c })
        .collect::<String>()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ");

    if normalized.len() <= max_len {
        normalized
    } else {
        // Truncate at char boundary
        let mut end = max_len.saturating_sub(3);
        while !normalized.is_char_boundary(end) && end > 0 {
            end -= 1;
        }
        format!("{}...", &normalized[..end])
    }
}

/// Generate a descriptive preview string for an image entry
pub fn generate_image_preview(format: &ImageFormat, size: u64) -> String {
    format!("[{} image, {}]", format, format_size_short(size))
}

/// Short size formatting for previews
fn format_size_short(bytes: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = 1024 * 1024;
    const GB: u64 = 1024 * 1024 * 1024;

    if bytes >= GB {
        format!("{:.1} GB", bytes as f64 / GB as f64)
    } else if bytes >= MB {
        format!("{:.1} MB", bytes as f64 / MB as f64)
    } else if bytes >= KB {
        format!("{:.1} KB", bytes as f64 / KB as f64)
    } else {
        format!("{} B", bytes)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_preview_short_text() {
        assert_eq!(generate_preview("Hello world", 80), "Hello world");
    }

    #[test]
    fn test_preview_long_text() {
        let long = "a".repeat(200);
        let preview = generate_preview(&long, 80);
        assert!(preview.len() <= 80);
        assert!(preview.ends_with("..."));
    }

    #[test]
    fn test_preview_normalizes_whitespace() {
        let text = "Hello\n  world\t\tfoo";
        assert_eq!(generate_preview(text, 80), "Hello world foo");
    }

    #[test]
    fn test_preview_empty() {
        assert_eq!(generate_preview("", 80), "");
    }

    #[test]
    fn test_image_preview_png() {
        let preview = generate_image_preview(&ImageFormat::Png, 2_500_000);
        assert_eq!(preview, "[PNG image, 2.4 MB]");
    }

    #[test]
    fn test_image_preview_jpeg_small() {
        let preview = generate_image_preview(&ImageFormat::Jpeg, 512);
        assert_eq!(preview, "[JPEG image, 512 B]");
    }

    #[test]
    fn test_image_preview_large() {
        let preview = generate_image_preview(&ImageFormat::Bmp, 1_500_000_000);
        assert_eq!(preview, "[BMP image, 1.4 GB]");
    }

    #[test]
    fn test_format_size_short_kb() {
        assert_eq!(format_size_short(10240), "10.0 KB");
    }
}
