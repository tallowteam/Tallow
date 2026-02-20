//! Send command implementation

use crate::cli::SendArgs;
use crate::output;
use bytes::BytesMut;
use std::io;
use std::path::PathBuf;
use tallow_protocol::wire::{codec::TallowCodec, Message};

/// Maximum receive buffer size (256 KB)
const RECV_BUF_SIZE: usize = 256 * 1024;

/// Execute send command
pub async fn execute(args: SendArgs, json: bool) -> io::Result<()> {
    // LAN peer discovery via mDNS
    if args.discover {
        if !json {
            output::color::info("Discovering peers on LAN...");
        }
        let mut discovery = tallow_net::discovery::MdnsDiscovery::new("tallow-sender".to_string());
        if let Err(e) = discovery.start() {
            tracing::warn!("LAN discovery failed: {}", e);
        } else {
            // Wait briefly for responses
            tokio::time::sleep(std::time::Duration::from_secs(3)).await;
            let peers = discovery.discovered_peers();
            if !peers.is_empty() {
                if json {
                    let peer_list: Vec<serde_json::Value> = peers
                        .iter()
                        .map(|p| {
                            serde_json::json!({
                                "id": p.id,
                                "address": p.addr.to_string(),
                                "name": p.name,
                            })
                        })
                        .collect();
                    println!(
                        "{}",
                        serde_json::json!({
                            "event": "lan_peers_found",
                            "peers": peer_list,
                        })
                    );
                } else {
                    println!("Found {} peer(s) on LAN:", peers.len());
                    for peer in &peers {
                        println!("  {} - {} ({})", peer.id, peer.name, peer.addr);
                    }
                }
            } else if !json {
                output::color::info("No peers found on LAN. Using relay...");
            }
            let _ = discovery.stop();
        }
    }

    // Validate files exist
    for file in &args.files {
        if !file.exists() {
            let msg = format!("File not found: {}", file.display());
            if json {
                println!("{}", serde_json::json!({"event": "error", "message": msg}));
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

    // Select compression algorithm
    let compression = match args.compress.as_str() {
        "none" => tallow_protocol::compression::CompressionAlgorithm::None,
        "zstd" => tallow_protocol::compression::CompressionAlgorithm::Zstd,
        "brotli" => tallow_protocol::compression::CompressionAlgorithm::Brotli,
        "lz4" => tallow_protocol::compression::CompressionAlgorithm::Lz4,
        "lzma" => tallow_protocol::compression::CompressionAlgorithm::Lzma,
        _ => tallow_protocol::compression::CompressionAlgorithm::Zstd, // "auto" and unrecognized default to zstd
    };

    let mut pipeline =
        tallow_protocol::transfer::SendPipeline::new(transfer_id, *session_key.as_bytes())
            .with_compression(compression);

    // Prepare files (scan, hash, build manifest)
    let file_paths: Vec<PathBuf> = args.files.clone();
    let offer_messages = pipeline
        .prepare(&file_paths)
        .await
        .map_err(|e| io::Error::other(format!("Failed to prepare transfer: {}", e)))?;

    let manifest = pipeline.manifest();
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
                "event": "transfer_prepared",
                "total_files": file_count,
                "total_bytes": total_size,
                "total_chunks": total_chunks,
            })
        );
    } else {
        println!(
            "Prepared {} file(s), {} bytes in {} chunks",
            file_count, total_size, total_chunks,
        );
    }

    // Resolve relay address
    let relay_addr: std::net::SocketAddr = resolve_relay(&args.relay)?;

    // Connect to relay
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

    // Wait for peer if not already present
    if !peer_present {
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

    // Create codec for encoding messages
    let mut codec = TallowCodec::new();
    let mut encode_buf = BytesMut::new();

    // Send FileOffer
    for msg in &offer_messages {
        encode_buf.clear();
        codec
            .encode_msg(msg, &mut encode_buf)
            .map_err(|e| io::Error::other(format!("Encode FileOffer failed: {}", e)))?;
        relay
            .forward(&encode_buf)
            .await
            .map_err(|e| io::Error::other(format!("Send FileOffer failed: {}", e)))?;
    }

    // Wait for FileAccept
    let mut recv_buf = vec![0u8; RECV_BUF_SIZE];
    let n = relay
        .receive(&mut recv_buf)
        .await
        .map_err(|e| io::Error::other(format!("Receive FileAccept failed: {}", e)))?;

    let mut decode_buf = BytesMut::from(&recv_buf[..n]);
    let response = codec
        .decode_msg(&mut decode_buf)
        .map_err(|e| io::Error::other(format!("Decode response failed: {}", e)))?;

    match response {
        Some(Message::FileAccept { .. }) => {
            tracing::info!("Receiver accepted the transfer");
        }
        Some(Message::FileReject { reason, .. }) => {
            let msg = format!("Transfer rejected: {}", reason);
            if json {
                println!(
                    "{}",
                    serde_json::json!({"event": "rejected", "reason": reason})
                );
            } else {
                output::color::error(&msg);
            }
            relay.close().await;
            return Err(io::Error::other(msg));
        }
        other => {
            let msg = format!("Unexpected response: {:?}", other);
            relay.close().await;
            return Err(io::Error::other(msg));
        }
    }

    // Create progress bar and send chunks
    let progress = output::TransferProgressBar::new(total_size);
    let mut total_sent: u64 = 0;
    let mut chunk_index: u64 = 0;

    for file in &args.files {
        let chunk_messages = pipeline
            .chunk_file(file, chunk_index)
            .await
            .map_err(|e| io::Error::other(format!("Failed to chunk {}: {}", file.display(), e)))?;

        for chunk_msg in &chunk_messages {
            // Encode and send chunk
            encode_buf.clear();
            codec
                .encode_msg(chunk_msg, &mut encode_buf)
                .map_err(|e| io::Error::other(format!("Encode chunk failed: {}", e)))?;
            relay
                .forward(&encode_buf)
                .await
                .map_err(|e| io::Error::other(format!("Send chunk failed: {}", e)))?;

            // Wait for acknowledgment
            let n = relay
                .receive(&mut recv_buf)
                .await
                .map_err(|e| io::Error::other(format!("Receive ack failed: {}", e)))?;

            let mut ack_buf = BytesMut::from(&recv_buf[..n]);
            let ack = codec
                .decode_msg(&mut ack_buf)
                .map_err(|e| io::Error::other(format!("Decode ack failed: {}", e)))?;

            match ack {
                Some(Message::Ack { .. }) => {
                    // Update progress
                    if let Message::Chunk { ref data, .. } = chunk_msg {
                        total_sent += data.len() as u64;
                        progress.update(total_sent.min(total_size));
                    }
                }
                Some(Message::TransferError { error, .. }) => {
                    progress.finish();
                    let msg = format!("Transfer error from receiver: {}", error);
                    relay.close().await;
                    return Err(io::Error::other(msg));
                }
                other => {
                    tracing::warn!("Unexpected message during transfer: {:?}", other);
                }
            }
        }

        chunk_index += chunk_messages.len() as u64;
    }

    progress.finish();

    // Send TransferComplete
    let complete_msg = Message::TransferComplete {
        transfer_id,
        hash: *pipeline
            .manifest()
            .manifest_hash
            .as_ref()
            .unwrap_or(&[0u8; 32]),
    };
    encode_buf.clear();
    codec
        .encode_msg(&complete_msg, &mut encode_buf)
        .map_err(|e| io::Error::other(format!("Encode complete failed: {}", e)))?;
    relay
        .forward(&encode_buf)
        .await
        .map_err(|e| io::Error::other(format!("Send complete failed: {}", e)))?;

    // Close relay connection
    relay.close().await;

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
