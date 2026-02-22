//! Wasm-bindgen wrappers for clipboard content handling
//!
//! Provides content type detection and manifest preparation for clipboard
//! sharing between browser and CLI. The browser sends clipboard content
//! using the same wire format as `tallow clip` for interoperability.

use wasm_bindgen::prelude::*;

// ---------------------------------------------------------------------------
// Content Type Detection
// ---------------------------------------------------------------------------

/// Detect the content type of clipboard text.
///
/// Returns one of: "url", "code", "text".
/// Matches the heuristics used by the CLI's `tallow clip` content detection.
#[wasm_bindgen(js_name = "detectContentType")]
pub fn detect_content_type(text: &str) -> String {
    let trimmed = text.trim();

    // URL detection
    if trimmed.starts_with("http://") || trimmed.starts_with("https://") {
        // Check if it's a single URL (no newlines in the main content)
        let lines: Vec<&str> = trimmed.lines().collect();
        if lines.len() <= 1 {
            return "url".to_string();
        }
    }

    // Code detection heuristics
    let code_indicators = [
        "fn ", "pub fn", "fn(", "let ", "const ", "var ", "function ",
        "class ", "import ", "export ", "async ", "await ", "return ",
        "if (", "for (", "while (", "switch (", "match ", "impl ",
        "struct ", "enum ", "trait ", "interface ", "type ", "def ",
        "#include", "#define", "package ", "use ", "mod ",
    ];

    let bracket_count = trimmed.chars().filter(|c| *c == '{' || *c == '}').count();
    let semicolons = trimmed.chars().filter(|c| *c == ';').count();
    let has_indent = trimmed.lines().any(|l| l.starts_with("    ") || l.starts_with('\t'));

    if code_indicators.iter().any(|ind| trimmed.contains(ind))
        || (bracket_count >= 2 && semicolons >= 1)
        || (has_indent && trimmed.lines().count() > 3)
    {
        return "code".to_string();
    }

    "text".to_string()
}

/// Prepare a clipboard manifest compatible with the CLI's clip format.
///
/// Returns a JSON-encoded manifest describing the clipboard content.
/// The manifest is then sent as a FileOffer's manifest field.
///
/// * `content_type` - "text", "url", "code", or "image/png"
/// * `data_size`    - Size of the clipboard data in bytes
#[wasm_bindgen(js_name = "prepareClipboardManifest")]
pub fn prepare_clipboard_manifest(
    content_type: &str,
    data_size: u64,
) -> Result<Vec<u8>, JsValue> {
    // Build a JSON manifest that identifies this as a clipboard transfer.
    // The CLI recognizes clipboard transfers by the presence of
    // `is_clipboard: true` and `content_type` fields.
    let manifest_json = format!(
        r#"{{"is_clipboard":true,"content_type":"{}","size":{},"files":[{{"name":"clipboard","size":{},"path":"clipboard"}}],"total_size":{},"total_chunks":1}}"#,
        content_type, data_size, data_size, data_size
    );

    Ok(manifest_json.into_bytes())
}

/// Parse a manifest to determine if it represents a clipboard transfer.
///
/// Returns a JsValue object with:
/// - `is_clipboard: bool`
/// - `content_type: string`
/// - `size: number`
#[wasm_bindgen(js_name = "parseClipboardContent")]
pub fn parse_clipboard_content(manifest_bytes: &[u8]) -> Result<JsValue, JsValue> {
    let text = core::str::from_utf8(manifest_bytes)
        .map_err(|e| JsValue::from_str(&format!("invalid manifest UTF-8: {}", e)))?;

    // Try to parse as JSON and check for clipboard markers
    let is_clipboard = text.contains("\"is_clipboard\":true")
        || text.contains("\"is_clipboard\": true");

    let content_type = if text.contains("\"content_type\":\"url\"")
        || text.contains("\"content_type\": \"url\"")
    {
        "url"
    } else if text.contains("\"content_type\":\"code\"")
        || text.contains("\"content_type\": \"code\"")
    {
        "code"
    } else if text.contains("\"content_type\":\"image")
        || text.contains("\"content_type\": \"image")
    {
        "image"
    } else {
        "text"
    };

    // Extract size (simple pattern matching on JSON)
    let size = extract_json_number(text, "size").unwrap_or(0);

    // Return as a JS object
    let obj = js_sys::Object::new();
    js_sys::Reflect::set(&obj, &"is_clipboard".into(), &JsValue::from_bool(is_clipboard))
        .map_err(|e| JsValue::from_str(&format!("reflect set: {:?}", e)))?;
    js_sys::Reflect::set(&obj, &"content_type".into(), &JsValue::from_str(content_type))
        .map_err(|e| JsValue::from_str(&format!("reflect set: {:?}", e)))?;
    js_sys::Reflect::set(&obj, &"size".into(), &JsValue::from_f64(size as f64))
        .map_err(|e| JsValue::from_str(&format!("reflect set: {:?}", e)))?;

    Ok(obj.into())
}

/// Simple JSON number extraction helper.
/// Finds `"key":NUMBER` or `"key": NUMBER` patterns.
fn extract_json_number(json: &str, key: &str) -> Option<u64> {
    let patterns = [
        format!("\"{}\":", key),
        format!("\"{}\": ", key),
    ];

    for pattern in &patterns {
        if let Some(pos) = json.find(pattern) {
            let start = pos + pattern.len();
            let rest = &json[start..];
            let rest = rest.trim_start();
            let num_str: String = rest.chars().take_while(|c| c.is_ascii_digit()).collect();
            if !num_str.is_empty() {
                return num_str.parse().ok();
            }
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_url() {
        assert_eq!(detect_content_type("https://example.com"), "url");
        assert_eq!(detect_content_type("http://example.com/path"), "url");
    }

    #[test]
    fn test_detect_code() {
        assert_eq!(detect_content_type("fn main() {\n    println!(\"hello\");\n}"), "code");
        assert_eq!(detect_content_type("function test() { return 42; }"), "code");
    }

    #[test]
    fn test_detect_text() {
        assert_eq!(detect_content_type("Hello, world!"), "text");
        assert_eq!(detect_content_type("Just some text"), "text");
    }

    #[test]
    fn test_prepare_manifest() {
        let manifest = prepare_clipboard_manifest("text", 100).unwrap();
        let text = core::str::from_utf8(&manifest).unwrap();
        assert!(text.contains("\"is_clipboard\":true"));
        assert!(text.contains("\"content_type\":\"text\""));
        assert!(text.contains("\"size\":100"));
    }

    #[test]
    fn test_extract_json_number() {
        assert_eq!(extract_json_number(r#"{"size":42}"#, "size"), Some(42));
        assert_eq!(extract_json_number(r#"{"size": 100}"#, "size"), Some(100));
        assert_eq!(extract_json_number(r#"{"other":5}"#, "size"), None);
    }
}
