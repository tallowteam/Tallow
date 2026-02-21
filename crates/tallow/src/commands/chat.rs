//! Chat command implementation
//!
//! End-to-end encrypted real-time text chat over the relay.
//! Uses the same KEM handshake as file transfer, then switches
//! to a `tokio::select!` loop for bidirectional stdin/network I/O.

use crate::cli::ChatArgs;
use crate::output;
use bytes::BytesMut;
use std::io;
use tallow_net::transport::PeerChannel;
use tallow_protocol::wire::{codec::TallowCodec, Message};
use tokio::io::AsyncBufReadExt;

/// Maximum receive buffer size (256 KB)
const RECV_BUF_SIZE: usize = 256 * 1024;

/// Send a protocol message over the channel.
async fn encode_and_send(
    msg: &Message,
    codec: &mut TallowCodec,
    encode_buf: &mut BytesMut,
    channel: &mut tallow_net::transport::ConnectionResult,
) -> io::Result<()> {
    encode_buf.clear();
    codec
        .encode_msg(msg, encode_buf)
        .map_err(|e| io::Error::other(format!("encode: {e}")))?;
    channel
        .send_message(encode_buf)
        .await
        .map_err(|e| io::Error::other(format!("send: {e}")))?;
    Ok(())
}

/// Resolve relay address string to a SocketAddr.
fn resolve_relay(relay: &str) -> io::Result<std::net::SocketAddr> {
    if let Ok(addr) = relay.parse() {
        return Ok(addr);
    }
    use std::net::ToSocketAddrs;
    relay
        .to_socket_addrs()
        .map_err(|e| io::Error::other(format!("Cannot resolve relay '{}': {}", relay, e)))?
        .next()
        .ok_or_else(|| io::Error::other(format!("No addresses found for relay '{}'", relay)))
}

/// Execute chat command
pub async fn execute(args: ChatArgs, json: bool) -> io::Result<()> {
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

    // Determine role: initiator (no code) or joiner (code provided)
    let is_initiator = args.code.is_none();

    // Generate or accept code phrase
    let code_phrase = if let Some(ref code) = args.code {
        // Joiner: use provided code
        code.clone()
    } else if let Some(ref custom_code) = args.custom_code {
        // Initiator with custom code
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
    } else {
        // Initiator: generate code phrase
        tallow_protocol::room::code::generate_code_phrase(
            args.words
                .unwrap_or(tallow_protocol::room::code::DEFAULT_WORD_COUNT),
        )
    };

    // Derive room ID from code phrase
    let room_id = tallow_protocol::room::code::derive_room_id(&code_phrase);

    if is_initiator {
        if json {
            println!(
                "{}",
                serde_json::json!({
                    "event": "code_generated",
                    "code": code_phrase,
                    "room_id": hex::encode(room_id),
                    "chat_command": format!("tallow chat {}", code_phrase),
                })
            );
        } else {
            output::color::info("Code phrase:");
            output::color::code_phrase(&code_phrase);
            println!();
            output::color::section("On the other end, run:");
            println!("  tallow chat {}", code_phrase);
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
                output::clipboard::copy_to_clipboard(&format!("tallow chat {}", code_phrase));
                output::color::info("(chat command copied to clipboard)");
            }
        }
    } else if json {
        println!(
            "{}",
            serde_json::json!({
                "event": "connecting",
                "code": code_phrase,
                "room_id": hex::encode(room_id),
            })
        );
    } else {
        output::color::info("Connecting with code:");
        output::color::code_phrase(&code_phrase);
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

    // Establish relay connection (chat always uses relay, no LAN mode)
    let mut channel = if let Some(ref proxy) = proxy_config {
        let resolved = tallow_net::relay::resolve_relay_proxy(&args.relay, proxy_config.as_ref())
            .await
            .map_err(|e| io::Error::other(format!("Relay resolution failed: {e}")))?;

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
            .map_err(|e| io::Error::other(format!("Connection failed: {e}")))?;
        if !relay.peer_present() {
            if !json {
                output::color::info("Waiting for peer...");
            }
            relay
                .wait_for_peer()
                .await
                .map_err(|e| io::Error::other(format!("Waiting for peer failed: {e}")))?;
        }

        tallow_net::transport::ConnectionResult::Relay(Box::new(relay))
    } else {
        let relay_addr = resolve_relay(&args.relay)?;
        let mut relay = tallow_net::relay::RelayClient::new(relay_addr);
        relay
            .connect(&room_id, pw_ref)
            .await
            .map_err(|e| io::Error::other(format!("Connection failed: {e}")))?;
        if !relay.peer_present() {
            if !json {
                output::color::info("Waiting for peer...");
            }
            relay
                .wait_for_peer()
                .await
                .map_err(|e| io::Error::other(format!("Waiting for peer failed: {e}")))?;
        }

        tallow_net::transport::ConnectionResult::Relay(Box::new(relay))
    };

    if json {
        println!("{}", serde_json::json!({ "event": "peer_connected" }));
    } else {
        output::color::success("Peer connected!");
    }

    // Create codec and buffers
    let mut codec = TallowCodec::new();
    let mut encode_buf = BytesMut::new();
    let mut recv_buf = vec![0u8; RECV_BUF_SIZE];

    // --- KEM Handshake ---
    // Initiator (no code given) uses SenderHandshake (sends first).
    // Joiner (code provided) uses ReceiverHandshake (responds).
    let session_key = if is_initiator {
        sender_handshake(
            &code_phrase,
            &room_id,
            &mut codec,
            &mut encode_buf,
            &mut recv_buf,
            &mut channel,
        )
        .await?
    } else {
        receiver_handshake(
            &code_phrase,
            &room_id,
            &mut codec,
            &mut encode_buf,
            &mut recv_buf,
            &mut channel,
        )
        .await?
    };

    if json {
        println!("{}", serde_json::json!({ "event": "session_established" }));
    } else {
        output::color::success("Secure session established (KEM handshake complete)");
    }

    // Display verification string for MITM detection (opt-in via --verify)
    if args.verify {
        if json {
            output::verify::display_verification_json(session_key.as_bytes());
        } else {
            output::verify::display_verification(session_key.as_bytes(), true);
        }
    }

    // --- Chat Loop ---
    // Initiator uses even nonces (0, 2, 4...), joiner uses odd (1, 3, 5...)
    let session_key_bytes = *session_key.as_bytes();
    let mut nonce_counter: u64 = if is_initiator { 0 } else { 1 };
    let mut sequence: u64 = 0;

    let stdin = tokio::io::stdin();
    let reader = tokio::io::BufReader::new(stdin);
    let mut lines = reader.lines();

    if !json {
        output::color::info("Chat session started. Type /quit to exit.");
    }

    loop {
        tokio::select! {
            line_result = lines.next_line() => {
                match line_result? {
                    Some(text) if text.trim() == "/quit" => {
                        encode_and_send(&Message::ChatEnd, &mut codec, &mut encode_buf, &mut channel).await?;
                        if json {
                            println!("{}", serde_json::json!({ "event": "chat_ended", "reason": "local_quit" }));
                        } else {
                            output::color::info("Chat ended.");
                        }
                        break;
                    }
                    Some(text) if text.trim().is_empty() => {
                        continue;
                    }
                    Some(text) => {
                        // Validate message size
                        if text.len() > tallow_protocol::chat::MAX_CHAT_MESSAGE_SIZE {
                            if !json {
                                output::color::warning(&format!(
                                    "Message too large ({} bytes, max {}). Not sent.",
                                    text.len(),
                                    tallow_protocol::chat::MAX_CHAT_MESSAGE_SIZE,
                                ));
                            }
                            continue;
                        }

                        // Encrypt the message
                        let (ciphertext, nonce) = tallow_protocol::chat::encrypt_chat_text(
                            &text, &session_key_bytes, &mut nonce_counter,
                        ).map_err(|e| io::Error::other(format!("Encrypt: {e}")))?;

                        let message_id: [u8; 16] = rand::random();
                        let msg = Message::ChatText {
                            message_id,
                            sequence,
                            ciphertext,
                            nonce,
                        };
                        sequence += 1;

                        encode_and_send(&msg, &mut codec, &mut encode_buf, &mut channel).await?;

                        if json {
                            println!("{}", serde_json::json!({
                                "event": "chat_message",
                                "direction": "sent",
                                "text": text,
                            }));
                        } else {
                            output::color::info(&format!("You: {}", text));
                        }
                    }
                    None => {
                        // EOF on stdin (e.g., Ctrl+D)
                        encode_and_send(&Message::ChatEnd, &mut codec, &mut encode_buf, &mut channel).await?;
                        if json {
                            println!("{}", serde_json::json!({ "event": "chat_ended", "reason": "stdin_eof" }));
                        }
                        break;
                    }
                }
            }
            recv_result = channel.receive_message(&mut recv_buf) => {
                let n = recv_result.map_err(|e| io::Error::other(format!("recv: {e}")))?;
                let mut decode_buf = BytesMut::from(&recv_buf[..n]);
                let msg = codec.decode_msg(&mut decode_buf)
                    .map_err(|e| io::Error::other(format!("decode: {e}")))?;

                match msg {
                    Some(Message::ChatText { ciphertext, nonce, .. }) => {
                        match tallow_protocol::chat::decrypt_chat_text(
                            &ciphertext, &nonce, &session_key_bytes,
                        ) {
                            Ok(text) => {
                                if json {
                                    println!("{}", serde_json::json!({
                                        "event": "chat_message",
                                        "direction": "received",
                                        "text": text,
                                    }));
                                } else {
                                    output::color::success(&format!("Peer: {}", text));
                                }
                            }
                            Err(e) => {
                                if !json {
                                    output::color::warning(&format!("Failed to decrypt message: {e}"));
                                }
                                tracing::warn!("Chat decrypt failed: {e}");
                            }
                        }
                    }
                    Some(Message::ChatEnd) => {
                        if json {
                            println!("{}", serde_json::json!({ "event": "chat_ended", "reason": "peer_quit" }));
                        } else {
                            output::color::info("Peer ended the chat.");
                        }
                        break;
                    }
                    Some(Message::PeerDeparted) => {
                        if json {
                            println!("{}", serde_json::json!({ "event": "chat_ended", "reason": "peer_disconnected" }));
                        } else {
                            output::color::info("Peer disconnected.");
                        }
                        break;
                    }
                    Some(Message::Ping) => {
                        encode_and_send(&Message::Pong, &mut codec, &mut encode_buf, &mut channel).await?;
                    }
                    other => {
                        tracing::debug!("Ignoring unexpected message in chat: {:?}", other);
                    }
                }
            }
        }
    }

    channel.close().await;
    Ok(())
}

/// Run SenderHandshake (initiator role — 4-step handshake, sends first).
async fn sender_handshake(
    code_phrase: &str,
    room_id: &[u8; 32],
    codec: &mut TallowCodec,
    encode_buf: &mut BytesMut,
    recv_buf: &mut [u8],
    channel: &mut tallow_net::transport::ConnectionResult,
) -> io::Result<tallow_protocol::kex::SessionKey> {
    let mut handshake = tallow_protocol::kex::SenderHandshake::new(code_phrase, room_id);

    // Step 1: Send HandshakeInit
    let init_msg = handshake
        .init()
        .map_err(|e| io::Error::other(format!("Handshake init failed: {e}")))?;
    encode_buf.clear();
    codec
        .encode_msg(&init_msg, encode_buf)
        .map_err(|e| io::Error::other(format!("Encode HandshakeInit: {e}")))?;
    channel
        .send_message(encode_buf)
        .await
        .map_err(|e| io::Error::other(format!("Send HandshakeInit: {e}")))?;

    // Step 2: Receive HandshakeResponse
    let n = tokio::time::timeout(
        std::time::Duration::from_secs(30),
        channel.receive_message(recv_buf),
    )
    .await
    .map_err(|_| io::Error::other("Handshake timeout waiting for response"))?
    .map_err(|e| io::Error::other(format!("Receive HandshakeResponse: {e}")))?;

    let mut decode_buf = BytesMut::from(&recv_buf[..n]);
    let resp_msg = codec
        .decode_msg(&mut decode_buf)
        .map_err(|e| io::Error::other(format!("Decode HandshakeResponse: {e}")))?;

    match resp_msg {
        Some(Message::HandshakeResponse {
            selected_kem,
            cpace_public,
            kem_public_key,
            nonce,
        }) => {
            // Step 3: Process response -> HandshakeKem + session key
            let (kem_msg, session_key) = handshake
                .process_response(selected_kem, &cpace_public, &kem_public_key, &nonce)
                .map_err(|e| {
                    io::Error::other(format!("Handshake response processing failed: {e}"))
                })?;

            encode_buf.clear();
            codec
                .encode_msg(&kem_msg, encode_buf)
                .map_err(|e| io::Error::other(format!("Encode HandshakeKem: {e}")))?;
            channel
                .send_message(encode_buf)
                .await
                .map_err(|e| io::Error::other(format!("Send HandshakeKem: {e}")))?;

            // Step 4: Receive HandshakeComplete
            let n = tokio::time::timeout(
                std::time::Duration::from_secs(30),
                channel.receive_message(recv_buf),
            )
            .await
            .map_err(|_| io::Error::other("Handshake timeout waiting for confirmation"))?
            .map_err(|e| io::Error::other(format!("Receive HandshakeComplete: {e}")))?;

            let mut decode_buf = BytesMut::from(&recv_buf[..n]);
            let complete_msg = codec
                .decode_msg(&mut decode_buf)
                .map_err(|e| io::Error::other(format!("Decode HandshakeComplete: {e}")))?;

            match complete_msg {
                Some(Message::HandshakeComplete { confirmation }) => {
                    handshake
                        .verify_receiver_confirmation(&confirmation)
                        .map_err(|e| io::Error::other(format!("Key confirmation failed: {e}")))?;
                }
                other => {
                    channel.close().await;
                    return Err(io::Error::other(format!(
                        "Expected HandshakeComplete, got: {:?}",
                        other
                    )));
                }
            }

            Ok(session_key)
        }
        Some(Message::HandshakeFailed { reason }) => {
            channel.close().await;
            Err(io::Error::other(format!("Handshake failed: {reason}")))
        }
        other => {
            channel.close().await;
            Err(io::Error::other(format!(
                "Expected HandshakeResponse, got: {:?}",
                other
            )))
        }
    }
}

/// Run ReceiverHandshake (joiner role — 4-step handshake, responds to init).
async fn receiver_handshake(
    code_phrase: &str,
    room_id: &[u8; 32],
    codec: &mut TallowCodec,
    encode_buf: &mut BytesMut,
    recv_buf: &mut [u8],
    channel: &mut tallow_net::transport::ConnectionResult,
) -> io::Result<tallow_protocol::kex::SessionKey> {
    let mut handshake = tallow_protocol::kex::ReceiverHandshake::new(code_phrase, room_id);

    // Step 1: Receive HandshakeInit
    let n = tokio::time::timeout(
        std::time::Duration::from_secs(30),
        channel.receive_message(recv_buf),
    )
    .await
    .map_err(|_| io::Error::other("Handshake timeout waiting for init"))?
    .map_err(|e| io::Error::other(format!("Receive HandshakeInit: {e}")))?;

    let mut decode_buf = BytesMut::from(&recv_buf[..n]);
    let init_msg = codec
        .decode_msg(&mut decode_buf)
        .map_err(|e| io::Error::other(format!("Decode HandshakeInit: {e}")))?;

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
                .map_err(|e| io::Error::other(format!("Handshake init processing failed: {e}")))?;

            encode_buf.clear();
            codec
                .encode_msg(&resp, encode_buf)
                .map_err(|e| io::Error::other(format!("Encode HandshakeResponse: {e}")))?;
            channel
                .send_message(encode_buf)
                .await
                .map_err(|e| io::Error::other(format!("Send HandshakeResponse: {e}")))?;

            // Step 3: Receive HandshakeKem
            let n = tokio::time::timeout(
                std::time::Duration::from_secs(30),
                channel.receive_message(recv_buf),
            )
            .await
            .map_err(|_| io::Error::other("Handshake timeout waiting for KEM"))?
            .map_err(|e| io::Error::other(format!("Receive HandshakeKem: {e}")))?;

            let mut decode_buf = BytesMut::from(&recv_buf[..n]);
            let kem_msg = codec
                .decode_msg(&mut decode_buf)
                .map_err(|e| io::Error::other(format!("Decode HandshakeKem: {e}")))?;

            match kem_msg {
                Some(Message::HandshakeKem {
                    kem_ciphertext,
                    confirmation,
                }) => {
                    let (complete_msg, session_key) = handshake
                        .process_kem(&kem_ciphertext, &confirmation)
                        .map_err(|e| io::Error::other(format!("Handshake KEM failed: {e}")))?;

                    // Step 4: Send HandshakeComplete
                    encode_buf.clear();
                    codec
                        .encode_msg(&complete_msg, encode_buf)
                        .map_err(|e| io::Error::other(format!("Encode HandshakeComplete: {e}")))?;
                    channel
                        .send_message(encode_buf)
                        .await
                        .map_err(|e| io::Error::other(format!("Send HandshakeComplete: {e}")))?;

                    Ok(session_key)
                }
                other => {
                    channel.close().await;
                    Err(io::Error::other(format!(
                        "Expected HandshakeKem, got: {:?}",
                        other
                    )))
                }
            }
        }
        Some(Message::HandshakeFailed { reason }) => {
            channel.close().await;
            Err(io::Error::other(format!("Handshake failed: {reason}")))
        }
        other => {
            channel.close().await;
            Err(io::Error::other(format!(
                "Expected HandshakeInit, got: {:?}",
                other
            )))
        }
    }
}
