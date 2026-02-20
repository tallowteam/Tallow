//! Receive command implementation

use crate::cli::ReceiveArgs;
use crate::output;
use bytes::BytesMut;
use std::io;
use std::path::PathBuf;
use tallow_protocol::wire::{codec::TallowCodec, Message};

/// Maximum receive buffer size (256 KB)
const RECV_BUF_SIZE: usize = 256 * 1024;

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

    // Resolve relay address and connect
    let relay_addr: std::net::SocketAddr = resolve_relay(&args.relay)?;
    let mut relay = tallow_net::relay::RelayClient::new(relay_addr);

    if json {
        println!(
            "{}",
            serde_json::json!({
                "event": "connecting_to_relay",
                "relay": args.relay,
            })
        );
    } else {
        output::color::info(&format!("Connecting to relay {}...", args.relay));
    }

    let peer_present = relay
        .connect(&room_id)
        .await
        .map_err(|e| io::Error::other(format!("Relay connection failed: {}", e)))?;

    if !peer_present {
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

        relay
            .wait_for_peer()
            .await
            .map_err(|e| io::Error::other(format!("Wait for peer failed: {}", e)))?;
    }

    if json {
        println!("{}", serde_json::json!({ "event": "peer_connected" }));
    } else {
        output::color::success("Peer connected!");
    }

    // Create codec and receive buffer
    let mut codec = TallowCodec::new();
    let mut recv_buf = vec![0u8; RECV_BUF_SIZE];
    let mut encode_buf = BytesMut::new();

    // Receive FileOffer
    let n = relay
        .receive(&mut recv_buf)
        .await
        .map_err(|e| io::Error::other(format!("Receive FileOffer failed: {}", e)))?;

    let mut decode_buf = BytesMut::from(&recv_buf[..n]);
    let offer_msg = codec
        .decode_msg(&mut decode_buf)
        .map_err(|e| io::Error::other(format!("Decode FileOffer failed: {}", e)))?;

    let (transfer_id, manifest_bytes) = match offer_msg {
        Some(Message::FileOffer {
            transfer_id,
            manifest,
        }) => (transfer_id, manifest),
        other => {
            let msg = format!("Expected FileOffer, got: {:?}", other);
            relay.close().await;
            return Err(io::Error::other(msg));
        }
    };

    // Initialize receive pipeline
    let mut pipeline = tallow_protocol::transfer::ReceivePipeline::new(
        transfer_id,
        output_dir.clone(),
        *session_key.as_bytes(),
    );

    // Process the offer
    let manifest = pipeline
        .process_offer(&manifest_bytes)
        .map_err(|e| io::Error::other(format!("Failed to process offer: {}", e)))?;

    let total_size = manifest.total_size;
    let total_chunks = manifest.total_chunks;
    let file_count = manifest.files.len();
    let filenames: Vec<String> = manifest
        .files
        .iter()
        .map(|f| f.path.display().to_string())
        .collect();

    if json {
        println!(
            "{}",
            serde_json::json!({
                "event": "file_offer",
                "transfer_id": hex::encode(transfer_id),
                "total_files": file_count,
                "total_bytes": total_size,
                "total_chunks": total_chunks,
                "files": filenames,
            })
        );
    } else {
        println!("Incoming transfer:");
        println!(
            "  {} file(s), {} bytes in {} chunks",
            file_count, total_size, total_chunks
        );
        for name in &filenames {
            println!("  - {}", name);
        }
    }

    // Auto-accept (for v1; future: prompt user for confirmation)
    let accept_msg = Message::FileAccept { transfer_id };
    encode_buf.clear();
    codec
        .encode_msg(&accept_msg, &mut encode_buf)
        .map_err(|e| io::Error::other(format!("Encode FileAccept failed: {}", e)))?;
    relay
        .forward(&encode_buf)
        .await
        .map_err(|e| io::Error::other(format!("Send FileAccept failed: {}", e)))?;

    if !json {
        output::color::info("Transfer accepted. Receiving...");
    }

    // Create progress bar
    let progress = output::TransferProgressBar::new(total_size);
    let mut bytes_received: u64 = 0;

    // Receive chunks
    loop {
        let n = relay
            .receive(&mut recv_buf)
            .await
            .map_err(|e| io::Error::other(format!("Receive chunk failed: {}", e)))?;

        let mut chunk_buf = BytesMut::from(&recv_buf[..n]);
        let msg = codec
            .decode_msg(&mut chunk_buf)
            .map_err(|e| io::Error::other(format!("Decode chunk failed: {}", e)))?;

        match msg {
            Some(Message::Chunk {
                index, total, data, ..
            }) => {
                let chunk_size = data.len() as u64;

                // Process the chunk (decrypt, store)
                let ack = pipeline.process_chunk(index, &data, total).map_err(|e| {
                    io::Error::other(format!("Process chunk {} failed: {}", index, e))
                })?;

                // Send acknowledgment
                if let Some(ack_msg) = ack {
                    encode_buf.clear();
                    codec
                        .encode_msg(&ack_msg, &mut encode_buf)
                        .map_err(|e| io::Error::other(format!("Encode ack failed: {}", e)))?;
                    relay
                        .forward(&encode_buf)
                        .await
                        .map_err(|e| io::Error::other(format!("Send ack failed: {}", e)))?;
                }

                bytes_received += chunk_size;
                progress.update(bytes_received.min(total_size));

                // Check if transfer is complete
                if pipeline.is_complete() {
                    break;
                }
            }
            Some(Message::TransferComplete { .. }) => {
                tracing::info!("Received TransferComplete from sender");
                break;
            }
            Some(Message::TransferError { error, .. }) => {
                progress.finish();
                let msg = format!("Transfer error from sender: {}", error);
                relay.close().await;
                return Err(io::Error::other(msg));
            }
            other => {
                tracing::warn!("Unexpected message during transfer: {:?}", other);
            }
        }
    }

    progress.finish();

    // Finalize: reassemble, decompress, verify, write to disk
    if !json {
        output::color::info("Verifying and writing files...");
    }

    let written_files = pipeline
        .finalize()
        .await
        .map_err(|e| io::Error::other(format!("Finalize failed: {}", e)))?;

    // Close relay connection
    relay.close().await;

    if json {
        println!(
            "{}",
            serde_json::json!({
                "event": "transfer_complete",
                "total_bytes": total_size,
                "total_chunks": total_chunks,
                "files": written_files.iter().map(|f| f.display().to_string()).collect::<Vec<_>>(),
            })
        );
    } else {
        output::color::success(&format!(
            "Transfer complete: {} file(s), {} bytes",
            written_files.len(),
            total_size
        ));
        for f in &written_files {
            println!("  Saved: {}", f.display());
        }
    }

    // Log to transfer history
    if let Ok(mut history) = tallow_store::history::TransferLog::open() {
        let _ = history.append(tallow_store::history::TransferEntry {
            id: hex::encode(transfer_id),
            peer_id: "unknown".to_string(),
            direction: tallow_store::history::TransferDirection::Received,
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

/// Resolve a relay address string to a SocketAddr
fn resolve_relay(relay: &str) -> io::Result<std::net::SocketAddr> {
    // Try parsing as a direct SocketAddr first
    if let Ok(addr) = relay.parse() {
        return Ok(addr);
    }

    // Try DNS resolution
    use std::net::ToSocketAddrs;
    relay
        .to_socket_addrs()
        .map_err(|e| {
            io::Error::other(format!(
                "Failed to resolve relay address '{}': {}",
                relay, e
            ))
        })?
        .next()
        .ok_or_else(|| io::Error::other(format!("No addresses found for relay '{}'", relay)))
}
