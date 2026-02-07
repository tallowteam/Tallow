/**
 * Mermaid.js Architecture Diagrams
 * Comprehensive system, crypto, transfer, discovery, state, and deployment diagrams
 */

/**
 * SYSTEM_OVERVIEW
 * High-level system architecture showing components and communication flows
 */
export const SYSTEM_OVERVIEW = `graph TB
    subgraph Browser["🌐 Browser App"]
        UI["User Interface<br/>React + Next.js"]
        WebRTC["WebRTC Manager<br/>P2P Connection"]
        Discovery["Discovery Service<br/>mDNS/Room Codes"]
    end

    subgraph Peer["👥 Peer Browser"]
        PeerUI["Peer Interface<br/>React + Next.js"]
        PeerWebRTC["Peer WebRTC<br/>P2P Connection"]
    end

    subgraph Signaling["🔌 Signaling Server"]
        SigServer["Signaling Service<br/>WebSocket API"]
        RoomManager["Room Manager<br/>Offer/Answer Exchange"]
    end

    subgraph Relay["🔀 Relay Infrastructure"]
        RelayServer["Relay Server<br/>TURN/STUN"]
        mDNS["mDNS Daemon<br/>Local Discovery"]
    end

    subgraph Network["🌍 Network"]
        Internet["Internet<br/>P2P Direct"]
    end

    UI -->|WebRTC Offer| WebRTC
    WebRTC -->|Direct Connection| Internet
    Internet -->|WebRTC Answer| PeerWebRTC
    PeerWebRTC --> PeerUI

    UI -->|Discovery| Discovery
    Discovery -->|Broadcast| mDNS
    mDNS -->|Device Found| Discovery

    UI -->|Room Code| SigServer
    SigServer -->|Signaling| RoomManager
    RoomManager -->|Offer/Answer| PeerUI

    WebRTC -.->|NAT Blocked| RelayServer
    RelayServer -->|Relayed Data| PeerWebRTC

    style Browser fill:#5e5ce6,stroke:#7b7bff,color:#fff,stroke-width:2px
    style Peer fill:#5e5ce6,stroke:#7b7bff,color:#fff,stroke-width:2px
    style Signaling fill:#f59e0b,stroke:#fbbf24,color:#1f2937,stroke-width:2px
    style Relay fill:#8b5cf6,stroke:#a78bfa,color:#fff,stroke-width:2px
    style Network fill:#3b82f6,stroke:#60a5fa,color:#fff,stroke-width:2px`;

/**
 * CRYPTO_ARCHITECTURE
 * Encryption and cryptographic layers used in Tallow
 */
export const CRYPTO_ARCHITECTURE = `graph LR
    subgraph KeyExchange["🔐 Key Exchange"]
        KEM["ML-KEM-768<br/>Post-Quantum KEM"]
        ECDH["X25519<br/>Elliptic Curve DH"]
        SharedSecret["Shared Secret<br/>Combined Keys"]
    end

    subgraph FileEncryption["📦 File Encryption"]
        FileData["File Data"]
        ChaCha["ChaCha20-Poly1305<br/>Stream Cipher"]
        EncryptedFile["Encrypted Chunks<br/>Authenticated"]
    end

    subgraph MessageEncryption["💬 Message Encryption"]
        Messages["Raw Messages"]
        TripleRatchet["Triple Ratchet<br/>Forward Secrecy"]
        EncryptedMsg["Encrypted Messages<br/>Ephemeral Keys"]
    end

    subgraph KeyManagement["🔑 Key Management"]
        SigningKey["Ed25519<br/>Digital Signatures"]
        VerifyKey["Verification Keys<br/>Peer Identity"]
    end

    KEM --> SharedSecret
    ECDH --> SharedSecret
    SharedSecret --> ChaCha
    FileData --> ChaCha
    ChaCha --> EncryptedFile

    SharedSecret --> TripleRatchet
    Messages --> TripleRatchet
    TripleRatchet --> EncryptedMsg

    SharedSecret --> SigningKey
    SigningKey --> VerifyKey

    style KeyExchange fill:#ec4899,stroke:#f472b6,color:#fff,stroke-width:2px
    style FileEncryption fill:#06b6d4,stroke:#22d3ee,color:#000,stroke-width:2px
    style MessageEncryption fill:#06b6d4,stroke:#22d3ee,color:#000,stroke-width:2px
    style KeyManagement fill:#f59e0b,stroke:#fbbf24,color:#1f2937,stroke-width:2px`;

/**
 * TRANSFER_FLOW
 * Sequence diagram showing file transfer lifecycle
 */
export const TRANSFER_FLOW = `sequenceDiagram
    participant Sender
    participant Encryption
    participant Chunking
    participant DataChannel
    participant Network
    participant Reassembly
    participant Decryption
    participant Receiver

    Sender->>Sender: Select file
    Sender->>Encryption: Generate random key
    Encryption->>Encryption: ChaCha20-Poly1305 encrypt
    Encryption->>Chunking: Encrypted file stream

    Chunking->>Chunking: Split into 64KB chunks
    Chunking->>Chunking: Add chunk metadata
    Chunking->>DataChannel: Chunk sequence

    DataChannel->>DataChannel: Queue chunks
    DataChannel->>Network: Send chunks (P2P)

    Network->>Reassembly: Chunks arrive
    Reassembly->>Reassembly: Reorder by sequence
    Reassembly->>Reassembly: Verify checksums

    Reassembly->>Decryption: Reassembled stream
    Decryption->>Decryption: ChaCha20-Poly1305 decrypt
    Decryption->>Decryption: Verify AEAD tag

    Decryption->>Receiver: Original file
    Receiver->>Receiver: Save to device`;

/**
 * DISCOVERY_FLOW
 * Device discovery flowchart showing both mDNS and room code paths
 */
export const DISCOVERY_FLOW = `graph TD
    Start["👤 User Action"] -->|Local Network| mDNSPath["🔍 mDNS Discovery"]
    Start -->|Remote| RoomCodePath["📝 Room Code"]

    mDNSPath -->|Broadcast Service| Discover["Device broadcasts<br/>_tallow._tcp.local"]
    Discover -->|Listener finds| Found["Device Found<br/>in Local Network"]
    Found -->|Verify TLS Cert| Verify["Verify Identity<br/>Public Key Check"]
    Verify -->|Valid| Add["✓ Add to Device List<br/>Peer Stored"]

    RoomCodePath -->|Input Code| SignalingServer["🔌 Signaling Server"]
    SignalingServer -->|Lookup Room| RoomCheck["Room Active?"]
    RoomCheck -->|Yes| WebRTCOffer["Send WebRTC Offer"]
    WebRTCOffer -->|Exchange SDP| Answer["Receive Answer"]
    Answer -->|Establish ICE| Connected["✓ Connected<br/>Data Channel Ready"]

    Verify -->|Invalid| Blocked["❌ Blocked<br/>Security Violation"]
    RoomCheck -->|No| Expired["❌ Room Expired<br/>Try Again"]

    Add --> Ready["Ready to Transfer"]
    Connected --> Ready

    style Start fill:#5e5ce6,stroke:#7b7bff,color:#fff
    style mDNSPath fill:#10b981,stroke:#34d399,color:#fff
    style RoomCodePath fill:#3b82f6,stroke:#60a5fa,color:#fff
    style Found fill:#f59e0b,stroke:#fbbf24,color:#1f2937
    style Connected fill:#f59e0b,stroke:#fbbf24,color:#1f2937
    style Add fill:#10b981,stroke:#34d399,color:#fff
    style Ready fill:#10b981,stroke:#34d399,color:#fff
    style Blocked fill:#ef4444,stroke:#f87171,color:#fff
    style Expired fill:#ef4444,stroke:#f87171,color:#fff`;

/**
 * STATE_MANAGEMENT
 * Zustand store architecture and data flow
 */
export const STATE_MANAGEMENT = `graph TB
    subgraph Stores["🗄️ Zustand Stores"]
        DeviceStore["device-store<br/>Connected Peers<br/>Local Devices"]
        TransferStore["transfer-store<br/>Progress<br/>File Metadata"]
        SettingsStore["settings-store<br/>User Preferences<br/>Theme/Privacy"]
        FriendsStore["friends-store<br/>Saved Peers<br/>Nicknames"]
    end

    subgraph Actions["⚙️ Store Actions"]
        DeviceActions["addDevice()<br/>removeDevice()<br/>updateStatus()"]
        TransferActions["startTransfer()<br/>updateProgress()<br/>completeTransfer()"]
        SettingsActions["updateTheme()<br/>setPrivacy()<br/>savePrefs()"]
        FriendsActions["addFriend()<br/>removeFriend()<br/>updateNickname()"]
    end

    subgraph Services["📦 Service Layer"]
        TSModules["TypeScript Modules<br/>Plain Functions<br/>No Framework Deps"]
    end

    subgraph Components["🎨 React Components"]
        DevicePanel["Device Panel"]
        TransferUI["Transfer UI"]
        Settings["Settings Page"]
        FriendsUI["Friends List"]
    end

    DeviceStore -->|setState| DeviceActions
    TransferStore -->|setState| TransferActions
    SettingsStore -->|setState| SettingsActions
    FriendsStore -->|setState| FriendsActions

    DeviceActions -->|call| TSModules
    TransferActions -->|call| TSModules
    SettingsActions -->|call| TSModules
    FriendsActions -->|call| TSModules

    DeviceStore -->|subscribe| DevicePanel
    TransferStore -->|subscribe| TransferUI
    SettingsStore -->|subscribe| Settings
    FriendsStore -->|subscribe| FriendsUI

    TSModules -->|getState| DeviceStore
    TSModules -->|getState| TransferStore
    TSModules -->|getState| SettingsStore
    TSModules -->|getState| FriendsStore

    style Stores fill:#8b5cf6,stroke:#a78bfa,color:#fff,stroke-width:2px
    style Actions fill:#f59e0b,stroke:#fbbf24,color:#1f2937,stroke-width:2px
    style Services fill:#5e5ce6,stroke:#7b7bff,color:#fff,stroke-width:2px
    style Components fill:#10b981,stroke:#34d399,color:#fff,stroke-width:2px`;

/**
 * DEPLOYMENT_ARCHITECTURE
 * Infrastructure and deployment topology
 */
export const DEPLOYMENT_ARCHITECTURE = `graph TB
    subgraph Local["🏠 Local Deployment"]
        NAS["Synology NAS<br/>Intel Processor"]
        Docker["Docker Container<br/>Alpine Linux"]
        NextApp["Next.js App<br/>Node.js Runtime"]
        Database["SQLite Database<br/>Local Storage"]
    end

    subgraph Internet["🌐 Internet Access"]
        CloudflareWAF["Cloudflare WAF<br/>DDoS Protection"]
        CloudflareTunnel["Cloudflare Tunnel<br/>Secure Ingress"]
        PublicDomain["tallow.example.com<br/>DNS + TLS"]
    end

    subgraph WebRTC["📡 WebRTC Relay"]
        coturn["coturn TURN Server<br/>NAT Traversal"]
        STUN["STUN Server<br/>IP Detection"]
    end

    subgraph Monitoring["📊 Observability"]
        Logs["Application Logs<br/>Structured JSON"]
        Metrics["Prometheus Metrics<br/>Real-time"]
        Health["Health Checks<br/>Readiness/Liveness"]
    end

    NAS --> Docker
    Docker --> NextApp
    NextApp --> Database

    NextApp --> CloudflareWAF
    CloudflareWAF --> CloudflareTunnel
    CloudflareTunnel --> PublicDomain

    NextApp -.->|ICE Candidates| STUN
    NextApp -.->|NAT Relay| coturn

    NextApp --> Logs
    NextApp --> Metrics
    NextApp --> Health

    style Local fill:#5e5ce6,stroke:#7b7bff,color:#fff,stroke-width:2px
    style Internet fill:#f59e0b,stroke:#fbbf24,color:#1f2937,stroke-width:2px
    style WebRTC fill:#06b6d4,stroke:#22d3ee,color:#000,stroke-width:2px
    style Monitoring fill:#10b981,stroke:#34d399,color:#fff,stroke-width:2px`;

/**
 * All diagrams exported as an object for easy access
 */
export const architectureDiagrams = {
  SYSTEM_OVERVIEW,
  CRYPTO_ARCHITECTURE,
  TRANSFER_FLOW,
  DISCOVERY_FLOW,
  STATE_MANAGEMENT,
  DEPLOYMENT_ARCHITECTURE,
} as const;

export type DiagramName = keyof typeof architectureDiagrams;
