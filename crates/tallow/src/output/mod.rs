//! Output formatting utilities

pub mod clipboard;
pub mod color;
pub mod errors;
pub mod json;
pub mod progress;
pub mod prompts;
pub mod qr;
pub mod verify;

pub use progress::TransferProgressBar;

/// Format a byte count as a human-readable string (e.g., "1.43 MiB").
///
/// Uses binary prefixes (KiB, MiB, GiB, TiB) per IEC 80000-13.
pub fn format_size(bytes: u64) -> String {
    const KIB: u64 = 1024;
    const MIB: u64 = 1024 * 1024;
    const GIB: u64 = 1024 * 1024 * 1024;
    const TIB: u64 = 1024 * 1024 * 1024 * 1024;

    if bytes >= TIB {
        format!("{:.2} TiB", bytes as f64 / TIB as f64)
    } else if bytes >= GIB {
        format!("{:.2} GiB", bytes as f64 / GIB as f64)
    } else if bytes >= MIB {
        format!("{:.2} MiB", bytes as f64 / MIB as f64)
    } else if bytes >= KIB {
        format!("{:.2} KiB", bytes as f64 / KIB as f64)
    } else {
        format!("{} B", bytes)
    }
}

/// Format a duration for human-readable display.
pub fn format_duration(duration: std::time::Duration) -> String {
    let secs = duration.as_secs();
    if secs < 60 {
        format!("{}s", secs)
    } else if secs < 3600 {
        format!("{}m {}s", secs / 60, secs % 60)
    } else {
        format!("{}h {}m", secs / 3600, (secs % 3600) / 60)
    }
}

/// Format transfer speed as human-readable bytes/second.
pub fn format_speed(bytes: u64, duration: std::time::Duration) -> String {
    let secs = duration.as_secs_f64();
    if secs <= 0.0 {
        return "-- B/s".to_string();
    }
    let bps = bytes as f64 / secs;
    format!("{}/s", format_size(bps as u64))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_size_zero() {
        assert_eq!(format_size(0), "0 B");
    }

    #[test]
    fn test_format_size_bytes() {
        assert_eq!(format_size(512), "512 B");
    }

    #[test]
    fn test_format_size_kib() {
        assert_eq!(format_size(1024), "1.00 KiB");
    }

    #[test]
    fn test_format_size_mib() {
        assert_eq!(format_size(1_500_000), "1.43 MiB");
    }

    #[test]
    fn test_format_size_gib() {
        assert_eq!(format_size(2_147_483_648), "2.00 GiB");
    }

    #[test]
    fn test_format_size_tib() {
        assert_eq!(format_size(1_099_511_627_776), "1.00 TiB");
    }

    #[test]
    fn test_format_size_exact_boundary() {
        // Exactly 1 MiB
        assert_eq!(format_size(1_048_576), "1.00 MiB");
    }

    #[test]
    fn test_format_duration_seconds() {
        assert_eq!(format_duration(std::time::Duration::from_secs(45)), "45s");
    }

    #[test]
    fn test_format_duration_minutes() {
        assert_eq!(
            format_duration(std::time::Duration::from_secs(125)),
            "2m 5s"
        );
    }

    #[test]
    fn test_format_duration_hours() {
        assert_eq!(
            format_duration(std::time::Duration::from_secs(3661)),
            "1h 1m"
        );
    }

    #[test]
    fn test_format_duration_zero() {
        assert_eq!(format_duration(std::time::Duration::from_secs(0)), "0s");
    }

    #[test]
    fn test_format_speed_normal() {
        let speed = format_speed(1_048_576, std::time::Duration::from_secs(1));
        assert_eq!(speed, "1.00 MiB/s");
    }

    #[test]
    fn test_format_speed_zero_duration() {
        assert_eq!(
            format_speed(1000, std::time::Duration::from_secs(0)),
            "-- B/s"
        );
    }

    #[test]
    fn test_format_speed_large() {
        let speed = format_speed(1_073_741_824, std::time::Duration::from_secs(1));
        assert_eq!(speed, "1.00 GiB/s");
    }
}
