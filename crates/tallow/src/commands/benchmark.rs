//! Benchmark command — real crypto performance tests

use crate::cli::BenchmarkArgs;
use std::io;
use std::time::{Duration, Instant};

/// Execute benchmark command
pub async fn execute(args: BenchmarkArgs, json: bool) -> io::Result<()> {
    let duration = Duration::from_secs(args.duration);
    let mut results: Vec<BenchResult> = Vec::new();

    if !json {
        println!("Running benchmarks ({} seconds each)...\n", args.duration);
    }

    match args.bench_type.as_str() {
        "crypto" | "all" => {
            results.push(bench_blake3_hash(duration));
            results.push(bench_aes_gcm_encrypt(duration));
            results.push(bench_aes_gcm_decrypt(duration));
            results.push(bench_argon2id(duration));
            results.push(bench_keygen(duration));

            if args.bench_type == "crypto" {
                print_results(&results, json);
                return Ok(());
            }
        }
        _ => {}
    }

    match args.bench_type.as_str() {
        "compression" | "all" => {
            results.push(bench_zstd_compress(duration));
            results.push(bench_zstd_decompress(duration));
        }
        _ => {}
    }

    print_results(&results, json);
    Ok(())
}

struct BenchResult {
    name: String,
    ops: u64,
    duration: Duration,
    bytes_processed: u64,
}

impl BenchResult {
    fn ops_per_sec(&self) -> f64 {
        self.ops as f64 / self.duration.as_secs_f64()
    }

    fn throughput_mbps(&self) -> Option<f64> {
        if self.bytes_processed > 0 {
            Some(self.bytes_processed as f64 / self.duration.as_secs_f64() / 1_048_576.0)
        } else {
            None
        }
    }
}

fn bench_blake3_hash(max_dur: Duration) -> BenchResult {
    let data = vec![0u8; 65536]; // 64 KB
    let start = Instant::now();
    let mut ops = 0u64;

    while start.elapsed() < max_dur {
        let _ = tallow_crypto::hash::blake3::hash(&data);
        ops += 1;
    }

    let elapsed = start.elapsed();
    BenchResult {
        name: "BLAKE3 hash (64KB)".to_string(),
        ops,
        duration: elapsed,
        bytes_processed: ops * 65536,
    }
}

fn bench_aes_gcm_encrypt(max_dur: Duration) -> BenchResult {
    let key = [42u8; 32];
    let data = vec![0u8; 65536];
    let aad = b"benchmark";
    let start = Instant::now();
    let mut ops = 0u64;
    let mut nonce_counter = 0u64;

    while start.elapsed() < max_dur {
        let mut nonce = [0u8; 12];
        nonce[4..12].copy_from_slice(&nonce_counter.to_be_bytes());
        let _ = tallow_crypto::symmetric::aes_encrypt(&key, &nonce, &data, aad);
        ops += 1;
        nonce_counter += 1;
    }

    let elapsed = start.elapsed();
    BenchResult {
        name: "AES-256-GCM encrypt (64KB)".to_string(),
        ops,
        duration: elapsed,
        bytes_processed: ops * 65536,
    }
}

fn bench_aes_gcm_decrypt(max_dur: Duration) -> BenchResult {
    let key = [42u8; 32];
    let data = vec![0u8; 65536];
    let nonce = [0u8; 12];
    let aad = b"benchmark";

    // Pre-encrypt
    let ciphertext = tallow_crypto::symmetric::aes_encrypt(&key, &nonce, &data, aad)
        .expect("encrypt for benchmark");

    let start = Instant::now();
    let mut ops = 0u64;

    while start.elapsed() < max_dur {
        let _ = tallow_crypto::symmetric::aes_decrypt(&key, &nonce, &ciphertext, aad);
        ops += 1;
    }

    let elapsed = start.elapsed();
    BenchResult {
        name: "AES-256-GCM decrypt (64KB)".to_string(),
        ops,
        duration: elapsed,
        bytes_processed: ops * 65536,
    }
}

fn bench_argon2id(max_dur: Duration) -> BenchResult {
    let password = b"benchmark-password";
    let salt = [0u8; 16];
    let start = Instant::now();
    let mut ops = 0u64;

    // Argon2id is intentionally slow — usually only 1-3 ops in 10s
    while start.elapsed() < max_dur {
        let _ = tallow_crypto::kdf::argon2::derive_key(password, &salt, 32);
        ops += 1;
        // Stop after 3 iterations max to avoid blocking
        if ops >= 3 {
            break;
        }
    }

    let elapsed = start.elapsed();
    BenchResult {
        name: "Argon2id (256MB, 3 iter)".to_string(),
        ops,
        duration: elapsed,
        bytes_processed: 0,
    }
}

fn bench_keygen(max_dur: Duration) -> BenchResult {
    let start = Instant::now();
    let mut ops = 0u64;

    while start.elapsed() < max_dur {
        let _ = tallow_crypto::sig::Ed25519Signer::keygen();
        ops += 1;
    }

    let elapsed = start.elapsed();
    BenchResult {
        name: "Ed25519 keygen".to_string(),
        ops,
        duration: elapsed,
        bytes_processed: 0,
    }
}

fn bench_zstd_compress(max_dur: Duration) -> BenchResult {
    let data = vec![42u8; 65536]; // Compressible data
    let start = Instant::now();
    let mut ops = 0u64;

    while start.elapsed() < max_dur {
        let _ = tallow_protocol::compression::zstd::compress_default(&data);
        ops += 1;
    }

    let elapsed = start.elapsed();
    BenchResult {
        name: "Zstd compress (64KB)".to_string(),
        ops,
        duration: elapsed,
        bytes_processed: ops * 65536,
    }
}

fn bench_zstd_decompress(max_dur: Duration) -> BenchResult {
    let data = vec![42u8; 65536];
    let compressed = tallow_protocol::compression::zstd::compress_default(&data)
        .expect("compress for benchmark");

    let start = Instant::now();
    let mut ops = 0u64;

    while start.elapsed() < max_dur {
        let _ = tallow_protocol::compression::zstd::decompress(&compressed);
        ops += 1;
    }

    let elapsed = start.elapsed();
    BenchResult {
        name: "Zstd decompress (64KB)".to_string(),
        ops,
        duration: elapsed,
        bytes_processed: ops * 65536,
    }
}

fn print_results(results: &[BenchResult], json: bool) {
    if json {
        let list: Vec<serde_json::Value> = results
            .iter()
            .map(|r| {
                let mut obj = serde_json::json!({
                    "name": r.name,
                    "ops": r.ops,
                    "ops_per_sec": r.ops_per_sec(),
                    "duration_ms": r.duration.as_millis(),
                });
                if let Some(tp) = r.throughput_mbps() {
                    obj["throughput_mbps"] = serde_json::json!(tp);
                }
                obj
            })
            .collect();
        println!("{}", serde_json::to_string_pretty(&list).unwrap_or_default());
    } else {
        println!("{:<35} {:>10} {:>12} {:>12}", "Benchmark", "Ops", "Ops/sec", "Throughput");
        println!("{}", "-".repeat(72));

        for r in results {
            let throughput = r
                .throughput_mbps()
                .map(|t| format!("{:.1} MB/s", t))
                .unwrap_or_else(|| "—".to_string());

            println!(
                "{:<35} {:>10} {:>12.0} {:>12}",
                r.name,
                r.ops,
                r.ops_per_sec(),
                throughput,
            );
        }
    }
}
