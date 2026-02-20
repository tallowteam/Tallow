---
name: tallow-architecture
description: >
  System design and module relationships for Tallow. Auto-invoke when
  adding new modules, changing data flow between crates, modifying the
  relay protocol, making design tradeoffs, evaluating feature requests
  for complexity vs value, or restructuring code organization.
allowed-tools: Read, Grep, Glob
---

# Tallow Architecture Skill

## Core Architecture Principles

1. **Crypto crate has ZERO I/O**: tallow-crypto is pure computation. Takes bytes in, returns bytes out. No network, no filesystem, no async. Independently testable and auditable.
2. **Net crate knows nothing about files**: tallow-net sends and receives byte chunks over the network. It doesn't know they're file pieces.
3. **Protocol crate orchestrates**: tallow-protocol connects crypto and net. Chunks files, encrypts via crypto, sends via net.
4. **CLI is presentation only**: tallow/ parses arguments and displays output. No business logic. No crypto. No networking.
5. **Single-relay architecture**: Resist multi-hop complexity. Tor handles anonymity — the relay is just a dumb pipe.

## Crate Dependency Graph
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

## When Evaluating Changes
- Does it violate module boundaries? (Crypto doing I/O? CLI doing crypto?)
- Does it fit in resource constraints (Oracle Cloud free tier)?
- Is the complexity justified by the security/feature gain?
- Does it introduce new trust boundaries?
- Could a simpler design achieve 90% of the benefit at 10% of the complexity?

Be honest. If something isn't worth building, say so.

## Reference Files
- `references/relay-protocol.md` — Wire format, message types, state machine
- `references/tor-socks5-integration.md` — SOCKS5 proxy wrapping strategy
- `references/threat-model.md` — Assets, boundaries, attack surfaces
