//! Send command implementation

use crate::cli::SendArgs;
use crate::output;
use bytes::BytesMut;
use std::io::{self, IsTerminal, Read};
use std::path::PathBuf;
use tallow_protocol::wire::{codec::TallowCodec, Message};

/// Maximum receive buffer size (256 KB)
const RECV_BUF_SIZE: usize = 256 * 1024;

/// Source of data to send
enum SendSource {
    /// File paths from CLI arguments
    Files(Vec<PathBuf>),
    /// Text from --text flag or stdin pipe
    Text(Vec<u8>),
}

/// Determine what to send based on CLI args and stdin state
fn determine_source(args: &SendArgs) -> io::Result<SendSource> {
    // --text flag takes highest priority
    if let Some(ref text) = args.text {
        return Ok(SendSource::Text(text.as_bytes().to_vec()));
    }

    // Check for piped stdin (not a terminal) when no files given
    if args.files.is_empty() && !args.ignore_stdin && !std::io::stdin().is_terminal() {
        let mut buf = Vec::new();
        std::io::stdin().read_to_end(&mut buf)?;
        if buf.is_empty() {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "No input: stdin is empty and no files specified",
            ));
        }
        return Ok(SendSource::Text(buf));
    }

    // Require at least one file
    if args.files.is_empty() {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "No files specified. Usage: tallow send <files>\n\
             Or use: tallow send --text \"message\"\n\
             Or pipe: echo hello | tallow send",
        ));
    }

    Ok(SendSource::Files(args.files.clone()))
}

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

    // Determine what we're sending (text, stdin pipe, or files)
    let source = determine_source(&args)?;

    // Validate files exist (only for file mode)
    if let SendSource::Files(ref files) = source {
        for file in files {
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
    }

    // Load or generate identity
    let mut identity = tallow_store::identity::IdentityStore::new();
    if let Err(e) = identity.load_or_generate("") {
        tracing::warn!("Identity initialization failed: {}", e);
    }

    // Generate code phrase for the room
    let code_phrase = if let Some(ref custom_code) = args.custom_code {
        // Validate minimum length for security
        if custom_code.len() < 4 {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "Custom code must be at least 4 characters for security",
            ));
        }
        if custom_code.len() < 8 && !json {
            output::color::warning(
                "Short custom code -- security depends on code phrase entropy",
            );
        }
        custom_code.clone()
    } else if let Some(room) = &args.room {
        // Legacy --room flag support
        room.clone()
    } else {
        tallow_protocol::room::code::generate_code_phrase(
            args.words
                .unwrap_or(tallow_protocol::room::code::DEFAULT_WORD_COUNT),
        )
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
                "receive_command": format!("tallow receive {}", code_phrase),
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

        // QR code (opt-in via --qr)
        if args.qr {
            if let Err(e) = output::qr::display_receive_qr(&code_phrase) {
                tracing::debug!("QR display failed: {}", e);
            }
            println!();
        }

        // Clipboard auto-copy (default on, disable with --no-clipboard)
        if !args.no_clipboard {
            output::clipboard::copy_to_clipboard(&format!("tallow receive {}", code_phrase));
            output::color::info("(receive command copied to clipboard)");
        }
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

    // Build exclusion config from --exclude and --git flags
    let exclusion = tallow_protocol::transfer::ExclusionConfig::from_exclude_str(
        args.exclude.as_deref(),
        args.git,
    );

    // Parse bandwidth throttle
    let throttle_bps = parse_throttle(&args.throttle)?;

    let mut pipeline =
        tallow_protocol::transfer::SendPipeline::new(transfer_id, *session_key.as_bytes())
            .with_compression(compression)
            .with_exclusion(exclusion);

    // Prepare transfer based on source
    let (offer_messages, source_files) = match &source {
        SendSource::Text(data) => {
            let msgs = pipeline
                .prepare_text(data)
                .await
                .map_err(|e| io::Error::other(format!("Failed to prepare text: {}", e)))?;
            (msgs, Vec::new())
        }
        SendSource::Files(files) => {
            let msgs = pipeline
                .prepare(files)
                .await
                .map_err(|e| io::Error::other(format!("Failed to prepare transfer: {}", e)))?;
            (msgs, files.clone())
        }
    };

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
        let label = match &source {
            SendSource::Text(_) => "text",
            SendSource::Files(_) => "file(s)",
        };
        println!(
            "Prepared {} {}, {} in {} chunks",
            file_count,
            label,
            output::format_size(total_size),
            total_chunks,
        );
    }

    // --ask: prompt sender for confirmation before starting transfer
    if args.ask && !json {
        let confirm = output::prompts::confirm_with_default(
            &format!(
                "Send {} file(s) ({})?",
                file_count,
                output::format_size(total_size)
            ),
            true,
        )?;
        if !confirm {
            output::color::info("Transfer cancelled by sender.");
            return Ok(());
        }
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

    // Hash relay password for authentication (if provided)
    let password_hash: Option<[u8; 32]> = args.relay_pass.as_ref().map(|pass| {
        blake3::hash(pass.as_bytes()).into()
    });
    let pw_ref = password_hash.as_ref();

    if args.relay_pass.is_some() && std::env::var("TALLOW_RELAY_PASS").is_err() {
        tracing::warn!(
            "Relay password passed via CLI argument -- visible in process list. \
             Use TALLOW_RELAY_PASS env var for better security."
        );
    }

    let peer_present = relay
        .connect(&room_id, pw_ref)
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

    // Display verification string for MITM detection (opt-in via --verify)
    if args.verify {
        if json {
            output::verify::display_verification_json(session_key.as_bytes());
        } else {
            output::verify::display_verification(session_key.as_bytes(), true);
        }
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
            let safe_reason =
                tallow_protocol::transfer::sanitize::sanitize_display(&reason);
            let msg = format!("Transfer rejected: {}", safe_reason);
            if json {
                println!(
                    "{}",
                    serde_json::json!({"event": "rejected", "reason": safe_reason})
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

    match &source {
        SendSource::Text(data) => {
            let chunk_messages = pipeline
                .chunk_data(data, 0)
                .await
                .map_err(|e| io::Error::other(format!("Failed to chunk text: {}", e)))?;

            for chunk_msg in &chunk_messages {
                // Apply bandwidth throttle if configured
                if throttle_bps > 0 {
                    let chunk_size = if let Message::Chunk { ref data, .. } = chunk_msg {
                        data.len() as u64
                    } else {
                        0
                    };
                    let delay_ms = (chunk_size * 1000) / throttle_bps;
                    if delay_ms > 0 {
                        tokio::time::sleep(std::time::Duration::from_millis(delay_ms)).await;
                    }
                }

                encode_buf.clear();
                codec
                    .encode_msg(chunk_msg, &mut encode_buf)
                    .map_err(|e| io::Error::other(format!("Encode chunk failed: {}", e)))?;
                relay
                    .forward(&encode_buf)
                    .await
                    .map_err(|e| io::Error::other(format!("Send chunk failed: {}", e)))?;

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
        }
        SendSource::Files(_) => {
            for file in &source_files {
                let chunk_messages = pipeline
                    .chunk_file(file, chunk_index)
                    .await
                    .map_err(|e| {
                        io::Error::other(format!("Failed to chunk {}: {}", file.display(), e))
                    })?;

                for chunk_msg in &chunk_messages {
                    // Apply bandwidth throttle if configured
                    if throttle_bps > 0 {
                        let chunk_size = if let Message::Chunk { ref data, .. } = chunk_msg {
                            data.len() as u64
                        } else {
                            0
                        };
                        let delay_ms = (chunk_size * 1000) / throttle_bps;
                        if delay_ms > 0 {
                            tokio::time::sleep(std::time::Duration::from_millis(delay_ms)).await;
                        }
                    }

                    encode_buf.clear();
                    codec
                        .encode_msg(chunk_msg, &mut encode_buf)
                        .map_err(|e| io::Error::other(format!("Encode chunk failed: {}", e)))?;
                    relay
                        .forward(&encode_buf)
                        .await
                        .map_err(|e| io::Error::other(format!("Send chunk failed: {}", e)))?;

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
        }
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
            "Transfer complete: {} in {} chunks",
            output::format_size(total_size),
            total_chunks
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

/// Parse a throttle string (e.g., "10MB", "500KB") into bytes per second
///
/// Returns 0 if no throttle is configured (unlimited).
fn parse_throttle(throttle: &Option<String>) -> io::Result<u64> {
    match throttle {
        None => Ok(0),
        Some(s) => {
            let bs: bytesize::ByteSize = s.parse().map_err(|e| {
                io::Error::other(format!(
                    "Invalid throttle '{}': {}. Examples: '10MB', '500KB', '1GB'",
                    s, e
                ))
            })?;
            Ok(bs.as_u64())
        }
    }
}

/// Public throttle parser for use by sync and watch commands
pub fn parse_throttle_pub(throttle: &Option<String>) -> io::Result<u64> {
    parse_throttle(throttle)
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
