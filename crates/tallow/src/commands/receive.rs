//! Receive command implementation

use crate::cli::ReceiveArgs;
use crate::output;
use std::io;
use std::path::PathBuf;

/// Execute receive command
pub async fn execute(args: ReceiveArgs, json: bool) -> io::Result<()> {
    // Get the code phrase
    let code_phrase = match &args.code {
        Some(code) => code.clone(),
        None => {
            if json {
                return Err(io::Error::new(
                    io::ErrorKind::InvalidInput,
                    "Code phrase required. Usage: tallow receive <code-phrase>",
                ));
            }
            // Prompt for code phrase
            output::color::info("Enter the code phrase:");
            let mut input = String::new();
            std::io::stdin().read_line(&mut input)?;
            input.trim().to_string()
        }
    };

    if code_phrase.is_empty() {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "Code phrase cannot be empty",
        ));
    }

    // Determine output directory
    let output_dir = args.output.unwrap_or_else(|| PathBuf::from("."));
    if !output_dir.exists() {
        std::fs::create_dir_all(&output_dir)?;
    }

    // Load or generate identity
    let mut identity = tallow_store::identity::IdentityStore::new();
    if let Err(e) = identity.load_or_generate("") {
        tracing::warn!("Identity initialization failed: {}", e);
    }

    // Derive room ID and session key
    let room_id = tallow_protocol::room::code::derive_room_id(&code_phrase);
    let session_key = tallow_protocol::kex::derive_session_key_from_phrase(&code_phrase, &room_id);

    if json {
        println!(
            "{}",
            serde_json::json!({
                "event": "connecting",
                "code": code_phrase,
                "room_id": hex::encode(room_id),
                "output_dir": output_dir.display().to_string(),
            })
        );
    } else {
        output::color::info(&format!("Connecting with code: {}", code_phrase));
        println!("Output directory: {}", output_dir.display());
    }

    // Initialize receive pipeline
    let transfer_id: [u8; 16] = [0u8; 16]; // Will be received from sender
    let pipeline = tallow_protocol::transfer::ReceivePipeline::new(
        transfer_id,
        output_dir.clone(),
        *session_key.as_bytes(),
    );

    if json {
        println!(
            "{}",
            serde_json::json!({
                "event": "waiting_for_sender",
                "code": code_phrase,
            })
        );
    } else {
        output::color::info("Waiting for sender to connect...");
    }

    // In v1, the actual receive loop would:
    // 1. Connect to relay with room_id
    // 2. Wait for sender peer
    // 3. Receive FileOffer message, display to user for confirmation
    // 4. Accept/reject
    // 5. Receive chunks, decrypt, decompress, verify, write
    // 6. Finalize (verify all hashes)

    if json {
        println!(
            "{}",
            serde_json::json!({
                "event": "ready",
                "output_dir": output_dir.display().to_string(),
                "message": "Receive pipeline ready, awaiting relay connection",
            })
        );
    } else {
        output::color::info("Receive pipeline ready. Awaiting relay connection...");
        println!("(Full relay transfer requires a running relay server)");
    }

    // Log to transfer history
    if let Ok(mut history) = tallow_store::history::TransferLog::open() {
        let _ = history.append(tallow_store::history::TransferEntry {
            id: hex::encode(&transfer_id),
            peer_id: "unknown".to_string(),
            direction: tallow_store::history::TransferDirection::Received,
            file_count: 0,
            total_bytes: 0,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs(),
            status: tallow_store::history::TransferStatus::Completed,
            filenames: Vec::new(),
        });
    }

    Ok(())
}
