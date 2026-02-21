//! Content type detection via heuristics and magic bytes
//!
//! Pure string/byte matching — no external dependencies required.

use super::{ContentType, ImageFormat};

/// Detect the content type of text from the clipboard
///
/// Uses heuristic matching for URLs, code, HTML. Falls back to plain text.
pub fn detect_content_type(text: &str) -> ContentType {
    let trimmed = text.trim();

    if trimmed.is_empty() {
        return ContentType::PlainText;
    }

    // URL detection: starts with http/https or looks like a bare domain
    if is_url(trimmed) {
        return ContentType::Url;
    }

    // HTML detection: starts with < and contains closing tag
    if is_html(trimmed) {
        return ContentType::Html;
    }

    // Code detection: contains common programming patterns
    if is_code(trimmed) {
        return ContentType::Code;
    }

    ContentType::PlainText
}

/// Detect image format from the first bytes (magic byte sniffing)
pub fn detect_image_format(bytes: &[u8]) -> ImageFormat {
    if bytes.len() < 4 {
        return ImageFormat::Unknown;
    }

    // PNG: 89 50 4E 47
    if bytes.starts_with(&[0x89, 0x50, 0x4E, 0x47]) {
        return ImageFormat::Png;
    }

    // JPEG: FF D8 FF
    if bytes.starts_with(&[0xFF, 0xD8, 0xFF]) {
        return ImageFormat::Jpeg;
    }

    // GIF: "GIF8"
    if bytes.starts_with(b"GIF8") {
        return ImageFormat::Gif;
    }

    // BMP: "BM"
    if bytes.starts_with(b"BM") {
        return ImageFormat::Bmp;
    }

    // WebP: "RIFF" + 4 bytes + "WEBP"
    if bytes.len() >= 12 && bytes.starts_with(b"RIFF") && &bytes[8..12] == b"WEBP" {
        return ImageFormat::Webp;
    }

    // TIFF: "II\x2A\x00" (little-endian) or "MM\x00\x2A" (big-endian)
    if bytes.starts_with(&[0x49, 0x49, 0x2A, 0x00]) || bytes.starts_with(&[0x4D, 0x4D, 0x00, 0x2A])
    {
        return ImageFormat::Tiff;
    }

    // ICO: 00 00 01 00
    if bytes.starts_with(&[0x00, 0x00, 0x01, 0x00]) {
        return ImageFormat::Ico;
    }

    // SVG: starts with "<?xml" or "<svg"
    if let Ok(text) = std::str::from_utf8(&bytes[..bytes.len().min(256)]) {
        let trimmed = text.trim();
        if trimmed.starts_with("<?xml") || trimmed.starts_with("<svg") {
            return ImageFormat::Svg;
        }
    }

    ImageFormat::Unknown
}

/// Check if text looks like a URL
fn is_url(text: &str) -> bool {
    // Multi-line text is not a URL
    if text.contains('\n') {
        return false;
    }

    text.starts_with("http://")
        || text.starts_with("https://")
        || text.starts_with("ftp://")
        || text.starts_with("ssh://")
        || text.starts_with("magnet:")
}

/// Check if text looks like HTML markup
fn is_html(text: &str) -> bool {
    let trimmed = text.trim();
    trimmed.starts_with('<')
        && (trimmed.contains("</") || trimmed.contains("/>"))
        && (trimmed.contains("<html")
            || trimmed.contains("<div")
            || trimmed.contains("<p")
            || trimmed.contains("<span")
            || trimmed.contains("<!DOCTYPE")
            || trimmed.contains("<head")
            || trimmed.contains("<body"))
}

/// Check if text looks like source code
fn is_code(text: &str) -> bool {
    let indicators = [
        "fn ",
        "pub fn ",
        "pub struct ",
        "impl ",
        "mod ", // Rust
        "def ",
        "class ",
        "import ",
        "from ", // Python
        "function ",
        "const ",
        "let ",
        "var ", // JS/TS
        "func ",
        "package ", // Go
        "#include",
        "int main", // C/C++
        "public class ",
        "private ", // Java/C#
        "SELECT ",
        "INSERT ",
        "UPDATE ", // SQL
        "#!/",     // Shebang
    ];

    let syntax_patterns: &[&str] = &["{", "}", "=>", "->", "&&", "||", "!=", "=="];

    let indicator_count = indicators.iter().filter(|&&i| text.contains(i)).count();
    let syntax_count = syntax_patterns
        .iter()
        .filter(|&&c| text.contains(c))
        .count();

    // At least one language keyword and one syntax character, or multiple keywords
    (indicator_count >= 1 && syntax_count >= 1) || indicator_count >= 2
}

#[cfg(test)]
mod tests {
    use super::*;

    // --- Content type detection ---

    #[test]
    fn test_detect_url() {
        assert_eq!(
            detect_content_type("https://github.com/tallowteam/Tallow"),
            ContentType::Url
        );
        assert_eq!(detect_content_type("http://example.com"), ContentType::Url);
        assert_eq!(
            detect_content_type("ftp://files.example.com/data"),
            ContentType::Url
        );
    }

    #[test]
    fn test_detect_code_rust() {
        let code = "fn main() {\n    println!(\"hello\");\n}";
        assert_eq!(detect_content_type(code), ContentType::Code);
    }

    #[test]
    fn test_detect_code_python() {
        let code = "import os\ndef hello():\n    print('world')";
        assert_eq!(detect_content_type(code), ContentType::Code);
    }

    #[test]
    fn test_detect_code_javascript() {
        let code = "const x = () => {\n  return 42;\n}";
        assert_eq!(detect_content_type(code), ContentType::Code);
    }

    #[test]
    fn test_detect_html() {
        let html = "<html><body><p>Hello</p></body></html>";
        assert_eq!(detect_content_type(html), ContentType::Html);
    }

    #[test]
    fn test_detect_plain_text() {
        assert_eq!(
            detect_content_type("Just a normal sentence."),
            ContentType::PlainText
        );
        assert_eq!(detect_content_type("hello world"), ContentType::PlainText);
    }

    #[test]
    fn test_detect_empty() {
        assert_eq!(detect_content_type(""), ContentType::PlainText);
        assert_eq!(detect_content_type("   "), ContentType::PlainText);
    }

    #[test]
    fn test_multiline_not_url() {
        // Multiline text starting with http should not be detected as URL
        assert_eq!(
            detect_content_type("https://example.com\nsome other text"),
            ContentType::PlainText
        );
    }

    // --- Image format detection ---

    #[test]
    fn test_detect_png() {
        let bytes = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
        assert_eq!(detect_image_format(&bytes), ImageFormat::Png);
    }

    #[test]
    fn test_detect_jpeg() {
        let bytes = [0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10];
        assert_eq!(detect_image_format(&bytes), ImageFormat::Jpeg);
    }

    #[test]
    fn test_detect_gif() {
        assert_eq!(detect_image_format(b"GIF89a..."), ImageFormat::Gif);
        assert_eq!(detect_image_format(b"GIF87a..."), ImageFormat::Gif);
    }

    #[test]
    fn test_detect_bmp() {
        assert_eq!(detect_image_format(b"BM\x00\x00\x00\x00"), ImageFormat::Bmp);
    }

    #[test]
    fn test_detect_webp() {
        let bytes = b"RIFF\x00\x00\x00\x00WEBP";
        assert_eq!(detect_image_format(bytes), ImageFormat::Webp);
    }

    #[test]
    fn test_detect_tiff_le() {
        let bytes = [0x49, 0x49, 0x2A, 0x00, 0x08, 0x00];
        assert_eq!(detect_image_format(&bytes), ImageFormat::Tiff);
    }

    #[test]
    fn test_detect_tiff_be() {
        let bytes = [0x4D, 0x4D, 0x00, 0x2A, 0x00, 0x08];
        assert_eq!(detect_image_format(&bytes), ImageFormat::Tiff);
    }

    #[test]
    fn test_detect_ico() {
        let bytes = [0x00, 0x00, 0x01, 0x00, 0x01, 0x00];
        assert_eq!(detect_image_format(&bytes), ImageFormat::Ico);
    }

    #[test]
    fn test_detect_svg_xml() {
        assert_eq!(
            detect_image_format(b"<?xml version=\"1.0\"?><svg>...</svg>"),
            ImageFormat::Svg
        );
    }

    #[test]
    fn test_detect_svg_direct() {
        assert_eq!(
            detect_image_format(b"<svg xmlns=\"http://www.w3.org/2000/svg\">"),
            ImageFormat::Svg
        );
    }

    #[test]
    fn test_detect_unknown() {
        assert_eq!(
            detect_image_format(&[0x00, 0x01, 0x02, 0x03]),
            ImageFormat::Unknown
        );
    }

    #[test]
    fn test_detect_too_short() {
        assert_eq!(detect_image_format(&[0x89, 0x50]), ImageFormat::Unknown);
    }
}
