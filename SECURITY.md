# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please report vulnerabilities via one of these channels:

1. **GitHub Security Advisories** (preferred): [Report a vulnerability](https://github.com/tallowteam/Tallow/security/advisories/new)
2. **Email**: security@tallowteam.org

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Affected version(s)
- Potential impact assessment
- Suggested fix (if any)

### Response Timeline

- **Acknowledgment**: within 48 hours
- **Initial assessment**: within 7 days
- **Fix release**: within 30 days for critical/high severity

### Scope

The following are in scope for security reports:

- Cryptographic weaknesses (key exchange, encryption, signatures, nonce handling)
- Authentication bypass
- Information leakage (plaintext, metadata, timing side-channels)
- Memory safety issues (buffer overflows, use-after-free)
- Relay server vulnerabilities
- Sandbox escapes
- Dependency vulnerabilities

### Cryptographic Design

Tallow uses defense-in-depth cryptography:

- **Key Exchange**: ML-KEM-1024 + X25519 hybrid (post-quantum safe)
- **Encryption**: AES-256-GCM with counter-based nonces
- **Signatures**: Ed25519 + ML-DSA-87 hybrid
- **Hashing**: BLAKE3 (primary), SHA3-256 (NIST compliance)
- **Passwords**: Argon2id (3 iterations, 256 MB, 4 lanes)
- **Key Derivation**: HKDF-SHA256

See [docs/threat-model.md](docs/threat-model.md) for the full threat model and [docs/crypto-decisions.md](docs/crypto-decisions.md) for algorithm selection rationale.

### Hall of Fame

We gratefully acknowledge security researchers who help keep Tallow secure. Contributors will be credited here (with permission).
