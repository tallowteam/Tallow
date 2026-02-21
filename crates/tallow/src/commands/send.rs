//! Send command implementation

use crate::cli::SendArgs;
use crate::output;
use bytes::BytesMut;
use std::io::{self, IsTerminal, Read};
use std::path::PathBuf;
use tallow_net::transport::reconnect::{self, ReconnectConfig};
use tallow_net::transport::PeerChannel;
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
        let ct = tallow_store::clipboard::detect::detect_content_type(text);
        tracing::debug!("Text content type detected: {}", ct);
        return Ok(SendSource::Text(text.as_bytes().to_vec()));
    }

    // Check for piped stdin (not a terminal) when no files given
    if args.files.is_empty() && !args.ignore_stdin && !std::io::stdin().is_terminal() {
        // Cap stdin reads at 256 MiB to prevent OOM from unbounded input
        const MAX_STDIN_SIZE: usize = 256 * 1024 * 1024;
        let mut buf = Vec::new();
        std::io::stdin()
            .take(MAX_STDIN_SIZE as u64 + 1)
            .read_to_end(&mut buf)?;
        if buf.len() > MAX_STDIN_SIZE {
            return Err(io::Error::new(
                io::ErrorKind::InvalidData,
                format!(
                    "Stdin exceeds maximum size of {} MiB. Use file mode instead.",
                    MAX_STDIN_SIZE / (1024 * 1024)
                ),
            ));
        }
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
    // Load config for hooks
    let config = tallow_store::config::load_config().unwrap_or_default();
    let hook_runner = crate::hooks::HookRunner::from_config(&config.hooks, !args.no_hooks);

    // Build proxy config from CLI flags
    let proxy_config =
        crate::commands::proxy::build_proxy_config(args.tor, &args.proxy, json).await?;

    // Suppress LAN discovery when proxy is active (broadcasts local IP)
    if proxy_config.is_some() && args.discover && !json {
        output::color::warning(
            "LAN discovery disabled: --discover leaks local IP when using a proxy",
        );
    }

    // Log proxy usage
    if let Some(ref proxy) = proxy_config {
        if !json {
            if proxy.tor_mode {
                output::color::info("Routing through Tor...");
            } else {
                output::color::info(&format!("Routing through proxy {}...", proxy.socks5_addr));
            }
        }
    }

    // LAN peer discovery via mDNS (skip when proxy is active)
    if args.discover && proxy_config.is_none() {
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
                        // Sanitize network-sourced strings to prevent ANSI injection
                        let safe_id =
                            tallow_protocol::transfer::sanitize::sanitize_display(&peer.id);
                        let safe_name =
                            tallow_protocol::transfer::sanitize::sanitize_display(&peer.name);
                        println!("  {} - {} ({})", safe_id, safe_name, peer.addr);
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

    // Run pre_send hook
    {
        let hook_files: Vec<String> = match &source {
            SendSource::Files(files) => files.iter().map(|f| f.display().to_string()).collect(),
            SendSource::Text(_) => vec!["<text>".to_string()],
        };
        let hook_env = crate::hooks::HookEnv {
            files: hook_files,
            direction: "send".to_string(),
            ..Default::default()
        };
        hook_runner
            .run_hook(crate::hooks::HookType::PreSend, &hook_env)
            .await?;
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
            output::color::warning("Short custom code -- security depends on code phrase entropy");
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
        output::color::info("Code phrase:");
        output::color::code_phrase(&code_phrase);
        println!();
        output::color::section("On the receiving end, run:");
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
    // Note: session key is set to a placeholder here; the real key is derived
    // from the KEM handshake after peer connection. prepare() does not use
    // the key — only chunk_file/chunk_data do (for AES-256-GCM encryption).
    let transfer_id: [u8; 16] = rand::random();
    let placeholder_key = [0u8; 32];

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

    let mut pipeline = tallow_protocol::transfer::SendPipeline::new(transfer_id, placeholder_key)
        .with_compression(compression)
        .with_exclusion(exclusion);

    // Prepare transfer based on source — with content type hint
    let (offer_messages, source_files) = match &source {
        SendSource::Text(data) => {
            // Show content type hint for text transfers
            if !json {
                if let Ok(text) = std::str::from_utf8(data) {
                    let ct = tallow_store::clipboard::detect::detect_content_type(text);
                    match ct {
                        tallow_store::clipboard::ContentType::Url => {
                            output::color::info(&format!(
                                "Sending URL: {}",
                                tallow_store::clipboard::preview::generate_preview(text, 80)
                            ));
                        }
                        tallow_store::clipboard::ContentType::Code => {
                            output::color::info("Sending code snippet");
                        }
                        tallow_store::clipboard::ContentType::Html => {
                            output::color::info("Sending HTML content");
                        }
                        _ => {}
                    }
                }
            }

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

    let manifest = pipeline.manifest().clone();
    let total_size = manifest.total_size;
    let total_chunks = manifest.total_chunks;
    let file_count = manifest.files.len();

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
        output::color::transfer_summary(file_count, total_size);
    }

    // --dry-run: display file summary and exit without connecting
    if args.dry_run {
        let compression_name = manifest.compression.as_deref().unwrap_or("none");

        if json {
            let file_list: Vec<serde_json::Value> = manifest
                .files
                .iter()
                .map(|f| {
                    serde_json::json!({
                        "path": f.path.display().to_string(),
                        "size": f.size,
                        "chunks": f.chunk_count,
                    })
                })
                .collect();
            println!(
                "{}",
                serde_json::json!({
                    "event": "dry_run",
                    "total_files": file_count,
                    "total_bytes": total_size,
                    "total_chunks": total_chunks,
                    "compression": compression_name,
                    "chunk_size": manifest.chunk_size,
                    "files": file_list,
                })
            );
        } else {
            output::color::section("Dry run -- no connection will be made");
            println!();
            output::color::section("Files:");
            for entry in &manifest.files {
                output::color::file_entry(&entry.path.display().to_string(), entry.size);
            }
            println!();
            output::color::info(&format!("Total chunks: {}", total_chunks));
            output::color::info(&format!(
                "Chunk size: {}",
                output::format_size(manifest.chunk_size as u64)
            ));
            output::color::info(&format!("Compression: {}", compression_name));
        }
        return Ok(());
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

    // Hash relay password for authentication (if provided)
    let password_hash: Option<[u8; 32]> = args
        .relay_pass
        .as_ref()
        .map(|pass| blake3::hash(pass.as_bytes()).into());
    let pw_ref = password_hash.as_ref();

    if args.relay_pass.is_some() && std::env::var("TALLOW_RELAY_PASS").is_err() {
        tracing::warn!(
            "Relay password passed via CLI argument -- visible in process list. \
             Use TALLOW_RELAY_PASS env var for better security."
        );
    }

    // Establish connection: proxy-aware relay or direct LAN with fallback
    let fingerprint_prefix = identity.fingerprint_prefix(8);
    let (mut channel, mut is_direct) = if let Some(ref proxy) = proxy_config {
        // Proxy active: resolve via DoH/hostname, skip LAN discovery entirely
        let resolved = tallow_net::relay::resolve_relay_proxy(&args.relay, proxy_config.as_ref())
            .await
            .map_err(|e| io::Error::other(format!("Relay resolution failed: {}", e)))?;

        let mut relay = match resolved {
            tallow_net::relay::ResolvedRelay::Addr(addr) => {
                let mut client = tallow_net::relay::RelayClient::new(addr);
                client.set_proxy(proxy.clone());
                client
            }
            tallow_net::relay::ResolvedRelay::Hostname { ref host, port } => {
                tallow_net::relay::RelayClient::new_with_proxy(host, port, proxy.clone())
            }
        };

        relay
            .connect(&room_id, pw_ref)
            .await
            .map_err(|e| io::Error::other(format!("Connection failed: {}", e)))?;
        if !relay.peer_present() {
            relay
                .wait_for_peer()
                .await
                .map_err(|e| io::Error::other(format!("Waiting for peer failed: {}", e)))?;
        }

        (
            tallow_net::transport::ConnectionResult::Relay(Box::new(relay)),
            false,
        )
    } else {
        // No proxy: use direct LAN / relay fallback strategy
        let relay_addr: std::net::SocketAddr = resolve_relay(&args.relay)?;
        tallow_net::transport::establish_sender_connection(
            &room_id,
            &fingerprint_prefix,
            relay_addr,
            pw_ref,
            args.local,
        )
        .await
        .map_err(|e| io::Error::other(format!("Connection failed: {}", e)))?
    };

    if is_direct {
        if json {
            println!("{}", serde_json::json!({"event": "direct_connection"}));
        } else {
            output::color::direct_connection();
        }
    } else if json {
        println!(
            "{}",
            serde_json::json!({"event": "relay_connection", "relay": args.relay})
        );
    } else if args.local {
        output::color::fallback_to_relay(&args.relay);
    } else {
        output::color::info(&format!("Connected to relay {}", args.relay));
    }

    if json {
        println!("{}", serde_json::json!({ "event": "peer_connected" }));
    } else {
        output::color::success("Peer connected!");
    }

    // Create codec and buffers
    let mut codec = TallowCodec::new();
    let mut encode_buf = BytesMut::new();
    let mut recv_buf = vec![0u8; RECV_BUF_SIZE];

    // Build reconnect config from CLI args
    let reconnect_config = ReconnectConfig {
        max_retries: args.max_retries,
        ..Default::default()
    };

    // --- KEM Handshake ---
    let mut handshake = tallow_protocol::kex::SenderHandshake::new(&code_phrase, &room_id);

    // Step 1: Send HandshakeInit
    let init_msg = handshake
        .init()
        .map_err(|e| io::Error::other(format!("Handshake init failed: {}", e)))?;
    encode_buf.clear();
    codec
        .encode_msg(&init_msg, &mut encode_buf)
        .map_err(|e| io::Error::other(format!("Encode HandshakeInit: {}", e)))?;
    channel
        .send_message(&encode_buf)
        .await
        .map_err(|e| io::Error::other(format!("Send HandshakeInit: {}", e)))?;

    // Step 2: Receive HandshakeResponse
    let n = tokio::time::timeout(
        std::time::Duration::from_secs(30),
        channel.receive_message(&mut recv_buf),
    )
    .await
    .map_err(|_| io::Error::other("Handshake timeout waiting for response"))?
    .map_err(|e| io::Error::other(format!("Receive HandshakeResponse: {}", e)))?;

    let mut decode_buf = BytesMut::from(&recv_buf[..n]);
    let resp_msg = codec
        .decode_msg(&mut decode_buf)
        .map_err(|e| io::Error::other(format!("Decode HandshakeResponse: {}", e)))?;

    let session_key: tallow_protocol::kex::SessionKey;

    match resp_msg {
        Some(Message::HandshakeResponse {
            selected_kem,
            cpace_public,
            kem_public_key,
            nonce,
        }) => {
            // Step 3: Process response -> HandshakeKem + session key
            let (kem_msg, session_key_result) = handshake
                .process_response(selected_kem, &cpace_public, &kem_public_key, &nonce)
                .map_err(|e| {
                    io::Error::other(format!("Handshake response processing failed: {}", e))
                })?;

            encode_buf.clear();
            codec
                .encode_msg(&kem_msg, &mut encode_buf)
                .map_err(|e| io::Error::other(format!("Encode HandshakeKem: {}", e)))?;
            channel
                .send_message(&encode_buf)
                .await
                .map_err(|e| io::Error::other(format!("Send HandshakeKem: {}", e)))?;

            // Step 4: Receive HandshakeComplete
            let n = tokio::time::timeout(
                std::time::Duration::from_secs(30),
                channel.receive_message(&mut recv_buf),
            )
            .await
            .map_err(|_| io::Error::other("Handshake timeout waiting for confirmation"))?
            .map_err(|e| io::Error::other(format!("Receive HandshakeComplete: {}", e)))?;

            let mut decode_buf = BytesMut::from(&recv_buf[..n]);
            let complete_msg = codec
                .decode_msg(&mut decode_buf)
                .map_err(|e| io::Error::other(format!("Decode HandshakeComplete: {}", e)))?;

            match complete_msg {
                Some(Message::HandshakeComplete { confirmation }) => {
                    handshake
                        .verify_receiver_confirmation(&confirmation)
                        .map_err(|e| io::Error::other(format!("Key confirmation failed: {}", e)))?;
                }
                other => {
                    channel.close().await;
                    return Err(io::Error::other(format!(
                        "Expected HandshakeComplete, got: {:?}",
                        other
                    )));
                }
            }

            session_key = session_key_result;
        }
        Some(Message::FileOffer { .. }) => {
            channel.close().await;
            return Err(io::Error::other(
                "Protocol version mismatch: peer uses old key exchange. \
                 Both sides must upgrade to tallow v2.0+",
            ));
        }
        other => {
            channel.close().await;
            return Err(io::Error::other(format!(
                "Expected HandshakeResponse, got: {:?}",
                other
            )));
        }
    }

    if !json {
        output::color::success("Secure session established (KEM handshake complete)");
    }
    // --- End handshake ---

    // Set the real session key derived from KEM handshake
    pipeline.set_session_key(*session_key.as_bytes());

    // Display verification string for MITM detection (opt-in via --verify)
    if args.verify {
        if json {
            output::verify::display_verification_json(session_key.as_bytes());
        } else {
            output::verify::display_verification(session_key.as_bytes(), true);
        }
    }

    // --- P2P Direct Connection Upgrade ---
    // Attempt to upgrade from relay to direct P2P QUIC after handshake.
    // Skip when: proxy active, --no-p2p set, already direct (LAN)
    if !is_direct && proxy_config.is_none() && !args.no_p2p {
        if !json {
            output::color::info("Attempting P2P direct connection...");
        }

        // Sender = initiator (QUIC client role)
        // Pass the combined suppression flag as defense-in-depth guard.
        let suppress_p2p = proxy_config.is_some() || args.no_p2p;
        match tallow_net::transport::negotiate_p2p(&mut channel, true, suppress_p2p).await {
            tallow_net::transport::NegotiationResult::Direct(direct_conn) => {
                if json {
                    println!(
                        "{}",
                        serde_json::json!({
                            "event": "p2p_upgrade",
                            "remote_addr": direct_conn.remote_addr().to_string(),
                        })
                    );
                } else {
                    output::color::success(&format!(
                        "Upgraded to direct P2P connection ({})",
                        direct_conn.remote_addr()
                    ));
                }
                channel = tallow_net::transport::ConnectionResult::Direct(direct_conn);
                is_direct = true;
                tracing::info!("Transport upgraded: is_direct={}", is_direct);
            }
            tallow_net::transport::NegotiationResult::FallbackToRelay(reason) => {
                if json {
                    println!(
                        "{}",
                        serde_json::json!({
                            "event": "p2p_fallback",
                            "reason": reason,
                        })
                    );
                } else {
                    output::color::info(&format!(
                        "P2P direct connection unavailable ({}), continuing via relay",
                        reason
                    ));
                }
            }
        }
    } else if proxy_config.is_some() || args.no_p2p {
        tracing::debug!(
            "P2P disabled: proxy={}, no_p2p={}",
            proxy_config.is_some(),
            args.no_p2p
        );
    }
    // --- End P2P Upgrade ---

    // Send FileOffer
    for msg in &offer_messages {
        encode_buf.clear();
        codec
            .encode_msg(msg, &mut encode_buf)
            .map_err(|e| io::Error::other(format!("Encode FileOffer failed: {}", e)))?;
        channel
            .send_message(&encode_buf)
            .await
            .map_err(|e| io::Error::other(format!("Send FileOffer failed: {}", e)))?;
    }

    // Wait for FileAccept (possibly preceded by FileSelection for per-file mode)
    let mut selected_file_indices: Option<Vec<u32>> = None;

    let n = channel
        .receive_message(&mut recv_buf)
        .await
        .map_err(|e| io::Error::other(format!("Receive response failed: {}", e)))?;

    let mut decode_buf = BytesMut::from(&recv_buf[..n]);
    let response = codec
        .decode_msg(&mut decode_buf)
        .map_err(|e| io::Error::other(format!("Decode response failed: {}", e)))?;

    match response {
        Some(Message::FileSelection {
            selected_indices, ..
        }) => {
            // Validate indices are within range and non-empty
            if selected_indices.is_empty() {
                return Err(io::Error::other(
                    "Receiver sent empty file selection — treating as rejection",
                ));
            }
            if selected_indices.iter().any(|&i| i >= file_count as u32) {
                return Err(io::Error::other(format!(
                    "Receiver sent invalid file selection index (max: {})",
                    file_count - 1
                )));
            }
            // Cap selection size to prevent memory abuse
            if selected_indices.len() > file_count {
                return Err(io::Error::other(
                    "Receiver sent more selections than files in manifest",
                ));
            }

            // Receiver sent per-file selection -- store indices, then wait for FileAccept
            tracing::info!(
                "Receiver selected {} of {} file(s)",
                selected_indices.len(),
                file_count
            );
            if !json {
                output::color::info(&format!(
                    "Receiver selected {}/{} file(s)",
                    selected_indices.len(),
                    file_count
                ));
            } else {
                println!(
                    "{}",
                    serde_json::json!({
                        "event": "file_selection",
                        "selected_count": selected_indices.len(),
                        "total_files": file_count,
                        "selected_indices": selected_indices,
                    })
                );
            }
            selected_file_indices = Some(selected_indices);

            // Now wait for the FileAccept that follows
            let n = channel
                .receive_message(&mut recv_buf)
                .await
                .map_err(|e| io::Error::other(format!("Receive FileAccept failed: {}", e)))?;

            let mut decode_buf = BytesMut::from(&recv_buf[..n]);
            let accept_response = codec
                .decode_msg(&mut decode_buf)
                .map_err(|e| io::Error::other(format!("Decode FileAccept failed: {}", e)))?;

            match accept_response {
                Some(Message::FileAccept { .. }) => {
                    tracing::info!("Receiver accepted the partial transfer");
                }
                Some(Message::FileReject { reason, .. }) => {
                    let safe_reason =
                        tallow_protocol::transfer::sanitize::sanitize_display(&reason);
                    let msg = format!("Transfer rejected: {}", safe_reason);
                    if !json {
                        output::color::error(&msg);
                    }
                    channel.close().await;
                    return Err(io::Error::other(msg));
                }
                other => {
                    let msg = format!("Expected FileAccept after FileSelection, got: {:?}", other);
                    channel.close().await;
                    return Err(io::Error::other(msg));
                }
            }
        }
        Some(Message::FileAccept { .. }) => {
            tracing::info!("Receiver accepted the transfer");
        }
        Some(Message::FileReject { reason, .. }) => {
            let safe_reason = tallow_protocol::transfer::sanitize::sanitize_display(&reason);
            let msg = format!("Transfer rejected: {}", safe_reason);
            if json {
                println!(
                    "{}",
                    serde_json::json!({"event": "rejected", "reason": safe_reason})
                );
            } else {
                output::color::error(&msg);
            }
            if args.notify && !json {
                output::notifications::notify_transfer_failed(&msg);
            }
            channel.close().await;
            return Err(io::Error::other(msg));
        }
        other => {
            let msg = format!("Unexpected response: {:?}", other);
            channel.close().await;
            return Err(io::Error::other(msg));
        }
    }

    // Filter source files based on per-file selection (if any)
    let effective_source_files: Vec<PathBuf> = if let Some(ref indices) = selected_file_indices {
        // Only send the files at the selected indices
        let selected_set: std::collections::HashSet<u32> = indices.iter().copied().collect();
        source_files
            .iter()
            .enumerate()
            .filter(|(i, _)| selected_set.contains(&(*i as u32)))
            .map(|(_, f)| f.clone())
            .collect()
    } else {
        source_files.clone()
    };

    // Recalculate totals for progress if selection reduced the file set
    let effective_total_size: u64 = if selected_file_indices.is_some() {
        let selected_set: std::collections::HashSet<u32> = selected_file_indices
            .as_ref()
            .map(|v| v.iter().copied().collect())
            .unwrap_or_default();
        manifest
            .files
            .iter()
            .enumerate()
            .filter(|(i, _)| selected_set.contains(&(*i as u32)))
            .map(|(_, f)| f.size)
            .sum()
    } else {
        total_size
    };

    let effective_total_chunks: u64 = if selected_file_indices.is_some() {
        let selected_set: std::collections::HashSet<u32> = selected_file_indices
            .as_ref()
            .map(|v| v.iter().copied().collect())
            .unwrap_or_default();
        manifest
            .files
            .iter()
            .enumerate()
            .filter(|(i, _)| selected_set.contains(&(*i as u32)))
            .map(|(_, f)| f.chunk_count)
            .sum()
    } else {
        total_chunks
    };

    // Create progress bar and send chunks with sliding window
    let transfer_start = std::time::Instant::now();
    let progress = output::TransferProgressBar::new(effective_total_size);
    let mut total_sent: u64 = 0;
    let mut chunk_index: u64 = 0;

    /// Sliding window size: send up to N chunks before draining acks.
    /// At 256 KB chunks and ~80ms RTT, 64-chunk windows yield ~200 MB/s ceiling.
    const WINDOW_SIZE: usize = 64;
    const _: () = assert!(WINDOW_SIZE > 0, "WINDOW_SIZE must be > 0");

    // Collect BLAKE3 hashes of encrypted chunks for Merkle tree
    let mut chunk_hashes: Vec<[u8; 32]> = Vec::new();

    /// Send a batch of chunks with sliding window and drain their acks.
    ///
    /// Uses auto-reconnect with exponential backoff on transient network failures.
    #[allow(clippy::too_many_arguments)]
    async fn send_batch_and_drain(
        batch: &[Message],
        channel: &mut tallow_net::transport::ConnectionResult,
        codec: &mut TallowCodec,
        encode_buf: &mut BytesMut,
        recv_buf: &mut [u8],
        progress: &output::TransferProgressBar,
        total_sent: &mut u64,
        total_size: u64,
        throttle_bps: u64,
        chunk_hashes: &mut Vec<[u8; 32]>,
        retry_config: &ReconnectConfig,
    ) -> io::Result<()> {
        // Phase 1: Send up to WINDOW_SIZE chunks
        for chunk_msg in batch {
            // Apply bandwidth throttle if configured
            if throttle_bps > 0 {
                if let Message::Chunk { ref data, .. } = chunk_msg {
                    let delay_ms = (data.len() as u64 * 1000) / throttle_bps;
                    if delay_ms > 0 {
                        tokio::time::sleep(std::time::Duration::from_millis(delay_ms)).await;
                    }
                }
            }

            // Record chunk hash for Merkle tree
            if let Message::Chunk { ref data, .. } = chunk_msg {
                chunk_hashes.push(blake3::hash(data).into());
            }

            encode_buf.clear();
            codec
                .encode_msg(chunk_msg, encode_buf)
                .map_err(|e| io::Error::other(format!("Encode chunk failed: {}", e)))?;
            reconnect::send_with_retry(channel, encode_buf, retry_config)
                .await
                .map_err(|e| io::Error::other(format!("Send chunk failed: {}", e)))?;
        }

        // Phase 2: Drain all acks
        for _ in 0..batch.len() {
            let n = reconnect::receive_with_retry(channel, recv_buf, retry_config)
                .await
                .map_err(|e| io::Error::other(format!("Receive ack failed: {}", e)))?;

            let mut ack_buf = BytesMut::from(&recv_buf[..n]);
            let ack = codec
                .decode_msg(&mut ack_buf)
                .map_err(|e| io::Error::other(format!("Decode ack failed: {}", e)))?;

            match ack {
                Some(Message::Ack { .. }) => {
                    // Count acked bytes (approximate from chunk data sizes)
                }
                Some(Message::TransferError { error, .. }) => {
                    progress.finish();
                    let safe_error = tallow_protocol::transfer::sanitize::sanitize_display(&error);
                    return Err(io::Error::other(format!(
                        "Transfer error from receiver: {}",
                        safe_error
                    )));
                }
                other => {
                    tracing::warn!("Unexpected message during transfer: {:?}", other);
                }
            }
        }

        // Update progress based on total batch data size
        let batch_bytes: u64 = batch
            .iter()
            .map(|m| {
                if let Message::Chunk { ref data, .. } = m {
                    data.len() as u64
                } else {
                    0
                }
            })
            .sum();
        *total_sent += batch_bytes;
        progress.update((*total_sent).min(total_size));

        Ok(())
    }

    match &source {
        SendSource::Text(data) => {
            // Text/stdin: small data, use in-memory chunking
            let chunk_messages = pipeline
                .chunk_data(data, 0)
                .await
                .map_err(|e| io::Error::other(format!("Failed to chunk text: {}", e)))?;

            // Send in sliding window batches
            for batch in chunk_messages.chunks(WINDOW_SIZE) {
                send_batch_and_drain(
                    batch,
                    &mut channel,
                    &mut codec,
                    &mut encode_buf,
                    &mut recv_buf,
                    &progress,
                    &mut total_sent,
                    effective_total_size,
                    throttle_bps,
                    &mut chunk_hashes,
                    &reconnect_config,
                )
                .await?;
            }
        }
        SendSource::Files(_) => {
            // File mode: streaming I/O with per-chunk compress+encrypt
            for file in &effective_source_files {
                let mut reader = pipeline.open_file_reader(file).await.map_err(|e| {
                    io::Error::other(format!("Failed to open {}: {}", file.display(), e))
                })?;

                // Find this file's chunk count from the manifest
                let file_name = file
                    .file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_default();
                let _file_chunk_count = pipeline
                    .manifest()
                    .files
                    .iter()
                    .find(|f| f.path.to_string_lossy() == file_name)
                    .map(|f| f.chunk_count)
                    .unwrap_or(1);
                let mut batch: Vec<Message> = Vec::with_capacity(WINDOW_SIZE);

                while let Some(raw_chunk) = reader.next_chunk().await.map_err(|e| {
                    io::Error::other(format!("Read chunk from {}: {}", file.display(), e))
                })? {
                    let is_last_chunk_overall = chunk_index + 1 == effective_total_chunks;

                    let msg = pipeline
                        .encrypt_chunk(
                            &raw_chunk,
                            chunk_index,
                            effective_total_chunks,
                            is_last_chunk_overall,
                        )
                        .map_err(|e| io::Error::other(format!("Encrypt chunk failed: {}", e)))?;

                    batch.push(msg);
                    chunk_index += 1;

                    // Send batch when window is full
                    if batch.len() >= WINDOW_SIZE {
                        send_batch_and_drain(
                            &batch,
                            &mut channel,
                            &mut codec,
                            &mut encode_buf,
                            &mut recv_buf,
                            &progress,
                            &mut total_sent,
                            effective_total_size,
                            throttle_bps,
                            &mut chunk_hashes,
                            &reconnect_config,
                        )
                        .await?;
                        batch.clear();
                    }
                }

                // Send remaining chunks in the partial batch
                if !batch.is_empty() {
                    send_batch_and_drain(
                        &batch,
                        &mut channel,
                        &mut codec,
                        &mut encode_buf,
                        &mut recv_buf,
                        &progress,
                        &mut total_sent,
                        effective_total_size,
                        throttle_bps,
                        &mut chunk_hashes,
                        &reconnect_config,
                    )
                    .await?;
                }
            }
        }
    }

    progress.finish();

    // Build Merkle tree from chunk hashes for integrity verification
    let merkle_root = if !chunk_hashes.is_empty() {
        let tree = tallow_crypto::hash::MerkleTree::build(chunk_hashes);
        Some(tree.root())
    } else {
        None
    };

    // Send TransferComplete with Merkle root
    let complete_msg = Message::TransferComplete {
        transfer_id,
        hash: *pipeline
            .manifest()
            .manifest_hash
            .as_ref()
            .unwrap_or(&[0u8; 32]),
        merkle_root,
    };
    encode_buf.clear();
    codec
        .encode_msg(&complete_msg, &mut encode_buf)
        .map_err(|e| io::Error::other(format!("Encode complete failed: {}", e)))?;
    channel
        .send_message(&encode_buf)
        .await
        .map_err(|e| io::Error::other(format!("Send complete failed: {}", e)))?;

    // Close connection
    channel.close().await;

    let effective_file_count = effective_source_files.len();

    if json {
        println!(
            "{}",
            serde_json::json!({
                "event": "transfer_complete",
                "total_bytes": effective_total_size,
                "total_chunks": effective_total_chunks,
                "files_sent": effective_file_count,
            })
        );
    } else {
        output::color::transfer_complete(effective_total_size, transfer_start.elapsed());
    }

    // Desktop notification (opt-in via --notify, suppressed in JSON mode)
    if args.notify && !json {
        output::notifications::notify_transfer_complete(
            effective_file_count,
            effective_total_size,
            transfer_start.elapsed().as_secs_f64(),
        );
    }

    // Log to transfer history
    if let Ok(mut history) = tallow_store::history::TransferLog::open() {
        let _ = history.append(tallow_store::history::TransferEntry {
            id: hex::encode(transfer_id),
            peer_id: "unknown".to_string(),
            direction: tallow_store::history::TransferDirection::Sent,
            file_count: effective_file_count,
            total_bytes: effective_total_size,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs(),
            status: tallow_store::history::TransferStatus::Completed,
            filenames: effective_source_files
                .iter()
                .map(|f| f.display().to_string())
                .collect(),
        });
    }

    // Run post_send hook
    {
        let hook_env = crate::hooks::HookEnv {
            files: effective_source_files
                .iter()
                .map(|f| f.display().to_string())
                .collect(),
            total_size: effective_total_size,
            direction: "send".to_string(),
            ..Default::default()
        };
        hook_runner
            .run_hook(crate::hooks::HookType::PostSend, &hook_env)
            .await?;
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
