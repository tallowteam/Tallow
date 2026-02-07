# Architecture Diagrams - Visual Reference

## Quick Visual Overview

### 1. System Overview Diagram
Shows complete P2P architecture with three main paths:

```
Browser App (React + WebRTC + Discovery)
    ↓
    ├─→ Direct P2P Connection → Peer Browser
    ├─→ Signaling Server (Room codes) → Peer
    └─→ mDNS Daemon (Local discovery) → Local devices

NAT Blocked? → TURN Relay Server → Relayed connection
```

**Key Elements:**
- 🌐 Browser interface with clients
- 👥 Peer-to-peer connections
- 🔌 Signaling infrastructure
- 🔀 Relay servers for NAT
- 🌍 Internet connectivity

**Use Case:** Understanding how Tallow connects devices

---

### 2. Cryptographic Architecture Diagram
Shows encryption layers for files and messages:

```
Key Exchange Phase:
    ML-KEM-768 (Post-quantum) + X25519 (Classical) → Shared Secret

File Encryption:
    Shared Secret + ChaCha20-Poly1305 + File Data → Encrypted File

Message Encryption:
    Shared Secret + Triple Ratchet + Messages → Encrypted Messages

Digital Signatures:
    Ed25519 Keys → Peer Verification
```

**Key Elements:**
- 🔐 Multi-layer encryption
- 🔑 Post-quantum + classical keys
- 📦 File-specific encryption
- 💬 Message-specific encryption
- ✍️ Digital signatures

**Use Case:** Understanding security mechanisms

---

### 3. Transfer Flow Diagram
Shows complete file transfer lifecycle:

```
SENDER SIDE:
    Select File → Generate Key → Encrypt → Chunk → Queue → Send

TRANSPORT:
    P2P Data Channel (Direct or Relayed)

RECEIVER SIDE:
    Receive → Reorder → Verify → Decrypt → Save
```

**Key Elements:**
- 1️⃣ Selection phase
- 2️⃣ Encryption phase
- 3️⃣ Chunking phase
- 4️⃣ Transport phase
- 5️⃣ Reassembly phase
- 6️⃣ Decryption phase
- 7️⃣ Save phase

**Use Case:** Understanding file transfer mechanics

---

### 4. Device Discovery Diagram
Shows two parallel discovery methods:

```
Path 1: mDNS (Local Network)
    Broadcast → Found → Verify → Add to List

Path 2: Room Code (Remote)
    Input Code → Signaling Server → WebRTC → Connected

Both paths verify device identity before connecting
```

**Key Elements:**
- 🔍 mDNS broadcast
- 📝 Room code entry
- 🔌 Signaling exchange
- ✓ Identity verification
- ❌ Security blocks

**Use Case:** Understanding device discovery methods

---

### 5. State Management Diagram
Shows application data flow architecture:

```
React Components
    ↓
    Subscribe to Stores (Zustand)
    ↓
    ├─ device-store (Connected peers)
    ├─ transfer-store (File progress)
    ├─ settings-store (Preferences)
    └─ friends-store (Saved devices)
    ↓
    Call Store Actions
    ↓
    Plain TypeScript Modules
    ↓
    Call getState() to fetch data
```

**Key Elements:**
- 🗄️ Zustand stores
- ⚙️ Store actions
- 📦 Service modules
- 🎨 React components
- 🔄 Data flow

**Use Case:** Understanding state management pattern

---

### 6. Deployment Architecture Diagram
Shows self-hosted infrastructure setup:

```
LOCAL DEPLOYMENT:
    Synology NAS → Docker Container → Next.js App → SQLite DB

INTERNET ACCESS:
    Cloudflare WAF → Cloudflare Tunnel → Public Domain + TLS

WEBRTC RELAY:
    coturn TURN Server (NAT relay)
    STUN Server (IP detection)

MONITORING:
    Application Logs + Prometheus Metrics + Health Checks
```

**Key Elements:**
- 🏠 Local hardware
- 🌐 Internet connectivity
- 📡 NAT traversal
- 📊 Observability

**Use Case:** Understanding deployment setup

---

## Color Coding Guide

### Node Types and Colors

**Purple (Primary - Processing/Logic)**
```css
fill:#5e5ce6,stroke:#7b7bff,color:#fff
```
- Components
- Processes
- Services
- Applications

**Green (Success/Ready)**
```css
fill:#10b981,stroke:#34d399,color:#fff
```
- Successful actions
- Ready states
- Positive outcomes
- Available devices

**Amber/Orange (Processing/Infrastructure)**
```css
fill:#f59e0b,stroke:#fbbf24,color:#1f2937
```
- Servers
- Infrastructure
- Intermediate processing
- Configuration

**Cyan (Data/Network)**
```css
fill:#06b6d4,stroke:#22d3ee,color:#000
```
- Data flows
- Network connections
- Relay/Bridge services
- Communication

**Blue (Info/API)**
```css
fill:#3b82f6,stroke:#60a5fa,color:#fff
```
- API endpoints
- Information
- Network services
- Internet connectivity

**Red (Error/Warning)**
```css
fill:#ef4444,stroke:#f87171,color:#fff
```
- Error states
- Security blocks
- Failures
- Warnings

**Violet (Secondary)**
```css
fill:#8b5cf6,stroke:#a78bfa,color:#fff
```
- Secondary systems
- State stores
- Data structures
- Complex services

---

## Diagram Legend

### Symbols and Shapes

**Rectangles** - Components, services, applications, systems

**Diamonds** - Decision points, conditional branches

**Circles** - Start/end points, states

**Rounded Rectangles** - Processes, actions

**Subgraphs** - Grouped components or logical sections

### Edge Types

**Solid Arrows** - Direct flow, primary connection
```
A --> B
```

**Dotted Lines** - Optional or fallback connections
```
A -.-> B
```

**Thick Arrows** - Strong connections, primary flow
```
A ==> B
```

**Labels** - Description of what the arrow represents
```
A -->|Action| B
```

---

## Common Patterns Shown

### 1. Client-Server Communication
```
Browser (Client)
    ↓ Request
Server
    ↓ Response
Browser (Client)
```

### 2. Encryption Pipeline
```
Raw Data
    ↓ Encrypt with Key
Encrypted Data
    ↓ Transport
Encrypted Data
    ↓ Decrypt with Key
Raw Data
```

### 3. Multi-Step Process
```
1️⃣ Input → 2️⃣ Process → 3️⃣ Validate → 4️⃣ Output
```

### 4. Failover/Fallback
```
Primary Path (Direct)
    ↓
Failed? → Fallback Path (Relay)
    ↓
    ✓ Connected
```

### 5. Publish-Subscribe Pattern
```
Store
    ↓ Subscribe
Component 1
Component 2
Component 3
```

---

## Reading the Diagrams

### System Overview
**Read Top-to-Bottom:**
1. Start with Browser App components
2. Follow connections to peers and servers
3. Note the relay server fallback path
4. Understand the three connection methods

### Crypto Architecture
**Read Left-to-Right:**
1. Start with key exchange
2. Follow to shared secret
3. Branch to file vs. message encryption
4. Note signature verification

### Transfer Flow
**Read Top-to-Bottom (Sequence):**
1. Sender-side steps (left)
2. Transport phase (center)
3. Receiver-side steps (right)
4. Understand the full lifecycle

### Discovery Flow
**Read Two Parallel Paths:**
1. Follow mDNS path (top)
2. Follow room code path (middle)
3. Both converge at connection
4. Note verification step

### State Management
**Read Top-to-Bottom:**
1. Components at top
2. Stores in middle
3. Services at bottom
4. Bidirectional data flow

### Deployment Architecture
**Read Top-to-Bottom (Layers):**
1. Local hardware layer
2. Internet access layer
3. WebRTC layer
4. Monitoring layer

---

## Key Takeaways

### What Each Diagram Teaches

**System Overview**
- How devices connect to each other
- Three different connection methods
- Role of signaling servers and relay
- P2P benefits and fallbacks

**Crypto Architecture**
- Defense in depth with multiple encryption
- Post-quantum readiness
- Different keys for different purposes
- Authentication through signatures

**Transfer Flow**
- Complete end-to-end process
- Where encryption happens
- Chunking for large files
- Error detection mechanisms

**Discovery Flow**
- Two ways to find devices
- Security verification process
- Success and failure paths
- User interaction points

**State Management**
- Centralized but decoupled stores
- How components get updates
- Pure function pattern
- Testability improvements

**Deployment Architecture**
- Self-hosting requirements
- Internet access methods
- NAT traversal solutions
- Observability and monitoring

---

## Using Diagrams in Documentation

### Best Practices

1. **Context First** - Introduce the topic before showing diagram
2. **Summary After** - Explain key points after diagram
3. **Highlight Key Elements** - Point out important nodes/flows
4. **Connect to Code** - Link diagram concepts to actual code
5. **Provide Examples** - Show concrete use cases

### Integration Examples

```markdown
## How File Transfer Works

When you send a file:

[TRANSFER_FLOW diagram]

As shown above:
1. File is encrypted using ChaCha20-Poly1305
2. Stream is divided into 64KB chunks
3. Chunks sent over P2P or relay
4. Receiver verifies and decrypts

See implementation in: `lib/transfer/encryption.ts`
```

### Referencing Specific Elements

- "The purple boxes represent processing layers"
- "The green checkmark shows successful connection"
- "Follow the dotted line for the fallback path"
- "The numbered steps show the sequence"

---

## Customizing Diagrams

### Quick Changes

**Change Colors:**
```mermaid
style A fill:#yourcolor,stroke:#yourstroke,color:#yourtext
```

**Add Labels:**
```mermaid
A -->|Your Label| B
```

**Reorder Flow:**
```mermaid
A --> B --> C  % or
A --> C --> B  % different order
```

### Adding New Diagrams

1. Define in `lib/docs/architecture-diagrams.ts`
2. Export from the diagrams object
3. Use in documentation pages
4. Link from sidebar navigation

---

## Performance Tips

### Diagram Optimization

1. **Keep it simple** - Max 20-30 nodes
2. **Use subgraphs** - Group related items
3. **Limit depth** - 3-4 levels maximum
4. **Clear labels** - Avoid long text
5. **Consistent styling** - Repeat color patterns

### Rendering Performance

- Longer diagrams take longer to render
- Nested structures are more complex
- Lots of connections slow rendering
- Simplify when possible

---

## Accessibility Notes

### For Screen Readers

- Each diagram has a title
- Descriptions explain the content
- Color not only indicator of meaning
- All connections labeled

### For Colorblind Users

- Diagrams use colorblind-safe palette
- Color combined with shape/labels
- Text labels on all important elements

### For Print

- Diagrams render well in black & white
- Text remains readable
- Sufficient contrast

---

## Diagram Versions

### As of 2026-02-06

| Diagram | Nodes | Type | Status |
|---------|-------|------|--------|
| System Overview | 15 | Flowchart | Active |
| Crypto Architecture | 10 | Graph | Active |
| Transfer Flow | 8 | Sequence | Active |
| Discovery Flow | 10 | Flowchart | Active |
| State Management | 12 | Graph | Active |
| Deployment | 15 | Graph | Active |

---

## Next Diagram Ideas

- User authentication flow
- Error handling procedures
- Room creation process
- Message encryption flow
- Performance optimization
- Security audit process

---

This visual reference guide helps you understand, interpret, and work with the architecture diagrams in the Tallow documentation system.

For more detailed information, see:
- `ARCHITECTURE_DIAGRAMS_IMPLEMENTATION.md` - Technical details
- `ARCHITECTURE_DIAGRAMS_USAGE.md` - How to create/modify diagrams
- `/docs/architecture` - Live interactive diagrams
