# TALLOW Subagents Collection

**Version:** 1.0.0
**Target Model:** Claude Opus
**Project:** TALLOW - Quantum-Resistant P2P File Transfer Platform

## Overview

This collection contains 20 specialized subagents designed specifically for TALLOW development, covering:

- Core feature additions (CLI, native apps, mDNS)
- Security auditing (PQC crypto, protocol review)
- Networking (relay, NAT traversal, WebRTC)
- Frontend/UX (React, accessibility, animations)
- Quality assurance (testing, performance)
- DevOps and documentation

## Installation

```bash
# Copy all agents to Claude's agent directory
cp -r agents/* ~/.claude/agents/

# Or install individually
cp agents/flutter-pro.md ~/.claude/agents/
```

## Agent Categories

### 🔧 Core Additions (Fill Gaps vs Croc/LocalSend/Blip)
1. `flutter-pro` - Native iOS/Android/Desktop apps
2. `go-expert` - CLI tool + self-hostable relay
3. `mdns-discovery` - Zero-config local device discovery
4. `rust-performance` - Maximum transfer speeds via WASM

### 🔐 Security
5. `pqc-crypto-auditor` - Post-quantum crypto audit
6. `protocol-security` - Hybrid encryption flow review
7. `penetration-tester` - Security testing

### 🌐 Networking
8. `relay-architect` - Self-hostable relay design
9. `nat-traversal` - STUN/TURN/ICE optimization
10. `webrtc-optimizer` - DataChannel throughput

### 📱 Frontend/UX
11. `react-nextjs-pro` - React 19 + Next.js 16
12. `accessibility-expert` - WCAG 2.1 AA compliance
13. `framer-motion-pro` - Animation optimization

### 🧪 Quality & Testing
14. `playwright-expert` - E2E test maintenance
15. `performance-engineer` - Lighthouse + Core Web Vitals
16. `test-automator` - Coverage improvement

### 🚀 DevOps & Infrastructure
17. `devops-engineer` - Docker/K8s/CI-CD
18. `monitoring-expert` - Sentry/Prometheus/Plausible

### 📝 Documentation & Polish
19. `documentation-engineer` - API docs + guides
20. `i18n-expert` - 22 languages + RTL

## Usage in CLAUDE.md

```markdown
During implementation, delegate to:
- Use `flutter-pro` for native iOS/Android/Desktop apps
- Use `go-expert` for CLI tool and relay server
- Use `mdns-discovery` for local device discovery
- Use `pqc-crypto-auditor` for ANY crypto changes (CRITICAL)
- Use `relay-architect` for relay protocol design
- Use `react-nextjs-pro` for web frontend work
- Use `playwright-expert` for E2E test maintenance
```

## TALLOW Context

All agents are pre-configured with knowledge of:

- **Crypto Stack:** ML-KEM-768, X25519, AES-256-GCM, BLAKE3, Argon2id, Triple Ratchet
- **Tech Stack:** Next.js 16, React 19, TypeScript 5, Socket.IO, WebRTC
- **Features:** P2P transfer, group transfer, metadata stripping, onion routing, Tor
- **Scale:** 106,000+ lines, 141 components, 22 languages

## Priority Order

1. 🔴 **HIGH**: flutter-pro, go-expert, mdns-discovery, pqc-crypto-auditor, relay-architect
2. 🟡 **MEDIUM**: protocol-security, nat-traversal, webrtc-optimizer, react-nextjs-pro, playwright-expert, performance-engineer, test-automator, devops-engineer
3. 🟢 **LOW**: rust-performance, accessibility-expert, framer-motion-pro, monitoring-expert, documentation-engineer, i18n-expert, penetration-tester
