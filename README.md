# TALLOW - Quantum-Resistant P2P File Transfer

<div align="center">

![TALLOW Logo](public/logo.svg)

**Secure, Private, Post-Quantum File Sharing**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![PQC: ML-KEM-768](https://img.shields.io/badge/PQC-ML--KEM--768-green)](https://csrc.nist.gov/projects/post-quantum-cryptography)

[Live Demo](https://tallow.manisahome.com) • [Documentation](./docs) • [Getting Started](./docs/guides/getting-started.md)

</div>

---

## ✨ Features

### 🔐 Security First
- **Post-Quantum Cryptography** - ML-KEM-768 (Kyber) + X25519 hybrid encryption
- **End-to-End Encryption** - Files encrypted on your device, never on servers
- **Triple Ratchet Protocol** - Forward secrecy and post-compromise security
- **Zero-Knowledge Architecture** - We can't see your files, ever

### 🚀 Fast & Reliable
- **Direct P2P Transfer** - Device-to-device via WebRTC (no middleman)
- **Unlimited File Size** - Transfer files of any size
- **Resumable Transfers** - Pause and resume large transfers
- **Smart Fallback** - Email delivery when P2P unavailable

### 🎭 Privacy Features
- **Onion Routing** - Multi-hop relay for anonymity (Tor-like)
- **Metadata Stripping** - Remove EXIF, GPS, and sensitive data
- **No Tracking** - No analytics, no logs, no fingerprinting
- **Secure Deletion** - DoD 5220.22-M file wiping

### 🌐 Cross-Platform
- **Web App** - Works in any modern browser
- **Progressive Web App** - Install on any device
- **Local Network** - Works offline via mDNS
- **22 Languages** - Full internationalization (i18n)

### 👥 Collaboration
- **Group Transfers** - Send to up to 50 recipients at once
- **Transfer Rooms** - Persistent shared spaces
- **Friends List** - Trusted contacts for quick sharing
- **Multi-Device** - Sync between your own devices

## 📸 Screenshots

<div align="center">

![Main Interface](docs/screenshots/main.png)
*Clean, intuitive transfer interface*

![Security Features](docs/screenshots/security.png)
*Advanced security options*

</div>

## 🚀 Quick Start

### Online (Fastest)

Visit [tallow.manisahome.com](https://tallow.manisahome.com) - no installation required!

### Local Development

```bash
# Clone repository
git clone https://github.com/your-org/tallow.git
cd tallow

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser
open http://localhost:3000
```

### Docker

```bash
# Using Docker Compose
docker-compose up

# Or direct Docker
docker run -p 3000:3000 tallow/tallow:latest
```

See [Installation Guide](./docs/guides/installation.md) for detailed instructions.

## 📖 Documentation

### User Guides
- [Getting Started](./docs/guides/getting-started.md) - New user walkthrough
- [Sending Files](./docs/guides/sending-files.md) - How to send files
- [Receiving Files](./docs/guides/receiving-files.md) - How to receive files
- [Group Transfer](./docs/guides/group-transfer.md) - Multi-recipient transfers
- [Privacy Mode](./docs/guides/privacy-mode.md) - Onion routing guide
- [Troubleshooting](./docs/guides/troubleshooting.md) - Common issues

### Developer Documentation
- [Architecture](./docs/development/architecture.md) - System design
- [Crypto Implementation](./docs/development/crypto-implementation.md) - Cryptography details
- [WebRTC Flow](./docs/development/webrtc-flow.md) - P2P connection setup
- [Signaling Protocol](./docs/development/signaling-protocol.md) - WebRTC signaling
- [Contributing](./docs/development/contributing.md) - How to contribute
- [Testing](./docs/development/testing.md) - Testing guide
- [Deployment](./docs/development/deployment.md) - Deployment options

### API Documentation
- [API Reference](./docs/api/README.md) - Complete API docs
- [OpenAPI Spec](./docs/api/openapi.yaml) - Machine-readable spec

### Architecture Diagrams
- [System Overview](./docs/diagrams/system-overview.mmd) - High-level architecture
- [Crypto Flow](./docs/diagrams/crypto-flow.mmd) - Encryption sequence
- [Transfer Flow](./docs/diagrams/transfer-flow.mmd) - File transfer flow
- [P2P Connection](./docs/diagrams/p2p-connection.mmd) - WebRTC setup

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    TALLOW Platform                       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────┐         ┌──────────┐      ┌──────────┐   │
│  │  Web App │◄───────►│ Signaling│      │  Email   │   │
│  │ Next.js  │ WebRTC  │  Server  │      │ Fallback │   │
│  │ React 19 │         │Socket.IO │      │ Resend   │   │
│  └────┬─────┘         └──────────┘      └──────────┘   │
│       │                                                  │
│       │ P2P WebRTC (Direct)                             │
│       ▼                                                  │
│  ┌──────────┐                          ┌──────────┐    │
│  │  Peer    │◄────────────────────────►│    S3    │    │
│  │  Device  │   Encrypted Upload       │ Storage  │    │
│  └──────────┘                          └──────────┘    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Tech Stack

**Frontend**
- Next.js 16 (React 19)
- TypeScript 5
- Tailwind CSS
- Radix UI Components
- Framer Motion

**Cryptography**
- ML-KEM-768 (Post-Quantum)
- X25519 (Elliptic Curve)
- AES-256-GCM (Symmetric)
- BLAKE3 / SHA-256 (Hashing)
- Argon2id (Password Hashing)

**Backend Services**
- Socket.IO (WebRTC Signaling)
- AWS S3 (Email Fallback Storage)
- Resend (Email Delivery)
- Stripe (Donations)

**WebRTC Stack**
- SimplePeer (WebRTC wrapper)
- Browser WebRTC API
- STUN/TURN servers

See [Architecture Documentation](./docs/development/architecture.md) for details.

## 🔒 Security

### Cryptographic Guarantees

- **Confidentiality**: AES-256-GCM encryption
- **Authentication**: HMAC-SHA256 tags
- **Integrity**: Per-chunk verification
- **Forward Secrecy**: Triple Ratchet protocol
- **Post-Quantum**: ML-KEM-768 resistance
- **Deniability**: MAC-based authentication

### Threat Model

**Protected Against**:
- ✅ Network eavesdropping (passive + active)
- ✅ Man-in-the-middle attacks
- ✅ Server compromise
- ✅ Quantum computer attacks
- ✅ Traffic analysis (with onion routing)

**NOT Protected Against**:
- ❌ Endpoint compromise (device malware)
- ❌ Physical device access
- ❌ Coercion of users
- ❌ Supply chain attacks

### Security Audits

- **Planned**: Professional security audit Q2 2026
- **Bug Bounty**: Coming soon

Report security issues to: security@tallow.example

See [Security Policy](./SECURITY.md) for details.

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](./docs/development/contributing.md) for guidelines.

### Development Setup

```bash
# Install dependencies
npm install

# Run type checker
npm run type-check

# Run linter
npm run lint

# Run tests
npm run test

# Run E2E tests
npm run test:e2e

# Build for production
npm run build
```

### Code Quality

- **TypeScript**: Strict mode enabled
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks
- **Playwright**: E2E testing
- **Vitest**: Unit testing

## 📊 Performance

- **Lighthouse Score**: 95+ (all categories)
- **Core Web Vitals**: All passing
- **Transfer Speed**: Up to 1 Gbps (local network)
- **Bundle Size**: <500 KB (initial)
- **Time to Interactive**: <2s (on 3G)

## 🌍 Internationalization

Fully translated into 22 languages:

🇺🇸 English • 🇪🇸 Español • 🇫🇷 Français • 🇩🇪 Deutsch • 🇮🇹 Italiano • 🇳🇱 Nederlands • 🇵🇱 Polski • 🇵🇹 Português • 🇷🇺 Русский • 🇺🇦 Українська • 🇹🇷 Türkçe • 🇸🇦 العربية • 🇮🇳 हिन्दी • 🇧🇩 বাংলা • 🇵🇰 اردو • 🇨🇳 中文 • 🇯🇵 日本語 • 🇰🇷 한국어 • 🇹🇭 ไทย • 🇻🇳 Tiếng Việt • 🇮🇩 Indonesia • 🇮🇱 עברית

## 📜 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🙏 Acknowledgments

Built with these amazing open-source projects:

- [Next.js](https://nextjs.org/) - React framework
- [Noble Crypto](https://github.com/paulmillr/noble-curves) - Cryptographic primitives
- [SimplePeer](https://github.com/feross/simple-peer) - WebRTC wrapper
- [Radix UI](https://www.radix-ui.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - Styling

## 📞 Support

- **Documentation**: https://tallow.manisahome.com/docs
- **FAQ**: https://tallow.manisahome.com/help/faq
- **GitHub Issues**: https://github.com/your-org/tallow/issues
- **Email**: support@tallow.example

## 🗺️ Roadmap

### Q1 2026
- ✅ Post-quantum cryptography
- ✅ Onion routing
- ✅ Group transfers
- ⏳ Mobile apps (React Native)

### Q2 2026
- ⏳ Desktop apps (Electron)
- ⏳ CLI tool (Go)
- ⏳ Self-hosted relay servers
- ⏳ Security audit

### Q3 2026
- ⏳ End-to-end encrypted chat
- ⏳ Screen sharing
- ⏳ Voice/video calls
- ⏳ Federation protocol

See [ROADMAP.md](./ROADMAP.md) for complete roadmap.

## 📈 Stats

![GitHub stars](https://img.shields.io/github/stars/your-org/tallow?style=social)
![GitHub forks](https://img.shields.io/github/forks/your-org/tallow?style=social)
![GitHub issues](https://img.shields.io/github/issues/your-org/tallow)
![GitHub pull requests](https://img.shields.io/github/issues-pr/your-org/tallow)

---

<div align="center">

**Made with ❤️ for privacy and security**

[Website](https://tallow.manisahome.com) • [Docs](./docs) • [API](./docs/api) • [Twitter](#) • [Discord](#)

</div>
