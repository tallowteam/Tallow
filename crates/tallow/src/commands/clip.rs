//! Clipboard sharing command implementation
//!
//! Handles sending/receiving clipboard contents (text, images, URLs)
//! via the standard E2E encrypted relay pipeline.

use crate::cli::{ClipArgs, ClipCommands};
use crate::output;
use bytes::BytesMut;
use std::io;
use std::path::PathBuf;
use tallow_protocol::wire::{codec::TallowCodec, Message};
use tallow_store::clipboard::{
    detect, preview, ClipboardEntry, ClipboardHistory, ContentType, ImageFormat,
};

/// Maximum receive buffer size (256 KB)
const RECV_BUF_SIZE: usize = 256 * 1024;

/// Execute the clip command, dispatching to the appropriate subcommand
pub async fn execute(args: ClipArgs, json: bool) -> io::Result<()> {
    match args.command {
        Some(ClipCommands::Receive {
            ref code,
            ref output,
        }) => execute_receive(&args, code, output.clone(), json).await,
        Some(ClipCommands::Watch { debounce }) => execute_watch(&args, debounce, json).await,
        Some(ClipCommands::History { count, search }) => execute_history(count, search, json),
        Some(ClipCommands::Clear) => execute_clear(json),
        None => execute_send(&args, json).await,
    }
}

/// Send current clipboard contents to a peer
async fn execute_send(args: &ClipArgs, json: bool) -> io::Result<()> {
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

    // Read clipboard contents
    let text = if !args.image {
        output::clipboard::read_from_clipboard()
    } else {
        None
    };

    let image_data = if args.image || args.all || text.is_none() {
        read_and_encode_image()
    } else {
        None
    };

    // Determine what we're sending
    let (payload, content_type, preview_str) = match (&text, &image_data) {
        // --all with both text + image: send text, log image to history
        (Some(t), Some(_)) if args.all => {
            let ct = ContentType::Multiple;
            let pv = preview::generate_preview(t, 80);
            (t.as_bytes().to_vec(), ct, pv)
        }
        // --image flag: send image
        (_, Some(img)) if args.image => {
            let fmt = detect::detect_image_format(img);
            let pv = preview::generate_image_preview(&fmt, img.len() as u64);
            (img.clone(), ContentType::Image { format: fmt }, pv)
        }
        // Text available with or without image: prefer text
        (Some(t), _) => {
            let ct = detect::detect_content_type(t);
            let pv = preview::generate_preview(t, 80);
            (t.as_bytes().to_vec(), ct, pv)
        }
        // No text, image available: send image
        (None, Some(img)) => {
            let fmt = detect::detect_image_format(img);
            let pv = preview::generate_image_preview(&fmt, img.len() as u64);
            (img.clone(), ContentType::Image { format: fmt }, pv)
        }
        // Nothing available
        (None, None) => {
            return Err(io::Error::new(
                io::ErrorKind::NotFound,
                "Clipboard is empty (no text or image found)",
            ));
        }
    };

    if json {
        println!(
            "{}",
            serde_json::json!({
                "event": "clipboard_read",
                "content_type": format!("{}", content_type),
                "size": payload.len(),
                "preview": preview_str,
            })
        );
    } else {
        output::color::info(&format!(
            "Clipboard: {} ({})",
            content_type,
            output::format_size(payload.len() as u64)
        ));
        if !matches!(content_type, ContentType::Image { .. }) {
            output::color::section(&format!("  {}", preview_str));
        }
    }

    // Generate code phrase
    let code_phrase = if let Some(ref custom_code) = args.custom_code {
        if custom_code.len() < 4 {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "Custom code must be at least 4 characters for security",
            ));
        }
        custom_code.clone()
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
                "event": "code_generated",
                "code": code_phrase,
                "receive_command": format!("tallow clip receive {}", code_phrase),
            })
        );
    } else {
        output::color::info("Code phrase:");
        output::color::code_phrase(&code_phrase);
        println!();
        output::color::section("On the receiving end, run:");
        println!("  tallow clip receive {}", code_phrase);
        println!();

        if args.qr {
            if let Err(e) = output::qr::display_receive_qr(&code_phrase) {
                tracing::debug!("QR display failed: {}", e);
            }
            println!();
        }

        if !args.no_clipboard {
            output::clipboard::copy_to_clipboard(&format!("tallow clip receive {}", code_phrase));
            output::color::info("(receive command copied to clipboard)");
        }
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

    let password_hash: Option<[u8; 32]> = args
        .relay_pass
        .as_ref()
        .map(|pass| blake3::hash(pass.as_bytes()).into());

    let peer_present = relay
        .connect(&room_id, password_hash.as_ref())
        .await
        .map_err(|e| io::Error::other(format!("Relay connection failed: {}", e)))?;

    if !peer_present {
        if !json {
            output::color::info("Waiting for receiver to connect...");
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
    let mut recv_buf = vec![0u8; RECV_BUF_SIZE];

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
        output::color::success("Secure session established (KEM handshake complete)");
    }
    // --- End handshake ---

    if args.verify {
        if json {
            output::verify::display_verification_json(session_key.as_bytes());
        } else {
            output::verify::display_verification(session_key.as_bytes(), true);
        }
    }

    // Create pipeline with handshake-derived session key
    let transfer_id: [u8; 16] = rand::random();
    let mut pipeline =
        tallow_protocol::transfer::SendPipeline::new(transfer_id, *session_key.as_bytes());

    let offer_messages = pipeline
        .prepare_text(&payload)
        .await
        .map_err(|e| io::Error::other(format!("Failed to prepare clipboard data: {}", e)))?;

    let total_size = pipeline.manifest().total_size;

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
            tracing::info!("Receiver accepted the clipboard transfer");
        }
        Some(Message::FileReject { reason, .. }) => {
            let safe_reason = tallow_protocol::transfer::sanitize::sanitize_display(&reason);
            let msg = format!("Transfer rejected: {}", safe_reason);
            if !json {
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

    // Send chunks
    let transfer_start = std::time::Instant::now();
    let progress = output::TransferProgressBar::new(total_size);
    let mut total_sent: u64 = 0;

    let chunk_messages = pipeline
        .chunk_data(&payload, 0)
        .await
        .map_err(|e| io::Error::other(format!("Failed to chunk clipboard data: {}", e)))?;

    for chunk_msg in &chunk_messages {
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
                let safe_error = tallow_protocol::transfer::sanitize::sanitize_display(&error);
                let msg = format!("Transfer error: {}", safe_error);
                relay.close().await;
                return Err(io::Error::other(msg));
            }
            other => {
                tracing::warn!("Unexpected message during transfer: {:?}", other);
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
        merkle_root: None,
    };
    encode_buf.clear();
    codec
        .encode_msg(&complete_msg, &mut encode_buf)
        .map_err(|e| io::Error::other(format!("Encode complete failed: {}", e)))?;
    relay
        .forward(&encode_buf)
        .await
        .map_err(|e| io::Error::other(format!("Send complete failed: {}", e)))?;

    relay.close().await;

    if json {
        println!(
            "{}",
            serde_json::json!({
                "event": "clipboard_sent",
                "content_type": format!("{}", content_type),
                "total_bytes": total_size,
            })
        );
    } else {
        output::color::transfer_complete(total_size, transfer_start.elapsed());
    }

    // Log to clipboard history
    log_to_history(&payload, &content_type, &preview_str, None);

    // When --all, also save the image to history separately
    if args.all {
        if let Some(ref img) = image_data {
            let fmt = detect::detect_image_format(img);
            let img_pv = preview::generate_image_preview(&fmt, img.len() as u64);
            log_to_history(img, &ContentType::Image { format: fmt }, &img_pv, Some(img));
        }
    }

    Ok(())
}

/// Receive clipboard contents from a peer
async fn execute_receive(
    args: &ClipArgs,
    code: &str,
    output_path: Option<PathBuf>,
    json: bool,
) -> io::Result<()> {
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

    if code.is_empty() {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "Code phrase cannot be empty",
        ));
    }

    let output_dir = output_path.unwrap_or_else(|| PathBuf::from("."));
    if !output_dir.exists() {
        std::fs::create_dir_all(&output_dir)?;
    }

    let room_id = tallow_protocol::room::code::derive_room_id(code);

    if !json {
        output::color::info("Connecting with code:");
        output::color::code_phrase(code);
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

    let password_hash: Option<[u8; 32]> = args
        .relay_pass
        .as_ref()
        .map(|pass| blake3::hash(pass.as_bytes()).into());

    let peer_present = relay
        .connect(&room_id, password_hash.as_ref())
        .await
        .map_err(|e| io::Error::other(format!("Relay connection failed: {}", e)))?;

    if !peer_present {
        if !json {
            output::color::info("Waiting for sender to connect...");
        }
        relay
            .wait_for_peer()
            .await
            .map_err(|e| io::Error::other(format!("Wait for peer failed: {}", e)))?;
    }

    if !json {
        output::color::success("Peer connected!");
    }

    let mut codec = TallowCodec::new();
    let mut recv_buf = vec![0u8; RECV_BUF_SIZE];
    let mut encode_buf = BytesMut::new();

    // --- KEM Handshake ---
    let mut handshake = tallow_protocol::kex::ReceiverHandshake::new(code, &room_id);

    // Step 1: Receive HandshakeInit (or detect old protocol)
    let n = tokio::time::timeout(
        std::time::Duration::from_secs(30),
        relay.receive(&mut recv_buf),
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
            // Step 2: Process init -> send HandshakeResponse
            let resp = handshake
                .process_init(protocol_version, &kem_capabilities, &cpace_public, &nonce)
                .map_err(|e| {
                    io::Error::other(format!("Handshake init processing failed: {}", e))
                })?;

            encode_buf.clear();
            codec
                .encode_msg(&resp, &mut encode_buf)
                .map_err(|e| io::Error::other(format!("Encode HandshakeResponse: {}", e)))?;
            relay
                .forward(&encode_buf)
                .await
                .map_err(|e| io::Error::other(format!("Send HandshakeResponse: {}", e)))?;

            // Step 3: Receive HandshakeKem
            let n = tokio::time::timeout(
                std::time::Duration::from_secs(30),
                relay.receive(&mut recv_buf),
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
                        .map_err(|e| {
                            io::Error::other(format!("Handshake KEM failed: {}", e))
                        })?;

                    // Step 4: Send HandshakeComplete
                    encode_buf.clear();
                    codec
                        .encode_msg(&complete_msg, &mut encode_buf)
                        .map_err(|e| {
                            io::Error::other(format!("Encode HandshakeComplete: {}", e))
                        })?;
                    relay
                        .forward(&encode_buf)
                        .await
                        .map_err(|e| {
                            io::Error::other(format!("Send HandshakeComplete: {}", e))
                        })?;

                    session_key = session_key_result;
                }
                other => {
                    relay.close().await;
                    return Err(io::Error::other(format!(
                        "Expected HandshakeKem, got: {:?}",
                        other
                    )));
                }
            }
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
                "Expected HandshakeInit, got: {:?}",
                other
            )));
        }
    }

    if !json {
        output::color::success("Secure session established (KEM handshake complete)");
    }
    // --- End handshake ---

    // Receive FileOffer
    let n = relay
        .receive(&mut recv_buf)
        .await
        .map_err(|e| io::Error::other(format!("Receive offer failed: {}", e)))?;

    let mut decode_buf = BytesMut::from(&recv_buf[..n]);
    let offer_msg = codec
        .decode_msg(&mut decode_buf)
        .map_err(|e| io::Error::other(format!("Decode offer failed: {}", e)))?;

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

    if args.verify {
        if json {
            output::verify::display_verification_json(session_key.as_bytes());
        } else {
            output::verify::display_verification(session_key.as_bytes(), true);
        }
    }

    let mut pipeline = tallow_protocol::transfer::ReceivePipeline::new(
        transfer_id,
        output_dir.clone(),
        *session_key.as_bytes(),
    );

    let manifest = pipeline
        .process_offer(&manifest_bytes)
        .map_err(|e| io::Error::other(format!("Process offer failed: {}", e)))?;

    let total_size = manifest.total_size;

    if json {
        println!(
            "{}",
            serde_json::json!({
                "event": "clipboard_offer",
                "total_bytes": total_size,
            })
        );
    } else {
        output::color::info(&format!(
            "Incoming clipboard data ({})",
            output::format_size(total_size)
        ));
    }

    // Prompt for confirmation unless --yes flag is set
    let accepted = if args.yes || json {
        true
    } else {
        output::prompts::confirm_with_default(
            &format!(
                "Accept clipboard transfer ({})?",
                output::format_size(total_size)
            ),
            true,
        )?
    };

    if !accepted {
        let reject_msg = Message::FileReject {
            transfer_id,
            reason: "declined by receiver".to_string(),
        };
        encode_buf.clear();
        codec
            .encode_msg(&reject_msg, &mut encode_buf)
            .map_err(|e| io::Error::other(format!("Encode reject failed: {}", e)))?;
        relay
            .forward(&encode_buf)
            .await
            .map_err(|e| io::Error::other(format!("Send reject failed: {}", e)))?;
        relay.close().await;
        if !json {
            output::color::info("Clipboard transfer declined.");
        }
        return Ok(());
    }

    // Accept clipboard transfer
    let accept_msg = Message::FileAccept { transfer_id };
    encode_buf.clear();
    codec
        .encode_msg(&accept_msg, &mut encode_buf)
        .map_err(|e| io::Error::other(format!("Encode accept failed: {}", e)))?;
    relay
        .forward(&encode_buf)
        .await
        .map_err(|e| io::Error::other(format!("Send accept failed: {}", e)))?;

    // Receive chunks
    let transfer_start = std::time::Instant::now();
    let progress = output::TransferProgressBar::new(total_size);
    let mut bytes_received: u64 = 0;

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
                let ack = pipeline.process_chunk(index, &data, total).map_err(|e| {
                    io::Error::other(format!("Process chunk {} failed: {}", index, e))
                })?;

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

                if pipeline.is_complete() {
                    break;
                }
            }
            Some(Message::TransferComplete { .. }) => {
                break;
            }
            Some(Message::TransferError { error, .. }) => {
                progress.finish();
                let safe_error = tallow_protocol::transfer::sanitize::sanitize_display(&error);
                relay.close().await;
                return Err(io::Error::other(format!("Transfer error: {}", safe_error)));
            }
            other => {
                tracing::warn!("Unexpected message: {:?}", other);
            }
        }
    }

    progress.finish();

    // Finalize
    let _written_files = pipeline
        .finalize()
        .await
        .map_err(|e| io::Error::other(format!("Finalize failed: {}", e)))?;

    relay.close().await;

    // Read the received data
    let text_path = output_dir.join("_tallow_text_");
    if text_path.exists() {
        let content = std::fs::read(&text_path)
            .map_err(|e| io::Error::other(format!("Read received data: {}", e)))?;

        // Detect content type
        let img_format = detect::detect_image_format(&content);
        let is_image = img_format != ImageFormat::Unknown;

        if is_image {
            // Save image to disk
            let filename = format!(
                "clipboard_{}.{}",
                chrono::Utc::now().format("%Y%m%d_%H%M%S"),
                img_format.extension()
            );
            let save_path = output_dir.join(&filename);
            output::image::save_image_to_disk(&content, &save_path)?;

            // Try to set clipboard image
            let set_ok = output::image::write_clipboard_image(&content);

            if json {
                println!(
                    "{}",
                    serde_json::json!({
                        "event": "clipboard_received",
                        "type": "image",
                        "format": format!("{}", img_format),
                        "saved_to": save_path.display().to_string(),
                        "clipboard_set": set_ok,
                    })
                );
            } else {
                output::color::transfer_complete(total_size, transfer_start.elapsed());
                output::color::success(&format!("Image saved to: {}", save_path.display()));
                if set_ok {
                    output::color::info("(image copied to clipboard)");
                }
            }

            // Log to history
            let pv = preview::generate_image_preview(&img_format, content.len() as u64);
            log_to_history(
                &content,
                &ContentType::Image { format: img_format },
                &pv,
                Some(&content),
            );
        } else {
            // Text content — paste to clipboard
            if let Ok(text) = std::str::from_utf8(&content) {
                output::clipboard::copy_to_clipboard(text);

                let ct = detect::detect_content_type(text);
                let pv = preview::generate_preview(text, 80);

                if json {
                    println!(
                        "{}",
                        serde_json::json!({
                            "event": "clipboard_received",
                            "type": format!("{}", ct),
                            "size": content.len(),
                            "preview": pv,
                            "clipboard_set": true,
                        })
                    );
                } else {
                    output::color::transfer_complete(total_size, transfer_start.elapsed());
                    output::color::success("Text pasted to clipboard");
                    output::color::section(&format!("  {}", pv));
                }

                log_to_history(&content, &ct, &pv, None);
            } else {
                // Binary data — save to file
                let filename = format!(
                    "clipboard_{}.bin",
                    chrono::Utc::now().format("%Y%m%d_%H%M%S")
                );
                let save_path = output_dir.join(&filename);
                std::fs::write(&save_path, &content)?;

                if !json {
                    output::color::transfer_complete(total_size, transfer_start.elapsed());
                    output::color::success(&format!(
                        "Binary data saved to: {}",
                        save_path.display()
                    ));
                }
            }
        }

        // Clean up temporary file
        let _ = std::fs::remove_file(&text_path);
    }

    Ok(())
}

/// Watch clipboard for changes and auto-send
async fn execute_watch(_args: &ClipArgs, debounce_secs: u64, json: bool) -> io::Result<()> {
    if !json {
        output::color::info(&format!(
            "Watching clipboard for changes ({}s debounce)...",
            debounce_secs
        ));
        output::color::section("Press Ctrl+C to stop.");
    }

    let mut last_text_hash: Option<[u8; 32]> = None;
    let mut last_image_hash: Option<[u8; 32]> = None;

    loop {
        tokio::time::sleep(std::time::Duration::from_secs(debounce_secs)).await;

        // Check text clipboard
        if let Some(text) = output::clipboard::read_from_clipboard() {
            let hash: [u8; 32] = blake3::hash(text.as_bytes()).into();
            if last_text_hash.as_ref() != Some(&hash) {
                last_text_hash = Some(hash);

                let ct = detect::detect_content_type(&text);
                let pv = preview::generate_preview(&text, 60);

                if json {
                    println!(
                        "{}",
                        serde_json::json!({
                            "event": "clipboard_changed",
                            "type": format!("{}", ct),
                            "preview": pv,
                            "size": text.len(),
                        })
                    );
                } else {
                    output::color::info(&format!(
                        "Clipboard changed: {} ({})",
                        ct,
                        output::format_size(text.len() as u64)
                    ));
                    output::color::section(&format!("  {}", pv));
                }

                // Log to history
                log_to_history(text.as_bytes(), &ct, &pv, None);
            }
        }

        // Check image clipboard
        if let Some(img) = read_and_encode_image() {
            let hash: [u8; 32] = blake3::hash(&img).into();
            if last_image_hash.as_ref() != Some(&hash) {
                last_image_hash = Some(hash);

                let fmt = detect::detect_image_format(&img);
                let pv = preview::generate_image_preview(&fmt, img.len() as u64);

                if json {
                    println!(
                        "{}",
                        serde_json::json!({
                            "event": "clipboard_image_changed",
                            "format": format!("{}", fmt),
                            "size": img.len(),
                        })
                    );
                } else {
                    output::color::info(&format!("Clipboard image changed: {}", pv));
                }

                // Log image to history
                log_to_history(&img, &ContentType::Image { format: fmt }, &pv, Some(&img));
            }
        }
    }
}

/// Show clipboard history
fn execute_history(count: Option<usize>, search: Option<String>, json: bool) -> io::Result<()> {
    let history = ClipboardHistory::open()
        .map_err(|e| io::Error::other(format!("Failed to open clipboard history: {}", e)))?;

    if history.is_empty() {
        if json {
            println!("{}", serde_json::json!({"entries": []}));
        } else {
            output::color::info("Clipboard history is empty.");
        }
        return Ok(());
    }

    let entries: Vec<&ClipboardEntry> = if let Some(ref keyword) = search {
        history.search(keyword)
    } else if let Some(n) = count {
        history.recent(n).iter().collect()
    } else {
        history.query().iter().collect()
    };

    if json {
        let items: Vec<serde_json::Value> = entries
            .iter()
            .map(|e| {
                serde_json::json!({
                    "id": e.id,
                    "content_type": format!("{}", e.content_type),
                    "preview": e.preview,
                    "size": e.size,
                    "timestamp": e.timestamp,
                })
            })
            .collect();
        println!("{}", serde_json::json!({"entries": items}));
    } else {
        if let Some(ref keyword) = search {
            output::color::info(&format!(
                "Search results for '{}' ({} found):",
                keyword,
                entries.len()
            ));
        } else {
            output::color::info(&format!("Clipboard history ({} entries):", entries.len()));
        }
        println!();

        for entry in entries.iter().rev() {
            let ts = format_timestamp(entry.timestamp);
            let type_str = format!("{}", entry.content_type);
            let size_str = output::format_size(entry.size);
            println!("  {} | {} | {} | {}", ts, type_str, size_str, entry.preview);
        }
    }

    Ok(())
}

/// Clear clipboard history
fn execute_clear(json: bool) -> io::Result<()> {
    let mut history = ClipboardHistory::open()
        .map_err(|e| io::Error::other(format!("Failed to open clipboard history: {}", e)))?;

    let count = history.len();
    history
        .clear()
        .map_err(|e| io::Error::other(format!("Failed to clear history: {}", e)))?;

    if json {
        println!(
            "{}",
            serde_json::json!({
                "event": "clipboard_history_cleared",
                "entries_removed": count,
            })
        );
    } else {
        output::color::success(&format!(
            "Clipboard history cleared ({} entries removed).",
            count
        ));
    }

    Ok(())
}

// --- Helpers ---

/// Read clipboard image and encode as PNG bytes
fn read_and_encode_image() -> Option<Vec<u8>> {
    let (width, height, rgba) = output::image::read_clipboard_image()?;
    output::image::encode_rgba_as_png(width, height, &rgba)
}

/// Log an entry to the persistent clipboard history
fn log_to_history(
    data: &[u8],
    content_type: &ContentType,
    preview_str: &str,
    image_data: Option<&[u8]>,
) {
    let hash = hex::encode(blake3::hash(data).as_bytes());
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    let text_content = if matches!(content_type, ContentType::Image { .. }) {
        None
    } else {
        std::str::from_utf8(data).ok().map(String::from)
    };

    // Save image data to disk if present
    let image_path = if let Some(img) = image_data {
        if let ContentType::Image { ref format } = content_type {
            match tallow_store::clipboard::save_clipboard_image(img, &hash, format) {
                Ok(path) => Some(path),
                Err(e) => {
                    tracing::warn!("Failed to save clipboard image: {}", e);
                    None
                }
            }
        } else {
            None
        }
    } else {
        None
    };

    let entry = ClipboardEntry {
        id: hash.clone(),
        content_type: content_type.clone(),
        preview: preview_str.to_string(),
        size: data.len() as u64,
        timestamp,
        blake3_hash: hash,
        image_path,
        text_content,
    };

    if let Ok(mut history) = ClipboardHistory::open() {
        if let Err(e) = history.append(entry) {
            tracing::warn!("Failed to log to clipboard history: {}", e);
        }
    }
}

/// Format a Unix timestamp as a human-readable string
fn format_timestamp(secs: u64) -> String {
    // Safe cast: i64::MAX covers timestamps past year 292 billion, well beyond u64 practical use
    let secs_i64 = i64::try_from(secs).unwrap_or(i64::MAX);
    let dt = chrono::DateTime::from_timestamp(secs_i64, 0);
    match dt {
        Some(dt) => dt.format("%Y-%m-%d %H:%M").to_string(),
        None => "unknown".to_string(),
    }
}

/// Resolve a relay address string to a SocketAddr
#[allow(dead_code)]
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
