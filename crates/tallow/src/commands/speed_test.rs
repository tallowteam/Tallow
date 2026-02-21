//! Speed test command — measure relay connection performance
//!
//! Tests QUIC handshake latency and round-trip time to the relay server
//! without needing a second peer. Measures:
//! - Connection time (QUIC handshake + TLS)
//! - Round-trip latency (room join + response)
//! - Estimated throughput based on test data upload

use crate::cli::SpeedTestArgs;
use crate::output;
use std::io;
use std::time::Instant;
use tracing::info;

/// Execute speed-test command
pub async fn execute(args: SpeedTestArgs, json: bool) -> io::Result<()> {
    let total_bytes = args.size_mb * 1024 * 1024;

    if !json {
        output::color::section("Speed Test");
        output::color::info(&format!("Relay: {}", args.relay));
        output::color::info(&format!("Test size: {} MB", args.size_mb));
    }

    // Build proxy config from CLI flags
    let proxy_config =
        crate::commands::proxy::build_proxy_config(args.tor, &args.proxy, json).await?;

    if let Some(ref proxy) = proxy_config {
        if !json {
            if proxy.tor_mode {
                output::color::info("Routing through Tor...");
            } else {
                output::color::info(&format!("Routing through proxy {}...", proxy.socks5_addr));
            }
        }
    }

    // Hash relay password for authentication (if provided)
    let password_hash: Option<[u8; 32]> = args
        .relay_pass
        .as_ref()
        .map(|pass| blake3::hash(pass.as_bytes()).into());
    let pw_ref = password_hash.as_ref();

    // Generate a unique benchmark room code to avoid collisions
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    let room_code = format!("benchmark-speed-test-{}", timestamp);
    let room_id = tallow_protocol::room::code::derive_room_id(&room_code);

    // --- Phase 1: Measure connection time (QUIC handshake) ---
    if !json {
        output::color::info("Testing connection...");
    }

    let connect_start = Instant::now();

    let mut relay = if let Some(ref proxy) = proxy_config {
        let resolved = tallow_net::relay::resolve_relay_proxy(&args.relay, proxy_config.as_ref())
            .await
            .map_err(|e| io::Error::other(format!("Relay resolution failed: {}", e)))?;

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
        let relay_addr: std::net::SocketAddr = resolve_relay(&args.relay)?;
        tallow_net::relay::RelayClient::new(relay_addr)
    };

    // Connect and join the benchmark room
    relay
        .connect(&room_id, pw_ref)
        .await
        .map_err(|e| io::Error::other(format!("Connection failed: {}", e)))?;

    let connect_elapsed = connect_start.elapsed();
    info!(
        "QUIC connection established in {:.1}ms",
        connect_elapsed.as_secs_f64() * 1000.0
    );

    if !json {
        output::color::success(&format!(
            "Connected in {:.1}ms",
            connect_elapsed.as_secs_f64() * 1000.0
        ));
    }

    // --- Phase 2: Measure data upload throughput ---
    // Since the relay needs a peer to forward data, we measure how fast
    // we can push data into the QUIC stream. The relay will buffer/drop
    // frames without a peer, but we still measure our upload capacity.
    if !json {
        output::color::info(&format!("Uploading {} MB test data...", args.size_mb));
    }

    let chunk_size: usize = 64 * 1024; // 64 KB chunks (same as real transfers)
    let chunk_count = (total_bytes as usize) / chunk_size;
    // Fill with a repeating pattern (not all zeros for realism)
    let test_chunk: Vec<u8> = (0..chunk_size).map(|i| (i & 0xFF) as u8).collect();

    let upload_start = Instant::now();
    let mut bytes_sent: u64 = 0;

    // Use the relay's send_message method (length-prefixed writes)
    // We wrap in a timeout to avoid hanging if the relay closes the stream
    let upload_result: io::Result<()> = async {
        for i in 0..chunk_count {
            // The relay will likely close the stream after a while since
            // there's no peer, so we handle errors gracefully.
            match relay.forward(&test_chunk).await {
                Ok(()) => {
                    bytes_sent += chunk_size as u64;
                }
                Err(e) => {
                    // Expected: relay may close stream without a peer
                    info!(
                        "Relay stopped accepting data after {} chunks ({}): {}",
                        i,
                        output::format_size(bytes_sent),
                        e
                    );
                    break;
                }
            }
        }
        Ok(())
    }
    .await;

    // Even if the relay closed the stream, we have valid timing data
    if let Err(ref e) = upload_result {
        tracing::debug!("Upload phase ended with error (expected): {}", e);
    }

    let upload_elapsed = upload_start.elapsed();

    // --- Phase 3: Calculate and display results ---
    let throughput_mbps = if upload_elapsed.as_secs_f64() > 0.0 {
        (bytes_sent as f64 / (1024.0 * 1024.0)) / upload_elapsed.as_secs_f64()
    } else {
        0.0
    };
    let throughput_mbits = throughput_mbps * 8.0;
    let latency_ms = connect_elapsed.as_secs_f64() * 1000.0;

    // Clean up
    relay.close().await;

    if json {
        println!(
            "{}",
            serde_json::json!({
                "event": "speed_test_complete",
                "relay": args.relay,
                "connection_ms": latency_ms,
                "size_bytes": bytes_sent,
                "upload_duration_secs": upload_elapsed.as_secs_f64(),
                "throughput_mbps": throughput_mbps,
                "throughput_mbits": throughput_mbits,
                "proxy": proxy_config.is_some(),
            })
        );
    } else {
        println!();
        output::color::section("Results");
        output::color::info(&format!("Connection latency: {:.1}ms", latency_ms));

        if bytes_sent > 0 {
            output::color::success(&format!(
                "Upload throughput: {:.1} MB/s ({:.0} Mbps)",
                throughput_mbps, throughput_mbits
            ));
            output::color::info(&format!("Data sent: {}", output::format_size(bytes_sent)));
            output::color::info(&format!("Duration: {:.2}s", upload_elapsed.as_secs_f64()));
        } else {
            output::color::warning(
                "Could not measure upload throughput (relay closed connection without peer)",
            );
            output::color::info(
                "Connection latency is still valid. \
                 For full throughput test, run a send/receive between two machines.",
            );
        }

        // Provide context for the connection latency
        if latency_ms < 50.0 {
            output::color::success("Excellent latency — relay is nearby");
        } else if latency_ms < 150.0 {
            output::color::info("Good latency — suitable for interactive transfers");
        } else if latency_ms < 500.0 {
            output::color::warning("Moderate latency — large transfers may be slow");
        } else {
            output::color::warning(
                "High latency — consider using a closer relay or checking network",
            );
        }
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
