# PLATFORM DIVISION — QUICK REFERENCE CARD
## Agents 061-074 at a Glance

---

## The 14 Agents

### Agent 061 — FLUTTER-COMMANDER
```
Platform:  Multi-platform (iOS, Android, macOS, Windows, Linux)
Role:      Flutter native app architecture
Files:     flutter/ directory, pubspec.yaml
Output:    5 native apps from 1 Flutter codebase
Key:       FFI bindings to Rust crypto, platform channels
```

### Agent 062 — IOS-SPECIALIST
```
Platform:  iOS
Role:      iOS-specific features
Files:     flutter/ios/, Xcode project
Output:    App Store-ready iOS app
Key:       Live Activities, Dynamic Island, Handoff, Shortcuts, Widgets, Share Extension
```

### Agent 063 — ANDROID-SPECIALIST
```
Platform:  Android
Role:      Android-specific features
Files:     flutter/android/, Gradle config
Output:    Google Play-ready APK/AAB
Key:       Quick Settings tile, Direct Share, Work Profile, Adaptive icons, Foreground service
```

### Agent 064 — DESKTOP-SPECIALIST
```
Platform:  Windows, macOS, Linux
Role:      Desktop OS integration
Files:     flutter/windows/, flutter/macos/, flutter/linux/
Output:    Desktop apps + context menu integration
Key:       Context menu, menu bar, global hotkeys, mini mode, clipboard monitoring
```

### Agent 065 — CLI-OPERATOR
```
Platform:  Command-line (cross-platform)
Role:      Go CLI tool (Croc-inspired)
Files:     tallow-cli/ directory, Go codebase
Output:    Single binary per platform
Key:       `tallow send file` → code, `tallow receive code` → file
```

### Agent 066 — PWA-ENGINEER
```
Platform:  Web (Progressive Web App)
Role:      Offline support, installability
Files:     public/sw.js, public/manifest.json
Output:    Installable web app
Key:       Service worker, offline caching, background sync, push notifications
```

### Agent 067 — BROWSER-EXTENSION-AGENT
```
Platform:  Chrome, Firefox, Edge, Safari
Role:      Browser extension integration
Files:     extensions/ directory, manifest.json
Output:    4 browser extensions
Key:       Right-click "Send via Tallow", minimal permissions, Manifest V3
```

### Agent 068 — ELECTRON-ARCHITECT
```
Platform:  Windows, macOS, Linux (Electron)
Role:      Electron packaging & distribution
Files:     electron/ directory, main.ts, preload.ts
Output:    Installers: MSI, DMG, DEB, RPM, AppImage
Key:       Auto-updater, code signing, delta updates
```

### Agent 069 — SHARE-SHEET-INTEGRATOR
```
Platform:  iOS, Android, macOS, Windows
Role:      OS-level share sheet integration
Files:     Share extensions, intent targets, services
Output:    "Send via Tallow" in system share sheet
Key:       Share files to Tallow, receive files from share sheet
```

### Agent 070 — NFC-PROXIMITY-AGENT
```
Platform:  iOS, Android (both), macOS/Linux (BLE)
Role:      NFC/BLE proximity connection
Files:     NFC/BLE integration code
Output:    Tap-to-connect, device proximity sorting
Key:       NFC NDEF records, BLE RSSI proximity, MAC randomization, privacy mode
```

### Agent 071 — QRCODE-LINKER
```
Platform:  All platforms
Role:      QR code generation & scanning
Files:     lib/qr/ directory
Output:    QR codes, camera scanner, image parser
Key:       Room code + public key encoded, time-limited tokens, Level H error correction
```

### Agent 072 — CLIPBOARD-AGENT
```
Platform:  All platforms
Role:      Cross-device clipboard sharing
Files:     Clipboard monitoring code
Output:    Synced clipboard across devices
Key:       Text/image/file sync, encrypted transit, opt-in only, clipboard history
```

### Agent 073 — FILESYSTEM-AGENT
```
Platform:  All platforms
Role:      File management & organization
Files:     File organization logic
Output:    Received files gallery, auto-organized structure
Key:       Folder preservation, duplicate detection via BLAKE3, auto-organize, collections
```

### Agent 074 — COMPRESSION-SPECIALIST
```
Platform:  Transfer pipeline (all platforms)
Role:      Adaptive compression
Files:     lib/compression/ directory
Output:    Compressed file transfers
Key:       Zstd (general), Brotli (text), LZ4 (fast), LZMA (max), entropy analysis
```

---

## Platform Coverage Matrix

| Agent | Web | iOS | Android | macOS | Windows | Linux | CLI |
|-------|-----|-----|---------|-------|---------|-------|-----|
| 061 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | - |
| 062 | - | ✓ | - | - | - | - | - |
| 063 | - | - | ✓ | - | - | - | - |
| 064 | - | - | - | ✓ | ✓ | ✓ | - |
| 065 | - | - | - | - | - | - | ✓ |
| 066 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | - |
| 067 | - | - | - | - | - | - | - |
| 068 | - | - | - | ✓ | ✓ | ✓ | - |
| 069 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | - |
| 070 | - | ✓ | ✓ | - | - | - | - |
| 071 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | - |
| 072 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | - |
| 073 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | - |
| 074 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## Key Metrics at a Glance

| Metric | Target |
|--------|--------|
| Feature parity | ≥90% across platforms |
| App size | <50MB per platform |
| Startup time | <2 seconds |
| Crash-free rate | ≥99.5% |
| Binary size (CLI) | <20MB |
| PWA Lighthouse score | 100/100 |
| Compression ratio | 2-8x (depending on algorithm) |
| QR scan time | <1 second |
| NFC tap-to-connect | <2 seconds |
| Unit test coverage | ≥90% |
| E2E test scenarios | 400+ |

---

## Agent Dependencies (Simplified)

### Core Platform
```
FLUTTER-COMMANDER (061)
├─→ IOS-SPECIALIST (062)
├─→ ANDROID-SPECIALIST (063)
├─→ DESKTOP-SPECIALIST (064)
└─→ Rust crypto library (FFI)
```

### Web Distribution
```
PWA-ENGINEER (066) + BROWSER-EXTENSION-AGENT (067) + ELECTRON-ARCHITECT (068)
└─→ NEXTJS-STRATEGIST (051) [web app structure]
```

### Cross-Platform Features
```
SHARE-SHEET-INTEGRATOR (069)
├─→ All native platforms (062, 063, 064)
└─→ TRANSFER-ENGINEER (025) [receive flow]

NFC-PROXIMITY-AGENT (070) + QRCODE-LINKER (071)
├─→ DISCOVERY-HUNTER (026) [device list]
└─→ SIGNAL-ROUTER (023) [room management]

CLIPBOARD-AGENT (072)
├─→ MEMORY-WARDEN (017) [encryption]
└─→ All platforms
```

### File Management
```
FILESYSTEM-AGENT (073)
├─→ HASH-ORACLE (009) [BLAKE3]
└─→ COMPRESSION-SPECIALIST (074) [compression]
```

---

## Failure Severity Guide

| Severity | Impact | Example |
|----------|--------|---------|
| **CATASTROPHIC** | System non-functional | PQC-KEYSMITH crypto fails → no secure sessions |
| **CRITICAL** | Major feature broken | Share sheet doesn't work → no file sharing |
| **HIGH** | Platform degraded | iOS Live Activities broken → poor UX |
| **MEDIUM** | Feature missing | Compression not working → slower transfers |
| **LOW** | Nice-to-have broken | NFC disabled → only QR codes work |

---

## Quality Standard Categories

### Performance
- Response time (<500ms typically)
- Startup time (<2s)
- Transfer speed (>10MB/s target)
- Memory usage (<10MB typical)

### Reliability
- Crash-free session rate (≥99.5%)
- Feature availability (100% for core)
- Backward compatibility (maintain)

### Security
- Encryption (AES-256-GCM)
- Crypto validation (NIST test vectors)
- Permission minimization
- Privacy preservation

### User Experience
- Discoverability (<3 clicks)
- Installation (<60 seconds)
- File transfer (<120 seconds first time)
- UI responsiveness (60fps)

---

## Implementation Sequence

```
Week 1-4:   FLUTTER-COMMANDER (061) foundation
Week 5-12:  Platform specialists (062, 063, 064, 065)
Week 13-16: Cross-platform features (069, 070, 071, 072)
Week 17-18: File management (073, 074)
Week 19-20: Distribution (066, 067, 068)
```

---

## Quick Start by Role

### If you're FLUTTER-COMMANDER (061)
- [ ] Read: PLATFORM_DIVISION_061-074.md, Agent 061 section
- [ ] Build: Flutter app compiling all 5 platforms
- [ ] Test: Feature parity maintained
- [ ] Deliver: Feature parity matrix (updated per release)

### If you're IOS-SPECIALIST (062)
- [ ] Read: Agent 062 section + iOS framework docs
- [ ] Build: Live Activities, Dynamic Island, Handoff
- [ ] Test: On physical iPhone hardware
- [ ] Deliver: TestFlight ready for beta

### If you're ANDROID-SPECIALIST (063)
- [ ] Read: Agent 063 section + Android framework docs
- [ ] Build: Quick Settings, Direct Share, Work Profile
- [ ] Test: On physical Android device + emulator
- [ ] Deliver: Google Play Store ready

### If you're CLI-OPERATOR (065)
- [ ] Read: Agent 065 section + Go documentation
- [ ] Build: `tallow send` and `tallow receive` commands
- [ ] Test: Cross-platform (Windows/macOS/Linux)
- [ ] Deliver: Precompiled binaries for all platforms

### If you're QA/Testing
- [ ] Read: PLATFORM_DIVISION_SUMMARY.md, Testing Strategy section
- [ ] Plan: Unit, integration, E2E test cases
- [ ] Build: Test suite per platform & agent
- [ ] Validate: Against Quality Standards in documentation

### If you're Project Manager
- [ ] Read: PLATFORM_DIVISION_SUMMARY.md (all sections)
- [ ] Track: Agent deliverables against checklists
- [ ] Report: Status against KPIs
- [ ] Plan: Phases according to implementation sequence

---

## Files to Read

| Role | Read These |
|------|-----------|
| Engineer | PLATFORM_DIVISION_061-074.md (your agent) |
| Team Lead | PLATFORM_DIVISION_SUMMARY.md |
| QA Lead | Testing Strategy section in Summary |
| PM | Implementation Timeline + KPIs in Summary |
| Tech Writer | INTEGRATION_INSTRUCTIONS.md |
| Architect | Dependencies section in Summary |
| CTO/VPE | PLATFORM_DIVISION_SUMMARY.md + Failure Points |

---

## Key Documents at a Glance

| Document | Purpose | Size | Audience |
|----------|---------|------|----------|
| PLATFORM_DIVISION_061-074.md | Complete specs | 12.5K words | Engineers |
| PLATFORM_DIVISION_SUMMARY.md | Overview & metrics | 3K words | PMs, Architects |
| INTEGRATION_INSTRUCTIONS.md | How to integrate | 2.5K words | Tech Writers |
| PLATFORM_DIVISION_INDEX.md | Navigation guide | 2K words | All users |
| DELIVERY_MANIFEST.md | What was delivered | 2K words | Management |
| PLATFORM_DIVISION_QUICK_REFERENCE.md | This file | 2K words | Quick lookup |

---

## Success Checklist

- [ ] All 14 agents have operational specs
- [ ] All deliverables documented
- [ ] All quality standards quantified
- [ ] All dependencies mapped
- [ ] All failure scenarios identified
- [ ] All agents integrated into main manual
- [ ] All cross-references valid
- [ ] All code examples verified
- [ ] All tables properly formatted
- [ ] Documentation validated against checklist

---

## Next Steps

1. **Today**: Review this quick reference
2. **This Week**: Read PLATFORM_DIVISION_SUMMARY.md
3. **Next Week**: Integrate PLATFORM_DIVISION_061-074.md into main manual
4. **Following Week**: Share with teams, gather feedback
5. **Ongoing**: Update as product evolves

---

## Support

- **Agent Questions**: PLATFORM_DIVISION_061-074.md
- **Integration Help**: INTEGRATION_INSTRUCTIONS.md
- **Strategy Questions**: PLATFORM_DIVISION_SUMMARY.md
- **Navigation Help**: PLATFORM_DIVISION_INDEX.md
- **What Was Delivered**: DELIVERY_MANIFEST.md

---

**QUICK REFERENCE CARD**
**Classification**: TOP SECRET // TALLOW // NOFORN
**Date**: 2026-02-07
**Status**: COMPLETE
