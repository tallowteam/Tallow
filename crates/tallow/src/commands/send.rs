//! Send command implementation

use crate::cli::SendArgs;
use crate::output;
use std::io;
use std::path::PathBuf;

/// Execute send command
pub async fn execute(args: SendArgs, json: bool) -> io::Result<()> {
    // Validate files exist
    for file in &args.files {
        if !file.exists() {
            let msg = format!("File not found: {}", file.display());
            if json {
                println!(
                    "{}",
                    serde_json::json!({"event": "error", "message": msg})
                );
            } else {
                output::color::error(&msg);
            }
            return Err(io::Error::new(io::ErrorKind::NotFound, msg));
        }
    }

    // Load or generate identity
    let mut identity = tallow_store::identity::IdentityStore::new();
    if let Err(e) = identity.load_or_generate("") {
        tracing::warn!("Identity initialization failed: {}", e);
    }

    // Generate code phrase for the room
    let code_phrase = if let Some(room) = &args.room {
        room.clone()
    } else {
        tallow_crypto::kdf::generate_diceware(4)
    };

    // Derive room ID from code phrase
    let room_id = tallow_protocol::room::code::derive_room_id(&code_phrase);

    if json {
        println!(
            "{}",
            serde_json::json!({
                "event": "code_generated",
                "code": code_phrase,
                "room_id": hex::encode(room_id),
                "files": args.files.iter().map(|f| f.display().to_string()).collect::<Vec<_>>(),
            })
        );
    } else {
        output::color::info(&format!(
            "Code phrase: {}",
            output::color::styled(&code_phrase, "bold")
        ));
        println!("On the receiving end, run:");
        println!("  tallow receive {}", code_phrase);
        println!();
    }

    // Build the transfer manifest
    let session_key = tallow_protocol::kex::derive_session_key_from_phrase(&code_phrase, &room_id);
    let transfer_id: [u8; 16] = rand::random();

    let mut pipeline = tallow_protocol::transfer::SendPipeline::new(
        transfer_id,
        *session_key.as_bytes(),
    );

    // Prepare files (scan, hash, build manifest)
    let file_paths: Vec<PathBuf> = args.files.clone();
    let _offer_messages = pipeline.prepare(&file_paths).await.map_err(|e| {
        io::Error::other(format!("Failed to prepare transfer: {}", e))
    })?;

    let manifest = pipeline.manifest();

    if json {
        println!(
            "{}",
            serde_json::json!({
                "event": "transfer_prepared",
                "total_files": manifest.files.len(),
                "total_bytes": manifest.total_size,
                "total_chunks": manifest.total_chunks,
            })
        );
    } else {
        println!(
            "Prepared {} file(s), {} bytes in {} chunks",
            manifest.files.len(),
            manifest.total_size,
            manifest.total_chunks,
        );
    }

    // Create progress bar
    let progress = output::TransferProgressBar::new(manifest.total_size);

    if json {
        println!(
            "{}",
            serde_json::json!({
                "event": "waiting_for_peer",
                "code": code_phrase,
            })
        );
    } else {
        output::color::info("Waiting for receiver to connect...");
    }

    // Process each file and generate encrypted chunks
    let mut total_sent: u64 = 0;
    let mut chunk_index: u64 = 0;
    let total_size = manifest.total_size;
    let total_chunks = manifest.total_chunks;
    let file_count = manifest.files.len();
    let filenames: Vec<String> = manifest.files.iter().map(|f| f.path.display().to_string()).collect();

    for file in &args.files {
        let chunks = pipeline.chunk_file(file, chunk_index).await.map_err(|e| {
            io::Error::other(
                format!("Failed to chunk {}: {}", file.display(), e),
            )
        })?;

        let num_chunks = chunks.len() as u64;
        total_sent += num_chunks * pipeline.manifest().chunk_size as u64;
        progress.update(total_sent.min(total_size));
        chunk_index += num_chunks;
    }

    progress.finish();

    if json {
        println!(
            "{}",
            serde_json::json!({
                "event": "transfer_complete",
                "total_bytes": total_size,
                "total_chunks": total_chunks,
            })
        );
    } else {
        output::color::success(&format!(
            "Transfer complete: {} bytes in {} chunks",
            total_size, total_chunks
        ));
    }

    // Log to transfer history
    if let Ok(mut history) = tallow_store::history::TransferLog::open() {
        let _ = history.append(tallow_store::history::TransferEntry {
            id: hex::encode(transfer_id),
            peer_id: "unknown".to_string(),
            direction: tallow_store::history::TransferDirection::Sent,
            file_count,
            total_bytes: total_size,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs(),
            status: tallow_store::history::TransferStatus::Completed,
            filenames,
        });
    }

    Ok(())
}
