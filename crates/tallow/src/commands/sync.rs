//! Sync command -- one-way directory synchronization
//!
//! Scans a local directory, connects to a relay, exchanges manifests
//! with the remote peer, computes a diff, and transfers only the
//! new and changed files. Optionally deletes remote files that no
//! longer exist locally.

use crate::cli::SyncArgs;
use crate::output;
use bytes::BytesMut;
use std::io;
use std::path::PathBuf;
use tallow_protocol::wire::{codec::TallowCodec, Message};

#[allow(clippy::too_many_lines)]
/// Execute sync command
pub async fn execute(args: SyncArgs, json: bool) -> io::Result<()> {
    // Build proxy config from CLI flags
    let proxy_config =
        crate::commands::proxy::build_proxy_config(args.tor, &args.proxy, json).await?;

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
            format!("Sync directory not found: {}", args.dir.display()),
        ));
    }

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
                "event": "sync_started",
                "directory": args.dir.display().to_string(),
                "code": code_phrase,
                "delete": args.delete,
            })
        );
    } else {
        output::color::info(&format!("Syncing: {}", args.dir.display()));
        output::color::info("Code phrase:");
        output::color::code_phrase(&code_phrase);
        output::color::section("On the receiving end, run:");
        println!("  tallow receive {}", code_phrase);
        println!();
    }

    // Build exclusion config
    let exclusion = tallow_protocol::transfer::ExclusionConfig::from_exclude_str(
        args.exclude.as_deref(),
        args.git,
    );

    // Scan local directory to build manifest
    // Note: session key is set to a placeholder here; the real key is derived
    // from the KEM handshake after peer connection. prepare() does not use
    // the key — only chunk_file/chunk_data do (for AES-256-GCM encryption).
    let transfer_id: [u8; 16] = rand::random();
    let placeholder_key = [0u8; 32];

    let mut pipeline = tallow_protocol::transfer::SendPipeline::new(transfer_id, placeholder_key)
        .with_exclusion(exclusion);

    let _offer = pipeline
        .prepare(std::slice::from_ref(&args.dir))
        .await
        .map_err(|e| io::Error::other(format!("Failed to scan directory: {}", e)))?;

    let manifest = pipeline.manifest();

    if json {
        println!(
            "{}",
            serde_json::json!({
                "event": "sync_scanned",
                "total_files": manifest.files.len(),
                "total_bytes": manifest.total_size,
            })
        );
    } else {
        println!(
            "Scanned {} file(s), {} total",
            manifest.files.len(),
            output::format_size(manifest.total_size)
        );
    }

    // Resolve relay address (proxy-aware: avoids DNS leaks)
    let resolved = tallow_net::relay::resolve_relay_proxy(&args.relay, proxy_config.as_ref())
        .await
        .map_err(|e| io::Error::other(format!("Relay resolution failed: {}", e)))?;

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
            let proxy = proxy_config
                .as_ref()
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
                        .map_err(|e| io::Error::other(format!("Key confirmation failed: {}", e)))?;
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
        output::color::success("Secure session established (KEM handshake complete)");
    }
    // --- End handshake ---

    // Set the real session key on the pipeline
    // Serialize manifest before mutable borrow to avoid conflict with pipeline.manifest() ref
    let manifest_bytes = manifest
        .to_bytes()
        .map_err(|e| io::Error::other(format!("Failed to serialize manifest: {}", e)))?;
    pipeline.set_session_key(*session_key.as_bytes());

    let exchange_msg = Message::ManifestExchange {
        transfer_id,
        manifest: manifest_bytes,
    };

    codec
        .encode_msg(&exchange_msg, &mut encode_buf)
        .map_err(|e| io::Error::other(format!("Encode manifest failed: {}", e)))?;
    relay
        .forward(&encode_buf)
        .await
        .map_err(|e| io::Error::other(format!("Send manifest failed: {}", e)))?;

    // Wait for peer's manifest exchange response
    let n = relay
        .receive(&mut recv_buf)
        .await
        .map_err(|e| io::Error::other(format!("Receive failed: {}", e)))?;

    let mut decode_buf = BytesMut::from(&recv_buf[..n]);
    let response = codec
        .decode_msg(&mut decode_buf)
        .map_err(|e| io::Error::other(format!("Decode failed: {}", e)))?;

    match response {
        Some(Message::ManifestExchange {
            manifest: remote_manifest_bytes,
            ..
        }) => {
            handle_manifest_exchange(
                &args,
                json,
                remote_manifest_bytes,
                pipeline,
                session_key,
                transfer_id,
                &mut relay,
                &mut codec,
                &mut encode_buf,
                &mut recv_buf,
            )
            .await?;
        }
        Some(Message::FileReject { reason, .. }) => {
            let safe_reason = tallow_protocol::transfer::sanitize::sanitize_display(&reason);
            relay.close().await;
            return Err(io::Error::other(format!(
                "Sync rejected by peer: {}",
                safe_reason
            )));
        }
        other => {
            relay.close().await;
            return Err(io::Error::other(format!(
                "Unexpected response: {:?}",
                other
            )));
        }
    }

    relay.close().await;
    Ok(())
}

/// Handle the manifest exchange response and perform the actual sync transfer
#[allow(clippy::too_many_arguments)]
async fn handle_manifest_exchange(
    args: &SyncArgs,
    json: bool,
    remote_manifest_bytes: Vec<u8>,
    pipeline: tallow_protocol::transfer::SendPipeline,
    session_key: tallow_protocol::kex::SessionKey,
    transfer_id: [u8; 16],
    relay: &mut tallow_net::relay::RelayClient,
    codec: &mut TallowCodec,
    encode_buf: &mut BytesMut,
    recv_buf: &mut [u8],
) -> io::Result<()> {
    let manifest = pipeline.manifest();

    // Parse remote manifest
    let remote_manifest =
        tallow_protocol::transfer::FileManifest::from_bytes(&remote_manifest_bytes)
            .map_err(|e| io::Error::other(format!("Invalid remote manifest: {}", e)))?;

    // Compute diff
    let diff =
        tallow_protocol::transfer::sync::compute_sync_diff(&manifest.files, &remote_manifest);

    if diff.is_empty() {
        if json {
            println!(
                "{}",
                serde_json::json!({"event": "sync_complete", "status": "up_to_date"})
            );
        } else {
            output::color::success("Already up to date -- no changes needed.");
        }
        relay.close().await;
        return Ok(());
    }

    if json {
        println!(
            "{}",
            serde_json::json!({
                "event": "sync_diff",
                "new_files": diff.new_files.len(),
                "changed_files": diff.changed_files.len(),
                "deleted_files": diff.deleted_files.len(),
                "transfer_bytes": diff.transfer_bytes(),
            })
        );
    } else {
        println!("Sync diff:");
        println!("  {} new file(s)", diff.new_files.len());
        println!("  {} changed file(s)", diff.changed_files.len());
        println!("  {} deleted file(s)", diff.deleted_files.len());
        println!(
            "  {} to transfer",
            output::format_size(diff.transfer_bytes())
        );
    }

    // Safety check: warn if >50% of remote files would be deleted
    if args.delete && diff.deletion_fraction(remote_manifest.files.len()) > 0.5 && !json {
        output::color::warning(&format!(
            "Warning: {} of {} remote files ({:.0}%) would be deleted",
            diff.deleted_files.len(),
            remote_manifest.files.len(),
            diff.deletion_fraction(remote_manifest.files.len()) * 100.0,
        ));
        let confirm = output::prompts::confirm_with_default("Continue with sync?", false)?;
        if !confirm {
            output::color::info("Sync cancelled.");
            relay.close().await;
            return Ok(());
        }
    }

    // Send only new + changed files
    let files_to_send: Vec<PathBuf> = diff
        .new_files
        .iter()
        .chain(diff.changed_files.iter())
        .map(|f| args.dir.join(&f.path))
        .collect();

    if !files_to_send.is_empty() {
        // Prepare a new pipeline for just the delta files
        let mut delta_pipeline =
            tallow_protocol::transfer::SendPipeline::new(transfer_id, *session_key.as_bytes());

        let offer_messages = delta_pipeline
            .prepare(&files_to_send)
            .await
            .map_err(|e| io::Error::other(format!("Failed to prepare delta: {}", e)))?;

        // Send FileOffer
        for msg in &offer_messages {
            encode_buf.clear();
            codec
                .encode_msg(msg, encode_buf)
                .map_err(|e| io::Error::other(format!("Encode failed: {}", e)))?;
            relay
                .forward(encode_buf)
                .await
                .map_err(|e| io::Error::other(format!("Send failed: {}", e)))?;
        }

        // Wait for accept
        let n = relay
            .receive(recv_buf)
            .await
            .map_err(|e| io::Error::other(format!("Receive failed: {}", e)))?;
        let mut accept_buf = BytesMut::from(&recv_buf[..n]);
        let accept = codec
            .decode_msg(&mut accept_buf)
            .map_err(|e| io::Error::other(format!("Decode failed: {}", e)))?;

        match accept {
            Some(Message::FileAccept { .. }) => {
                tracing::info!("Receiver accepted sync transfer");
            }
            Some(Message::FileReject { reason, .. }) => {
                let safe_reason = tallow_protocol::transfer::sanitize::sanitize_display(&reason);
                relay.close().await;
                return Err(io::Error::other(format!("Sync rejected: {}", safe_reason)));
            }
            other => {
                relay.close().await;
                return Err(io::Error::other(format!("Unexpected: {:?}", other)));
            }
        }

        // Send chunks
        let progress = output::TransferProgressBar::new(delta_pipeline.manifest().total_size);
        let mut total_sent: u64 = 0;
        let mut chunk_index: u64 = 0;

        let throttle_bps = crate::commands::send::parse_throttle_pub(&args.throttle)?;

        for file in &files_to_send {
            let chunk_messages = delta_pipeline
                .chunk_file(file, chunk_index)
                .await
                .map_err(|e| io::Error::other(format!("Chunk failed: {}", e)))?;

            for chunk_msg in &chunk_messages {
                if throttle_bps > 0 {
                    if let Message::Chunk { ref data, .. } = chunk_msg {
                        let delay_ms = (data.len() as u64 * 1000) / throttle_bps;
                        if delay_ms > 0 {
                            tokio::time::sleep(std::time::Duration::from_millis(delay_ms)).await;
                        }
                    }
                }

                encode_buf.clear();
                codec
                    .encode_msg(chunk_msg, encode_buf)
                    .map_err(|e| io::Error::other(format!("Encode failed: {}", e)))?;
                relay
                    .forward(encode_buf)
                    .await
                    .map_err(|e| io::Error::other(format!("Send failed: {}", e)))?;

                let n = relay
                    .receive(recv_buf)
                    .await
                    .map_err(|e| io::Error::other(format!("Receive ack failed: {}", e)))?;
                let mut ack_buf = BytesMut::from(&recv_buf[..n]);
                if let Some(Message::Ack { .. }) = codec
                    .decode_msg(&mut ack_buf)
                    .map_err(|e| io::Error::other(format!("Decode ack failed: {}", e)))?
                {
                    if let Message::Chunk { ref data, .. } = chunk_msg {
                        total_sent += data.len() as u64;
                        progress.update(total_sent);
                    }
                }
            }
            chunk_index += chunk_messages.len() as u64;
        }
        progress.finish();
    }

    // Handle deletions
    if args.delete && !diff.deleted_files.is_empty() {
        let delete_paths: Vec<String> = diff
            .deleted_files
            .iter()
            .map(|f| f.path.display().to_string())
            .collect();

        let delete_msg = Message::SyncDeleteList {
            transfer_id,
            paths: delete_paths,
        };
        encode_buf.clear();
        codec
            .encode_msg(&delete_msg, encode_buf)
            .map_err(|e| io::Error::other(format!("Encode delete list failed: {}", e)))?;
        relay
            .forward(encode_buf)
            .await
            .map_err(|e| io::Error::other(format!("Send delete list failed: {}", e)))?;
    }

    // Send completion
    let complete_msg = Message::TransferComplete {
        transfer_id,
        hash: *manifest.manifest_hash.as_ref().unwrap_or(&[0u8; 32]),
        merkle_root: None,
    };
    encode_buf.clear();
    codec
        .encode_msg(&complete_msg, encode_buf)
        .map_err(|e| io::Error::other(format!("Encode complete failed: {}", e)))?;
    relay
        .forward(encode_buf)
        .await
        .map_err(|e| io::Error::other(format!("Send complete failed: {}", e)))?;

    if json {
        println!(
            "{}",
            serde_json::json!({
                "event": "sync_complete",
                "transferred": diff.transfer_count(),
                "deleted": if args.delete { diff.deleted_files.len() } else { 0 },
                "bytes": diff.transfer_bytes(),
            })
        );
    } else {
        output::color::success(&format!(
            "Sync complete: {} file(s) transferred ({})",
            diff.transfer_count(),
            output::format_size(diff.transfer_bytes()),
        ));
        if args.delete && !diff.deleted_files.is_empty() {
            println!("  {} file(s) deleted on remote", diff.deleted_files.len());
        }
    }

    Ok(())
}
