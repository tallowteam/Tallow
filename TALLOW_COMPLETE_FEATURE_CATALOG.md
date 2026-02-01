# TALLOW - COMPREHENSIVE FEATURE CATALOG

**Last Updated:** January 26, 2026
**Version:** 0.1.0
**Project Type:** Secure P2P File Transfer Platform with Post-Quantum Cryptography
**Tech Stack:** Next.js 16, React 19, TypeScript, WebRTC, Socket.IO
**Status:** Production-Ready

---

## TABLE OF CONTENTS

1. [Core Features](#1-core-features)
2. [Security Features](#2-security-features)
3. [Privacy Features](#3-privacy-features)
4. [Communication Features](#4-communication-features)
5. [Advanced Transfer Features](#5-advanced-transfer-features)
6. [UI/UX Features](#6-uiux-features)
7. [Network & Connectivity](#7-network--connectivity)
8. [Monitoring & Analytics](#8-monitoring--analytics)
9. [Developer Features](#9-developer-features)
10. [API Endpoints](#10-api-endpoints)
11. [Third-Party Integrations](#11-third-party-integrations)
12. [Deployment & Infrastructure](#12-deployment--infrastructure)
13. [Storage Features](#13-storage-features)
14. [Utilities & Helpers](#14-utilities--helpers)
15. [Feature Flags](#15-feature-flags)
16. [Dependencies](#16-dependencies)

---

## 1. CORE FEATURES

### 1.1 File Transfer Engine
**Location:** `lib/transfer/`, `lib/crypto/file-encryption-pqc.ts`
**Status:** ✅ Fully Implemented

**Capabilities:**
- **P2P Direct Transfer**: WebRTC DataChannel for peer-to-peer file sharing
- **End-to-End Encryption**: AES-256-GCM client-side encryption
- **Chunk-Based Transfer**: 64KB chunks with integrity verification (BLAKE3 hashing)
- **Progress Tracking**: Real-time progress with speed calculation and ETA
- **File Metadata Encryption**: Encrypted filenames and paths
- **Large File Support**: Files up to 4GB with chunked streaming
- **Zero Server Storage**: Files never stored on server
- **Multi-File Support**: Send multiple files simultaneously
- **Acknowledgment Protocol**: Chunk-level ACK with 3 retry attempts
- **Bandwidth Optimization**: Adaptive chunk sizing based on connection quality

**Key Files:**
- `lib/transfer/pqc-transfer-manager.ts` (1,200+ lines)
- `lib/crypto/file-encryption-pqc.ts` (800+ lines)
- `lib/transfer/file-chunking.ts`
- `lib/transfer/encryption.ts`

---

## 2. SECURITY FEATURES

### 2.1 Post-Quantum Cryptography (PQC)
**Location:** `lib/crypto/pqc-crypto.ts`
**Status:** ✅ Production-Grade Implementation

**Features:**
- **Hybrid Key Exchange**: ML-KEM-768 (Kyber) + X25519 ECDH dual protection
- **NIST Standardized**: Uses NIST's post-quantum standard (ML-KEM-768)
- **Quantum-Resistant**: Protection against both classical and quantum attacks
- **Forward Secrecy**: Ephemeral keys destroyed after each session
- **Key Rotation**: Automatic rotation every 5 minutes (max 100 generations)
- **Session Key Derivation**: HKDF-SHA-256 for encryption, auth, and session ID
- **Constant-Time Operations**: Timing-safe comparisons prevent side-channel attacks
- **Memory Safety**: Explicit memory wiping of sensitive key material

**Technical Specifications:**
- Kyber-768: 1184B public key, 2400B private key
- X25519: 32B public/private keys
- Session key lifetime: 5 minutes
- Key rotation interval: Configurable

**Key Files:**
- `lib/crypto/pqc-crypto.ts` - Core PQC implementation
- `lib/crypto/pqc-crypto-lazy.ts` - Lazy-loaded module
- `lib/crypto/key-management.ts` - Key lifecycle
- `lib/security/key-rotation.ts` - Rotation logic

### 2.2 Encryption Suite
**Location:** `lib/crypto/`
**Status:** ✅ Military-Grade Encryption

**Algorithms Implemented:**
- **AES-256-GCM**: Symmetric encryption with authentication
- **BLAKE3**: Ultra-fast cryptographic hashing
- **SHA-256**: Key derivation and message authentication
- **HMAC-SHA-256**: Message authentication codes
- **Argon2**: Password-based key derivation (browser-optimized)
- **Ed25519**: Digital signatures for authentication
- **ChaCha20-Poly1305**: Alternative AEAD cipher (optional)

**Advanced Protocols:**
- **X3DH (Extended Triple Diffie-Hellman)**: Key agreement protocol
- **Double Ratchet**: Signal Protocol implementation
- **Triple Ratchet**: Enhanced ratcheting with PQC layer
- **Sparse PQ Ratchet**: Post-quantum ratcheting mechanism

**Key Files:**
- `lib/crypto/file-encryption-pqc.ts`
- `lib/crypto/password-file-encryption.ts`
- `lib/crypto/digital-signatures.ts`
- `lib/crypto/argon2-browser.ts`
- `lib/crypto/signed-prekeys.ts`
- `lib/crypto/triple-ratchet.ts`
- `lib/crypto/sparse-pq-ratchet.ts`

### 2.3 Authentication & Verification
**Location:** `lib/crypto/`, `lib/security/`
**Status:** ✅ Multi-Layer Authentication

**Features:**
- **SAS Verification**: 6-emoji Short Authentication String for MITM detection
- **Peer Authentication**: Cryptographic peer identity verification
- **Device Verification**: Trusted device management with fingerprinting
- **API Key Authentication**: X-API-Key header validation
- **CSRF Protection**: Double-submit cookie pattern
- **Rate Limiting**: IP-based throttling (3-5 req/min configurable)
- **Input Validation**: Zod schemas for all API inputs
- **Credential Encryption**: AES-256-GCM encrypted credential storage

**Key Files:**
- `lib/crypto/peer-authentication.ts`
- `lib/auth/user-identity.ts`
- `lib/security/csrf.ts`
- `lib/security/credential-encryption.ts`
- `lib/middleware/rate-limit.ts`
- `lib/validation/schemas.ts`

### 2.4 Secure Storage System
**Location:** `lib/storage/`
**Status:** ✅ Zero-Knowledge Storage

**Capabilities:**
- **Encrypted LocalStorage**: AES-256-GCM with per-user keys
- **IndexedDB Encryption**: Non-extractable CryptoKeys
- **Transfer State Persistence**: Resumable transfer state in IndexedDB
- **Friends Database**: Encrypted trusted contacts list
- **Device Registry**: Encrypted device list with metadata
- **Transfer History**: Encrypted transfer records with search
- **Temp File Storage**: Encrypted temporary file handling
- **Migration Utilities**: Secure data migration tools

**Key Files:**
- `lib/storage/secure-storage.ts` (400+ lines)
- `lib/storage/transfer-state-db.ts`
- `lib/storage/friends.ts`
- `lib/storage/my-devices.ts`
- `lib/storage/temp-file-storage.ts`
- `lib/storage/migrate-to-secure.ts`

### 2.5 Memory Security
**Location:** `lib/security/`
**Status:** ✅ Production Hardened

**Features:**
- **Memory Wiping**: Explicit zeroing of sensitive buffers
- **Timing-Safe Comparisons**: XOR-based constant-time comparison
- **Secure Cleanup**: Automatic cleanup on session destroy
- **Key Material Sanitization**: Secure deletion from memory
- **Buffer Overwrite**: Multiple-pass secure deletion

**Key Files:**
- `lib/security/memory-wiper.ts`
- `lib/security/timing-safe.ts`

---

## 3. PRIVACY FEATURES

### 3.1 Metadata Protection
**Location:** `lib/privacy/metadata-stripper.ts`
**Status:** ✅ Industry-Leading Privacy

**Capabilities:**
- **EXIF Stripping**: Remove GPS, device, timestamp data from images
- **Supported Formats**: JPEG, PNG, WebP, HEIC, MP4, QuickTime, AVI, MKV
- **Video Metadata**: Strip codec, camera, location data from videos
- **Audio Metadata**: Remove ID3 tags, artist info, timestamps
- **Batch Processing**: Process multiple files simultaneously
- **Orientation Preservation**: Optional orientation data retention
- **Canvas Re-encoding**: Fallback for unsupported formats
- **Privacy Warnings**: Alert users about sensitive metadata found

**Metadata Removed:**
- GPS coordinates (latitude, longitude, altitude)
- Camera info (make, model, lens, settings)
- Timestamps (creation, modification, access dates)
- Author/copyright information
- Software/editor information
- Thumbnail images
- Color profiles

**Key Files:**
- `lib/privacy/metadata-stripper.ts` (600+ lines)
- `lib/hooks/use-metadata-stripper.ts`
- `components/privacy/metadata-strip-dialog.tsx`

### 3.2 Privacy Modes
**Location:** `lib/privacy/`
**Status:** ✅ Maximum Privacy Protection

**Features:**
- **Relay-Only Mode**: Force TURN relay to prevent IP leaks
- **VPN Leak Detection**: Detect VPN usage and WebRTC IP leaks
- **Tor Browser Support**: Optimized for Tor with .onion support
- **Traffic Obfuscation**: Random padding and decoy packets
- **IP Leak Prevention**: Block host/srflx ICE candidates
- **Privacy Levels**: Low/Medium/High/Maximum configurable settings
- **Trusted Contacts**: Selective privacy for known contacts
- **Anonymous Mode**: No device fingerprinting

**Privacy Levels:**
- **Low**: Standard encryption only
- **Medium**: + Relay-only mode
- **High**: + Traffic obfuscation + VPN check
- **Maximum**: + Tor mode + No fingerprinting

**Key Files:**
- `lib/privacy/privacy-settings.ts` (500+ lines)
- `lib/privacy/vpn-leak-detection.ts`
- `lib/privacy/tor-support.ts`
- `lib/privacy/relay-routing.ts`
- `lib/transport/obfuscation.ts`
- `components/privacy/privacy-settings-panel.tsx`

### 3.3 Network Privacy
**Location:** `lib/transport/`, `lib/network/`
**Status:** ✅ Advanced Network Protection

**Features:**
- **Private WebRTC**: Leak-proof WebRTC configuration
- **Onion Routing**: Multi-hop routing (3+ hops)
- **Proxy Support**: SOCKS5/HTTP/HTTPS proxy integration
- **Connection Obfuscation**: Hide WebRTC fingerprints
- **TURN Relay Forcing**: Mandatory relay connections
- **ICE Candidate Filtering**: Remove revealing candidates
- **DNS Leak Prevention**: Block DNS queries

**Key Files:**
- `lib/transport/private-webrtc.ts`
- `lib/transport/onion-routing.ts`
- `lib/network/proxy-config.ts`

---

## 4. COMMUNICATION FEATURES

### 4.1 Encrypted Chat System
**Location:** `lib/chat/`
**Status:** ✅ Enterprise-Grade Messaging

**Features:**
- **End-to-End Encrypted**: ML-KEM-768 + X25519 message encryption
- **Real-Time Delivery**: WebRTC DataChannel for instant messages
- **Message Types**: Text, files, emojis, system notifications
- **Message Status**: Sending → Sent → Delivered → Read
- **Typing Indicators**: Real-time typing notifications
- **Read Receipts**: Message read tracking
- **Message Editing**: Edit sent messages (with history)
- **Message Deletion**: Delete for all participants
- **Reply Functionality**: Quote and reply to messages
- **File Attachments**: Up to 5MB inline files
- **Message Persistence**: IndexedDB storage with encryption
- **Full-Text Search**: Search across message history
- **Export Options**: JSON/TXT chat history export
- **Retry Logic**: 3 automatic retries on failure
- **Offline Queue**: Queue messages when offline

**Additional Features:**
- **Markdown Support**: Bold, italic, code blocks, links
- **Emoji Picker**: 100+ emojis with search
- **Character Counter**: Real-time character count
- **Auto-Send**: Send on Enter key
- **Pagination**: Load messages in batches

**Key Files:**
- `lib/chat/chat-manager.ts` (880+ lines)
- `lib/chat/chat-encryption.ts`
- `lib/chat/message-encryption.ts`
- `lib/chat/chat-storage.ts` (280+ lines)
- `components/app/ChatPanel.tsx` (330+ lines)
- `components/app/MessageBubble.tsx`
- `components/app/ChatInput.tsx`

### 4.2 Screen Sharing
**Location:** `lib/webrtc/screen-sharing.ts`
**Status:** ✅ Professional Quality

**Features:**
- **Quality Presets**: 720p, 1080p, 4K (up to 3840×2160)
- **Frame Rate Control**: 15, 30, 60 FPS
- **System Audio**: Share audio along with screen (Chrome/Edge)
- **Cursor Control**: Show/hide cursor in share
- **Adaptive Bitrate**: Auto-adjust quality based on bandwidth
- **Pause/Resume**: Temporarily pause without disconnecting
- **Source Switching**: Switch screens/windows on-the-fly
- **Connection Quality**: Monitor latency, packet loss, FPS
- **Statistics Dashboard**: Real-time stats overlay
- **Auto-Stop Detection**: Stop when user closes native share
- **Fullscreen Viewer**: Immersive viewing mode
- **Picture-in-Picture**: Keep share visible while multitasking
- **Recording Support**: Optional local recording

**Browser Support:**
- Chrome 72+: Full support with system audio
- Edge 79+: Full support with system audio
- Firefox 66+: Screen sharing only (no system audio)
- Safari 13+: Limited support
- Opera 60+: Full support

**Key Files:**
- `lib/webrtc/screen-sharing.ts` (700+ lines)
- `lib/hooks/use-screen-share.ts`
- `lib/hooks/use-screen-capture.ts`
- `components/app/ScreenShare.tsx`
- `components/app/ScreenShareViewer.tsx`
- `components/app/ScreenSharePreview.tsx`
- `app/screen-share-demo/page.tsx`

### 4.3 Voice Commands (Beta)
**Location:** `lib/hooks/use-voice-commands.ts`
**Status:** ⚠️ Feature Flagged (Beta)

**Features:**
- **Web Speech API**: Browser-native speech recognition
- **Hands-Free Control**: Voice-controlled file operations
- **Command Recognition**: Pre-defined command set
- **Accessibility**: Enhanced for users with disabilities
- **Multi-Language**: Support for 50+ languages

**Commands:**
- "Send file" - Initiate file transfer
- "Cancel transfer" - Cancel ongoing transfer
- "Accept" - Accept incoming file
- "Reject" - Reject incoming file

**Key Files:**
- `lib/hooks/use-voice-commands.ts`
- `components/accessibility/voice-commands.tsx`

---

## 5. ADVANCED TRANSFER FEATURES

### 5.1 Group Transfer (1-to-Many)
**Location:** `lib/transfer/group-transfer-manager.ts`
**Status:** ✅ Production Ready

**Capabilities:**
- **Multi-Recipient**: Send to 2-10 recipients simultaneously
- **Parallel Transfers**: Independent PQC sessions per recipient
- **Individual Progress**: Track each recipient separately
- **Bandwidth Management**: Per-recipient bandwidth throttling
- **Graceful Degradation**: Continue even if some recipients fail
- **Connection Quality**: Monitor each peer's connection
- **Group Signaling**: Coordinated WebRTC setup
- **Fair Bandwidth**: Equal distribution or priority-based
- **Recipient Selection**: Smart device picker with search

**Key Features:**
- Speed graphs per recipient
- Success/failure tracking
- Animated progress bars
- Device avatars
- Real-time ETA calculations
- Toast notifications per recipient

**Key Files:**
- `lib/transfer/group-transfer-manager.ts` (800+ lines)
- `lib/hooks/use-group-transfer.ts`
- `lib/webrtc/data-channel.ts` (660+ lines)
- `components/app/GroupTransferProgress.tsx`
- `components/app/RecipientSelector.tsx`
- `components/app/GroupTransferConfirmDialog.tsx`

### 5.2 Resumable Transfers
**Location:** `lib/transfer/resumable-transfer.ts`
**Status:** ✅ Robust Implementation

**Features:**
- **Auto State Persistence**: Save state to IndexedDB every 5 seconds
- **Connection Loss Detection**: Detect disconnections instantly
- **Resume Protocol**: Efficient chunk bitmap exchange
- **Chunk Verification**: SHA-256 verification after resume
- **Auto-Resume**: Optional automatic resume on reconnect
- **Transfer Expiration**: Clean up old transfers (24h default)
- **Max Resume Attempts**: Configurable limit (3 default)
- **Progress Recovery**: Resume from exact chunk position
- **Bandwidth Resumption**: Restore optimal bandwidth settings

**Resume Flow:**
1. Detect disconnection
2. Save transfer state
3. Attempt reconnection (3 tries, exponential backoff)
4. Exchange chunk bitmaps
5. Resume from last successful chunk
6. Verify integrity

**Key Files:**
- `lib/transfer/resumable-transfer.ts` (600+ lines)
- `lib/storage/transfer-state-db.ts`
- `lib/hooks/use-resumable-transfer.ts`
- `components/app/ResumableTransferDialog.tsx`

### 5.3 Transfer Rooms
**Location:** `lib/rooms/transfer-room-manager.ts`
**Status:** ✅ Multi-User Collaboration

**Features:**
- **Persistent Rooms**: Create/join with 8-character codes
- **Multi-User Support**: Up to 10 members per room
- **Room Codes**: Alphanumeric codes (e.g., "ABC12XYZ")
- **Password Protection**: Optional AES-256 encrypted passwords
- **Expiration Options**: 1h/6h/24h/7d/30d/Never
- **Member Presence**: Real-time online/offline status
- **File Broadcasting**: Share files with all room members
- **Room Management**: Owner controls (close room, kick members)
- **Auto-Rejoin**: Reconnect after disconnect
- **Direct URL**: Share via URL (e.g., `/room/ABC12XYZ`)
- **Room Analytics**: Track member count, files shared

**Room Features:**
- Copy room code
- Share room URL
- Member list with status
- File offer notifications
- Owner privileges
- Time remaining display
- Keyboard navigation
- WCAG AA accessible

**Key Files:**
- `lib/rooms/transfer-room-manager.ts` (900+ lines)
- `lib/rooms/room-p2p-integration.ts`
- `lib/hooks/use-transfer-room.ts`
- `components/app/TransferRoom.tsx`
- `app/room/[code]/page.tsx`
- `app/api/rooms/` - REST APIs

### 5.4 Folder Transfer
**Location:** `lib/transfer/folder-transfer.ts`
**Status:** ✅ Hierarchical Transfer

**Features:**
- **Directory Structure**: Preserve complete folder hierarchy
- **Recursive Transfer**: Handle nested folders (unlimited depth)
- **Path Encryption**: Encrypt relative paths for privacy
- **Folder Compression**: Optional ZIP compression
- **Progress Tracking**: File-by-file progress display
- **Folder Tree View**: Visual folder structure
- **Selective Transfer**: Choose specific files/folders
- **Size Calculation**: Accurate total size before transfer

**Key Files:**
- `lib/transfer/folder-transfer.ts` (500+ lines)
- `lib/transfer/folder-transfer-integration.ts`
- `components/transfer/FolderSelector.tsx`
- `components/transfer/FolderTree.tsx`
- `components/transfer/FolderProgress.tsx`
- `components/transfer/FolderDownload.tsx`

### 5.5 Email Fallback System
**Location:** `lib/email/`
**Status:** ✅ Production Integration

**Features:**
- **Resend Integration**: Professional email delivery
- **File Compression**: Automatic fflate compression
- **Password Protection**: AES-256 encrypted email attachments
- **Batch Sending**: Multiple recipients per email
- **Delivery Tracking**: Track sent/delivered/opened/downloaded
- **Download Links**: Secure tokenized links
- **Link Expiration**: 1h/6h/24h/7d/30d expiration
- **Max Downloads**: Limit downloads (1-10 times)
- **Retry Manager**: Automatic retry with exponential backoff
- **Email Analytics**: Track email metrics
- **Custom Branding**: Logo, colors, company name
- **React Email Templates**: Beautiful responsive templates

**Email Types:**
- File transfer notification
- Welcome email
- Share invitation
- Download link

**Key Files:**
- `lib/email/email-service.ts` (400+ lines)
- `lib/email/file-compression.ts`
- `lib/email/password-protection.ts`
- `lib/email/retry-manager.ts`
- `lib/email/email-storage.ts`
- `lib/emails/file-transfer-email.tsx`
- `lib/emails/welcome-email.tsx`
- `components/app/EmailFallbackDialog.tsx`

---

## 6. UI/UX FEATURES

### 6.1 Themes & Design System
**Location:** `app/globals.css`, `components/theme-*`
**Status:** ✅ Professional Design

**Features:**
- **Dark Mode**: Full dark theme with optimal contrast
- **Light Mode**: Clean light theme
- **System Sync**: Auto-detect OS theme preference
- **Smooth Transitions**: Animated theme switching
- **Custom Color Schemes**: Extensible theming system
- **Tailwind CSS 4**: Modern utility-first styling
- **Radix UI Primitives**: Accessible components
- **CVA (Class Variance Authority)**: Type-safe variants
- **Design Tokens**: Consistent spacing, colors, typography

**Design Tokens:**
- 8px base unit
- 16-step color palettes
- Typography scale (12px-96px)
- Shadow levels (sm/md/lg/xl/2xl)
- Border radii (sm/md/lg/full)

**Key Files:**
- `app/globals.css` (2000+ lines)
- `components/theme-toggle.tsx`
- `components/theme-provider.tsx`
- `lib/context/settings-context.tsx`
- `tailwind.config.ts`

### 6.2 Animation System
**Location:** `lib/animations/`, `components/*-animated.tsx`
**Status:** ✅ Smooth Animations

**Features:**
- **Framer Motion**: Production-grade animations
- **12+ Animation Types**: Fade, slide, scale, rotate, bounce, etc.
- **Page Transitions**: Smooth route changes
- **Component Animations**: Animated cards, lists, buttons
- **Reduced Motion**: Respect user preferences (prefers-reduced-motion)
- **Performance Optimized**: 60 FPS animations
- **Gesture Support**: Touch/swipe/drag animations
- **Spring Physics**: Natural motion feel

**Animation Types:**
- fadeIn/fadeOut
- slideUp/slideDown/slideLeft/slideRight
- scaleIn/scaleOut
- rotateIn/rotateOut
- bounceIn/bounceOut
- staggerChildren (sequential animations)

**Key Files:**
- `lib/animations/motion-config.ts`
- `lib/animations/page-transition.tsx`
- `lib/animations/animated-components.tsx`
- `components/transfer/transfer-card-animated.tsx`
- `components/devices/device-list-animated.tsx`
- `lib/context/reduced-motion-context.tsx`

### 6.3 Internationalization (i18n)
**Location:** `lib/i18n/`
**Status:** ✅ Multi-Language Support

**Features:**
- **Languages**: English (default), Hebrew (עברית)
- **RTL Support**: Full right-to-left layout for Hebrew
- **Language Context**: React context for app-wide translations
- **Dynamic Switching**: Change language without reload
- **Locale Formatting**: Date, time, number, currency formatting
- **Pluralization**: Proper plural forms
- **Fallback Language**: English as default
- **Missing Key Handling**: Graceful fallback
- **Translation Files**: JSON-based structure

**Locale Features:**
- Date formatting (relative, absolute)
- Time formatting (12h/24h)
- Number formatting (1,000.00 vs 1.000,00)
- Currency formatting
- Percentage formatting
- File size formatting

**Key Files:**
- `lib/i18n/language-context.tsx` (200+ lines)
- `lib/i18n/locale-formatter.ts` (300+ lines)
- `lib/i18n/rtl-support.css`
- `lib/i18n/translations/he.json`
- `components/language-dropdown.tsx`

### 6.4 Progressive Web App (PWA)
**Location:** `lib/pwa/`, `public/manifest.json`
**Status:** ✅ Full PWA Support

**Features:**
- **Installable**: Add to home screen (iOS/Android/Desktop)
- **Service Worker**: Offline functionality
- **App Manifest**: PWA metadata
- **Push Notifications**: Web push (optional)
- **Offline Mode**: Work without internet
- **App Icons**: 192×192, 512×512, maskable icons
- **Splash Screens**: iOS splash screens
- **Install Prompt**: Custom install UI
- **Update Manager**: Auto-update service worker

**PWA Capabilities:**
- Cache static assets
- Cache API responses
- Background sync
- Push notifications
- Share target (receive files)
- File handling (open files in app)

**Key Files:**
- `lib/pwa/service-worker-registration.ts`
- `lib/pwa/push-notifications.ts`
- `lib/hooks/use-pwa.ts`
- `lib/hooks/use-service-worker.ts`
- `public/manifest.json`
- `public/sw.js`
- `components/app/install-prompt.tsx`
- `app/offline/page.tsx`

### 6.5 Accessibility (a11y)
**Location:** `lib/utils/accessibility.ts`, `components/accessibility/`
**Status:** ✅ WCAG 2.1 AA Compliant

**Features:**
- **Screen Reader Support**: Full ARIA labels
- **Keyboard Navigation**: Tab, arrow keys, shortcuts
- **Focus Management**: Focus traps, focus restoration
- **Live Regions**: ARIA-live announcements
- **Color Contrast**: 4.5:1 minimum ratio
- **Touch Targets**: 44×44px minimum
- **Voice Commands**: Optional voice control
- **Reduced Motion**: Respect prefers-reduced-motion
- **High Contrast**: Support for high contrast mode
- **Skip Navigation**: Skip to main content link

**ARIA Implementation:**
- aria-label, aria-labelledby
- aria-describedby
- aria-live (polite/assertive)
- aria-invalid, aria-errormessage
- aria-required
- aria-expanded, aria-controls
- role attributes

**Keyboard Shortcuts:**
- `Ctrl+A`: Select all
- `Enter`: Confirm
- `Escape`: Cancel/close
- `Space`: Select/toggle
- Arrow keys: Navigate lists
- Tab/Shift+Tab: Navigate

**Key Files:**
- `lib/utils/accessibility.ts` (400+ lines)
- `lib/hooks/use-announce.ts`
- `lib/hooks/use-focus-trap.ts`
- `lib/hooks/use-reduced-motion.ts`
- `components/accessibility/reduced-motion-settings.tsx`
- `components/accessibility/voice-commands.tsx`
- `app/layout.tsx` (skip navigation)

### 6.6 Mobile Optimization
**Location:** `lib/hooks/`, `components/app/Mobile*`
**Status:** ✅ Mobile-First Design

**Features:**
- **Touch Gestures**: Swipe, pinch, long press, double tap
- **Camera Capture**: Take photos for instant transfer
- **Media Capture**: Audio/video recording
- **Responsive Design**: Mobile/tablet/desktop layouts
- **Action Sheets**: Mobile-friendly menus
- **Gesture Settings**: Configure gesture sensitivity
- **Web Share API**: Native share sheet integration
- **Viewport Optimization**: Safe areas, notches
- **Touch Targets**: 44px+ minimum size
- **Mobile Performance**: Optimized for mobile CPUs

**Gestures:**
- Swipe left/right: Navigate
- Swipe to dismiss: Close dialogs
- Long press: Context menu
- Pinch to zoom: Image preview
- Pull to refresh

**Key Files:**
- `lib/hooks/use-swipe-gestures.ts`
- `lib/hooks/use-advanced-gestures.ts`
- `lib/hooks/use-media-capture.ts`
- `lib/hooks/use-web-share.ts`
- `components/app/CameraCapture.tsx`
- `components/app/MobileActionSheet.tsx`
- `components/app/MobileFeaturesDemo.tsx`

---

## 7. NETWORK & CONNECTIVITY

### 7.1 WebRTC Infrastructure
**Location:** `lib/webrtc/`, `lib/transport/`
**Status:** ✅ Enterprise-Grade WebRTC

**Features:**
- **DataChannel Manager**: Multi-peer connection management
- **ICE Handling**: STUN/TURN server integration
- **Connection Quality**: Monitor RTT, packet loss, bandwidth
- **Adaptive Configuration**: Adjust based on network
- **Privacy Mode**: Relay-only connections
- **Connection Recovery**: Auto-reconnect with exponential backoff
- **Bandwidth Estimation**: Adaptive bitrate control
- **NAT Traversal**: STUN/TURN fallback

**WebRTC Configuration:**
- **ICE Servers**: Multiple STUN servers, TURN fallback
- **DataChannel**: Ordered, reliable delivery
- **Connection Timeout**: 30s default
- **Keep-Alive**: Heartbeat every 30s
- **Max Reconnect Attempts**: 3

**Key Files:**
- `lib/webrtc/data-channel.ts` (660+ lines)
- `lib/transport/private-webrtc.ts`
- `lib/hooks/use-p2p-connection.ts`
- `lib/hooks/use-p2p-session.ts`
- `lib/webrtc/screen-sharing.ts`

### 7.2 Signaling Server
**Location:** `lib/signaling/`, `signaling-server.js`
**Status:** ✅ Production Signaling

**Features:**
- **Socket.IO**: WebSocket-based signaling
- **Room Support**: Multi-user rooms
- **Encrypted Signaling**: AES-256-GCM encrypted messages
- **Auto-Reconnect**: Client-side reconnection logic
- **Heartbeat**: Keep connections alive
- **Load Balancing**: Multiple signaling servers
- **Scalability**: Redis adapter for clustering

**Signaling Protocol:**
- `join-room`: Join transfer room
- `leave-room`: Leave room
- `offer`: Send WebRTC offer
- `answer`: Send WebRTC answer
- `ice-candidate`: Exchange ICE candidates
- `heartbeat`: Keep-alive ping

**Key Files:**
- `lib/signaling/socket-signaling.ts` (500+ lines)
- `lib/signaling/connection-manager.ts` (600+ lines)
- `lib/signaling/signaling-crypto.ts`
- `signaling-server.js` (Node.js server)

### 7.3 Local Network Discovery
**Location:** `lib/discovery/`
**Status:** ✅ Zero-Config Discovery

**Features:**
- **mDNS/Bonjour**: Discover devices on LAN
- **Group Discovery**: Find group transfer participants
- **Device Broadcast**: Announce device presence
- **Peer Discovery**: Auto-discover nearby peers
- **Capability Detection**: Detect PQC, group transfer support
- **Device Prioritization**: Recent partners, connection quality

**Key Files:**
- `lib/discovery/local-discovery.ts` (400+ lines)
- `lib/discovery/group-discovery-manager.ts` (448+ lines)
- `lib/hooks/use-group-discovery.ts` (362+ lines)

---

## 8. MONITORING & ANALYTICS

### 8.1 Error Tracking & Monitoring
**Location:** `lib/monitoring/sentry.ts`
**Status:** ⚠️ Optional (Configurable)

**Features:**
- **Sentry Integration**: Real-time error reporting
- **Error Boundaries**: React error boundaries
- **Breadcrumbs**: User action tracking for debugging
- **User Context**: Associate errors with users
- **Performance Monitoring**: Track slow operations
- **Session Replay**: Debug user sessions (privacy-safe)
- **Privacy Filtering**: Redact sensitive data
- **Source Maps**: Unminify production errors

**Tracked Metrics:**
- JavaScript errors
- Promise rejections
- Network failures
- Performance issues
- User interactions

**Key Files:**
- `lib/monitoring/sentry.ts`
- `components/error-boundary.tsx`

### 8.2 Analytics & Metrics
**Location:** `lib/monitoring/`, `lib/utils/`
**Status:** ✅ Privacy-First Analytics

**Features:**
- **Plausible Analytics**: Privacy-friendly, GDPR compliant
- **Custom Events**: Track user actions
- **Prometheus Metrics**: Server-side metrics
- **Core Web Vitals**: LCP, FID, CLS tracking
- **Transfer Analytics**: Success/failure rates
- **Email Analytics**: Delivery, open, download rates
- **No Cookies**: Cookieless tracking
- **No PII**: No personal data collected

**Tracked Events:**
- File transfer started/completed/failed
- Screen sharing started/stopped
- Chat messages sent
- Room created/joined
- Settings changed

**Key Files:**
- `lib/monitoring/plausible.ts`
- `lib/monitoring/metrics.ts`
- `lib/utils/performance-metrics.ts`
- `components/analytics/plausible-script.tsx`

### 8.3 Secure Logging
**Location:** `lib/utils/secure-logger.ts`
**Status:** ✅ Production-Safe Logging

**Features:**
- **PII Redaction**: Auto-redact sensitive data
- **Log Levels**: Debug/Info/Warn/Error
- **Production Filtering**: Reduce logs in prod
- **Structured Logging**: JSON-formatted logs
- **Context Preservation**: Maintain error context

**Redacted Data:**
- API keys
- Passwords
- Email addresses
- IP addresses
- File contents
- Encryption keys

**Key Files:**
- `lib/utils/secure-logger.ts` (300+ lines)

---

## 9. DEVELOPER FEATURES

### 9.1 Testing Infrastructure
**Location:** `tests/`
**Status:** ✅ Comprehensive Testing

**Test Suites:**
- **E2E Tests**: 342 Playwright tests
- **Unit Tests**: 550+ Vitest tests
- **Visual Regression**: Screenshot comparison tests
- **Accessibility Tests**: a11y compliance tests
- **Performance Tests**: Lighthouse tests
- **Security Tests**: Penetration tests

**Test Coverage:**
- Unit tests: ~69% (550+ tests)
- E2E tests: 342 tests across 3 browsers
- Visual tests: 18 screenshot comparisons

**Key Files:**
- `tests/e2e/` - E2E test suites
- `tests/unit/` - Unit test suites
- `playwright.config.ts` - Playwright config
- `vitest.config.ts` - Vitest config

### 9.2 Code Quality Tools
**Location:** Root config files
**Status:** ✅ Strict Quality Enforcement

**Tools:**
- **ESLint 9**: JavaScript/TypeScript linting
- **TypeScript 5**: Strict type checking
- **Prettier**: Code formatting
- **Husky**: Git hooks (pre-commit, pre-push)
- **Lint-Staged**: Run linters on staged files
- **Commitlint**: Enforce commit message format

**ESLint Rules:**
- TypeScript strict mode
- React Hooks rules
- Accessibility rules (jsx-a11y)
- Security rules
- No console.log in production

**Key Files:**
- `eslint.config.mjs`
- `tsconfig.json`
- `.prettierrc.json`
- `.husky/`

### 9.3 Documentation
**Location:** Various `.md` files
**Status:** ✅ Extensive Documentation

**Documentation Types:**
- **Architecture**: System design diagrams
- **API Docs**: Endpoint documentation
- **Feature Guides**: Implementation guides
- **Security Docs**: Security best practices
- **Deployment**: Production deployment guides
- **TypeDoc**: Auto-generated API docs

**Documentation Files:** 100+ markdown files

**Key Docs:**
- `ARCHITECTURE.md`
- `API_EXAMPLES.md`
- `SECURITY_ENHANCEMENTS.md`
- `DEPLOYMENT.md`
- `QUICKSTART.md`

---

## 10. API ENDPOINTS

### 10.1 Transfer APIs
**Location:** `app/api/`
**Status:** ✅ RESTful APIs

**Endpoints:**
- `POST /api/email/send` - Send file via email
- `POST /api/email/batch` - Batch email sending
- `GET /api/email/download/[id]` - Download file
- `GET /api/email/status/[id]` - Check status
- `POST /api/email/webhook` - Resend webhooks

### 10.2 Room APIs
**Location:** `app/api/rooms/`
**Status:** ✅ Room Management

**Endpoints:**
- `POST /api/rooms` - Create room
- `GET /api/rooms/[code]` - Get room info
- `POST /api/rooms/[code]/join` - Join room
- `DELETE /api/rooms/[code]` - Close room

### 10.3 System APIs
**Location:** `app/api/`
**Status:** ✅ Health & Monitoring

**Endpoints:**
- `GET /api/health` - Health check
- `GET /api/ready` - Readiness probe
- `GET /api/metrics` - Prometheus metrics
- `GET /api/csrf-token` - CSRF token

### 10.4 Payment APIs
**Location:** `app/api/stripe/`
**Status:** ✅ Stripe Integration

**Endpoints:**
- `POST /api/stripe/create-checkout-session`
- `POST /api/stripe/webhook`

### 10.5 Versioned APIs
All APIs available under `/api/v1/` for versioning.

---

## 11. THIRD-PARTY INTEGRATIONS

### 11.1 Payment Processing
- **Stripe**: Donation checkout & webhooks
- **Files**: `lib/stripe/config.ts`

### 11.2 Email Services
- **Resend**: Transactional emails
- **React Email**: Email templates
- **Files**: `lib/email/email-service.ts`

### 11.3 Feature Flags
- **LaunchDarkly**: A/B testing & rollouts
- **Files**: `lib/feature-flags/`

### 11.4 Analytics
- **Plausible**: Privacy-friendly analytics
- **Sentry**: Error tracking (optional)

---

## 12. DEPLOYMENT & INFRASTRUCTURE

### 12.1 Containerization
**Files:** `Dockerfile`, `docker-compose.yml`
**Status:** ✅ Production Ready

**Containers:**
- **Web App**: Next.js application
- **Signaling Server**: Socket.IO server
- **Development**: Hot-reload dev environment

### 12.2 Hosting Platforms
**Supported:**
- Vercel (recommended)
- AWS EC2
- Docker/Docker Compose
- Kubernetes
- Synology NAS

**Scripts:**
- `deploy-vercel.sh`
- `deploy-aws-ec2.sh`
- `deploy-docker.sh`

### 12.3 Monitoring Stack
- **Prometheus**: Metrics collection
- **Grafana**: Visualization
- **Nginx**: Reverse proxy
- **Health Checks**: Liveness/readiness probes

---

## 13. STORAGE FEATURES

### 13.1 Client-Side Storage
- **LocalStorage**: Encrypted KV storage
- **IndexedDB**: Structured data
- **Secure Storage**: AES-256-GCM wrapper
- **Transfer History**: Local records
- **Friends List**: Trusted contacts
- **Device List**: Registered devices
- **Settings**: User preferences
- **Cache**: API response caching

### 13.2 Temporary Storage
- **Temp Files**: Encrypted temporary storage
- **Auto-Cleanup**: Automatic old file removal
- **Size Limits**: Configurable limits

---

## 14. UTILITIES & HELPERS

### 14.1 File Utilities
- **MIME Type Detection**
- **File Size Formatting** (bytes → human-readable)
- **Image Optimization**
- **UUID Generation** (cryptographically secure)
- **Hash Generation** (BLAKE3, SHA-256)

### 14.2 Validation
- **Zod Schemas**: Type-safe validation
- **Email Validation**
- **File Type Validation**
- **Size Validation**

### 14.3 Toast Notifications
- **Sonner**: Beautiful toast library
- **Custom Styling**: Themed toasts
- **Types**: Success/Error/Info/Warning
- **Duration Control**
- **Action Buttons**

---

## 15. FEATURE FLAGS

**LaunchDarkly Flags:**
- `voice-commands` (Beta)
- `camera-capture` (Enabled)
- `metadata-stripping` (Enabled)
- `one-time-transfers` (Enabled)
- `pqc-encryption` (Enabled)
- `advanced-privacy` (Enabled)
- `qr-code-sharing` (Enabled)
- `email-sharing` (Enabled)
- `link-expiration` (Disabled)
- `custom-themes` (Disabled)
- `mobile-app-promo` (Disabled)
- `donation-prompts` (Enabled)

---

## 16. DEPENDENCIES

### Core Stack
- **next**: 16.1.2
- **react**: 19.2.3
- **typescript**: 5.x
- **tailwindcss**: 4.x

### Cryptography
- **pqc-kyber**: 0.7.0 (ML-KEM-768)
- **@noble/curves**: 2.0.1 (X25519)
- **@noble/hashes**: 2.0.1 (BLAKE3, SHA-256)

### WebRTC
- **simple-peer**: 9.11.1
- **socket.io**: 4.8.3
- **socket.io-client**: 4.8.3

### UI/UX
- **framer-motion**: 12.26.2
- **next-themes**: 0.4.6
- **sonner**: 2.0.7 (toasts)
- **@radix-ui**: Multiple packages

### Utilities
- **zod**: 4.3.6
- **exifreader**: 4.36.0
- **jszip**: 3.10.1
- **qrcode**: 1.5.4

### Integrations
- **stripe**: 20.2.0
- **resend**: 6.7.0
- **launchdarkly-react-client-sdk**: 3.9.0

### Testing
- **@playwright/test**: 1.58.0
- **vitest**: 4.0.18

---

## SUMMARY STATISTICS

**Total Features**: 150+
**Core Modules**: 15
**API Endpoints**: 20+
**React Components**: 100+
**Custom Hooks**: 30+
**Utility Functions**: 50+
**Security Features**: 20+
**Privacy Features**: 15+
**Integrations**: 10+
**Lines of Code**: 50,000+
**Test Coverage**: 550+ unit tests, 342 E2E tests
**Documentation**: 100+ files

---

## PROJECT STATUS

**Overall**: ✅ Production-Ready
**Security**: ✅ Military-Grade
**Performance**: ✅ Optimized
**Accessibility**: ✅ WCAG 2.1 AA
**Mobile**: ✅ Fully Responsive
**Browser Support**: Chrome, Firefox, Safari, Edge

**Completed**: 95%
**In Development**: 5%

---

**Document Created**: January 26, 2026
**Last Updated**: January 26, 2026
**Catalog Version**: 1.0
**Maintained By**: Tallow Development Team
