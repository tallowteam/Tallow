# Threat Model Reference

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
- Mitigated by: E2E encryption, zero data retention, relay sees only opaque bytes

### Nation-State Passive
- Backbone taps, metadata collection
- Mitigated by: Tor integration, traffic padding, timing obfuscation

### Nation-State Active
- DNS hijack, BGP hijack, quantum computers
- Mitigated by: Post-quantum KEM, certificate pinning, DoH
