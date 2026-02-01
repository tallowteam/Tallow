//! Benchmarks for cryptographic operations

use criterion::{black_box, criterion_group, criterion_main, Criterion, Throughput};
use tallow_wasm::*;

fn bench_mlkem_keygen(c: &mut Criterion) {
    c.bench_function("mlkem_keygen", |b| {
        b.iter(|| {
            let _kp = mlkem_keypair();
        })
    });
}

fn bench_x25519_keygen(c: &mut Criterion) {
    c.bench_function("x25519_keygen", |b| {
        b.iter(|| {
            let _kp = x25519_keypair();
        })
    });
}

fn bench_aes_encryption(c: &mut Criterion) {
    let mut group = c.benchmark_group("aes_encryption");

    for size in [1024, 64 * 1024, 1024 * 1024].iter() {
        group.throughput(Throughput::Bytes(*size as u64));

        let key = aes_generate_key();
        let data = vec![0u8; *size];

        group.bench_with_input(format!("{}KB", size / 1024), size, |b, _| {
            b.iter(|| {
                let _ = aes_encrypt(black_box(&key), black_box(&data));
            })
        });
    }

    group.finish();
}

fn bench_blake3_hash(c: &mut Criterion) {
    let mut group = c.benchmark_group("blake3_hash");

    for size in [1024, 64 * 1024, 1024 * 1024, 10 * 1024 * 1024].iter() {
        group.throughput(Throughput::Bytes(*size as u64));

        let data = vec![0u8; *size];

        group.bench_with_input(format!("{}KB", size / 1024), size, |b, _| {
            b.iter(|| {
                let _ = blake3_hash(black_box(&data));
            })
        });
    }

    group.finish();
}

fn bench_argon2(c: &mut Criterion) {
    c.bench_function("argon2_hash_password", |b| {
        b.iter(|| {
            let _ = argon2_hash_password(black_box("test-password"));
        })
    });
}

fn bench_hybrid_exchange(c: &mut Criterion) {
    c.bench_function("hybrid_keygen", |b| {
        b.iter(|| {
            let _kp = hybrid_keypair();
        })
    });

    let responder = hybrid_keypair();

    c.bench_function("hybrid_encapsulate", |b| {
        b.iter(|| {
            let _ = hybrid_encapsulate(
                black_box(&responder.mlkem_public_key()),
                black_box(&responder.x25519_public_key()),
                Some("bench".to_string()),
            );
        })
    });
}

fn bench_chunking(c: &mut Criterion) {
    let file_size = 100 * 1024 * 1024; // 100 MB
    let chunk_size = 1024 * 1024; // 1 MB

    c.bench_function("file_chunker_new", |b| {
        b.iter(|| {
            let _ = FileChunker::new(black_box(file_size), Some(black_box(chunk_size)));
        })
    });

    c.bench_function("calculate_optimal_chunk_size", |b| {
        b.iter(|| {
            let _ = calculate_optimal_chunk_size(black_box(file_size));
        })
    });
}

fn bench_transfer_session(c: &mut Criterion) {
    let key = aes_generate_key();
    let session_id = generate_session_id();

    c.bench_function("transfer_session_new", |b| {
        b.iter(|| {
            let _ = TransferSession::new(black_box(&key), black_box(session_id.clone()));
        })
    });

    let mut session = TransferSession::new(&key, session_id).unwrap();
    let chunk = vec![0u8; 64 * 1024]; // 64 KB

    c.bench_function("session_encrypt_chunk", |b| {
        b.iter(|| {
            let _ = session.encrypt_chunk(black_box(&chunk));
        })
    });
}

criterion_group!(
    benches,
    bench_mlkem_keygen,
    bench_x25519_keygen,
    bench_aes_encryption,
    bench_blake3_hash,
    bench_argon2,
    bench_hybrid_exchange,
    bench_chunking,
    bench_transfer_session
);

criterion_main!(benches);
