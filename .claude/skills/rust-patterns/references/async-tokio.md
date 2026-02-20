# Async/Tokio Patterns for Tallow

## Key Patterns

### spawn_blocking for CPU-Heavy Crypto
```rust
let result = tokio::task::spawn_blocking(move || {
    encrypt(&key, &plaintext)
}).await??;
```
Never block the async runtime with crypto operations.

### Cancellation Safety
- Ensure cleanup on task abort (key material zeroization)
- Use `tokio::select!` carefully — cancelled branches must not leak state
- Prefer `JoinSet` for structured concurrency

### Graceful Shutdown
```rust
tokio::signal::ctrl_c().await?;
// Zeroize all key material
// Close network connections
// Flush logs
```

### Timeouts
- Network operations: always use `tokio::time::timeout`
- Key exchange: 30-second timeout (prevent DoS via slow key exchange)
- Transfer chunks: per-chunk timeout based on bandwidth estimate
