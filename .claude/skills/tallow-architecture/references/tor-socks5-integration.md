# Tor/SOCKS5 Integration Reference

## Strategy
- Tor integration via SOCKS5 proxy (not custom onion routing)
- Wraps relay connections transparently
- DNS-over-HTTPS to prevent DNS leaks
- Encrypted Client Hello (ECH) when available

## Implementation
- SOCKS5 connect through local Tor daemon
- Automatic fallback to direct connection if Tor unavailable
- User configurable: `--tor always|prefer|never`

## Critical Checks
- Does the SOCKS5 integration leak DNS?
- Are packet sizes padded to prevent file size inference?
- Can timing correlation link sender and receiver?
- Is the Tor circuit fresh per session?
