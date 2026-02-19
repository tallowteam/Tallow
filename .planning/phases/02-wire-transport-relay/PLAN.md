# Phase 2 Plan: Wire Protocol, Transport and Relay

## Overview
4 execution waves. Each wave is independently committable.

## Wave 1: Wire Protocol Foundation (WIRE-01 through WIRE-04)
**Files:** tallow-protocol Cargo.toml, wire/messages.rs, wire/codec.rs, wire/version.rs, workspace Cargo.toml

1. Add `postcard` to workspace dependencies, add to tallow-protocol
2. Remove `#[serde(tag = "type")]` from Message enum (postcard uses integer discriminants natively)
3. Implement TallowCodec::encode() — 4-byte BE length prefix + postcard::to_stdvec
4. Implement TallowCodec::decode() — read length, read payload, postcard::from_bytes
5. Implement tokio_util::codec::Encoder and Decoder traits for TallowCodec
6. Add version negotiation messages to Message enum
7. Tests: round-trip encode/decode for every Message variant

## Wave 2: QUIC Transport (XPORT-01, XPORT-04)
**Files:** tallow-net Cargo.toml, transport/quic.rs, tallow-net error.rs

1. Add `rcgen` to tallow-net Cargo.toml for self-signed cert generation
2. Create `transport/tls_config.rs` — helper to generate self-signed certs via rcgen, build rustls ServerConfig and ClientConfig
3. Rewrite QuicTransport with real quinn Endpoint
   - `new()` creates quinn Endpoint with generated TLS config
   - `connect()` establishes QUIC connection and opens bidirectional stream
   - `send()` writes length-prefixed data to stream
   - `receive()` reads length-prefixed data from stream
4. Add `close()` method to Transport trait
5. Tests: unit tests for TLS config generation

## Wave 3: TCP+TLS Fallback (XPORT-02, XPORT-03)
**Files:** transport/tcp_tls.rs, transport/mod.rs

1. Implement TcpTlsTransport with tokio_rustls
   - `connect()` creates TcpStream + TLS handshake
   - `send()` writes length-prefixed data
   - `receive()` reads length-prefixed data
2. Create `FallbackTransport` that tries QUIC first, falls back to TCP+TLS
3. Add `close()` to Transport trait and all impls
4. Tests: unit test for framing logic

## Wave 4: Relay Server (RELAY-01 through RELAY-07)
**Files:** tallow-relay server.rs, config.rs, main.rs, signaling.rs, auth.rs; tallow-net relay/client.rs

1. Add room management types to relay server
   - Room struct: room_id, sender connection, receiver connection, created_at
   - RoomManager using DashMap<[u8;32], Room>
2. Implement RelayServer::start()
   - Build QUIC endpoint with self-signed cert
   - Accept connections in loop
   - Spawn tokio task per connection
   - Parse first message as RoomJoin
   - Pair connections by room code hash
3. Implement DataForwarder — bidirectional byte relay between paired connections
4. Implement stale room cleanup — tokio::time::interval sweeps rooms older than timeout
5. Wire rate limiter into connection acceptance
6. Update RelayConfig with room_timeout, max_rooms fields
7. Implement relay client in tallow-net (connect, join room, forward)
8. Wire main.rs to actually start the relay server
9. Tests: room management unit tests, rate limiter tests

## Success Criteria Mapping
- SC1 (codec round-trip): Wave 1 tests
- SC2 (two clients relay): Wave 4 integration
- SC3 (QUIC blocked → TCP fallback): Wave 3 FallbackTransport
- SC4 (50MB RSS at 100 rooms): Wave 4 design (stream-forward, no buffering)
- SC5 (stale room cleanup + rate limiting): Wave 4 cleanup + existing rate limiter
