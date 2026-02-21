//! Transfer history command implementation

use crate::cli::HistoryArgs;
use crate::output;
use std::io;
use tallow_store::history::{TransferDirection, TransferLog, TransferStatus};

/// Execute the history command
pub async fn execute(args: HistoryArgs, json: bool) -> io::Result<()> {
    // --clear: wipe all history and exit
    if args.clear {
        let mut log = TransferLog::open()
            .map_err(|e| io::Error::other(format!("Failed to open history: {}", e)))?;
        log.clear()
            .map_err(|e| io::Error::other(format!("Failed to clear history: {}", e)))?;

        if json {
            println!("{}", serde_json::json!({"event": "history_cleared"}));
        } else {
            output::color::success("Transfer history cleared.");
        }
        return Ok(());
    }

    // Load history
    let log = TransferLog::open()
        .map_err(|e| io::Error::other(format!("Failed to open history: {}", e)))?;

    let entries = log.recent(args.limit);

    if entries.is_empty() {
        if json {
            println!("{}", serde_json::json!({"event": "history", "entries": []}));
        } else {
            output::color::info("No transfer history.");
        }
        return Ok(());
    }

    if json {
        let json_entries: Vec<serde_json::Value> = entries
            .iter()
            .map(|e| {
                serde_json::json!({
                    "id": e.id,
                    "direction": direction_str(e.direction),
                    "file_count": e.file_count,
                    "total_bytes": e.total_bytes,
                    "timestamp": e.timestamp,
                    "status": status_str(e.status),
                    "filenames": e.filenames,
                })
            })
            .collect();
        println!(
            "{}",
            serde_json::json!({"event": "history", "entries": json_entries})
        );
    } else {
        output::color::section("Transfer History");
        println!();

        // Table header
        let mut table = comfy_table::Table::new();
        table.set_header(vec!["Date", "Direction", "Files", "Size", "Status"]);

        for entry in entries {
            let date = format_timestamp(entry.timestamp);
            let dir = direction_str(entry.direction);
            let files = if entry.filenames.len() == 1 {
                entry.filenames[0].clone()
            } else {
                format!("{} file(s)", entry.file_count)
            };
            let size = output::format_size(entry.total_bytes);
            let status = status_str(entry.status);

            table.add_row(vec![&date, dir, &files, &size, status]);
        }

        println!("{}", table);
    }

    Ok(())
}

/// Convert a direction enum to a display string
fn direction_str(dir: TransferDirection) -> &'static str {
    match dir {
        TransferDirection::Sent => "Sent",
        TransferDirection::Received => "Received",
    }
}

/// Convert a status enum to a display string
fn status_str(status: TransferStatus) -> &'static str {
    match status {
        TransferStatus::Completed => "Completed",
        TransferStatus::Failed => "Failed",
        TransferStatus::Cancelled => "Cancelled",
    }
}

/// Format a Unix timestamp as a human-readable date string
fn format_timestamp(epoch_secs: u64) -> String {
    use chrono::{TimeZone, Utc};
    match Utc.timestamp_opt(epoch_secs as i64, 0) {
        chrono::LocalResult::Single(dt) => dt.format("%Y-%m-%d %H:%M").to_string(),
        _ => "unknown".to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_direction_str() {
        assert_eq!(direction_str(TransferDirection::Sent), "Sent");
        assert_eq!(direction_str(TransferDirection::Received), "Received");
    }

    #[test]
    fn test_status_str() {
        assert_eq!(status_str(TransferStatus::Completed), "Completed");
        assert_eq!(status_str(TransferStatus::Failed), "Failed");
        assert_eq!(status_str(TransferStatus::Cancelled), "Cancelled");
    }

    #[test]
    fn test_format_timestamp() {
        // 2024-02-19 00:00:00 UTC
        let ts = 1708300800;
        let result = format_timestamp(ts);
        assert!(result.starts_with("2024-02-19"));
    }

    #[test]
    fn test_format_timestamp_zero() {
        let result = format_timestamp(0);
        assert_eq!(result, "1970-01-01 00:00");
    }
}
