# Tallow Architecture

## Overview

Tallow is a 7-crate Rust workspace for secure, post-quantum file transfer.

## Crate Dependencies

```
tallow (binary)
  -> tallow-tui
  -> tallow-protocol
     -> tallow-crypto
     -> tallow-net
     -> tallow-store
  -> tallow-store
  -> tallow-crypto

tallow-relay (binary)
  -> tallow-net (subset)
```

## Module Boundaries

1. **tallow-crypto**: All cryptographic operations. ZERO I/O dependencies. Pure functions.
2. **tallow-net**: Transport, NAT traversal, discovery, relay client, privacy. Knows nothing about files.
3. **tallow-protocol**: Wire protocol and transfer orchestration. Connects crypto and net.
4. **tallow-store**: Persistent state and configuration.
5. **tallow-relay**: Self-hostable relay server.
6. **tallow-tui**: Terminal UI engine.
7. **tallow**: Main binary. CLI commands, output formatting, sandbox, runtime.

## Data Flow

```
User -> CLI (tallow) -> Protocol (tallow-protocol)
  -> Crypto (tallow-crypto): encrypt/sign
  -> Net (tallow-net): transport
  -> Relay (tallow-relay): pass-through
  -> Net -> Crypto: decrypt/verify -> Protocol -> CLI -> User
```

## Design Principles

- Security-maximalist defaults
- Defense-in-depth at every layer
- Simplicity over unnecessary complexity
- Single-relay + Tor over custom onion routing
