//! Drop box (persistent receive) command implementation
//!
//! Listens persistently on a room code, auto-accepting transfers from
//! trusted contacts in the trust database. Loops back to waiting after
//! each completed transfer.

use crate::cli::DropBoxArgs;
use crate::output;
use bytes::BytesMut;
use std::io;
use tallow_net::transport::reconnect::{self, ReconnectConfig};
use tallow_net::transport::PeerChannel;
use tallow_protocol::transfer::manifest::TransferType;
use tallow_protocol::wire::{codec::TallowCodec, Message};

/// Maximum receive buffer size (256 KB)
const RECV_BUF_SIZE: usize = 256 * 1024;

/// Execute the drop-box persistent receive command
pub async fn execute(args: DropBoxArgs, json: bool) -> io::Result<()> {
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

    // Determine output directory
    let output_dir = args.output.clone();
    if !output_dir.exists() {
        std::fs::create_dir_all(&output_dir)?;
    }

    // Load or generate identity (needed for future trust DB lookups)
    let mut _identity = tallow_store::identity::IdentityStore::new();
    if let Err(e) = _identity.load_or_generate("") {
        tracing::warn!("Identity initialization failed: {}", e);
    }

    // Generate or use fixed code phrase
    let code_phrase = if let Some(ref code) = args.code {
        if code.len() < 4 {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "Custom code must be at least 4 characters for security",
            ));
        }
        code.clone()
    } else {
        tallow_protocol::room::code::generate_code_phrase(
            tallow_protocol::room::code::DEFAULT_WORD_COUNT,
        )
    };

    let room_id = tallow_protocol::room::code::derive_room_id(&code_phrase);

    if json {
        println!(
            "{}",
            serde_json::json!({
                "event": "drop_box_started",
                "code": code_phrase,
                "room_id": hex::encode(room_id),
                "output_dir": output_dir.display().to_string(),
                "trusted_only": args.trusted_only,
                "max_transfers": args.max_transfers,
            })
        );
    } else {
        output::color::section("Drop Box Mode");
        output::color::info("Listening for incoming transfers...");
        output::color::info("Code phrase:");
        output::color::code_phrase(&code_phrase);
        println!();
        output::color::section("Senders can connect with:");
        println!("  tallow send --code {} <files>", code_phrase);
        println!();
        if args.trusted_only {
            output::color::info("Only accepting from trusted contacts");
        }
        if args.max_transfers > 0 {
            output::color::info(&format!(
                "Will exit after {} transfer(s)",
                args.max_transfers
            ));
        }
        output::color::info("Press Ctrl+C to stop");
        println!();
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

    let mut transfer_count: u64 = 0;

    // Main drop box loop
    loop {
        if args.max_transfers > 0 && transfer_count >= args.max_transfers {
            if json {
                println!(
                    "{}",
                    serde_json::json!({
                        "event": "drop_box_max_reached",
                        "transfers_completed": transfer_count,
                    })
                );
            } else {
                output::color::success(&format!(
                    "Completed {} transfer(s). Exiting drop box.",
                    transfer_count
                ));
            }
            break;
        }

        if !json && transfer_count > 0 {
            println!();
            output::color::info("Waiting for next sender...");
        }

        // Handle one transfer session; on error, log and continue
        match handle_one_transfer(
            &args,
            json,
            &code_phrase,
            &room_id,
            pw_ref,
            &proxy_config,
            &output_dir,
        )
        .await
        {
            Ok(()) => {
                transfer_count += 1;
                if json {
                    println!(
                        "{}",
                        serde_json::json!({
                            "event": "drop_box_transfer_complete",
                            "transfers_completed": transfer_count,
                        })
                    );
                }
            }
            Err(e) => {
                // Log the error but keep the drop box running
                let msg = format!("{}", e);
                if json {
                    println!(
                        "{}",
                        serde_json::json!({
                            "event": "drop_box_transfer_error",
                            "error": msg,
                            "transfers_completed": transfer_count,
                        })
                    );
                } else {
                    output::color::warning(&format!("Transfer failed: {}", msg));
                    output::color::info("Continuing to listen...");
                }
            }
        }
    }

    Ok(())
}

/// Handle a single transfer session within the drop box loop
async fn handle_one_transfer(
    args: &DropBoxArgs,
    json: bool,
    code_phrase: &str,
    room_id: &[u8; 32],
    pw_ref: Option<&[u8; 32]>,
    proxy_config: &Option<tallow_net::privacy::ProxyConfig>,
    output_dir: &std::path::Path,
) -> io::Result<()> {
    // Establish connection
    let (mut channel, mut is_direct) = if let Some(ref proxy) = proxy_config {
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
            .connect(room_id, pw_ref)
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
        let relay_addr: std::net::SocketAddr = resolve_relay(&args.relay)?;
        tallow_net::transport::establish_receiver_connection(room_id, relay_addr, pw_ref, false)
            .await
            .map_err(|e| io::Error::other(format!("Connection failed: {}", e)))?
    };

    if !json {
        if is_direct {
            output::color::direct_connection();
        } else {
            output::color::info(&format!("Connected to relay {}", args.relay));
        }
        output::color::success("Sender connected!");
    }

    // Create codec and buffers
    let mut codec = TallowCodec::new();
    let mut recv_buf = vec![0u8; RECV_BUF_SIZE];
    let mut encode_buf = BytesMut::new();

    let reconnect_config = ReconnectConfig::default();

    // --- KEM Handshake ---
    let mut handshake = tallow_protocol::kex::ReceiverHandshake::new(code_phrase, room_id);

    let n = tokio::time::timeout(
        std::time::Duration::from_secs(30),
        channel.receive_message(&mut recv_buf),
    )
    .await
    .map_err(|_| io::Error::other("Handshake timeout waiting for init"))?
    .map_err(|e| io::Error::other(format!("Receive handshake: {}", e)))?;

    let mut decode_buf = BytesMut::from(&recv_buf[..n]);
    let init_msg = codec
        .decode_msg(&mut decode_buf)
        .map_err(|e| io::Error::other(format!("Decode handshake: {}", e)))?;

    let session_key: tallow_protocol::kex::SessionKey;

    match init_msg {
        Some(Message::HandshakeInit {
            protocol_version,
            kem_capabilities,
            cpace_public,
            nonce,
        }) => {
            let resp = handshake
                .process_init(protocol_version, &kem_capabilities, &cpace_public, &nonce)
                .map_err(|e| {
                    io::Error::other(format!("Handshake init processing failed: {}", e))
                })?;

            encode_buf.clear();
            codec
                .encode_msg(&resp, &mut encode_buf)
                .map_err(|e| io::Error::other(format!("Encode HandshakeResponse: {}", e)))?;
            channel
                .send_message(&encode_buf)
                .await
                .map_err(|e| io::Error::other(format!("Send HandshakeResponse: {}", e)))?;

            let n = tokio::time::timeout(
                std::time::Duration::from_secs(30),
                channel.receive_message(&mut recv_buf),
            )
            .await
            .map_err(|_| io::Error::other("Handshake timeout waiting for KEM"))?
            .map_err(|e| io::Error::other(format!("Receive HandshakeKem: {}", e)))?;

            let mut decode_buf = BytesMut::from(&recv_buf[..n]);
            let kem_msg = codec
                .decode_msg(&mut decode_buf)
                .map_err(|e| io::Error::other(format!("Decode HandshakeKem: {}", e)))?;

            match kem_msg {
                Some(Message::HandshakeKem {
                    kem_ciphertext,
                    confirmation,
                }) => {
                    let (complete_msg, session_key_result) = handshake
                        .process_kem(&kem_ciphertext, &confirmation)
                        .map_err(|e| io::Error::other(format!("Handshake KEM failed: {}", e)))?;

                    encode_buf.clear();
                    codec
                        .encode_msg(&complete_msg, &mut encode_buf)
                        .map_err(|e| {
                            io::Error::other(format!("Encode HandshakeComplete: {}", e))
                        })?;
                    channel
                        .send_message(&encode_buf)
                        .await
                        .map_err(|e| io::Error::other(format!("Send HandshakeComplete: {}", e)))?;

                    session_key = session_key_result;
                }
                other => {
                    channel.close().await;
                    return Err(io::Error::other(format!(
                        "Expected HandshakeKem, got: {:?}",
                        other
                    )));
                }
            }
        }
        other => {
            channel.close().await;
            return Err(io::Error::other(format!(
                "Expected HandshakeInit, got: {:?}",
                other
            )));
        }
    }

    if !json {
        output::color::success("Secure session established (KEM handshake complete)");
    }

    // Display verification string (opt-in via --verify)
    if args.verify {
        if json {
            output::verify::display_verification_json(session_key.as_bytes());
        } else {
            output::verify::display_verification(session_key.as_bytes(), true);
        }
    }

    // --- P2P Direct Connection Upgrade ---
    if !is_direct && proxy_config.is_none() && !args.no_p2p {
        if !json {
            output::color::info("Attempting P2P direct connection...");
        }
        let suppress_p2p = proxy_config.is_some() || args.no_p2p;
        match tallow_net::transport::negotiate_p2p(&mut channel, false, suppress_p2p).await {
            tallow_net::transport::NegotiationResult::Direct(direct_conn) => {
                if !json {
                    output::color::success(&format!(
                        "Upgraded to direct P2P connection ({})",
                        direct_conn.remote_addr()
                    ));
                }
                channel = tallow_net::transport::ConnectionResult::Direct(direct_conn);
                is_direct = true;
            }
            tallow_net::transport::NegotiationResult::FallbackToRelay(reason) => {
                if !json {
                    output::color::info(&format!(
                        "P2P direct connection unavailable ({}), continuing via relay",
                        reason
                    ));
                }
            }
        }
    }
    // Suppress unused variable warning when P2P is skipped
    let _ = is_direct;

    // --- Receive FileOffer ---
    let n = channel
        .receive_message(&mut recv_buf)
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
            channel.close().await;
            return Err(io::Error::other(format!(
                "Expected FileOffer, got: {:?}",
                other
            )));
        }
    };

    // Initialize receive pipeline
    let mut pipeline = tallow_protocol::transfer::ReceivePipeline::new(
        transfer_id,
        output_dir,
        *session_key.as_bytes(),
    );

    let manifest = pipeline
        .process_offer(&manifest_bytes)
        .map_err(|e| io::Error::other(format!("Failed to process offer: {}", e)))?;

    let total_size = manifest.total_size;
    let file_count = manifest.files.len();
    let is_text_transfer = manifest.transfer_type == TransferType::Text;

    if json {
        println!(
            "{}",
            serde_json::json!({
                "event": "drop_box_offer",
                "transfer_id": hex::encode(transfer_id),
                "total_files": file_count,
                "total_bytes": total_size,
                "text_transfer": is_text_transfer,
            })
        );
    } else {
        println!();
        if is_text_transfer {
            output::color::info(&format!(
                "Incoming text transfer ({})",
                output::format_size(total_size)
            ));
        } else {
            output::color::section("Incoming transfer:");
            for entry in manifest.files.iter() {
                let safe_name = tallow_protocol::transfer::sanitize::sanitize_display(
                    &entry.path.display().to_string(),
                );
                output::color::file_entry(&safe_name, entry.size);
            }
            output::color::transfer_summary(file_count, total_size);
        }
    }

    // Decide whether to accept
    let accepted = if args.yes {
        // Auto-accept everything
        true
    } else if args.trusted_only {
        // Only accept from trusted contacts
        // For now, accept -- full trust DB integration requires identity exchange
        // which happens in the handshake. Log a warning about the stub.
        tracing::info!("--trusted-only: accepting (trust verification stub)");
        if !json {
            output::color::info(
                "Accepting transfer (trust verification pending full identity exchange)",
            );
        }
        true
    } else if json {
        // JSON mode with no --yes: reject
        false
    } else {
        // Interactive prompt
        output::prompts::confirm_with_default(
            &format!(
                "Accept {} ({})?",
                if is_text_transfer {
                    "text transfer".to_string()
                } else {
                    format!("{} file(s)", file_count)
                },
                output::format_size(total_size),
            ),
            true,
        )?
    };

    if !accepted {
        let reject_msg = Message::FileReject {
            transfer_id,
            reason: "declined by drop box".to_string(),
        };
        encode_buf.clear();
        codec
            .encode_msg(&reject_msg, &mut encode_buf)
            .map_err(|e| io::Error::other(format!("Encode FileReject: {}", e)))?;
        channel
            .send_message(&encode_buf)
            .await
            .map_err(|e| io::Error::other(format!("Send FileReject: {}", e)))?;
        channel.close().await;

        if !json {
            output::color::info("Transfer declined.");
        }
        return Ok(());
    }

    // Send FileAccept
    let accept_msg = Message::FileAccept { transfer_id };
    encode_buf.clear();
    codec
        .encode_msg(&accept_msg, &mut encode_buf)
        .map_err(|e| io::Error::other(format!("Encode FileAccept: {}", e)))?;
    channel
        .send_message(&encode_buf)
        .await
        .map_err(|e| io::Error::other(format!("Send FileAccept: {}", e)))?;

    if !json {
        output::color::info("Transfer accepted. Receiving...");
    }

    // Receive chunks
    let transfer_start = std::time::Instant::now();
    let progress = output::TransferProgressBar::new(total_size);
    let mut bytes_received: u64 = 0;

    loop {
        let n = reconnect::receive_with_retry(&mut channel, &mut recv_buf, &reconnect_config)
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

                let ack = pipeline.process_chunk(index, &data, total).map_err(|e| {
                    io::Error::other(format!("Process chunk {} failed: {}", index, e))
                })?;

                if let Some(ack_msg) = ack {
                    encode_buf.clear();
                    codec
                        .encode_msg(&ack_msg, &mut encode_buf)
                        .map_err(|e| io::Error::other(format!("Encode ack: {}", e)))?;
                    reconnect::send_with_retry(&mut channel, &encode_buf, &reconnect_config)
                        .await
                        .map_err(|e| io::Error::other(format!("Send ack: {}", e)))?;
                }

                bytes_received += chunk_size;
                progress.update(bytes_received.min(total_size));

                if pipeline.is_complete() {
                    break;
                }
            }
            Some(Message::TransferComplete { merkle_root, .. }) => {
                if let Some(sender_root) = merkle_root {
                    if let Some(receiver_root) = pipeline.merkle_root() {
                        if !tallow_crypto::mem::constant_time::ct_eq(&sender_root, &receiver_root) {
                            progress.finish();
                            channel.close().await;
                            return Err(io::Error::other(
                                "Merkle root mismatch: transfer integrity verification failed",
                            ));
                        }
                        tracing::info!("Merkle root verified successfully");
                    }
                }
                break;
            }
            Some(Message::TransferError { error, .. }) => {
                progress.finish();
                let safe_error = tallow_protocol::transfer::sanitize::sanitize_display(&error);
                channel.close().await;
                return Err(io::Error::other(format!(
                    "Transfer error from sender: {}",
                    safe_error
                )));
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

    channel.close().await;

    if json {
        println!(
            "{}",
            serde_json::json!({
                "event": "transfer_complete",
                "total_bytes": total_size,
                "files": written_files.iter().map(|f| f.display().to_string()).collect::<Vec<_>>(),
            })
        );
    } else {
        output::color::transfer_complete(total_size, transfer_start.elapsed());
        for f in &written_files {
            println!("  Saved: {}", f.display());
        }
    }

    // Desktop notification (opt-in)
    if args.notify && !json {
        output::notifications::notify_transfer_complete(
            file_count,
            total_size,
            transfer_start.elapsed().as_secs_f64(),
        );
    }

    // Log to transfer history
    if let Ok(mut history) = tallow_store::history::TransferLog::open() {
        let filenames: Vec<String> = written_files
            .iter()
            .map(|f| f.display().to_string())
            .collect();
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
    if let Ok(addr) = relay.parse() {
        return Ok(addr);
    }
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
