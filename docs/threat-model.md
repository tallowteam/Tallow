# Tallow Threat Model

## Assets
- File content (plaintext)
- Key material (session keys, identity keys)
- Metadata (filenames, sizes, timestamps)
- Identity (who communicates with whom)

## Trust Boundaries
- Client <-> Relay: relay is FULLY untrusted
- Client <-> Tor: Tor provides IP anonymity only
- Client <-> Client: authenticated via PAKE/safety numbers

## Adversary Profiles

### Script Kiddie
- Shared WiFi, available tools
- Mitigated by: E2E encryption, TLS on relay connection

### Compromised Relay
- Full server control
- Mitigated by: E2E encryption (relay never sees plaintext), zero data retention

### Nation-State Passive
- Backbone taps, metadata collection
- Mitigated by: Tor integration, traffic padding, timing obfuscation

### Nation-State Active
- DNS hijack, BGP hijack, quantum computers
- Mitigated by: Post-quantum KEM, certificate pinning, DoH

## STRIDE Analysis
- Spoofing: PAKE authentication, safety numbers
- Tampering: AEAD authentication tags, Merkle tree integrity
- Repudiation: Not a design goal (privacy tool)
- Information Disclosure: E2E encryption, zeroization, secure memory
- Denial of Service: Rate limiting, resource caps
- Elevation of Privilege: OS sandbox (Landlock + Seccomp)
