//! Watch command -- monitor directory and auto-send changes
//!
//! Monitors a directory for filesystem changes using the `notify` crate,
//! debounces events, then sends changed files to a connected peer via
//! the relay. Runs indefinitely until stopped with Ctrl+C.

use crate::cli::WatchArgs;
use crate::output;
use bytes::BytesMut;
use std::io;
use tallow_protocol::wire::{codec::TallowCodec, Message};

/// Execute watch command
pub async fn execute(args: WatchArgs, json: bool) -> io::Result<()> {
    // Build proxy config from CLI flags
    let proxy_config = crate::commands::proxy::build_proxy_config(
        args.tor, &args.proxy, json,
    ).await?;

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

    // Validate directory exists
    if !args.dir.exists() || !args.dir.is_dir() {
        return Err(io::Error::new(
            io::ErrorKind::NotFound,
            format!("Watch directory not found: {}", args.dir.display()),
        ));
    }

    let debounce = std::time::Duration::from_secs(args.debounce);

    // Start filesystem watcher
    let watch_config = tallow_protocol::transfer::WatchConfig {
        path: args.dir.clone(),
        debounce_duration: debounce,
        recursive: true,
    };

    let (mut event_rx, watch_handle) =
        tallow_protocol::transfer::watch::start_watcher(watch_config)
            .map_err(|e| io::Error::other(format!("Failed to start watcher: {}", e)))?;

    // Generate code phrase
    let code_phrase = args
        .code
        .clone()
        .unwrap_or_else(|| tallow_protocol::room::code::generate_code_phrase(4));

    let room_id = tallow_protocol::room::code::derive_room_id(&code_phrase);

    if json {
        println!(
            "{}",
            serde_json::json!({
                "event": "watch_started",
                "directory": args.dir.display().to_string(),
                "code": code_phrase,
                "debounce_secs": args.debounce,
            })
        );
    } else {
        output::color::info(&format!("Watching: {}", args.dir.display()));
        output::color::info(&format!(
            "Code phrase: {}",
            output::color::styled(&code_phrase, "bold")
        ));
        println!("On the receiving end, run:");
        println!("  tallow receive {}", code_phrase);
        println!();
        output::color::info("Waiting for changes... (Ctrl+C to stop)");
    }

    // Resolve relay address (proxy-aware: avoids DNS leaks)
    let resolved = tallow_net::relay::resolve_relay_proxy(
        &args.relay, proxy_config.as_ref(),
    ).await.map_err(|e| io::Error::other(format!("Relay resolution failed: {}", e)))?;

    let mut relay = match resolved {
        tallow_net::relay::ResolvedRelay::Addr(addr) => {
            if let Some(ref proxy) = proxy_config {
                let mut client = tallow_net::relay::RelayClient::new(addr);
                client.set_proxy(proxy.clone());
                client
            } else {
                tallow_net::relay::RelayClient::new(addr)
            }
        }
        tallow_net::relay::ResolvedRelay::Hostname { ref host, port } => {
            let proxy = proxy_config.as_ref()
                .expect("Hostname resolution only returned for proxy mode");
            tallow_net::relay::RelayClient::new_with_proxy(host, port, proxy.clone())
        }
    };

    if !json {
        output::color::info(&format!("Connecting to relay {}...", args.relay));
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

    let peer_present = relay
        .connect(&room_id, pw_ref)
        .await
        .map_err(|e| io::Error::other(format!("Relay connection failed: {}", e)))?;

    if !peer_present {
        if !json {
            output::color::info("Waiting for receiver...");
        }
        relay
            .wait_for_peer()
            .await
            .map_err(|e| io::Error::other(format!("Wait for peer failed: {}", e)))?;
    }

    if !json {
        output::color::success("Peer connected!");
    }

    // --- KEM Handshake ---
    let mut codec = TallowCodec::new();
    let mut encode_buf = BytesMut::new();
    let mut recv_buf = vec![0u8; 256 * 1024];

    let mut handshake = tallow_protocol::kex::SenderHandshake::new(&code_phrase, &room_id);

    // Step 1: Send HandshakeInit
    let init_msg = handshake
        .init()
        .map_err(|e| io::Error::other(format!("Handshake init failed: {}", e)))?;
    encode_buf.clear();
    codec
        .encode_msg(&init_msg, &mut encode_buf)
        .map_err(|e| io::Error::other(format!("Encode HandshakeInit: {}", e)))?;
    relay
        .forward(&encode_buf)
        .await
        .map_err(|e| io::Error::other(format!("Send HandshakeInit: {}", e)))?;

    // Step 2: Receive HandshakeResponse
    let n = tokio::time::timeout(
        std::time::Duration::from_secs(30),
        relay.receive(&mut recv_buf),
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
            let (kem_msg, session_key_result) = handshake
                .process_response(selected_kem, &cpace_public, &kem_public_key, &nonce)
                .map_err(|e| {
                    io::Error::other(format!("Handshake response processing failed: {}", e))
                })?;

            encode_buf.clear();
            codec
                .encode_msg(&kem_msg, &mut encode_buf)
                .map_err(|e| io::Error::other(format!("Encode HandshakeKem: {}", e)))?;
            relay
                .forward(&encode_buf)
                .await
                .map_err(|e| io::Error::other(format!("Send HandshakeKem: {}", e)))?;

            // Step 4: Receive HandshakeComplete
            let n = tokio::time::timeout(
                std::time::Duration::from_secs(30),
                relay.receive(&mut recv_buf),
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
                        .map_err(|e| {
                            io::Error::other(format!("Key confirmation failed: {}", e))
                        })?;
                }
                other => {
                    relay.close().await;
                    return Err(io::Error::other(format!(
                        "Expected HandshakeComplete, got: {:?}",
                        other
                    )));
                }
            }

            session_key = session_key_result;
        }
        Some(Message::FileOffer { .. }) => {
            relay.close().await;
            return Err(io::Error::other(
                "Protocol version mismatch: peer uses old key exchange. \
                 Both sides must upgrade to tallow v2.0+",
            ));
        }
        other => {
            relay.close().await;
            return Err(io::Error::other(format!(
                "Expected HandshakeResponse, got: {:?}",
                other
            )));
        }
    }

    if !json {
        output::color::success("Secure session established. Watching for changes...");
    }
    // --- End handshake ---

    // Build exclusion config (used for filtering in future iterations)
    let _exclusion = tallow_protocol::transfer::ExclusionConfig::from_exclude_str(
        args.exclude.as_deref(),
        args.git,
    );

    let throttle_bps = crate::commands::send::parse_throttle_pub(&args.throttle)?;

    // Event loop -- process filesystem changes
    while let Some(event) = event_rx.recv().await {
        let files_to_send: Vec<_> = event.changed_files;

        if files_to_send.is_empty() {
            continue;
        }

        if json {
            let file_names: Vec<String> = files_to_send
                .iter()
                .map(|f| f.display().to_string())
                .collect();
            println!(
                "{}",
                serde_json::json!({
                    "event": "watch_detected",
                    "changed_files": file_names,
                })
            );
        } else {
            output::color::info(&format!(
                "Detected {} changed file(s), sending...",
                files_to_send.len()
            ));
        }

        // Build and send a mini transfer for this batch
        // Uses the session key derived from the KEM handshake at connection time
        let transfer_id: [u8; 16] = rand::random();
        let mut pipeline =
            tallow_protocol::transfer::SendPipeline::new(transfer_id, *session_key.as_bytes());

        let offer_messages = match pipeline.prepare(&files_to_send).await {
            Ok(msgs) => msgs,
            Err(e) => {
                tracing::warn!("Failed to prepare watch batch: {}", e);
                continue;
            }
        };

        let batch_size = pipeline.manifest().total_size;

        // Send offer
        for msg in &offer_messages {
            encode_buf.clear();
            if let Err(e) = codec.encode_msg(msg, &mut encode_buf) {
                tracing::warn!("Encode failed: {}", e);
                continue;
            }
            if let Err(e) = relay.forward(&encode_buf).await {
                tracing::warn!("Send failed: {}", e);
                continue;
            }
        }

        // Wait for accept
        let n = match relay.receive(&mut recv_buf).await {
            Ok(n) => n,
            Err(e) => {
                tracing::warn!("Receive failed: {}", e);
                continue;
            }
        };

        let mut decode_buf = BytesMut::from(&recv_buf[..n]);
        let response = codec.decode_msg(&mut decode_buf);

        match response {
            Ok(Some(Message::FileAccept { .. })) => {
                // Send chunks
                let mut chunk_index: u64 = 0;
                for file in &files_to_send {
                    let chunk_messages = match pipeline.chunk_file(file, chunk_index).await {
                        Ok(msgs) => msgs,
                        Err(e) => {
                            tracing::warn!("Chunk failed for {}: {}", file.display(), e);
                            continue;
                        }
                    };

                    for chunk_msg in &chunk_messages {
                        if throttle_bps > 0 {
                            if let Message::Chunk { ref data, .. } = chunk_msg {
                                let delay_ms = (data.len() as u64 * 1000) / throttle_bps;
                                if delay_ms > 0 {
                                    tokio::time::sleep(std::time::Duration::from_millis(delay_ms))
                                        .await;
                                }
                            }
                        }

                        encode_buf.clear();
                        let _ = codec.encode_msg(chunk_msg, &mut encode_buf);
                        let _ = relay.forward(&encode_buf).await;

                        // Read ack
                        if let Ok(n) = relay.receive(&mut recv_buf).await {
                            let mut ack_buf = BytesMut::from(&recv_buf[..n]);
                            let _ = codec.decode_msg(&mut ack_buf);
                        }
                    }
                    chunk_index += chunk_messages.len() as u64;
                }

                // Send complete
                let complete_msg = Message::TransferComplete {
                    transfer_id,
                    hash: *pipeline
                        .manifest()
                        .manifest_hash
                        .as_ref()
                        .unwrap_or(&[0u8; 32]),
                };
                encode_buf.clear();
                let _ = codec.encode_msg(&complete_msg, &mut encode_buf);
                let _ = relay.forward(&encode_buf).await;

                if json {
                    println!(
                        "{}",
                        serde_json::json!({
                            "event": "watch_sent",
                            "files": files_to_send.len(),
                            "bytes": batch_size,
                        })
                    );
                } else {
                    output::color::success(&format!(
                        "Sent {} file(s) ({})",
                        files_to_send.len(),
                        output::format_size(batch_size),
                    ));
                }
            }
            Ok(Some(Message::FileReject { reason, .. })) => {
                let safe_reason = tallow_protocol::transfer::sanitize::sanitize_display(&reason);
                tracing::warn!("Watch batch rejected: {}", safe_reason);
            }
            _ => {
                tracing::warn!("Unexpected response during watch");
            }
        }
    }

    watch_handle.stop();
    relay.close().await;

    if !json {
        output::color::info("Watch stopped.");
    }

    Ok(())
}
