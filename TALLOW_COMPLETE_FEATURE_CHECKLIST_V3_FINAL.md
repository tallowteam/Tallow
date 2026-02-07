# TALLOW — Complete Feature & Addon Checklist (V3 — FINAL)

> Every single feature, addon, integration, and capability discussed across ALL conversations. V3 adds SAS verification, traffic obfuscation, signed prekeys, process isolation, sandboxing, Sparse PQ Ratchet, design system revisions, Claude Code tooling, Docker deployment, env config, and Claude Code skills/plugins.
>
> **Last audited**: 2026-02-06 — Items marked [x] are verified in the codebase.

---

## CRYPTOGRAPHY & SECURITY

### Post-Quantum Cryptography
- [x] ML-KEM-768 (NIST FIPS 203) key encapsulation mechanism — `lib/crypto/pqc-crypto.ts`
- [x] Hybrid ML-KEM-768 + X25519 key exchange (defense-in-depth) — `lib/crypto/pqc-crypto.ts`
- [x] X25519 elliptic curve Diffie-Hellman — `lib/crypto/pqc-crypto.ts`
- [x] Ed25519 digital signatures — `lib/crypto/digital-signatures.ts`
- [x] AES-256-GCM authenticated encryption — `lib/crypto/pqc-crypto.ts`
- [x] BLAKE3 hashing and key derivation — `lib/crypto/blake3.ts`
- [x] Argon2id password hashing (600K iterations, 64MB) — `lib/crypto/argon2-browser.ts`
- [x] Domain separation in key derivation (`tallow-hybrid-v1`) — `lib/crypto/pqc-crypto.ts`
- [x] CSPRNG (crypto.getRandomValues) for all key generation — throughout crypto modules
- [x] Key material zeroed after use — `lib/security/memory-wiper.ts`, `lib/crypto/key-management.ts`
- [x] No key reuse across sessions — `lib/crypto/key-management.ts`
- [x] Session keys derived with domain separation — `lib/crypto/pqc-crypto.ts`
- [x] ML-DSA-65 (FIPS 204) digital signatures for file authenticity — `lib/crypto/pq-signatures.ts`
- [x] SLH-DSA (FIPS 205) stateless hash-based signatures (backup) — `lib/crypto/slh-dsa.ts`
- [x] ChaCha20-Poly1305 as alternative symmetric cipher — `lib/crypto/chacha20-poly1305.ts`
- [x] AEGIS-256 authenticated encryption (fastest option) — `lib/crypto/aegis256.ts`
- [x] HKDF key derivation function — `lib/crypto/pqc-crypto.ts` (uses SHA-256)
- [x] SHA3-256 (FIPS 202) quantum-resistant hashing — `lib/crypto/sha3.ts`
- [x] ChaCha20-based nonce management — `lib/crypto/chacha20-poly1305.ts`

### Triple Ratchet Protocol (Chat)
- [x] Forward secrecy for chat messages — `lib/crypto/triple-ratchet.ts`
- [x] Triple Ratchet protocol implementation — `lib/crypto/triple-ratchet.ts` (505 lines)
- [x] Per-message key rotation — `lib/crypto/key-management.ts`
- [x] Post-compromise security — `lib/crypto/triple-ratchet.ts`
- [x] Signal Protocol Double Ratchet integration — `lib/crypto/triple-ratchet.ts`
- [x] Perfect forward secrecy (PFS) — via Triple Ratchet
- [x] Sparse PQ Ratchet for long sessions (periodic PQC ratchet) — `lib/crypto/sparse-pq-ratchet.ts` (365 lines)
- [x] DH ratchet every N messages (configurable) — `lib/crypto/sparse-pq-ratchet.ts`
- [x] Skipped message key storage (out-of-order handling) — `lib/crypto/triple-ratchet.ts`
- [x] Break-in recovery mechanism — `lib/crypto/triple-ratchet.ts`

### Password Protection
- [x] Argon2id password-based encryption — `lib/crypto/password-file-encryption.ts`
- [ ] PAKE (Password-Authenticated Key Exchange) for CLI — CLI-only feature
- [ ] OPAQUE protocol for zero-knowledge password auth — not implemented
- [x] Password-protected transfers — `lib/crypto/password-file-encryption.ts`
- [x] Password-protected rooms — `lib/rooms/room-crypto.ts`

### Security Verification
- [x] Public key fingerprint verification — `lib/crypto/digital-signatures.ts`
- [x] Certificate fingerprint verification in SDP — `lib/hooks/use-p2p-connection.ts`
- [x] Safety number / security code comparison — `lib/crypto/peer-authentication.ts`
- [x] PQC status badge (3 variants: default, compact, detailed) — transfer components
- [x] WebAuthn / FIDO2 biometric authentication — `lib/auth/webauthn.ts`, `lib/auth/webauthn-store.ts`
- [ ] Hardware security module (HSM) integration — not implemented
- [x] Progressive trust authentication system — `lib/stores/friends-store.ts` trust levels
- [x] **SAS (Short Authentication String) verification** — `lib/crypto/peer-authentication.ts`
- [x] SAS word-list verification UI — `lib/crypto/peer-authentication.ts` (64-word dictionary)
- [x] Out-of-band SAS comparison flow — `lib/crypto/peer-authentication.ts`
- [x] **Signed prekeys** — Ed25519 identity binding — `lib/crypto/signed-prekeys.ts` (422 lines)
- [x] Prekey bundle exchange during handshake — `lib/crypto/signed-prekeys.ts`
- [x] Prekey rotation policy — `lib/crypto/signed-prekeys.ts` (7-day interval)

### Constant-Time & Side-Channel Protection
- [x] Constant-time comparison for all key/secret operations — `lib/security/timing-safe.ts`
- [x] No early returns based on secret data — `lib/security/timing-safe.ts`
- [x] No conditional branches on secret data — `lib/security/timing-safe.ts`
- [x] No array access patterns that leak secrets — `lib/security/timing-safe.ts`
- [x] No timing variations in crypto operations — `lib/security/timing-safe.ts`
- [x] No cache-timing vulnerabilities — `lib/crypto/pqc-crypto.ts`
- [x] Crypto failures handled securely (no info leakage in errors) — throughout crypto modules

### Traffic Analysis Resistance & Obfuscation
- [x] Constant-rate dummy traffic (anti-traffic analysis) — `lib/transport/obfuscation.ts`
- [x] Traffic shaping / padding — `lib/transport/obfuscation.ts`
- [x] Encrypted filenames in transit — `lib/hooks/use-privacy-pipeline.ts`
- [x] Padded file sizes to prevent size-based identification — `lib/transport/packet-padding.ts`
- [x] **Traffic obfuscation** — padding + decoy traffic — `lib/transport/obfuscation.ts` (1004 lines)
- [x] Timing jitter (random inter-packet delays) — `lib/transport/obfuscation.ts`
- [x] Packet size uniformity (all packets same size) — `lib/transport/obfuscation.ts`
- [x] Dummy packet injection to fill transfer gaps — `lib/transport/obfuscation.ts`
- [x] Website fingerprinting defense (traffic morphing) — `lib/transport/obfuscation.ts`
- [x] Packet splitting (fragment randomly) — `lib/transport/obfuscation.ts`
- [x] Burst pattern randomization — `lib/transport/obfuscation.ts`
- [x] Bidirectional dummy traffic (direction mixing) — `lib/transport/obfuscation.ts`
- [x] Target bitrate shaping (constant throughput appearance) — `lib/transport/obfuscation.ts`

---

## INTERNET P2P & TRANSFER

### P2P File Transfer (Core)
- [x] WebRTC DataChannel direct transfers — `lib/hooks/use-p2p-connection.ts`
- [x] Chunked file transfer (64KB adaptive chunks) — `lib/transfer/file-chunking.ts`
- [x] Resumable/pausable transfers — `lib/transfer/resumable-transfer.ts`
- [x] Transfer progress tracking (real-time) — `lib/hooks/use-p2p-connection.ts`
- [x] Transfer speed monitoring (MB/s) — `lib/hooks/use-p2p-connection.ts`
- [x] Transfer queue management — `lib/transfer/transfer-manager.ts`
- [x] Priority ordering in queue — `lib/transfer/transfer-manager.ts`
- [x] Large file support (no size limits) — adaptive chunking for 100MB+ files
- [x] Multiple simultaneous transfers — `lib/hooks/use-p2p-connection.ts`
- [x] File integrity verification (SHA-256 checksums) — `lib/transfer/file-chunking.ts`
- [x] Drag-and-drop file upload zone — `lib/hooks/use-file-transfer.ts`, `components/transfer/FileDropZone.tsx`
- [x] Retry failed transfers automatically — `lib/hooks/use-resumable-transfer.ts`
- [x] Transfer state persistence (survive app crash) — `lib/storage/transfer-state-db.ts`
- [x] Partial transfer recovery — `lib/transfer/resumable-transfer.ts`
- [x] Real-time transfer rate graphs — `components/transfer/TransferRateGraph.tsx` (SVG line chart)
- [x] Network usage statistics — `lib/network/connection-strategy.ts`
- [x] Transfer history with timestamps — `components/transfer/TransferHistory.tsx`
- [x] Estimated time remaining — `lib/transfer/transfer-manager.ts`
- [x] Batch operations — `lib/hooks/use-p2p-connection.ts` sendFiles()

### Internet P2P (Cross-Network)
- [x] Direct P2P over internet — `lib/hooks/use-p2p-connection.ts` + signaling
- [ ] QUIC Protocol (HTTP/3) transport option — not implemented
- [ ] Multi-path TCP (MPTCP) — not implemented
- [x] WebTransport API support — `lib/transport/webtransport.ts`
- [ ] BBR congestion control with FEC — not implemented
- [x] Adaptive buffer sizing — `lib/transfer/adaptive-bitrate.ts`
- [ ] Zero-copy transfers — N/A for browser
- [ ] Memory-mapped file transfers — N/A for browser
- [x] Backpressure handling for DataChannels — `lib/hooks/use-p2p-connection.ts`

### Group Transfer
- [x] 1-to-many file distribution (up to 10 recipients) — `lib/transfer/group-transfer-manager.ts`
- [x] Group transfer progress panel — `lib/hooks/use-group-transfer.ts`
- [x] Group transfer manager UI — `lib/transfer/group-transfer-manager.ts`
- [x] Transfer to multiple recipients simultaneously — `lib/transfer/group-transfer-manager.ts`
- [x] Broadcast mode (send to ALL devices) — `lib/transfer/broadcast-transfer.ts`, `components/transfer/DeviceDiscovery.tsx` (Send to All button)

### Screen Sharing
- [x] PQC-protected screen streaming — `lib/webrtc/screen-sharing.ts`
- [x] Screen share controls UI — `lib/webrtc/screen-sharing.ts`
- [x] Screen capture hook (useScreenCapture) — `lib/hooks/use-screen-capture.ts`

### Email Fallback
- [x] Resend email integration for transfer links — `lib/hooks/use-email-transfer.ts`
- [x] Fallback when P2P not possible — `lib/hooks/use-email-transfer.ts`
- [x] Shareable transfer links (URL-based) — `components/transfer/RoomCodeConnect.tsx` (Share Link + Copy Code buttons)

### File Request
- [x] File request feature — `components/transfer/FileRequestPanel.tsx` (request files from peers)
- [x] Request link generation — `components/transfer/FileRequestPanel.tsx` (shareable request links)
- [x] Request notifications — `components/transfer/FileRequestPanel.tsx` (accept/reject UI)

---

## FRIENDS, CONTACTS & TRUSTED DEVICES

### Favorites & Trusted Devices
- [x] Favorite devices list — `lib/stores/friends-store.ts`
- [x] Auto-accept from trusted devices/favorites — `lib/stores/friends-store.ts`
- [x] Auto-reconnect to known devices — `lib/stores/friends-store.ts`
- [x] Connection history logging — `lib/storage/transfer-history.ts`
- [x] Trusted device whitelist — `lib/stores/friends-store.ts`
- [x] Whitelist-only mode (block unknown senders) — `lib/stores/friends-store.ts`
- [x] Private device lists — `lib/stores/friends-store.ts`
- [x] Device trust levels (untrusted → trusted → verified) — `lib/stores/friends-store.ts`

### Device Identity
- [x] Device name customization — `lib/stores/settings-store.ts`
- [x] Device avatar/icon selection — `lib/stores/friends-store.ts`
- [x] Device type detection (desktop/mobile/tablet) — discovery system
- [x] Platform identification (Windows/Mac/Linux/iOS/Android) — `lib/discovery/mdns-types.ts`
- [x] Device fingerprint display — `lib/crypto/digital-signatures.ts`
- [x] Public key fingerprint for device verification — `lib/crypto/signed-prekeys.ts`

### Contact Management
- [x] Recently connected devices list — `lib/stores/friends-store.ts`
- [x] Quick resend to recent contacts — `lib/stores/friends-store.ts`
- [x] Contact sharing between devices — `lib/contacts/contact-export.ts`, `components/transfer/ContactShareDialog.tsx`
- [x] Contact card sharing — `lib/contacts/contact-export.ts` (JSON/vCard export)

### Permissions & Privacy
- [x] Block specific devices — `lib/stores/friends-store.ts`
- [x] Visibility controls (who can see you) — `lib/stores/settings-store.ts`
- [x] Temporary visibility (appear only when app open) — `components/transfer/GuestModeBanner.tsx`, `app/settings/page.tsx` toggle
- [x] Guest mode for one-time shares — `components/transfer/GuestModeBanner.tsx`, `lib/stores/settings-store.ts`
- [x] No signup required option — app works without login

---

## LOCAL NETWORK FEATURES

### mDNS / Zero-Config Discovery
- [x] Service type: `_tallow._tcp.local` — `lib/discovery/mdns-types.ts`
- [x] TXT records (version, deviceId, deviceName, platform, capabilities, fingerprint) — `lib/discovery/mdns-types.ts`
- [x] Web: WebSocket bridge to local mDNS daemon — `lib/discovery/mdns-bridge.ts`
- [ ] Flutter: multicast_dns / NSD package — separate project
- [x] Advertise local device on network — `daemon/src/mdns-server.ts`
- [x] Browse for other Tallow instances — `lib/discovery/mdns-bridge.ts`
- [x] Resolve IP for direct connection — `lib/discovery/mdns-bridge.ts`
- [x] Fallback to signaling if mDNS fails — `lib/discovery/unified-discovery.ts`
- [x] Unified discovery (merge mDNS + signaling, prioritize local) — `lib/discovery/unified-discovery.ts`

### Additional Local Discovery Methods
- [x] UDP broadcast discovery — `lib/network/udp-broadcast.ts`
- [x] Manual IP address entry option — `components/transfer/DeviceDiscovery.tsx` (Enter IP form)
- [x] QR code generation for connection sharing — `components/transfer/RoomCodeConnect.tsx` (QR code display)
- [ ] QR code scanner for quick pairing — camera-based scanning not implemented
- [ ] NFC tap-to-connect pairing — not implemented (native only)
- [ ] NFC NDEF record for connection payload — not implemented (native only)
- [ ] NFC writable tags support — not implemented (native only)
- [ ] Bluetooth Low Energy (BLE) 5.0+ proximity detection — not implemented (native only)
- [ ] BLE Extended Advertising for discovery — not implemented (native only)
- [ ] Nearby Connections API (Android) — Android only
- [ ] Multipeer Connectivity Framework (iOS) — iOS only

### Local Network Optimization
- [x] LAN speed optimization (maximum local bandwidth) — adaptive chunk sizes
- [ ] WiFi Direct device-to-device connection — not implemented
- [x] Local network hotspot mode — `lib/network/hotspot-mode.ts`
- [x] Network interface selection (WiFi/Ethernet/Hotspot) — `lib/network/interface-selector.ts`
- [x] IPv4 and IPv6 support — `lib/network/nat-detection.ts`
- [x] Port configuration options — `daemon/src/mdns-server.ts`
- [x] Firewall detection and guidance — `lib/network/firewall-detection.ts`, `components/transfer/FirewallStatus.tsx`
- [x] Connection status indicators — `components/transfer/DeviceDiscovery.tsx`
- [x] Signal strength display — `lib/network/signal-strength.ts`
- [ ] Proximity detection (prioritize closest devices) — not implemented

### Signaling Discovery (Existing)
- [x] Socket.IO signaling server — `lib/signaling/socket-signaling.ts`
- [x] Signaling-based peer discovery — `lib/discovery/local-discovery.ts`
- [x] Encrypted signaling messages — `lib/signaling/socket-signaling.ts`
- [x] Replay protection (nonces/timestamps) — `lib/chat/chat-manager.ts`
- [x] Rate limiting on signaling — `tallow-relay/relay-server.js`

---

## RELAY & NAT TRAVERSAL

### Self-Hostable Relay Server
- [x] Self-hostable relay server binary — `tallow-relay/relay-server.js`
- [x] Code phrase-based rooms — `lib/rooms/transfer-room-manager.ts`
- [x] Bidirectional encrypted tunnel — `lib/relay/relay-client.ts`
- [x] Server never sees plaintext (zero-knowledge) — E2E encryption
- [ ] PAKE authentication for rooms — not implemented (CLI feature)
- [x] Rate limiting & abuse prevention — `tallow-relay/relay-server.js`
- [x] Room timeout/expiration — `lib/rooms/transfer-room-manager.ts`
- [x] Max transfer size limits — `lib/transfer/transfer-manager.ts`
- [x] Prometheus metrics endpoint — `lib/metrics/prometheus.ts`, `monitoring/prometheus.yml`
- [x] Docker image (`tallow/relay:latest`) — `tallow-relay/Dockerfile`
- [x] Docker Compose deployment — `docker-compose.yml`
- [x] Quick start: Docker run — documented in docker-compose

### STUN/TURN/ICE
- [x] Multiple STUN servers (Google, Cloudflare) — `lib/network/nat-detection.ts`
- [x] TURN server fallback (UDP, TCP, TLS) — `lib/network/nat-detection.ts`
- [x] Time-limited TURN credentials (HMAC-based, 24h validity) — `lib/network/nat-detection.ts`
- [x] ICE candidate pool pre-gathering (size: 10) — `lib/network/nat-detection.ts`
- [x] Bundle policy: max-bundle — `lib/hooks/use-p2p-connection.ts`
- [x] Force relay mode option — `lib/hooks/use-p2p-connection.ts`
- [x] NAT type detection (Full Cone, Restricted, Symmetric, Blocked) — `lib/network/nat-detection.ts`
- [x] Strategy selection based on NAT types — `lib/network/connection-strategy.ts`
- [x] Aggressive TURN fallback for symmetric NAT (5s timeout) — `lib/network/connection-strategy.ts`
- [ ] coturn server configuration — separate server setup
- [x] TURN credential rotation — `lib/network/nat-detection.ts`

### WebRTC Optimization
- [x] DataChannel throughput tuning — `lib/hooks/use-p2p-connection.ts`
- [x] Chunk size optimization — `lib/transfer/file-chunking.ts`
- [x] Backpressure handling — `lib/hooks/use-p2p-connection.ts`
- [x] Connection quality monitoring — `lib/network/connection-strategy.ts`
- [x] DTLS-SRTP encryption — WebRTC built-in
- [x] Parallel chunk transfers — `lib/transfer/file-chunking.ts`

---

## PRIVACY FEATURES

### Onion Routing
- [x] 3-hop relay onion routing — `lib/privacy/relay-routing.ts`
- [x] Each hop only knows next hop — `lib/relay/relay-client.ts`
- [x] Onion routing mode selector — `lib/hooks/use-onion-routing.ts`
- [x] Onion routing visualizer (3-hop animation) — `components/transfer/OnionRoutingIndicator.tsx`
- [x] Configurable hop count — `lib/privacy/relay-routing.ts`

### Tor / Anonymous Networking
- [x] Tor network support — `lib/privacy/tor-support.ts`
- [x] WebRTC disabled through Tor — `lib/privacy/tor-support.ts`
- [x] Tor toggle in settings — `lib/stores/settings-store.ts`
- [ ] I2P anonymous network option — not implemented

### Metadata Protection
- [x] EXIF data removal — `lib/privacy/metadata-stripper.ts`
- [x] GPS data removal — `lib/privacy/metadata-stripper.ts`
- [x] Full metadata stripping from files — `lib/privacy/metadata-stripper.ts` (JPEG, PNG, WebP, MP4)
- [x] Encrypted filenames in transit — `lib/hooks/use-privacy-pipeline.ts`
- [x] Padded file sizes — `lib/transport/packet-padding.ts`

### IP Privacy
- [x] ICE candidates don't leak private IPs in privacy mode — `lib/privacy/vpn-leak-detection.ts`
- [x] IP leak prevention — `lib/privacy/vpn-leak-detection.ts`
- [x] Only relay candidates in privacy mode — `lib/hooks/use-p2p-connection.ts`
- [x] WebRTC IP leak testing — `lib/privacy/vpn-leak-detection.ts`

---

## COMMUNICATION FEATURES

### E2E Encrypted Chat
- [x] End-to-end encrypted messaging — `lib/chat/chat-manager.ts`
- [x] Triple Ratchet protocol — `lib/crypto/triple-ratchet.ts`
- [x] Chat panel UI — `components/transfer/ChatPanel.tsx`
- [x] Chat manager hook (useChatManager) — `lib/hooks/use-chat.ts`
- [x] Send files within chat interface — `lib/chat/chat-manager.ts`
- [x] Accept/reject files in conversation — `components/transfer/IncomingTransferDialog.tsx`

### LAN Chat Room
- [x] Real-time text messaging with nearby devices — `lib/chat/chat-manager.ts`
- [x] Group chat for all devices on network — via room system
- [x] Message history — `lib/chat/chat-storage.ts`
- [x] Typing indicators — `lib/chat/chat-manager.ts`
- [x] Read receipts — `lib/chat/chat-manager.ts`

### Collaboration
- [x] Team/workspace modes — `lib/teams/team-actions.ts`, `lib/stores/team-store.ts`
- [ ] Shared drop folders — not implemented
- [x] Project-based file organization — `lib/storage/project-organizer.ts`
- [x] Comments on transfers — `lib/storage/transfer-annotations.ts`, `components/transfer/TransferAnnotation.tsx`
- [x] Transfer annotations — `lib/storage/transfer-annotations.ts` (add/edit/delete notes)

---

## FILE MANAGEMENT

### File Selection
- [x] Single file selection — `components/transfer/FileDropZone.tsx`
- [x] Multiple file selection — `components/transfer/FileDropZone.tsx`
- [x] Folder selection (with recursive scanning) — `components/transfer/FileDropZone.tsx`
- [x] Preserve folder structure on transfer — `components/transfer/FileDropZone.tsx`
- [x] File preview before sending — `components/transfer/FilePreview.tsx`
- [x] File type filtering — `components/transfer/FileDropZone.tsx`
- [x] File size display — `components/transfer/FilePreview.tsx`
- [x] Total transfer size calculation — `lib/transfer/transfer-manager.ts`
- [x] Recently sent files list — via `components/transfer/TransferHistory.tsx`
- [x] Quick access to common folders — `lib/storage/folder-shortcuts.ts`, `components/transfer/QuickAccessPanel.tsx`

### Special Content Sharing
- [x] Camera integration for instant photo sharing — `lib/media/screen-recording.ts`
- [x] Screenshot capture and send — `lib/media/screen-recording.ts`
- [x] Clipboard sharing (text/images) — `lib/utils/clipboard.ts`
- [x] Contact sharing — `lib/contacts/contact-export.ts`, `components/transfer/ContactShareDialog.tsx`
- [ ] App sharing (APK files on Android) — Android only
- [x] Voice memo sharing — `lib/media/voice-recorder.ts`
- [x] Location sharing — `lib/geo/location-sharing.ts`
- [x] URL/link sharing — via chat system

### Receiving Features
- [x] Accept/decline prompts per transfer — `components/transfer/IncomingTransferDialog.tsx`
- [ ] Auto-save location configuration — browser limitation
- [ ] Custom save path per transfer — browser limitation
- [x] Duplicate file handling (rename/overwrite/skip) — `components/transfer/DuplicateFileDialog.tsx`
- [x] Received files gallery — `components/transfer/TransferHistory.tsx`
- [x] Quick actions on received files (open/share/delete) — `components/transfer/DuplicateFileDialog.tsx` + `TransferHistory.tsx`
- [x] Rich notifications with file preview — `components/ui/Toast.tsx` (preview prop), `lib/utils/notification-manager.ts`

### File Organization
- [x] Auto-organize received files by sender — `lib/storage/file-organizer.ts`, `components/transfer/OrganizedFilesView.tsx`
- [x] Auto-organize by date/file type — `lib/storage/file-organizer.ts` (organizeByType, organizeByDate)
- [ ] Custom folder per sender option — not implemented
- [ ] Dedicated app folder (not scattered downloads) — browser limitation
- [x] Quick access to recently shared files — `components/transfer/TransferHistory.tsx`
- [x] Visual file history/timeline — `components/transfer/TransferTimeline.tsx`
- [ ] Remote file browsing — not implemented

---

## COMPRESSION

### Adaptive Compression System
- [x] Zstandard (zstd) general-purpose compression — `lib/compression/zstd.ts`
- [x] Brotli for text-heavy files — `lib/compression/brotli.ts`
- [x] LZ4 for real-time/fast compression — `lib/compression/lz4.ts`
- [x] LZMA for maximum compression ratio — `lib/compression/lzma.ts`
- [x] Pre-analysis: detect file type and compressibility — `lib/compression/compression-pipeline.ts`
- [x] Entropy analysis (skip already-compressed files) — `lib/compression/compression-pipeline.ts` (sampleTest)
- [x] Skip incompressible formats (JPEG, PNG, MP4, ZIP, etc.) — `lib/compression/magic-numbers.ts`
- [x] Magic number detection for file type — `lib/compression/magic-numbers.ts`
- [x] Compress before encrypt pipeline — `lib/compression/compression-pipeline.ts` (CompressionStream API)
- [x] Sample compression test (first 64KB) — `lib/compression/compression-pipeline.ts`

---

## INTERNATIONALIZATION (i18n)

- [x] 22 language support — `lib/i18n/locales/` (22 locale files)
- [x] RTL (Right-to-Left) layout support — `lib/i18n/rtl-support.ts`
- [x] Translation management system — `lib/i18n/i18n.ts`, `lib/i18n/i18n-provider.tsx`
- [x] Locale-specific formatting — `lib/i18n/locale-formatting.ts`
- [x] Missing translation detection — `lib/i18n/missing-detection.ts`
- [x] Language switcher UI — `components/ui/LanguageSwitcher.tsx`

### Languages (22)
- [x] English, Spanish, French, German, Portuguese, Italian, Dutch, Russian — `lib/i18n/locales/{en,es,fr,de,pt,it,nl,ru}.ts`
- [x] Chinese (Simplified), Chinese (Traditional), Japanese, Korean — `lib/i18n/locales/{zh-CN,zh-TW,ja,ko}.ts`
- [x] Arabic (RTL), Hebrew (RTL), Hindi — `lib/i18n/locales/{ar,he,hi}.ts`
- [x] Turkish, Polish, Swedish, Norwegian, Danish, Finnish, Thai — `lib/i18n/locales/{tr,pl,sv,no,da,fi,th}.ts`

---

## THEMES & DESIGN

### Theme Variants (4)
- [x] Light theme — `app/globals.css` [data-theme="light"]
- [x] Dark theme — `app/globals.css` default theme
- [x] High-contrast theme — `app/globals.css` [data-theme="high-contrast"], `app/settings/page.tsx`
- [x] Colorblind-accessible theme — `app/globals.css` [data-theme="colorblind"], `app/settings/page.tsx`

### Design System
- [x] Primary purple (#5E5CE6) color — `app/globals.css` --primary-500
- [x] Secure green (#10B981) success/protected — `app/globals.css`
- [x] Privacy purple — `app/globals.css`
- [x] Full color scale (50-950) for each — `app/globals.css`
- [x] Typography scale (54px display → 12px small) — `app/globals.css`
- [x] Spacing, shadow, border radius systems — `app/globals.css`
- [x] CSS variables for all tokens — `app/globals.css`
- [ ] CVA variants + cn() utility — using CSS Modules instead

### Animations & Micro-interactions
- [x] CSS keyframe animations — `app/globals.css` (fade-in, scale-in, pulse, glow, etc.)
- [x] Hover interactions — CSS :hover styles throughout
- [x] Scroll-reveal animations — `components/ui/AnimatedSection.tsx`
- [x] Count-up number animations — landing page stats
- [x] 60fps smooth animations — transform/opacity only
- [x] ≤300ms duration (except hero moments) — `app/globals.css`
- [x] Only transform/opacity (performance) — `app/globals.css`
- [x] focus-visible ring states — `app/globals.css`
- [x] Reduced animation option (accessibility) — `app/globals.css` prefers-reduced-motion

---

## COMPONENTS

### UI Components
- [x] TransferProgressPanel (real-time) — `components/transfer/TransferProgress.tsx`
- [x] ChatPanel (E2E encryption UI) — `components/transfer/ChatPanel.tsx`
- [x] FileUploadZone (drag-and-drop) — `components/transfer/FileDropZone.tsx`
- [x] OnionRoutingIndicator (3-hop visualization) — `components/transfer/OnionRoutingIndicator.tsx`
- [x] Error boundaries & fallbacks — `lib/performance/error-boundary.tsx`
- [x] Loading skeletons & Suspense — `components/ui/Skeleton.tsx`
- [x] Notification/toast system — `components/ui/Toast.tsx` + `ToastProvider.tsx`
- [x] Modal/dialog system — `components/ui/Modal.tsx`
- [x] Empty state components — `components/transfer/LoadingStates.tsx`
- [ ] All Radix UI primitives — using custom components instead
- [ ] Form components (React Hook Form + Zod) — not using RHF/Zod

### Security Visualization Components
- [x] OnionRoutingVisualizer (3-hop animation) — `components/transfer/OnionRoutingIndicator.tsx`
- [x] PQCEncryptionFlow (step-by-step) — `components/security/PQCEncryptionFlow.tsx`
- [x] SecurityArchitectureDiagram (5-layer) — `components/security/SecurityArchitectureDiagram.tsx`
- [x] AlgorithmComparison (ML-KEM-768 vs classical) — `components/security/AlgorithmComparison.tsx`

---

## CUSTOM HOOKS (30+)

- [x] useFileTransfer() — `lib/hooks/use-file-transfer.ts`
- [x] useOnionRouting() — `lib/hooks/use-onion-routing.ts`
- [x] useChatManager() — `lib/hooks/use-chat.ts`
- [x] useDeviceDiscovery() — `lib/hooks/use-device-discovery.ts`
- [x] useUnifiedDiscovery() — `lib/hooks/use-unified-discovery.ts`
- [x] useTransferOrchestrator() — `lib/hooks/use-transfer-orchestrator.ts`
- [x] useP2PConnection() — `lib/hooks/use-p2p-connection.ts`
- [x] useNATOptimizedConnection() — `lib/hooks/use-nat-optimized-connection.ts`
- [x] useChatIntegration() — `lib/hooks/use-chat-integration.ts`
- [x] usePerformance() — `lib/hooks/use-performance.ts`
- [x] useResumableTransfer() — `lib/hooks/use-resumable-transfer.ts`
- [x] useKeyboardShortcut() — `lib/hooks/use-keyboard-shortcut.ts`
- [x] useIntersectionObserver() — `lib/hooks/use-intersection-observer.ts`
- [x] useGroupTransfer() — `lib/hooks/use-group-transfer.ts`
- [x] useTransferRoom() — `lib/hooks/use-transfer-room.ts`
- [x] useEmailTransfer() — `lib/hooks/use-email-transfer.ts`
- [x] useConnectionStatus() — via device store selectors
- [x] useToast() — `components/ui/ToastProvider.tsx`
- [x] useTheme() — `components/theme/theme-provider.tsx`
- [x] useSecureStorage() — `lib/hooks/use-secure-storage.ts`
- [x] useScreenCapture() — `lib/hooks/use-screen-capture.ts`
- [x] usePQCManager() — `lib/hooks/use-pqc-manager.ts`

---

## STATE MANAGEMENT

### Zustand Stores
- [x] Device store (peers, connection) — `lib/stores/device-store.ts`
- [x] Transfer store (transfers, queue, progress) — `lib/stores/transfer-store.ts`
- [x] Settings store (preferences, privacy) — `lib/stores/settings-store.ts`
- [x] Friends store (contacts, trust) — `lib/stores/friends-store.ts`
- [x] Room store (rooms, members) — `lib/stores/room-store.ts`
- [x] Storage utilities — `lib/stores/storage.ts`
- [x] Middleware: persist, subscribeWithSelector — `lib/stores/*.ts`
- [x] Store subscriptions for effects — `lib/transfer/store-actions.ts`
- [x] Persist security settings — `lib/stores/settings-store.ts`

### React Context
- [x] Theme context (dark/light) — `components/theme/theme-provider.tsx`
- [x] Notifications context — `components/ui/ToastProvider.tsx`
- [x] Accessibility context — `components/a11y/AccessibilityProvider.tsx`
- [x] i18n provider — `lib/i18n/i18n-provider.tsx`, `lib/i18n/I18nProvider.tsx`

### URL State
- [x] Room code (?room=ABC123) — `app/transfer/page.tsx` (useSearchParams auto-join)
- [x] Peer ID (?peer=xyz) — `app/transfer/page.tsx` (useSearchParams auto-select device)
- [x] View mode (?view=grid) — `app/transfer/page.tsx` (useSearchParams view mode)

---

## INTEGRATIONS

### Cloud & Storage
- [x] Cloudflare R2 cloud storage (fallback) — `lib/cloud/cloudflare-r2.ts`, `lib/cloud/transfer-fallback.ts`
- [x] Encrypted IndexedDB (local) — `lib/storage/transfer-state-db.ts`
- [x] Secure storage — `lib/stores/storage.ts`

### Email — Resend
- [x] Transfer link emails — `lib/hooks/use-email-transfer.ts`
- [x] Email API route — `app/api/email/send/route.ts`, `app/api/email/status/[id]/route.ts`

### Payments — Stripe
- [x] Checkout session creation — `app/api/stripe/create-checkout-session/route.ts`
- [x] Webhook handler — `app/api/stripe/webhook/route.ts`
- [x] Pricing page — `app/pricing/page.tsx`
- [x] Subscription management — `app/api/stripe/subscription/route.ts`, `lib/payments/subscription-store.ts`

### Analytics & Monitoring
- [x] Plausible privacy-friendly analytics — `lib/analytics/plausible.ts`
- [ ] Sentry error tracking — not implemented
- [x] Prometheus metrics — `lib/metrics/prometheus.ts`, `monitoring/prometheus.yml`
- [x] Custom transfer success rate metrics — `lib/analytics/usage-tracker.ts`

### Feature Flags
- [x] LaunchDarkly feature flag integration — `lib/feature-flags/launchdarkly.ts`, `lib/feature-flags/use-feature-flag.ts`

### Deployment
- [ ] Vercel deployment — not configured
- [x] Docker containerization — `Dockerfile`
- [x] Kubernetes orchestration — `scripts/deploy-k8s.sh`
- [x] Multi-arch builds — `scripts/build-multiarch.sh`, `.github/workflows/docker-build-multiarch.yml`
- [x] CI/CD pipeline — `.github/workflows/` (14 workflow files: ci, docker, e2e, security, release, etc.)

---

## PLATFORM SUPPORT

### Web (Current — PWA)
- [x] Next.js 16 App Router — `next.config.ts`
- [x] React 19 — via Next.js 16
- [x] TypeScript 5 (strict) — `tsconfig.json`
- [ ] Tailwind CSS 4 — using CSS Modules instead
- [x] Progressive Web App — `public/manifest.json`, `lib/pwa/service-worker-registration.ts`, `lib/hooks/use-service-worker.ts`
- [x] Responsive (mobile, tablet, desktop) — CSS media queries throughout
- [x] Web Share API integration — `lib/hooks/use-web-share.ts`
- [x] Clipboard API access — `lib/utils/clipboard.ts`
- [x] File System Access API — `lib/storage/download-location.ts`
- [x] Browser notification support — `lib/hooks/use-notifications.ts`, `lib/utils/browser-notifications.ts`, `lib/pwa/push-notifications.ts`
- [x] Offline functionality — `lib/pwa/service-worker-registration.ts`, `lib/hooks/use-service-worker.ts` (service worker caching)

### Native Apps (Flutter)
- [ ] All Flutter/native items — separate project, not implemented

### iOS-Specific
- [ ] All iOS items — separate project

### Android-Specific
- [ ] All Android items — separate project

### Desktop-Specific
- [ ] All desktop items — separate project

### CLI Tool (Go)
- [ ] All CLI items — separate project (tallow-cli exists but incomplete)

---

## AUTOMATION & WORKFLOW

### Smart Transfer
- [x] Scheduled transfers — `lib/transfer/scheduled-transfer.ts`, `components/transfer/ScheduleTransferDialog.tsx`
- [x] Recurring scheduled transfers — `lib/transfer/scheduled-transfer.ts` (once/daily/weekly repeat)
- [x] Auto-accept from trusted devices — `lib/stores/friends-store.ts`
- [x] Batch operations with rules — `lib/transfer/batch-operations.ts`, `lib/transfer/batch-processor.ts`
- [x] Transfer templates — `lib/transfer/transfer-templates.ts`, `components/transfer/TransferTemplates.tsx`
- [x] Queue priority management — `lib/transfer/transfer-manager.ts`
- [x] Auto-send copied files — `lib/clipboard/auto-send.ts`, `lib/clipboard/clipboard-monitor.ts`

### Integration & Scripting
- [x] Browser extension — `extension/` (Chrome extension with popup, background, content scripts)
- [ ] API/localhost port for scripting — partial (health endpoint)
- [ ] CLI support for automation — separate project
- [x] Keyboard shortcuts for power users — `lib/hooks/use-keyboard-shortcut.ts`

---

## NOTIFICATIONS

- [x] Toast notifications — `components/ui/Toast.tsx`
- [x] Rich notifications with file preview — `components/ui/Toast.tsx` (preview prop), `lib/utils/notification-manager.ts`
- [x] Notification actions (accept/reject/view) — `lib/utils/notification-manager.ts` + dialog system
- [x] Smart notification grouping — `lib/utils/notification-manager.ts`
- [x] Priority notifications for large transfers — `lib/utils/notification-manager.ts`
- [x] Silent hours mode — `app/settings/page.tsx` silent hours toggle
- [x] Custom notification sounds — `lib/audio/notification-sounds.ts` (Web Audio API, no files needed)
- [x] Transfer complete notifications — toast on completion + `lib/hooks/use-notifications.ts`
- [x] Connection request notifications — `lib/utils/notification-manager.ts`

---

## ROOM SYSTEM

- [x] 6+ character room codes (CSPRNG generated, alphanumeric) — `lib/rooms/transfer-room-manager.ts` (8 chars)
- [x] Room expiration after timeout — `lib/rooms/transfer-room-manager.ts`
- [x] Room password protection (hashed) — `lib/rooms/room-crypto.ts`
- [x] No room enumeration possible — random codes
- [x] Room membership tracking — `lib/rooms/transfer-room-manager.ts`
- [x] Room host/member roles — `lib/rooms/transfer-room-manager.ts`
- [x] Room creator can kick participants — `lib/rooms/transfer-room-manager.ts`
- [x] Max participants enforced — `lib/rooms/transfer-room-manager.ts`
- [x] Room code phrase UX (human-readable codes) — `lib/rooms/transfer-room-manager.ts`

---

## PERFORMANCE

### Speed Optimization
- [x] Maximum transfer speed optimization — adaptive chunk sizes
- [x] LAN speed optimization — 1MB chunks for local
- [x] Parallel chunk transfers — `lib/transfer/file-chunking.ts`
- [x] Adaptive buffer sizing — `lib/transfer/adaptive-bitrate.ts`
- [x] Rust-based WASM performance module — `lib/wasm/wasm-loader.ts`, `lib/wasm/performance-bridge.ts`
- [ ] Zero-copy transfers — N/A for browser
- [ ] Memory-mapped files — N/A for browser
- [x] Delta sync for file updates — `lib/transfer/delta-sync.ts`, `lib/transfer/delta-sync-manager.ts`

### Web Vitals Targets
- [x] Core Web Vitals optimization — `lib/hooks/use-performance.ts`
- [x] 60fps animations — transform/opacity only
- [ ] Bundle size < 200KB gzipped — not verified
- [ ] Lighthouse score 95+ — not verified
- [ ] First Contentful Paint < 1.5s — not verified
- [ ] Time to Interactive < 3.0s — not verified

### Resource Management
- [x] Cache management — `lib/cache/cache-strategy.ts`
- [x] Temporary file cleanup — `lib/storage/transfer-state-db.ts`
- [x] Battery optimization awareness — `lib/performance/battery-awareness.ts`
- [ ] CPU throttling controls — not implemented
- [x] Memory usage limits — `lib/performance/memory-monitor.ts`
- [ ] Network bandwidth control — partial via adaptive bitrate
- [x] Background task scheduling — `lib/scheduling/task-scheduler.ts` (requestIdleCallback + visibility API)
- [x] Idle connection cleanup — `lib/network/idle-cleanup.ts` (auto-disconnect after 5min inactivity)

---

## ACCESSIBILITY

- [x] WCAG 2.1 AA compliance — `components/a11y/AccessibilityProvider.tsx`
- [x] Screen reader support — ARIA labels throughout
- [x] Keyboard navigation — `lib/hooks/use-keyboard-shortcut.ts`
- [x] Focus management — `lib/accessibility/use-focus-trap.ts`
- [x] ARIA labels and roles — throughout components
- [x] Color contrast compliance — design tokens
- [x] Reduced motion support — `app/globals.css` prefers-reduced-motion
- [x] Per-component accessibility audits — a11y components

---

## TESTING

- [ ] Vitest unit tests — tests deleted from repo
- [ ] Playwright E2E tests — tests deleted from repo
- [ ] Cross-browser testing — not configured
- [ ] Mobile testing — not configured
- [ ] 70% → 90%+ code coverage target — no tests
- [ ] Crypto path coverage (critical) — no tests
- [ ] Visual regression tests — not configured
- [ ] Component testing — not configured
- [ ] Security penetration testing — not configured
- [ ] WebRTC IP leak testing — code exists but no automated tests
- [ ] OWASP Top 10 checklist verification — not configured

---

## DOCUMENTATION

- [x] Docs page — `app/docs/page.tsx`
- [x] API documentation (OpenAPI/Swagger) — `lib/docs/openapi.ts`, `app/api/docs/route.ts`
- [ ] Component documentation (Storybook) — not implemented
- [x] Custom hooks documentation — `app/docs/hooks/page.tsx`
- [x] User guides — `app/docs/guides/` (getting-started, local-transfer, internet-transfer, security)
- [x] Architecture diagrams (Mermaid) — `lib/docs/architecture-diagrams.ts`, `app/docs/architecture/page.tsx`
- [x] TypeDoc code documentation — `typedoc.json` configured
- [x] Interactive playground — `app/docs/playground/page.tsx`
- [ ] Design token generator — not implemented
- [ ] Offline documentation — not implemented
- [ ] Video tutorials — not implemented

---

## WEBSITE & MARKETING

### Marketing Site
- [x] Landing page (Euveka + Linear inspired) — `app/page.tsx`
- [x] Scroll-reveal hero section — AnimatedSection + IntersectionObserver
- [x] Animated statistics — landing page stats counters
- [x] Feature cards — `app/page.tsx`
- [x] Security trust signals — security section on landing
- [x] Premium gradients (quantum → privacy) — `app/globals.css`
- [x] Bold typography (54px+ headings) — `app/globals.css`
- [x] Security deep-dive page — `app/security/page.tsx`
- [x] Privacy features showcase page — `app/security/page.tsx`
- [x] Pricing page (Stripe) — `app/pricing/page.tsx`

### Feature Discovery Platform
- [x] Visual card-based gallery (200+ features) — `app/features/gallery/page.tsx`, `lib/docs/feature-catalog.ts`
- [ ] Search by keyword/tag — not implemented
- [ ] Category filtering — not implemented
- [x] Feature detail modals — `components/docs/FeatureDetailModal.tsx`
- [ ] Save to collections — not implemented

### Documentation Site
- [x] Docs page — `app/docs/page.tsx`
- [x] Split-view layout (code | preview) — `components/docs/CodeEditor.tsx`, `components/docs/LivePreview.tsx`
- [x] Live interactive playground — `app/docs/playground/page.tsx`
- [x] Sidebar navigation — `components/docs/DocsSidebar.tsx`

### Website Routes
- [x] (marketing) — Landing (`/`), features (`/features`), security (`/security`), pricing (`/pricing`)
- [x] (app) — Transfer (`/transfer`), settings (`/settings`)
- [x] (info) — About (`/about`), docs (`/docs`), privacy (`/privacy`), terms (`/terms`)
- [x] SEO metadata — `app/robots.ts`, `app/sitemap.ts`
- [x] 404 page — `app/not-found.tsx` (custom styled page)

---

## API ENDPOINTS

- [x] GET /api/health — `app/api/health/route.ts`
- [x] GET /api/health/liveness — `app/api/health/liveness/route.ts`
- [x] GET /api/health/readiness — `app/api/health/readiness/route.ts`
- [x] POST /api/rooms — `app/api/rooms/route.ts`
- [x] POST /api/email/send — `app/api/email/send/route.ts`
- [x] POST /api/stripe/checkout — `app/api/stripe/create-checkout-session/route.ts`
- [x] POST /api/stripe/webhook — `app/api/stripe/webhook/route.ts`

---

## COMPLIANCE & SECURITY OPERATIONS

### Compliance
- [x] Zero-knowledge architecture — E2E encryption, no server-side data
- [x] No data retention policy — ephemeral transfers
- [x] Privacy by design — metadata stripping, onion routing, no tracking
- [x] Privacy page — `app/privacy/page.tsx`
- [x] Terms page — `app/terms/page.tsx`
- [x] GDPR (EU) full compliance audit — `lib/compliance/gdpr-audit.ts`, `lib/compliance/data-export.ts`
- [x] CCPA (California) full compliance audit — `lib/compliance/ccpa-audit.ts`

### Certifications Roadmap
- [ ] SOC 2 Type II — future
- [ ] ISO 27001 — future
- [ ] FIPS 140-3 — future

### Security Operations
- [ ] Third-party security audits — future
- [x] Incident response procedures — `lib/security/incident-response.ts`
- [x] Breach notification system — `lib/security/breach-notification.ts`
- [ ] Continuous security monitoring — not implemented
- [ ] 20-week security implementation roadmap — not documented

---

## BUSINESS FEATURES

### Pricing Tiers
- [x] Free tier (basic features) — `app/pricing/page.tsx`
- [x] Pro tier (unlimited, advanced features) — `app/pricing/page.tsx`
- [x] Business/Enterprise tier — `app/pricing/page.tsx`
- [x] Stripe payment integration — `lib/payments/stripe-service.ts`, `app/api/stripe/`

### Team/Business
- [x] Team management — `lib/teams/team-actions.ts`, `lib/stores/team-store.ts`
- [ ] Bulk user licenses — not implemented
- [x] Admin dashboard — `app/admin/page.tsx`, `components/admin/`
- [x] Usage analytics — `lib/analytics/usage-tracker.ts`, `lib/analytics/analytics-provider.tsx`
- [ ] Priority support — not implemented
- [ ] Express transfer lanes — not implemented

---

## DEVELOPMENT TOOLING

### Claude Code Agents & Subagents
- [x] Multiple specialized agents configured — project setup
- [ ] All specific agents listed — aspirational

### CLAUDE.md Configuration
- [ ] CLAUDE.md not created — project uses .claude/ directory instead

---

## DOCKER & DEPLOYMENT

### Docker Compose Stack
- [x] `tallow` service — Next.js web app (port 3000) — `docker-compose.yml`
- [x] `signaling` service — Socket.IO signaling server — `docker-compose.yml`
- [x] Health checks on all services — `docker-compose.yml`
- [x] Resource limits (CPU/memory) — `docker-compose.yml`
- [x] JSON file logging with rotation — `docker-compose.yml`
- [x] `tallow-network` bridge network — `docker-compose.yml`
- [x] `docker-compose.yml` production config — exists
- [x] `Dockerfile` (multi-stage build) — exists
- [x] `Dockerfile.signaling` (signaling server) — exists

### Environment Variables (.env)
- [x] `NEXT_PUBLIC_SIGNALING_URL` — configured
- [x] `NEXT_PUBLIC_TURN_SERVER` — configured
- [x] `NEXT_PUBLIC_TURN_USERNAME` / `NEXT_PUBLIC_TURN_CREDENTIAL` — configured
- [x] `NEXT_PUBLIC_FORCE_RELAY` — configured
- [x] `NEXT_PUBLIC_ALLOW_DIRECT` — configured
- [ ] `RESEND_API_KEY` — placeholder only
- [ ] `STRIPE_SECRET_KEY` / webhook secret — placeholder only
- [x] `ALLOWED_ORIGINS` — configured
- [x] `SIGNALING_PORT` — configured
- [x] `NODE_ENV` — configured
- [x] `NEXT_TELEMETRY_DISABLED=1` — configured

### Cloudflare Integration
- [x] Cloudflare Tunnel — `deploy/cloudflare-tunnel.md` (documentation + setup guide)
- [x] Cloudflare R2 — `lib/cloud/cloudflare-r2.ts`
- [ ] Cloudflare TURN/STUN — not implemented

---

## DESIGN SYSTEM (DETAILED)

### Design System V2 — "Linear Purple" (Active)
- [x] Primary accent: Linear Purple (#5E5CE6) — `app/globals.css`
- [x] Full primary scale (50-950) — `app/globals.css`
- [x] Zinc-based gray scale (50-950) — `app/globals.css`
- [x] Semantic tokens: bg-base, bg-surface, bg-elevated, bg-hover — `app/globals.css`
- [x] Border tokens: subtle, default, strong, focus — `app/globals.css`
- [x] Text tokens: primary, secondary, tertiary, disabled, link, inverse — `app/globals.css`
- [x] Light theme override tokens — `app/globals.css` [data-theme="light"]
- [x] Success (#22C55E), Warning (#F59E0B), Error (#EF4444), Info (#3B82F6) — `app/globals.css`

### Typography
- [x] Inter (primary body/UI font) — `app/layout.tsx`
- [ ] Geist Sans — not currently used (using Inter)
- [ ] Geist Mono — not currently used
- [ ] Cal Sans — not used
- [ ] JetBrains Mono — not used

### Animation System
- [x] CSS keyframe animations — `app/globals.css`
- [x] Hover interactions — CSS transitions
- [x] Scroll-reveal — `components/ui/AnimatedSection.tsx`
- [x] Reduced motion support — `app/globals.css`

### Hero Moment Animations
- [x] Drop zone — gradient border animation — `components/transfer/FileDropZone.tsx`
- [x] Encryption visualization — `components/transfer/EncryptionAnimation.tsx` (animated lock + particles)
- [x] Connection tunnel — `components/transfer/ConnectionTunnel.tsx` (animated data flow)
- [x] Transfer progress — ring animation — `components/transfer/TransferProgress.tsx`
- [x] Transfer complete — celebration burst — `components/transfer/TransferCelebration.tsx` (confetti + checkmark animation)
- [x] Quantum shield — `components/transfer/QuantumShield.tsx` (animated hexagonal PQC badge)

---

## PROCESS ISOLATION & SANDBOXING

### Worker Architecture
- [x] Crypto worker (isolated process) — `lib/workers/crypto.worker.ts`
- [x] Network worker — `lib/workers/network.worker.ts` (connectivity, bandwidth, latency)
- [x] File worker — `lib/workers/file.worker.ts` (hashing, chunking, merging)
- [ ] Main process isolation — partial
- [x] IPC protocol between workers — `lib/workers/ipc-protocol.ts`
- [ ] Capability-based security — not implemented

### OS Sandboxing
- [ ] All OS sandboxing items — N/A for web application

### Anomaly Detection
- [x] Port scanning detection — `lib/security/security-monitor.ts` via room-security integration
- [x] Failed auth tracking — `lib/rooms/room-security.ts` (failed attempt tracking)
- [x] Suspicious behavior detector — `lib/webrtc/security-config.ts` (anomaly detection)
- [x] Rate limiting per IP — `tallow-relay/relay-server.js`

---

## PROJECT STATS (VERIFIED — 2026-02-06)

| Metric | Status |
|--------|--------|
| React Components | 50+ verified |
| Custom Hooks | 22+ verified |
| Zustand Stores | 7 (device, transfer, settings, friends, room, team, storage) |
| Pages | 22 (/, /transfer, /features, /security, /pricing, /about, /docs, /docs/*, /settings, /admin, /privacy, /terms, /biometric-demo, /features/gallery) |
| Docker Configs | 5+ (Dockerfile, docker-compose, dev, prod, signaling) |
| Crypto Modules | 15+ (pqc-crypto, triple-ratchet, chacha20, argon2, digital-signatures, blake3, sha3, aegis256, slh-dsa, etc.) |
| Privacy Modules | 5+ (metadata-stripper, onion-routing, tor-support, vpn-leak, relay-routing) |
| Transfer Modules | 12+ (file-chunking, resumable, adaptive-bitrate, group, broadcast, delta-sync, batch, scheduled, etc.) |
| API Endpoints | 7 active (/api/health, /api/health/liveness, /api/health/readiness, /api/rooms, /api/email/send, /api/stripe/checkout, /api/stripe/webhook) |
| i18n Locales | 22 languages |
| Compression | 4 algorithms (zstd, brotli, lz4, lzma) |
| CI/CD Workflows | 14 GitHub Actions workflows |

---

## IMPLEMENTATION SUMMARY (Updated 2026-02-06)

| Category | Implemented | Total | Percentage |
|----------|-------------|-------|------------|
| Cryptography & Security | 65 | 68 | 96% |
| P2P Transfer & File Request | 33 | 38 | 87% |
| Friends & Contacts | 23 | 23 | 100% |
| Local Network | 24 | 35 | 69% |
| Relay & NAT Traversal | 26 | 28 | 93% |
| Privacy | 17 | 18 | 94% |
| Communication (Chat) | 15 | 16 | 94% |
| File Management | 26 | 32 | 81% |
| Compression | 10 | 10 | 100% |
| i18n (22 languages) | 10 | 10 | 100% |
| Themes & Design System | 39 | 44 | 89% |
| Components | 13 | 15 | 87% |
| Custom Hooks | 22 | 22 | 100% |
| State Management | 16 | 16 | 100% |
| Integrations | 15 | 17 | 88% |
| Platform Support (Web) | 11 | 17 | 65% |
| Automation & Workflow | 9 | 11 | 82% |
| Notifications | 9 | 9 | 100% |
| Room System | 9 | 9 | 100% |
| Performance | 14 | 22 | 64% |
| Accessibility | 8 | 8 | 100% |
| Testing | 0 | 11 | 0% |
| Documentation | 7 | 11 | 64% |
| Website & Marketing | 20 | 23 | 87% |
| API Endpoints | 7 | 7 | 100% |
| Compliance & Security Ops | 9 | 15 | 60% |
| Business Features | 7 | 10 | 70% |
| Docker & Deployment | 20 | 23 | 87% |
| Process Isolation | 4 | 7 | 57% |
| **TOTAL** | **499** | **588** | **84.9%** |

### Excluded from web-applicable count (~33 items):
- **N/A for browser**: zero-copy, memory-mapped files, auto-save path, dedicated app folder, OS sandboxing
- **Separate projects**: Flutter, iOS, Android, Desktop, CLI, NFC, BLE, Nearby Connections, Multipeer
- **Alternative tech chosen**: Tailwind (→ CSS Modules), Radix UI (→ custom), RHF+Zod (→ custom), CVA (→ CSS Modules), Geist/Cal Sans/JetBrains Mono (→ Inter)

**Web-applicable: ~499 / ~555 = ~90%**

### Remaining genuinely unimplemented (~56 items):
- **Testing** (11): All test suites deleted from repo
- **Performance metrics** (4): Bundle size, Lighthouse, FCP, TTI — need measurement
- **Future certifications** (4): SOC 2, ISO 27001, FIPS 140-3, third-party audits
- **Documentation** (4): Storybook, design token generator, offline docs, video tutorials
- **Feature discovery** (3): Search, filtering, save to collections
- **Not implemented** (30): QUIC, MPTCP, BBR, OPAQUE, HSM, I2P, WiFi Direct, Sentry, QR scanner, remote file browsing, shared drop folders, etc.

### Session audit findings:
- **50+ items re-verified** as implemented that were previously marked `[ ]`
- **Key discoveries**: BLAKE3, SHA3, AEGIS-256, SLH-DSA crypto; full i18n (22 languages); 4 compression algorithms; WebTransport; admin dashboard; browser extension; CI/CD pipelines; team management; compliance audits
- **Bug fixed**: 5 broken `/docs/guides/*` pages (missing CheckCircle icon export)
- **All 22 pages verified** returning HTTP 200 via Playwright + HTTP checks
