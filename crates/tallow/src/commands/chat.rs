//! Chat command implementation
//!
//! End-to-end encrypted real-time text chat over the relay.
//! Uses the same KEM handshake as file transfer, then switches
//! to a `tokio::select!` loop for bidirectional stdin/network I/O.
//!
//! Multi-peer mode (--multi) supports N peers with pairwise KEM
//! handshakes and per-pair AES-256-GCM encryption via Targeted
//! message routing through the relay.

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

    // Multi-peer mode: dispatch to dedicated handler
    if args.multi {
        return execute_multi(args, json, code_phrase, room_id, proxy_config).await;
    }

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

// ---------------------------------------------------------------------------
// Multi-peer chat (Phase 19)
// ---------------------------------------------------------------------------

/// Execute multi-peer chat mode.
///
/// Joins a multi-peer room on the relay, performs pairwise KEM handshakes
/// with all existing peers, then enters a chat loop that encrypts each
/// outbound message per-peer and decrypts inbound messages from the
/// corresponding peer session.
async fn execute_multi(
    args: ChatArgs,
    json: bool,
    code_phrase: String,
    room_id: [u8; 32],
    proxy_config: Option<tallow_net::privacy::ProxyConfig>,
) -> io::Result<()> {
    // Hash relay password for authentication
    let password_hash: Option<[u8; 32]> = args
        .relay_pass
        .as_ref()
        .map(|pass| blake3::hash(pass.as_bytes()).into());

    if args.relay_pass.is_some() && std::env::var("TALLOW_RELAY_PASS").is_err() {
        tracing::warn!(
            "Relay password passed via CLI argument -- visible in process list. \
             Use TALLOW_RELAY_PASS env var for better security."
        );
    }

    // Build the RoomJoinMulti payload (postcard-serialized)
    let join_msg = Message::RoomJoinMulti {
        room_id: room_id.to_vec(),
        password_hash: password_hash.map(|h| h.to_vec()),
        requested_capacity: args.capacity,
    };
    let join_payload = postcard::to_stdvec(&join_msg)
        .map_err(|e| io::Error::other(format!("encode RoomJoinMulti: {e}")))?;

    // Connect to relay with raw join payload
    let mut relay = if let Some(ref proxy) = proxy_config {
        if !json {
            if proxy.tor_mode {
                output::color::info("Routing through Tor...");
            } else {
                output::color::info(&format!("Routing through proxy {}...", proxy.socks5_addr));
            }
        }

        let resolved = tallow_net::relay::resolve_relay_proxy(&args.relay, proxy_config.as_ref())
            .await
            .map_err(|e| io::Error::other(format!("Relay resolution failed: {e}")))?;

        match resolved {
            tallow_net::relay::ResolvedRelay::Addr(addr) => {
                let mut client = tallow_net::relay::RelayClient::new(addr);
                client.set_proxy(proxy.clone());
                client
            }
            tallow_net::relay::ResolvedRelay::Hostname { ref host, port } => {
                tallow_net::relay::RelayClient::new_with_proxy(host, port, proxy.clone())
            }
        }
    } else {
        let relay_addr = resolve_relay(&args.relay)?;
        tallow_net::relay::RelayClient::new(relay_addr)
    };

    let response_bytes = relay
        .connect_raw(&join_payload)
        .await
        .map_err(|e| io::Error::other(format!("Connection failed: {e}")))?;

    // Parse RoomJoinedMulti from response
    let joined: Message = postcard::from_bytes(&response_bytes)
        .map_err(|e| io::Error::other(format!("decode RoomJoinedMulti: {e}")))?;

    let (my_peer_id, existing_peers) = match joined {
        Message::RoomJoinedMulti {
            peer_id,
            existing_peers,
        } => (peer_id, existing_peers),
        other => {
            relay.close().await;
            return Err(io::Error::other(format!(
                "Expected RoomJoinedMulti, got: {:?}",
                other
            )));
        }
    };

    if json {
        println!(
            "{}",
            serde_json::json!({
                "event": "multi_room_joined",
                "peer_id": my_peer_id,
                "existing_peers": existing_peers,
                "code": code_phrase,
            })
        );
    } else {
        output::color::success(&format!(
            "Joined multi-peer room as peer {} ({} existing peer{})",
            my_peer_id,
            existing_peers.len(),
            if existing_peers.len() == 1 { "" } else { "s" },
        ));
        output::color::info("Code phrase:");
        output::color::code_phrase(&code_phrase);
        println!();
        output::color::section("Others join with:");
        println!("  tallow chat --multi {}", code_phrase);
        println!();
    }

    // Wrap relay as ConnectionResult for PeerChannel trait
    let mut channel = tallow_net::transport::ConnectionResult::Relay(Box::new(relay));

    // Create codec and buffers
    let mut codec = TallowCodec::new();
    let mut encode_buf = BytesMut::new();
    let mut recv_buf = vec![0u8; RECV_BUF_SIZE];

    // Initialize multi-peer session manager
    let mut sessions = tallow_protocol::multi::MultiPeerSessions::new(my_peer_id);

    // Perform pairwise KEM handshakes with all existing peers
    for &peer_id in &existing_peers {
        let session_key = if sessions.is_initiator_for(peer_id) {
            multi_sender_handshake(
                &code_phrase,
                &room_id,
                my_peer_id,
                peer_id,
                &mut codec,
                &mut encode_buf,
                &mut recv_buf,
                &mut channel,
            )
            .await?
        } else {
            multi_receiver_handshake(
                &code_phrase,
                &room_id,
                my_peer_id,
                peer_id,
                &mut codec,
                &mut encode_buf,
                &mut recv_buf,
                &mut channel,
            )
            .await?
        };

        sessions
            .add_session(session_key.as_bytes(), peer_id)
            .map_err(|e| io::Error::other(format!("Key derivation failed: {e}")))?;

        if json {
            println!(
                "{}",
                serde_json::json!({
                    "event": "peer_session_established",
                    "peer_id": peer_id,
                })
            );
        } else {
            output::color::success(&format!("Secure session with peer {}", peer_id));
        }
    }

    if json {
        println!("{}", serde_json::json!({ "event": "session_established" }));
    } else {
        output::color::info("Chat session started. Type /quit to exit.");
    }

    // --- Multi-peer chat loop ---
    let stdin = tokio::io::stdin();
    let reader = tokio::io::BufReader::new(stdin);
    let mut lines = reader.lines();
    let mut sequence: u64 = 0;

    loop {
        tokio::select! {
            line_result = lines.next_line() => {
                match line_result? {
                    Some(text) if text.trim() == "/quit" => {
                        // Broadcast ChatEnd to all peers
                        let end_payload = postcard::to_stdvec(&Message::ChatEnd)
                            .map_err(|e| io::Error::other(format!("encode ChatEnd: {e}")))?;
                        let broadcast = Message::Targeted {
                            from_peer: my_peer_id,
                            to_peer: 0xFF,
                            payload: end_payload,
                        };
                        encode_and_send(&broadcast, &mut codec, &mut encode_buf, &mut channel).await?;
                        if json {
                            println!("{}", serde_json::json!({ "event": "chat_ended", "reason": "local_quit" }));
                        } else {
                            output::color::info("Chat ended.");
                        }
                        break;
                    }
                    Some(text) if text.trim().is_empty() => continue,
                    Some(text) => {
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

                        // Encrypt and send to each peer with their pairwise key
                        let message_id: [u8; 16] = rand::random();
                        for (_peer_id, session) in sessions.iter_mut() {
                            let nonce_val = session.next_send_nonce();
                            let mut nonce = [0u8; 12];
                            nonce[4..12].copy_from_slice(&nonce_val.to_be_bytes());

                            let ciphertext = tallow_crypto::symmetric::aes_encrypt(
                                session.send_key(),
                                &nonce,
                                text.as_bytes(),
                                b"tallow-chat-v1",
                            )
                            .map_err(|e| io::Error::other(format!("encrypt: {e}")))?;

                            let chat_msg = Message::ChatText {
                                message_id,
                                sequence,
                                ciphertext,
                                nonce,
                            };
                            let inner_bytes = postcard::to_stdvec(&chat_msg)
                                .map_err(|e| io::Error::other(format!("encode ChatText: {e}")))?;

                            let targeted = Message::Targeted {
                                from_peer: my_peer_id,
                                to_peer: session.peer_id(),
                                payload: inner_bytes,
                            };
                            encode_and_send(&targeted, &mut codec, &mut encode_buf, &mut channel).await?;
                        }
                        sequence += 1;

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
                        // EOF on stdin
                        let end_payload = postcard::to_stdvec(&Message::ChatEnd)
                            .map_err(|e| io::Error::other(format!("encode ChatEnd: {e}")))?;
                        let broadcast = Message::Targeted {
                            from_peer: my_peer_id,
                            to_peer: 0xFF,
                            payload: end_payload,
                        };
                        let _ = encode_and_send(&broadcast, &mut codec, &mut encode_buf, &mut channel).await;
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
                    Some(Message::Targeted { from_peer, payload, .. }) => {
                        handle_targeted_message(
                            from_peer, &payload, &code_phrase, &room_id,
                            my_peer_id, &mut sessions,
                            &mut codec, &mut encode_buf, &mut recv_buf, &mut channel,
                            json,
                        ).await?;
                    }
                    Some(Message::PeerJoinedRoom { peer_id }) => {
                        if json {
                            println!("{}", serde_json::json!({
                                "event": "peer_joined",
                                "peer_id": peer_id,
                            }));
                        } else {
                            output::color::info(&format!("Peer {} joined the room.", peer_id));
                        }
                        // Initiate handshake if we have the lower ID
                        if my_peer_id < peer_id {
                            let session_key = multi_sender_handshake(
                                &code_phrase, &room_id, my_peer_id, peer_id,
                                &mut codec, &mut encode_buf, &mut recv_buf, &mut channel,
                            ).await?;
                            sessions.add_session(session_key.as_bytes(), peer_id)
                                .map_err(|e| io::Error::other(format!("Key derivation: {e}")))?;
                            if json {
                                println!("{}", serde_json::json!({
                                    "event": "peer_session_established",
                                    "peer_id": peer_id,
                                }));
                            } else {
                                output::color::success(&format!("Secure session with peer {}", peer_id));
                            }
                        }
                        // If we have the higher ID, we wait for their HandshakeInit via Targeted
                    }
                    Some(Message::PeerLeftRoom { peer_id }) => {
                        sessions.remove_session(peer_id);
                        if json {
                            println!("{}", serde_json::json!({
                                "event": "peer_left",
                                "peer_id": peer_id,
                            }));
                        } else {
                            output::color::info(&format!("Peer {} left the room.", peer_id));
                        }
                    }
                    Some(Message::RoomPeerCount { count, capacity }) => {
                        if !json {
                            output::color::info(&format!("Room: {}/{} peers", count, capacity));
                        }
                    }
                    Some(Message::Ping) => {
                        encode_and_send(&Message::Pong, &mut codec, &mut encode_buf, &mut channel).await?;
                    }
                    _ => {}
                }
            }
        }
    }

    channel.close().await;
    Ok(())
}

/// Handle an incoming Targeted message in multi-peer mode.
///
/// Dispatches on the inner message type: chat text, handshake init, chat end.
#[allow(clippy::too_many_arguments)]
async fn handle_targeted_message(
    from_peer: u8,
    payload: &[u8],
    code_phrase: &str,
    room_id: &[u8; 32],
    my_peer_id: u8,
    sessions: &mut tallow_protocol::multi::MultiPeerSessions,
    codec: &mut TallowCodec,
    encode_buf: &mut BytesMut,
    recv_buf: &mut [u8],
    channel: &mut tallow_net::transport::ConnectionResult,
    json: bool,
) -> io::Result<()> {
    let inner: Message = match postcard::from_bytes(payload) {
        Ok(m) => m,
        Err(e) => {
            tracing::warn!(
                "Failed to decode inner message from peer {}: {}",
                from_peer,
                e
            );
            return Ok(());
        }
    };

    match inner {
        Message::ChatText {
            ciphertext, nonce, ..
        } => {
            if let Some(session) = sessions.get(&from_peer) {
                match tallow_crypto::symmetric::aes_decrypt(
                    session.recv_key(),
                    &nonce,
                    &ciphertext,
                    b"tallow-chat-v1",
                ) {
                    Ok(plaintext_bytes) => {
                        let text = String::from_utf8_lossy(&plaintext_bytes);
                        let safe = tallow_protocol::transfer::sanitize::sanitize_display(&text);
                        if json {
                            println!(
                                "{}",
                                serde_json::json!({
                                    "event": "chat_message",
                                    "direction": "received",
                                    "peer_id": from_peer,
                                    "text": safe,
                                })
                            );
                        } else {
                            output::color::success(&format!("Peer {}: {}", from_peer, safe));
                        }
                    }
                    Err(e) => {
                        tracing::warn!("Decrypt from peer {} failed: {}", from_peer, e);
                        if !json {
                            output::color::warning(&format!(
                                "Failed to decrypt message from peer {}",
                                from_peer
                            ));
                        }
                    }
                }
            } else {
                tracing::warn!("No session for peer {}, dropping message", from_peer);
            }
        }
        Message::ChatEnd => {
            sessions.remove_session(from_peer);
            if json {
                println!(
                    "{}",
                    serde_json::json!({
                        "event": "peer_chat_ended",
                        "peer_id": from_peer,
                    })
                );
            } else {
                output::color::info(&format!("Peer {} left the chat.", from_peer));
            }
        }
        Message::HandshakeInit {
            protocol_version,
            kem_capabilities,
            cpace_public,
            nonce,
        } => {
            // Late-joiner handshake: a new peer is initiating KEM with us
            tracing::info!("Received handshake init from peer {}", from_peer);
            let session_key = handle_incoming_handshake(
                code_phrase,
                room_id,
                my_peer_id,
                from_peer,
                protocol_version,
                &kem_capabilities,
                &cpace_public,
                &nonce,
                codec,
                encode_buf,
                recv_buf,
                channel,
            )
            .await?;
            sessions
                .add_session(session_key.as_bytes(), from_peer)
                .map_err(|e| io::Error::other(format!("Key derivation: {e}")))?;
            if json {
                println!(
                    "{}",
                    serde_json::json!({
                        "event": "peer_session_established",
                        "peer_id": from_peer,
                    })
                );
            } else {
                output::color::success(&format!("Secure session with peer {}", from_peer));
            }
        }
        _ => {
            tracing::debug!("Ignoring inner message type from peer {}", from_peer);
        }
    }

    Ok(())
}

/// Perform KEM handshake as initiator, routing via Targeted messages.
///
/// Wraps the existing `SenderHandshake` but sends/receives through
/// `Targeted` envelopes for multi-peer relay routing.
#[allow(clippy::too_many_arguments)]
async fn multi_sender_handshake(
    code_phrase: &str,
    room_id: &[u8; 32],
    my_peer_id: u8,
    their_peer_id: u8,
    codec: &mut TallowCodec,
    encode_buf: &mut BytesMut,
    recv_buf: &mut [u8],
    channel: &mut tallow_net::transport::ConnectionResult,
) -> io::Result<tallow_protocol::kex::SessionKey> {
    let mut handshake = tallow_protocol::kex::SenderHandshake::new(code_phrase, room_id);

    // Step 1: Send HandshakeInit -> targeted to their_peer_id
    let init_msg = handshake
        .init()
        .map_err(|e| io::Error::other(format!("handshake init: {e}")))?;
    let init_bytes = postcard::to_stdvec(&init_msg)
        .map_err(|e| io::Error::other(format!("encode init: {e}")))?;
    let targeted = Message::Targeted {
        from_peer: my_peer_id,
        to_peer: their_peer_id,
        payload: init_bytes,
    };
    encode_and_send(&targeted, codec, encode_buf, channel).await?;

    // Step 2: Wait for HandshakeResponse from their_peer_id
    let (selected_kem, cpace_public, kem_public_key, nonce) = loop {
        let n = tokio::time::timeout(
            std::time::Duration::from_secs(30),
            channel.receive_message(recv_buf),
        )
        .await
        .map_err(|_| io::Error::other("handshake timeout waiting for response"))?
        .map_err(|e| io::Error::other(format!("recv: {e}")))?;

        let mut db = BytesMut::from(&recv_buf[..n]);
        let msg = codec
            .decode_msg(&mut db)
            .map_err(|e| io::Error::other(format!("decode: {e}")))?;

        if let Some(Message::Targeted {
            from_peer, payload, ..
        }) = msg
        {
            if from_peer == their_peer_id {
                if let Ok(Message::HandshakeResponse {
                    selected_kem,
                    cpace_public,
                    kem_public_key,
                    nonce,
                }) = postcard::from_bytes::<Message>(&payload)
                {
                    break (selected_kem, cpace_public, kem_public_key, nonce);
                }
            }
        }
        // Ignore non-matching messages (from other peers during handshake)
    };

    // Step 3: Process response -> send HandshakeKem
    let (kem_msg, session_key) = handshake
        .process_response(selected_kem, &cpace_public, &kem_public_key, &nonce)
        .map_err(|e| io::Error::other(format!("handshake response: {e}")))?;
    let kem_bytes =
        postcard::to_stdvec(&kem_msg).map_err(|e| io::Error::other(format!("encode kem: {e}")))?;
    let targeted = Message::Targeted {
        from_peer: my_peer_id,
        to_peer: their_peer_id,
        payload: kem_bytes,
    };
    encode_and_send(&targeted, codec, encode_buf, channel).await?;

    // Step 4: Wait for HandshakeComplete
    let confirmation = loop {
        let n = tokio::time::timeout(
            std::time::Duration::from_secs(30),
            channel.receive_message(recv_buf),
        )
        .await
        .map_err(|_| io::Error::other("handshake timeout waiting for confirmation"))?
        .map_err(|e| io::Error::other(format!("recv: {e}")))?;

        let mut db = BytesMut::from(&recv_buf[..n]);
        let msg = codec
            .decode_msg(&mut db)
            .map_err(|e| io::Error::other(format!("decode: {e}")))?;

        if let Some(Message::Targeted {
            from_peer, payload, ..
        }) = msg
        {
            if from_peer == their_peer_id {
                if let Ok(Message::HandshakeComplete { confirmation }) =
                    postcard::from_bytes::<Message>(&payload)
                {
                    break confirmation;
                }
            }
        }
    };

    handshake
        .verify_receiver_confirmation(&confirmation)
        .map_err(|e| io::Error::other(format!("key confirmation: {e}")))?;

    Ok(session_key)
}

/// Perform KEM handshake as receiver, routing via Targeted messages.
///
/// Wraps the existing `ReceiverHandshake` but sends/receives through
/// `Targeted` envelopes for multi-peer relay routing.
#[allow(clippy::too_many_arguments)]
async fn multi_receiver_handshake(
    code_phrase: &str,
    room_id: &[u8; 32],
    my_peer_id: u8,
    their_peer_id: u8,
    codec: &mut TallowCodec,
    encode_buf: &mut BytesMut,
    recv_buf: &mut [u8],
    channel: &mut tallow_net::transport::ConnectionResult,
) -> io::Result<tallow_protocol::kex::SessionKey> {
    let mut handshake = tallow_protocol::kex::ReceiverHandshake::new(code_phrase, room_id);

    // Step 1: Wait for HandshakeInit from their_peer_id
    let (protocol_version, kem_capabilities, cpace_public, nonce) = loop {
        let n = tokio::time::timeout(
            std::time::Duration::from_secs(30),
            channel.receive_message(recv_buf),
        )
        .await
        .map_err(|_| io::Error::other("handshake timeout waiting for init"))?
        .map_err(|e| io::Error::other(format!("recv: {e}")))?;

        let mut db = BytesMut::from(&recv_buf[..n]);
        let msg = codec
            .decode_msg(&mut db)
            .map_err(|e| io::Error::other(format!("decode: {e}")))?;

        if let Some(Message::Targeted {
            from_peer, payload, ..
        }) = msg
        {
            if from_peer == their_peer_id {
                if let Ok(Message::HandshakeInit {
                    protocol_version,
                    kem_capabilities,
                    cpace_public,
                    nonce,
                }) = postcard::from_bytes::<Message>(&payload)
                {
                    break (protocol_version, kem_capabilities, cpace_public, nonce);
                }
            }
        }
    };

    // Step 2: Process init -> send HandshakeResponse
    let resp = handshake
        .process_init(protocol_version, &kem_capabilities, &cpace_public, &nonce)
        .map_err(|e| io::Error::other(format!("handshake init processing: {e}")))?;
    let resp_bytes = postcard::to_stdvec(&resp)
        .map_err(|e| io::Error::other(format!("encode response: {e}")))?;
    let targeted = Message::Targeted {
        from_peer: my_peer_id,
        to_peer: their_peer_id,
        payload: resp_bytes,
    };
    encode_and_send(&targeted, codec, encode_buf, channel).await?;

    // Step 3: Wait for HandshakeKem
    let (kem_ciphertext, confirmation) = loop {
        let n = tokio::time::timeout(
            std::time::Duration::from_secs(30),
            channel.receive_message(recv_buf),
        )
        .await
        .map_err(|_| io::Error::other("handshake timeout waiting for KEM"))?
        .map_err(|e| io::Error::other(format!("recv: {e}")))?;

        let mut db = BytesMut::from(&recv_buf[..n]);
        let msg = codec
            .decode_msg(&mut db)
            .map_err(|e| io::Error::other(format!("decode: {e}")))?;

        if let Some(Message::Targeted {
            from_peer, payload, ..
        }) = msg
        {
            if from_peer == their_peer_id {
                if let Ok(Message::HandshakeKem {
                    kem_ciphertext,
                    confirmation,
                }) = postcard::from_bytes::<Message>(&payload)
                {
                    break (kem_ciphertext, confirmation);
                }
            }
        }
    };

    // Step 4: Process KEM -> send HandshakeComplete
    let (complete_msg, session_key) = handshake
        .process_kem(&kem_ciphertext, &confirmation)
        .map_err(|e| io::Error::other(format!("handshake KEM: {e}")))?;
    let complete_bytes = postcard::to_stdvec(&complete_msg)
        .map_err(|e| io::Error::other(format!("encode complete: {e}")))?;
    let targeted = Message::Targeted {
        from_peer: my_peer_id,
        to_peer: their_peer_id,
        payload: complete_bytes,
    };
    encode_and_send(&targeted, codec, encode_buf, channel).await?;

    Ok(session_key)
}

/// Handle an incoming HandshakeInit from a late-joining peer.
///
/// Acts as receiver for the KEM handshake steps 2-4 (we already have
/// their step 1 data).
#[allow(clippy::too_many_arguments)]
async fn handle_incoming_handshake(
    code_phrase: &str,
    room_id: &[u8; 32],
    my_peer_id: u8,
    from_peer: u8,
    protocol_version: u32,
    kem_capabilities: &[u8],
    cpace_public: &[u8; 32],
    nonce: &[u8; 16],
    codec: &mut TallowCodec,
    encode_buf: &mut BytesMut,
    recv_buf: &mut [u8],
    channel: &mut tallow_net::transport::ConnectionResult,
) -> io::Result<tallow_protocol::kex::SessionKey> {
    let mut handshake = tallow_protocol::kex::ReceiverHandshake::new(code_phrase, room_id);

    // Step 2: Process init (we already have the data) -> send HandshakeResponse
    let resp = handshake
        .process_init(protocol_version, kem_capabilities, cpace_public, nonce)
        .map_err(|e| io::Error::other(format!("handshake init processing: {e}")))?;
    let resp_bytes = postcard::to_stdvec(&resp)
        .map_err(|e| io::Error::other(format!("encode response: {e}")))?;
    let targeted = Message::Targeted {
        from_peer: my_peer_id,
        to_peer: from_peer,
        payload: resp_bytes,
    };
    encode_and_send(&targeted, codec, encode_buf, channel).await?;

    // Step 3: Wait for HandshakeKem from the initiating peer
    let (kem_ciphertext, confirmation) = loop {
        let n = tokio::time::timeout(
            std::time::Duration::from_secs(30),
            channel.receive_message(recv_buf),
        )
        .await
        .map_err(|_| io::Error::other("handshake timeout waiting for KEM"))?
        .map_err(|e| io::Error::other(format!("recv: {e}")))?;

        let mut db = BytesMut::from(&recv_buf[..n]);
        let msg = codec
            .decode_msg(&mut db)
            .map_err(|e| io::Error::other(format!("decode: {e}")))?;

        if let Some(Message::Targeted {
            from_peer: sender,
            payload,
            ..
        }) = msg
        {
            if sender == from_peer {
                if let Ok(Message::HandshakeKem {
                    kem_ciphertext,
                    confirmation,
                }) = postcard::from_bytes::<Message>(&payload)
                {
                    break (kem_ciphertext, confirmation);
                }
            }
        }
    };

    // Step 4: Process KEM -> send HandshakeComplete
    let (complete_msg, session_key) = handshake
        .process_kem(&kem_ciphertext, &confirmation)
        .map_err(|e| io::Error::other(format!("handshake KEM: {e}")))?;
    let complete_bytes = postcard::to_stdvec(&complete_msg)
        .map_err(|e| io::Error::other(format!("encode complete: {e}")))?;
    let targeted = Message::Targeted {
        from_peer: my_peer_id,
        to_peer: from_peer,
        payload: complete_bytes,
    };
    encode_and_send(&targeted, codec, encode_buf, channel).await?;

    Ok(session_key)
}
