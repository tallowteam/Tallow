# Changelog

All notable changes to Tallow are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2026-02-08

### Added
- Post-quantum cryptography: ML-KEM-768 + X25519 hybrid key exchange
- AES-256-GCM, ChaCha20-Poly1305, and AEGIS-256 cipher suite
- Triple Ratchet protocol (DH + symmetric + PQ ratchet)
- BLAKE3 hashing with streaming and keyed modes
- Ed25519 + ML-DSA-65 + SLH-DSA signature suite
- Short Authentication String (SAS) verification with emoji and word modes
- WebAuthn/FIDO2 biometric authentication
- BLE proximity detection via Web Bluetooth API
- ICE candidate management with NAT type detection
- Encrypted vault storage (IndexedDB + AES-256-GCM)
- Certificate pinning for relay server connections
- UPnP/NAT-PMP relay-assisted port mapping
- Multi-device sync engine with CRDT conflict resolution
- Onboarding flow with step-by-step walkthrough
- Comprehensive keyboard shortcuts system
- Feature flag infrastructure with LaunchDarkly integration
- PWA manifest and service worker for offline support
- PAKE authentication (CPace/OPAQUE) for relay server
- Argon2id password hashing (3 iterations, 64MB, 4 parallel)
- 96-bit counter-based nonce management
- Entropy harvesting with CSPRNG health checks
- Secure memory zeroization
- Digital signatures with post-quantum fallback
- Transfer mode selector (Local/Internet P2P)
- Device discovery with mDNS and BLE
- File drag-and-drop with validation
- Transfer progress with speed/ETA display
- Transfer history with persistence
- Dark/light theme with system preference detection
- Comprehensive design token system
- Responsive layout (320px-2560px+)
- Accessibility: WCAG 2.1 AA compliance, screen reader support
- Print stylesheet for paper-optimized output
- 22 locale i18n with RTL support
- 4 compression algorithms (Zstd, Brotli, LZ4, LZMA)
- Adaptive compression selection based on file entropy
- Group transfer and multi-device rooms
- Screen sharing capability
- Voice memo transfer support
- Chat integration for transfer sessions
- Contact management with encrypted backup
- Metadata stripping for privacy
- Delta sync for efficient updates
- Resumable transfers with checkpoint support
- Go relay server with WebSocket signaling
- 14 GitHub Actions CI/CD workflows
- Prometheus metrics and Plausible analytics
- Sentry error tracking and performance monitoring
- Web Vitals monitoring
- Structured logging system
- Health check API endpoint
- Rate limiting middleware
- CORS security headers and CSP
- Stripe subscription and webhook handling
- Email notification system
- Cookie consent banner (GDPR)
- Privacy policy and terms of service pages
- Comprehensive documentation site (/docs)
- API documentation with OpenAPI
- Architecture diagrams
- Getting started guides
- Security audit documentation

### Security
- NIST FIPS 203/204/205 compliance for PQC algorithms
- HKDF domain separation with `tallow-hybrid-v1` label
- Constant-time comparison for SAS verification
- CSP, HSTS, X-Frame-Options security headers
- Input validation with Zod schemas on all API routes
- Rate limiting on all API endpoints
- Encrypted IndexedDB storage for sensitive data

## [2.0.0] - 2026-01-15

### Added
- WebRTC peer-to-peer file transfer
- Basic AES-256-GCM encryption
- Device discovery via WebSocket signaling
- Transfer progress indicators
- Settings page with theme toggle

### Changed
- Migrated from Pages Router to App Router
- Upgraded to Next.js 16 with Turbopack

## [1.0.0] - 2025-12-01

### Added
- Initial release
- Landing page with feature showcase
- Basic file transfer via relay server
- Dark theme design system
- Responsive layout

[3.0.0]: https://github.com/tallow/tallow/compare/v2.0.0...v3.0.0
[2.0.0]: https://github.com/tallow/tallow/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/tallow/tallow/releases/tag/v1.0.0
