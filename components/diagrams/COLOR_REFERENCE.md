# Diagram Color Reference Guide

Visual reference for color coding used across all Tallow architecture diagrams.

## Color Palette & Meanings

### Primary Colors

#### 🔵 Blue Family
**Usage**: Signaling, Communication, Primary Flow

| Shade | Light Mode | Dark Mode | Component | Purpose |
|-------|-----------|-----------|-----------|---------|
| Base | `#2563EB` | `#60A5FA` | Signaling Server | WebSocket communication |
| Light | `#DBEAFE` | `#1E3A8A30` | Background | Card backgrounds |
| Border | `#BFDBFE` | `#1E3A8A` | Borders | Component borders |

**Example Usage**:
- Signaling phase in WebRTC flow
- Peer communication
- Data channel creation
- Receiving chain in Triple Ratchet

---

#### 🟣 Purple Family
**Usage**: Key Management, Cryptography, Root Operations

| Shade | Light Mode | Dark Mode | Component | Purpose |
|-------|-----------|-----------|-----------|---------|
| Base | `#9333EA` | `#C084FC` | Key Generation | Cryptographic operations |
| Light | `#F3E8FF` | `#581C8730` | Background | Crypto sections |
| Border | `#E9D5FF` | `#6B21A8` | Borders | Security boundaries |

**Example Usage**:
- ML-KEM-768 key generation
- Root chain in Triple Ratchet
- Key exchange processes
- Peer identity

---

#### 🟢 Green Family
**Usage**: Security, Encryption, Success States

| Shade | Light Mode | Dark Mode | Component | Purpose |
|-------|-----------|-----------|-----------|---------|
| Base | `#16A34A` | `#4ADE80` | DTLS Handshake | Secure connections |
| Light | `#DCFCE7` | `#14532D30` | Background | Security sections |
| Border | `#BBF7D0` | `#166534` | Borders | Security boundaries |

**Example Usage**:
- DTLS handshake in WebRTC
- ChaCha20-Poly1305 encryption
- Sending chain in Triple Ratchet
- Success indicators

---

#### 🟠 Orange Family
**Usage**: Processing, Transformation, Data Operations

| Shade | Light Mode | Dark Mode | Component | Purpose |
|-------|-----------|-----------|-----------|---------|
| Base | `#EA580C` | `#FB923C` | Data Channel | Data processing |
| Light | `#FFEDD5` | `#7C2D1230` | Background | Processing sections |
| Border | `#FED7AA` | `#9A3412` | Borders | Data flow boundaries |

**Example Usage**:
- DataChannel creation
- File chunking process
- Data transformation
- Signaling operations

---

#### 🩷 Pink/Rose Family
**Usage**: Peer Operations, Transfer, Sending

| Shade | Light Mode | Dark Mode | Component | Purpose |
|-------|-----------|-----------|-----------|---------|
| Base | `#EC4899` | `#F472B6` | P2P Transfer | Peer operations |
| Light | `#FCE7F3` | `#83184030` | Background | Transfer sections |
| Border | `#FBCFE8` | `#9F1239` | Borders | Peer boundaries |

**Example Usage**:
- P2P file transfer
- Peer B (receiver)
- TURN relay services
- Message sending

---

#### 🔷 Teal/Cyan Family
**Usage**: Network Services, Discovery

| Shade | Light Mode | Dark Mode | Component | Purpose |
|-------|-----------|-----------|-----------|---------|
| Base | `#0891B2` | `#22D3EE` | STUN Server | Network services |
| Light | `#CFFAFE` | `#16484730` | Background | Network sections |
| Border | `#A5F3FC` | `#155E75` | Borders | Network boundaries |

**Example Usage**:
- STUN server
- ICE candidate discovery
- Network path finding
- NAT traversal

---

#### 🟣 Violet/Indigo Family
**Usage**: Storage, Persistence, Database

| Shade | Light Mode | Dark Mode | Component | Purpose |
|-------|-----------|-----------|-----------|---------|
| Base | `#7C3AED` | `#A78BFA` | Storage Layer | Data storage |
| Light | `#EDE9FE` | `#4C1D9530` | Background | Storage sections |
| Border | `#DDD6FE` | `#5B21B6` | Borders | Storage boundaries |

**Example Usage**:
- IndexedDB storage
- Encrypted data stream
- Session storage
- Persistent keys

---

#### 🟡 Amber/Yellow Family
**Usage**: Derivation, Key Generation, Transformation

| Shade | Light Mode | Dark Mode | Component | Purpose |
|-------|-----------|-----------|-----------|---------|
| Base | `#D97706` | `#FBBF24` | Message Keys | Key derivation |
| Light | `#FEF3C7` | `#78350F30` | Background | Derivation sections |
| Border | `#FDE68A` | `#92400E` | Borders | Derivation boundaries |

**Example Usage**:
- Message key derivation
- HKDF operations
- KDF processes
- Key transformation

---

#### 🟢 Emerald Family
**Usage**: Security Layer, Protection

| Shade | Light Mode | Dark Mode | Component | Purpose |
|-------|-----------|-----------|-----------|---------|
| Base | `#059669` | `#34D399` | Security Layer | Security systems |
| Light | `#D1FAE5` | `#06513330` | Background | Security sections |
| Border | `#A7F3D0` | `#065F46` | Borders | Security boundaries |

**Example Usage**:
- Overall security layer
- Multi-layered encryption
- Authentication systems
- Security properties

---

## Color Coding by Diagram

### WebRTC Connection Flow
1. **Blue** - Signaling (WebSocket communication)
2. **Purple** - ICE Candidates (network discovery)
3. **Green** - DTLS Handshake (security establishment)
4. **Orange** - DataChannel (data stream creation)
5. **Pink** - P2P Transfer (direct transfer)

### Encryption Flow
1. **Blue/Purple** - Key Generation (hybrid PQC)
2. **Purple/Pink** - Key Exchange (secure swap)
3. **Orange/Amber** - File Chunking (data preparation)
4. **Green/Teal** - Encryption (ChaCha20-Poly1305)
5. **Indigo/Blue** - Encrypted Stream (secure transfer)

### Triple Ratchet
1. **Purple** - Root Chain (master key derivation)
2. **Green** - Sending Chain (outbound keys)
3. **Blue** - Receiving Chain (inbound keys)
4. **Amber** - Message Keys (per-message encryption)

### System Architecture
1. **Blue** - Peer A (sender)
2. **Purple** - Peer B (receiver)
3. **Amber** - Signaling Server (coordination)
4. **Teal** - STUN Server (NAT discovery)
5. **Rose** - TURN Server (relay fallback)
6. **Violet** - Storage Layer (persistence)
7. **Emerald** - Security Layer (encryption)

---

## Gradient Combinations

### Light Mode Gradients

```css
/* Blue → Purple: Key Generation */
background: linear-gradient(to right, #DBEAFE, #F3E8FF);

/* Purple → Pink: Key Exchange */
background: linear-gradient(to right, #F3E8FF, #FCE7F3);

/* Orange → Amber: Processing */
background: linear-gradient(to right, #FFEDD5, #FEF3C7);

/* Green → Teal: Encryption */
background: linear-gradient(to right, #DCFCE7, #CFFAFE);

/* Indigo → Blue: Data Stream */
background: linear-gradient(to right, #E0E7FF, #DBEAFE);
```

### Dark Mode Gradients

```css
/* Blue → Purple: Key Generation */
background: linear-gradient(to right, #1E3A8A30, #581C8730);

/* Purple → Pink: Key Exchange */
background: linear-gradient(to right, #581C8730, #83184030);

/* Orange → Amber: Processing */
background: linear-gradient(to right, #7C2D1230, #78350F30);

/* Green → Teal: Encryption */
background: linear-gradient(to right, #14532D30, #16484730);

/* Indigo → Blue: Data Stream */
background: linear-gradient(to right, #312E8130, #1E3A8A30);
```

---

## Icon Color Mapping

| Icon | Color | Component |
|------|-------|-----------|
| Radio, Server | Blue | Signaling |
| Key, Shield | Purple | Cryptography |
| Lock, CheckCircle | Green | Security |
| ArrowRight, Database | Orange | Processing |
| Send, Download | Pink | Transfer |
| Globe, Wifi | Teal | Network |
| Cloud | Rose | Relay |
| HardDrive | Violet | Storage |
| Cpu, Zap | Amber | Computation |

---

## Accessibility Compliance

### Contrast Ratios (Light Mode)

| Color | Background | Foreground | Ratio | WCAG Level |
|-------|-----------|------------|-------|------------|
| Blue | #DBEAFE | #1E3A8A | 8.2:1 | AAA |
| Purple | #F3E8FF | #581C87 | 7.5:1 | AAA |
| Green | #DCFCE7 | #166534 | 7.8:1 | AAA |
| Orange | #FFEDD5 | #7C2D12 | 7.1:1 | AAA |
| Pink | #FCE7F3 | #831843 | 7.4:1 | AAA |

### Contrast Ratios (Dark Mode)

| Color | Background | Foreground | Ratio | WCAG Level |
|-------|-----------|------------|-------|------------|
| Blue | #1E3A8A30 | #60A5FA | 7.9:1 | AAA |
| Purple | #581C8730 | #C084FC | 7.2:1 | AAA |
| Green | #14532D30 | #4ADE80 | 7.6:1 | AAA |
| Orange | #7C2D1230 | #FB923C | 7.3:1 | AAA |
| Pink | #83184030 | #F472B6 | 7.1:1 | AAA |

---

## Theme Adaptation

### Light Mode
- Background: Pale tints (50-100 on Tailwind scale)
- Foreground: Deep shades (700-900)
- Borders: Medium shades (200-300)
- Hover: Slightly darker backgrounds

### Dark Mode
- Background: Deep shades with low opacity (950/30)
- Foreground: Bright tints (300-500)
- Borders: Deep shades (700-800)
- Hover: Glow effects

### High Contrast
- Background: Pure white (#FFFFFF) or black (#000000)
- Foreground: Maximum contrast
- Borders: 2px thick, high contrast
- No subtle shades

---

## Best Practices

### Do's ✅
- Use color coding consistently across diagrams
- Maintain contrast ratios for accessibility
- Apply gradients for visual hierarchy
- Use icons with matching colors
- Respect theme mode colors

### Don'ts ❌
- Don't mix unrelated color meanings
- Don't use colors alone to convey information
- Don't ignore contrast requirements
- Don't override theme colors arbitrarily
- Don't use too many colors in one diagram

---

## Color Psychology

### Why These Colors?

**Blue** - Trust, communication, technology
**Purple** - Security, sophistication, cryptography
**Green** - Security, success, encryption
**Orange** - Activity, processing, transformation
**Pink** - Connection, transfer, interaction
**Teal** - Network, infrastructure, services
**Violet** - Storage, memory, persistence
**Amber** - Computation, derivation, generation

---

## Quick Reference Card

```
📘 Blue     → Signaling, Communication
🟣 Purple   → Keys, Cryptography
🟢 Green    → Security, Encryption
🟠 Orange   → Processing, Data
🩷 Pink     → Transfer, Peers
🔷 Teal     → Network, Services
🌹 Rose     → Relay, Fallback
💜 Violet   → Storage, Database
🟡 Amber    → Derivation, KDF
💚 Emerald  → Protection, Layer
```

---

## Testing Colors

### Visual Testing Checklist

- [ ] Light mode rendering
- [ ] Dark mode rendering
- [ ] High contrast mode
- [ ] Color blind simulation (Deuteranopia)
- [ ] Color blind simulation (Protanopia)
- [ ] Color blind simulation (Tritanopia)
- [ ] Monochrome/grayscale
- [ ] Print preview (black & white)

### Tools
- Chrome DevTools: Color contrast checker
- axe DevTools: Accessibility audit
- Colorblind Web Page Filter: Simulation
- WebAIM Contrast Checker: Ratio validation

---

**Last Updated**: January 27, 2026
**Maintained By**: Tallow UI Design Team
