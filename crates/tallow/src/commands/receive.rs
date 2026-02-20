//! Receive command implementation

use crate::cli::ReceiveArgs;
use crate::output;
use bytes::BytesMut;
use std::io::{self, IsTerminal, Write};
use std::path::PathBuf;
use tallow_protocol::transfer::manifest::TransferType;
use tallow_protocol::wire::{codec::TallowCodec, Message};

/// Maximum receive buffer size (256 KB)
const RECV_BUF_SIZE: usize = 256 * 1024;

/// Execute receive command
pub async fn execute(args: ReceiveArgs, json: bool) -> io::Result<()> {
    // LAN advertise via mDNS
    let mut _mdns_discovery = None;
    if args.advertise {
        if !json {
            output::color::info("Advertising on LAN for peer discovery...");
        }
        let mut discovery =
            tallow_net::discovery::MdnsDiscovery::new("tallow-receiver".to_string());
        if let Err(e) = discovery.advertise(4433, "tallow-receiver") {
            tracing::warn!("LAN advertise failed: {}", e);
        }
        // Keep discovery alive for the duration of the transfer
        _mdns_discovery = Some(discovery);
    }

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
        output::color::info("Connecting with code:");
        output::color::code_phrase(&code_phrase);
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

    // Display verification string for MITM detection (opt-in via --verify)
    if args.verify {
        if json {
            output::verify::display_verification_json(session_key.as_bytes());
        } else {
            output::verify::display_verification(session_key.as_bytes(), true);
        }
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

    // Check for resume from a previous interrupted transfer
    if let Some(ref resume_id) = args.resume_id {
        // Sanitize resume_id to prevent path traversal
        let safe_resume_id: String = resume_id
            .chars()
            .filter(|c| c.is_alphanumeric() || *c == '-' || *c == '_')
            .collect();
        let checkpoint_path = tallow_store::persistence::data_dir()
            .join("checkpoints")
            .join(format!("{}.checkpoint", safe_resume_id));
        if checkpoint_path.exists() {
            if let Ok(data) = std::fs::read(&checkpoint_path) {
                match tallow_protocol::transfer::resume::ResumeState::restore(&data) {
                    Ok(resume_state) => {
                        if json {
                            println!(
                                "{}",
                                serde_json::json!({
                                    "event": "resuming",
                                    "resume_id": resume_id,
                                    "completion": resume_state.completion_percentage(),
                                })
                            );
                        } else {
                            output::color::info(&format!(
                                "Resuming from checkpoint ({:.1}% complete)...",
                                resume_state.completion_percentage()
                            ));
                        }
                        pipeline = pipeline.with_resume(resume_state);
                    }
                    Err(e) => {
                        tracing::warn!("Failed to restore checkpoint: {}", e);
                    }
                }
            }
        } else {
            tracing::info!("No checkpoint found at {}", checkpoint_path.display());
        }
    }

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

    let is_text_transfer = manifest.transfer_type == TransferType::Text;

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
        println!();
    }

    // Check for existing files (overwrite protection)
    if !is_text_transfer && !args.overwrite {
        let mut conflicts = Vec::new();
        for entry in manifest.files.iter() {
            let target = output_dir.join(&entry.path);
            if target.exists() {
                conflicts.push(target);
            }
        }
        if !conflicts.is_empty() && !json {
            output::color::warning("The following files already exist:");
            for path in &conflicts {
                println!("  {}", path.display());
            }
            if !args.yes && !args.auto_accept {
                let overwrite = output::prompts::confirm_with_default(
                    "Overwrite existing files?",
                    false,
                )?;
                if !overwrite {
                    let reject_msg = Message::FileReject {
                        transfer_id,
                        reason: "file conflict -- receiver declined overwrite".to_string(),
                    };
                    encode_buf.clear();
                    codec
                        .encode_msg(&reject_msg, &mut encode_buf)
                        .map_err(|e| io::Error::other(format!("Encode reject: {}", e)))?;
                    relay
                        .forward(&encode_buf)
                        .await
                        .map_err(|e| io::Error::other(format!("Send reject: {}", e)))?;
                    relay.close().await;
                    output::color::info("Transfer declined due to file conflicts.");
                    return Ok(());
                }
            }
        }
    }

    // Prompt for confirmation unless --yes or --auto-accept
    let accepted = if args.yes || args.auto_accept {
        true
    } else if json {
        // JSON mode cannot prompt interactively; require --yes
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "JSON mode requires --yes flag to accept transfers",
        ));
    } else {
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
            reason: "declined by receiver".to_string(),
        };
        encode_buf.clear();
        codec
            .encode_msg(&reject_msg, &mut encode_buf)
            .map_err(|e| io::Error::other(format!("Encode FileReject failed: {}", e)))?;
        relay
            .forward(&encode_buf)
            .await
            .map_err(|e| io::Error::other(format!("Send FileReject failed: {}", e)))?;
        relay.close().await;

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
        .map_err(|e| io::Error::other(format!("Encode FileAccept failed: {}", e)))?;
    relay
        .forward(&encode_buf)
        .await
        .map_err(|e| io::Error::other(format!("Send FileAccept failed: {}", e)))?;

    if !json {
        output::color::info("Transfer accepted. Receiving...");
    }

    // Create progress bar
    let transfer_start = std::time::Instant::now();
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

                // Save checkpoint every 100 chunks for resume support
                if index % 100 == 0 {
                    if let Some(resume_state) = pipeline.resume_state() {
                        if let Ok(data) = resume_state.checkpoint() {
                            let checkpoint_dir =
                                tallow_store::persistence::data_dir().join("checkpoints");
                            let _ = std::fs::create_dir_all(&checkpoint_dir);
                            let checkpoint_path = checkpoint_dir
                                .join(format!("{}.checkpoint", hex::encode(transfer_id)));
                            let _ = std::fs::write(&checkpoint_path, data);
                        }
                    }
                }

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
                let safe_error =
                    tallow_protocol::transfer::sanitize::sanitize_display(&error);
                let msg = format!("Transfer error from sender: {}", safe_error);
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

    // Clean up checkpoint on success
    let checkpoint_path = tallow_store::persistence::data_dir()
        .join("checkpoints")
        .join(format!("{}.checkpoint", hex::encode(transfer_id)));
    let _ = std::fs::remove_file(&checkpoint_path);

    // Close relay connection
    relay.close().await;

    // Handle text transfers vs file transfers
    let is_stdout_pipe = !std::io::stdout().is_terminal();

    if is_text_transfer {
        // Text transfer: read the virtual file and output to terminal/stdout
        let text_path = output_dir.join("_tallow_text_");
        if text_path.exists() {
            let content = tokio::fs::read(&text_path)
                .await
                .map_err(|e| io::Error::other(format!("Read text content: {}", e)))?;

            if is_stdout_pipe || json {
                // Pipe mode: raw output to stdout
                std::io::stdout()
                    .write_all(&content)
                    .map_err(|e| io::Error::other(format!("stdout write: {}", e)))?;
            } else {
                // Interactive terminal: display with formatting
                match std::str::from_utf8(&content) {
                    Ok(text) => {
                        println!();
                        println!("{}", text);
                    }
                    Err(_) => {
                        output::color::warning(
                            "Received binary data; saving to file instead of displaying",
                        );
                    }
                }
            }

            // Clean up the virtual file (don't leave _tallow_text_ on disk)
            let _ = tokio::fs::remove_file(&text_path).await;
        }

        if !json && !is_stdout_pipe {
            output::color::success("Text received.");
        }
    } else if json {
        println!(
            "{}",
            serde_json::json!({
                "event": "transfer_complete",
                "total_bytes": total_size,
                "total_chunks": total_chunks,
                "files": written_files.iter().map(|f| f.display().to_string()).collect::<Vec<_>>(),
            })
        );
    } else if is_stdout_pipe && written_files.len() == 1 {
        // Single file received with stdout piped: cat to stdout
        let content = tokio::fs::read(&written_files[0])
            .await
            .map_err(|e| io::Error::other(format!("Read for stdout: {}", e)))?;
        std::io::stdout()
            .write_all(&content)
            .map_err(|e| io::Error::other(format!("stdout write: {}", e)))?;
    } else {
        output::color::transfer_complete(total_size, transfer_start.elapsed());
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
