# Changelog

All notable changes to Tallow will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Post-Quantum Cryptography (ML-KEM-768 + X25519 hybrid encryption)
- Group file transfers with up to 50 participants
- Screen sharing with PQC encryption
- Email-based file transfer with S3 fallback
- Password protection for transfers
- Metadata stripping for privacy
- Resumable transfers with checkpoint support
- Onion routing for enhanced privacy
- 22-language internationalization support
- Interactive help system with FAQ
- Architecture diagrams page
- Prometheus metrics endpoint
- Sealed Secrets support for Kubernetes

### Changed
- Upgraded to Next.js 14 with App Router
- Enhanced rate limiting with multiple tiers
- Improved CSRF protection across all endpoints
- Standardized error responses with machine-readable codes

### Security
- Added RFC 5322 compliant email validation
- Implemented timing-safe comparisons with length padding
- Mandatory webhook signature verification in production
- Added HEALTHCHECK to Docker containers
- Multi-platform builds (AMD64 + ARM64)

### Fixed
- Console warning cleanup for production builds
- Service worker caching improvements
- TypeScript strict mode compliance

## [0.1.0] - 2026-01-29

### Added
- Initial release
- P2P file transfer via WebRTC
- End-to-end encryption (AES-256-GCM)
- QR code device pairing
- Room-based transfers
- Signaling server for peer discovery
- Docker and Kubernetes deployment support
- GitHub Actions CI/CD pipeline
- Comprehensive API documentation (OpenAPI 3.1)

### Security
- Non-root Docker containers
- Read-only filesystem in production
- Network policies for Kubernetes
- Rate limiting on all endpoints
- CORS origin validation

---

## Version History

| Version | Release Date | Highlights |
|---------|--------------|------------|
| 0.1.0 | 2026-01-29 | Initial release with P2P transfers |

## Upgrade Guide

### Upgrading to 0.1.0

This is the initial release. No upgrade steps required.

### Future Upgrades

When upgrading between versions:

1. Read the changelog for breaking changes
2. Update environment variables if needed
3. Run database migrations (if applicable)
4. Test in staging before production deployment

## Deprecation Policy

- Deprecated features are announced in the changelog
- Deprecated features continue to work for at least 2 minor versions
- Removal is announced in advance with migration guides

## Support

- **Current Version (0.1.x)**: Full support
- **Previous Versions**: Security fixes only for 6 months after next release

---

[Unreleased]: https://github.com/your-org/tallow/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/your-org/tallow/releases/tag/v0.1.0
