//! Image clipboard I/O helpers (cross-platform, fail-silent)
//!
//! Reads and writes image data from/to the system clipboard.
//! Uses the same fail-silent pattern as [`super::clipboard`].

use std::io;
use std::path::Path;

/// Read image from the system clipboard as raw RGBA pixel data.
///
/// Returns `(width, height, rgba_bytes)` or `None` if no image is available
/// or the clipboard is inaccessible (headless/SSH/CI).
pub fn read_clipboard_image() -> Option<(usize, usize, Vec<u8>)> {
    #[cfg(target_os = "linux")]
    {
        let has_display =
            std::env::var("DISPLAY").is_ok() || std::env::var("WAYLAND_DISPLAY").is_ok();
        if !has_display {
            tracing::debug!("No display server; skipping clipboard image read");
            return None;
        }
    }

    match arboard::Clipboard::new() {
        Ok(mut cb) => match cb.get_image() {
            Ok(img) => {
                tracing::debug!(
                    "Read image from clipboard: {}x{} ({} bytes)",
                    img.width,
                    img.height,
                    img.bytes.len()
                );
                Some((img.width, img.height, img.bytes.into_owned()))
            }
            Err(e) => {
                tracing::debug!("No image in clipboard: {e}");
                None
            }
        },
        Err(e) => {
            tracing::debug!("Clipboard unavailable for image read: {e}");
            None
        }
    }
}

/// Maximum pixel count to prevent OOM during PNG encoding (64 MiB RGBA)
const MAX_ENCODE_PIXELS: usize = 4096 * 4096;

/// Maximum decompressed PNG data size (256 MiB) to prevent decompression bombs
const MAX_DECODE_BYTES: usize = 256 * 1024 * 1024;

/// Encode raw RGBA pixel data as PNG bytes.
///
/// Uses a minimal PNG encoder — no external image crate needed.
/// Returns the PNG file bytes ready for storage or transfer.
/// Rejects images larger than 4096x4096 (16M pixels) to prevent OOM.
pub fn encode_rgba_as_png(width: usize, height: usize, rgba: &[u8]) -> Option<Vec<u8>> {
    // Validate dimensions with overflow protection
    let pixel_count = width.checked_mul(height);
    let expected_len = pixel_count.and_then(|n| n.checked_mul(4));
    match expected_len {
        Some(len) if width > 0 && height > 0 && rgba.len() == len => {}
        _ => {
            tracing::debug!(
                "Invalid image dimensions: {}x{}, data len: {}",
                width,
                height,
                rgba.len()
            );
            return None;
        }
    }

    // Reject oversized images to prevent OOM
    if pixel_count.unwrap_or(usize::MAX) > MAX_ENCODE_PIXELS {
        tracing::debug!(
            "Image too large for PNG encoding: {}x{} ({} pixels, max {})",
            width,
            height,
            pixel_count.unwrap_or(0),
            MAX_ENCODE_PIXELS,
        );
        return None;
    }

    // Validate dimensions fit in u32 (PNG spec limit)
    if width > u32::MAX as usize || height > u32::MAX as usize {
        tracing::debug!("Image dimensions exceed PNG u32 limit");
        return None;
    }

    // Build raw PNG using miniz_oxide for deflate
    let mut png = Vec::new();

    // PNG signature
    png.extend_from_slice(&[137, 80, 78, 71, 13, 10, 26, 10]);

    // IHDR chunk
    let mut ihdr_data = Vec::with_capacity(13);
    #[allow(clippy::cast_possible_truncation)]
    {
        ihdr_data.extend_from_slice(&(width as u32).to_be_bytes());
        ihdr_data.extend_from_slice(&(height as u32).to_be_bytes());
    }
    ihdr_data.push(8); // bit depth
    ihdr_data.push(6); // color type: RGBA
    ihdr_data.push(0); // compression
    ihdr_data.push(0); // filter
    ihdr_data.push(0); // interlace
    write_png_chunk(&mut png, b"IHDR", &ihdr_data);

    // IDAT chunk: filter rows + deflate
    let row_len = width * 4;
    let mut raw_data = Vec::with_capacity(height * (1 + row_len));
    for y in 0..height {
        raw_data.push(0); // filter type: None
        let start = y * row_len;
        let end = start + row_len;
        raw_data.extend_from_slice(&rgba[start..end]);
    }

    let compressed = miniz_oxide::deflate::compress_to_vec_zlib(&raw_data, 6);
    write_png_chunk(&mut png, b"IDAT", &compressed);

    // IEND chunk
    write_png_chunk(&mut png, b"IEND", &[]);

    Some(png)
}

/// Write a PNG chunk (length + type + data + CRC).
///
/// # Panics
/// Panics if `data.len()` exceeds `u32::MAX` (PNG spec chunk limit).
fn write_png_chunk(buf: &mut Vec<u8>, chunk_type: &[u8; 4], data: &[u8]) {
    assert!(
        data.len() <= u32::MAX as usize,
        "PNG chunk exceeds u32::MAX"
    );
    #[allow(clippy::cast_possible_truncation)]
    let len = data.len() as u32;
    buf.extend_from_slice(&len.to_be_bytes());
    buf.extend_from_slice(chunk_type);
    buf.extend_from_slice(data);

    // CRC32 over type + data
    let mut crc_data = Vec::with_capacity(4 + data.len());
    crc_data.extend_from_slice(chunk_type);
    crc_data.extend_from_slice(data);
    let crc = crc32(&crc_data);
    buf.extend_from_slice(&crc.to_be_bytes());
}

/// CRC32 (PNG uses ISO 3309 / ITU-T V.42 CRC)
fn crc32(data: &[u8]) -> u32 {
    let mut crc: u32 = 0xFFFF_FFFF;
    for &byte in data {
        crc ^= byte as u32;
        for _ in 0..8 {
            if crc & 1 != 0 {
                crc = (crc >> 1) ^ 0xEDB8_8320;
            } else {
                crc >>= 1;
            }
        }
    }
    !crc
}

/// Write image bytes to the system clipboard.
///
/// Attempts to decode PNG data and set it as a clipboard image.
/// Only supports simple PNGs (8-bit RGBA, filter type 0). For complex PNGs
/// produced by external tools, this may return `false` — the image will still
/// be saved to disk by the caller.
/// Returns `true` on success, `false` on failure (fails silently).
pub fn write_clipboard_image(png_data: &[u8]) -> bool {
    // Decode PNG dimensions and RGBA data (only filter-0 PNGs supported)
    let (width, height, rgba) = match decode_png_rgba(png_data) {
        Some(v) => v,
        None => {
            tracing::debug!("PNG not decodable for clipboard (unsupported filter or format)");
            return false;
        }
    };

    #[cfg(target_os = "linux")]
    {
        let has_display =
            std::env::var("DISPLAY").is_ok() || std::env::var("WAYLAND_DISPLAY").is_ok();
        if !has_display {
            tracing::debug!("No display server; skipping clipboard image write");
            return false;
        }
    }

    match arboard::Clipboard::new() {
        Ok(mut cb) => {
            let img = arboard::ImageData {
                width,
                height,
                bytes: rgba.into(),
            };
            match cb.set_image(img) {
                Ok(()) => {
                    tracing::debug!("Image written to clipboard");
                    true
                }
                Err(e) => {
                    tracing::debug!("Failed to write image to clipboard: {e}");
                    false
                }
            }
        }
        Err(e) => {
            tracing::debug!("Clipboard unavailable for image write: {e}");
            false
        }
    }
}

/// Minimal PNG RGBA decoder — extracts dimensions and pixel data.
///
/// **Limitation**: Only supports 8-bit RGBA PNGs with filter type 0 (None).
/// This is sufficient for round-tripping images produced by [`encode_rgba_as_png`],
/// but will return `None` for PNGs with other filter types (sub, up, average, paeth).
/// For externally-produced PNGs, consider saving directly to disk instead.
fn decode_png_rgba(data: &[u8]) -> Option<(usize, usize, Vec<u8>)> {
    // Verify PNG signature
    if data.len() < 33 || !data.starts_with(&[137, 80, 78, 71, 13, 10, 26, 10]) {
        return None;
    }

    // Read IHDR
    let width = u32::from_be_bytes([data[16], data[17], data[18], data[19]]) as usize;
    let height = u32::from_be_bytes([data[20], data[21], data[22], data[23]]) as usize;
    let bit_depth = data[24];
    let color_type = data[25];

    // Only support 8-bit RGBA for now
    if bit_depth != 8 || color_type != 6 {
        tracing::debug!(
            "Unsupported PNG format: bit_depth={}, color_type={}",
            bit_depth,
            color_type
        );
        return None;
    }

    // Collect all IDAT chunks
    let mut idat_data = Vec::new();
    let mut pos = 8;
    while pos + 12 <= data.len() {
        let chunk_len =
            u32::from_be_bytes([data[pos], data[pos + 1], data[pos + 2], data[pos + 3]]) as usize;
        let chunk_type = &data[pos + 4..pos + 8];

        if pos + 8 + chunk_len > data.len() {
            break;
        }

        if chunk_type == b"IDAT" {
            idat_data.extend_from_slice(&data[pos + 8..pos + 8 + chunk_len]);
        }

        pos += 12 + chunk_len;
    }

    // Compute expected decompressed size from IHDR dimensions
    // (width * 4 bytes per pixel + 1 filter byte) * height
    let row_len = width * 4;
    let expected_len = match height.checked_mul(1 + row_len) {
        Some(len) if len <= MAX_DECODE_BYTES => len,
        _ => {
            tracing::debug!(
                "PNG dimensions too large for decoding: {}x{} (would decompress to {} bytes)",
                width,
                height,
                height as u128 * (1 + row_len) as u128,
            );
            return None;
        }
    };

    // Decompress with size limit based on expected dimensions
    let decompressed = miniz_oxide::inflate::decompress_to_vec_zlib(&idat_data).ok()?;

    // Verify decompressed size does not exceed expected (prevents decompression bombs)
    if decompressed.len() > expected_len.saturating_mul(2) {
        tracing::debug!(
            "PNG decompression bomb detected: got {} bytes, expected ~{}",
            decompressed.len(),
            expected_len,
        );
        return None;
    }

    // Reconstruct RGBA pixels (filter type 0 = None only for simplicity)
    if decompressed.len() != expected_len {
        tracing::debug!(
            "PNG data size mismatch: got {}, expected {}",
            decompressed.len(),
            expected_len
        );
        return None;
    }

    let mut rgba = Vec::with_capacity(width * height * 4);
    for y in 0..height {
        let row_start = y * (1 + row_len);
        // Skip filter byte (we only support filter 0)
        rgba.extend_from_slice(&decompressed[row_start + 1..row_start + 1 + row_len]);
    }

    Some((width, height, rgba))
}

/// Save image bytes to a file on disk
pub fn save_image_to_disk(data: &[u8], path: &Path) -> io::Result<()> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    std::fs::write(path, data)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_crc32_known_value() {
        // CRC32 of "IEND" is well-known
        let crc = crc32(b"IEND");
        assert_eq!(crc, 0xAE42_6082);
    }

    #[test]
    fn test_encode_small_png() {
        // 2x2 red RGBA image
        let rgba = vec![
            255, 0, 0, 255, // red
            0, 255, 0, 255, // green
            0, 0, 255, 255, // blue
            255, 255, 0, 255, // yellow
        ];
        let png = encode_rgba_as_png(2, 2, &rgba);
        assert!(png.is_some());
        let png = png.unwrap();
        // Check PNG signature
        assert_eq!(&png[..8], &[137, 80, 78, 71, 13, 10, 26, 10]);
    }

    #[test]
    fn test_encode_invalid_dimensions() {
        assert!(encode_rgba_as_png(0, 0, &[]).is_none());
        assert!(encode_rgba_as_png(2, 2, &[0; 8]).is_none()); // wrong data length
    }

    #[test]
    fn test_png_roundtrip() {
        let rgba = vec![
            255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 0, 255,
        ];
        let png = encode_rgba_as_png(2, 2, &rgba).unwrap();
        let (w, h, decoded) = decode_png_rgba(&png).unwrap();
        assert_eq!(w, 2);
        assert_eq!(h, 2);
        assert_eq!(decoded, rgba);
    }

    #[test]
    fn test_decode_invalid_png() {
        assert!(decode_png_rgba(&[0; 10]).is_none());
        assert!(decode_png_rgba(b"not a png").is_none());
    }

    #[test]
    fn test_save_image_to_disk() {
        let dir = tempfile::TempDir::new().unwrap();
        let path = dir.path().join("test.png");
        save_image_to_disk(b"fake png data", &path).unwrap();
        assert!(path.exists());
        assert_eq!(std::fs::read(&path).unwrap(), b"fake png data");
    }
}
