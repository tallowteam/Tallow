# Group Transfer Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SENDER APPLICATION                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        User Interface Layer                           │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │                                                                        │  │
│  │  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────────┐  │  │
│  │  │ RecipientSelector│  │ConfirmDialog     │  │ ProgressDialog     │  │  │
│  │  │                 │  │                  │  │                    │  │  │
│  │  │ - Search        │  │ - File preview   │  │ - Overall progress │  │  │
│  │  │ - Multi-select  │  │ - Recipient list │  │ - Per-recipient    │  │  │
│  │  │ - Filter        │  │ - Statistics     │  │ - Speed/ETA        │  │  │
│  │  └─────────────────┘  └──────────────────┘  └────────────────────┘  │  │
│  │                                                                        │  │
│  └────────────────────────────────────┬───────────────────────────────────┘  │
│                                       │                                       │
│  ┌────────────────────────────────────▼───────────────────────────────────┐  │
│  │                        React Hook Layer                                 │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │                     useGroupTransfer()                                │  │
│  │                                                                        │  │
│  │  - State management                                                   │  │
│  │  - Event handlers                                                     │  │
│  │  - Progress polling                                                   │  │
│  │  - Toast notifications                                                │  │
│  │  - Lifecycle management                                               │  │
│  └────────────────────────────────────┬───────────────────────────────────┘  │
│                                       │                                       │
│  ┌────────────────────────────────────▼───────────────────────────────────┐  │
│  │                     Business Logic Layer                               │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │                   GroupTransferManager                                │  │
│  │                                                                        │  │
│  │  ┌──────────────────────────────────────────────────────────────┐   │  │
│  │  │ Orchestration                                                 │   │  │
│  │  │ - Initialize N PQCTransferManagers                            │   │  │
│  │  │ - Start key exchange with all recipients                      │   │  │
│  │  │ - Send file to all recipients in parallel                     │   │  │
│  │  │ - Aggregate progress from all managers                        │   │  │
│  │  │ - Handle individual failures gracefully                        │   │  │
│  │  │ - Apply bandwidth limits                                       │   │  │
│  │  └──────────────────────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────┬───────────────────────────────────┘  │
│                                       │                                       │
│                                       │ Creates N instances                   │
│                                       ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    Transfer Layer (Per Recipient)                     │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │                                                                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │  │
│  │  │PQCTransfer   │  │PQCTransfer   │  │PQCTransfer   │   ... (N)     │  │
│  │  │Manager #1    │  │Manager #2    │  │Manager #3    │               │  │
│  │  │              │  │              │  │              │               │  │
│  │  │- ML-KEM-768  │  │- ML-KEM-768  │  │- ML-KEM-768  │               │  │
│  │  │- X25519      │  │- X25519      │  │- X25519      │               │  │
│  │  │- Encryption  │  │- Encryption  │  │- Encryption  │               │  │
│  │  │- Chunking    │  │- Chunking    │  │- Chunking    │               │  │
│  │  │- Progress    │  │- Progress    │  │- Progress    │               │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘               │  │
│  │         │                 │                 │                         │  │
│  └─────────┼─────────────────┼─────────────────┼─────────────────────────┘  │
│            │                 │                 │                            │
└────────────┼─────────────────┼─────────────────┼─────────────────────────────┘
             │                 │                 │
             │ Independent     │ Independent     │ Independent
             │ WebRTC         │ WebRTC         │ WebRTC
             │ Channel        │ Channel        │ Channel
             │                 │                 │
        ┌────▼─────┐      ┌────▼─────┐      ┌────▼─────┐
        │          │      │          │      │          │
        │Recipient │      │Recipient │      │Recipient │
        │    #1    │      │    #2    │      │    #3    │
        │          │      │          │      │          │
        │- Receives│      │- Receives│      │- Receives│
        │- Decrypts│      │- Decrypts│      │- Decrypts│
        │- Saves   │      │- Saves   │      │- Saves   │
        └──────────┘      └──────────┘      └──────────┘
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Initialization Phase                              │
└─────────────────────────────────────────────────────────────────────────┘

User selects file(s)
    │
    ▼
RecipientSelector shows available devices
    │
    ▼
User selects N recipients
    │
    ▼
GroupTransferConfirmDialog shows preview
    │
    ▼
User confirms transfer
    │
    ▼
GroupTransferManager.initializeGroupTransfer()
    │
    ├─> Create PQCTransferManager for Recipient #1
    │   └─> Generate ML-KEM-768 + X25519 keypair #1
    │
    ├─> Create PQCTransferManager for Recipient #2
    │   └─> Generate ML-KEM-768 + X25519 keypair #2
    │
    └─> Create PQCTransferManager for Recipient #3
        └─> Generate ML-KEM-768 + X25519 keypair #3

┌─────────────────────────────────────────────────────────────────────────┐
│                        Key Exchange Phase                                │
└─────────────────────────────────────────────────────────────────────────┘

GroupTransferManager.startKeyExchange()
    │
    ├─> Recipient #1: Send public key → Receive peer public key → Encapsulate
    │   └─> Derive session keys #1 (unique)
    │
    ├─> Recipient #2: Send public key → Receive peer public key → Encapsulate
    │   └─> Derive session keys #2 (unique)
    │
    └─> Recipient #3: Send public key → Receive peer public key → Encapsulate
        └─> Derive session keys #3 (unique)

┌─────────────────────────────────────────────────────────────────────────┐
│                        Transfer Phase (Parallel)                         │
└─────────────────────────────────────────────────────────────────────────┘

GroupTransferManager.sendToAll(file)
    │
    ├─────────────────────────────┬─────────────────────────────┐
    │                             │                             │
    ▼                             ▼                             ▼
Recipient #1                  Recipient #2                  Recipient #3
    │                             │                             │
    ├─> Encrypt file with key #1  ├─> Encrypt file with key #2  ├─> Encrypt file with key #3
    ├─> Send metadata             ├─> Send metadata             ├─> Send metadata
    ├─> Send chunk 1 → ACK        ├─> Send chunk 1 → ACK        ├─> Send chunk 1 → ACK
    ├─> Send chunk 2 → ACK        ├─> Send chunk 2 → ACK        ├─> Send chunk 2 → ACK
    ├─> Send chunk 3 → ACK        ├─> Send chunk 3 → ACK        ├─> Send chunk 3 → ACK
    │   ...                       │   ...                       │   ...
    ├─> Send chunk N → ACK        ├─> Send chunk N → ACK        ├─> Send chunk N → ACK
    ├─> Send complete signal      ├─> Send complete signal      ├─> Send complete signal
    │                             │                             │
    ▼                             ▼                             ▼
✓ Success (33% done)          ✓ Success (66% done)          ✓ Success (100% done)

    │
    └──────────────────┬─────────────────────┘
                       │
                       ▼
              Aggregate Results
                       │
                       ├─> Success: 3/3 recipients
                       ├─> Failed: 0/3 recipients
                       ├─> Total time: Xs
                       └─> Show completion notification

┌─────────────────────────────────────────────────────────────────────────┐
│                        Progress Tracking                                 │
└─────────────────────────────────────────────────────────────────────────┘

Every 100-200ms:
    │
    ├─> Poll Recipient #1: progress = 45%
    ├─> Poll Recipient #2: progress = 52%
    ├─> Poll Recipient #3: progress = 38%
    │
    └─> Calculate aggregate: (45 + 52 + 38) / 3 = 45%
        │
        └─> Update UI:
            ├─> Overall progress bar: 45%
            ├─> Recipient #1 card: 45% (speed: 1.2 MB/s, ETA: 10s)
            ├─> Recipient #2 card: 52% (speed: 1.5 MB/s, ETA: 8s)
            └─> Recipient #3 card: 38% (speed: 0.9 MB/s, ETA: 12s)
```

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           User Actions                                   │
└─────────────────────────────────────────────────────────────────────────┘
            │
            ▼
    ┌───────────────┐
    │  User clicks  │
    │ "Send to      │
    │  Multiple"    │
    └───────┬───────┘
            │
            ▼
    ┌───────────────────────┐
    │ RecipientSelector     │──────┐
    │                       │      │ User searches
    │ - Shows all devices   │◄─────┘ and selects
    │ - Multi-select UI     │
    │ - Search/filter       │
    └───────┬───────────────┘
            │ onConfirm()
            ▼
    ┌──────────────────────────┐
    │ GroupTransferConfirmDialog│─────┐
    │                          │     │ User reviews
    │ - File preview           │◄────┘ and confirms
    │ - Recipient list         │
    │ - Statistics             │
    │ - Warnings               │
    └───────┬──────────────────┘
            │ onConfirm()
            ▼
    ┌──────────────────────┐
    │  useGroupTransfer()  │
    │                      │
    │ 1. Create managers   │
    │ 2. Initialize        │
    │ 3. Key exchange      │
    │ 4. Send to all       │
    └───────┬──────────────┘
            │
            ├───────────────────────┐
            │                       │
            ▼                       ▼
    ┌──────────────────┐    ┌─────────────────────┐
    │GroupTransferManager│   │ Toast Notifications │
    │                  │    │                     │
    │ - Orchestration  │    │ - Progress updates  │
    │ - State tracking │    │ - Success/failure   │
    │ - Error handling │    │ - Completion        │
    └───────┬──────────┘    └─────────────────────┘
            │
            ▼
    ┌─────────────────────┐
    │GroupTransferProgress │
    │                     │
    │ - Live updates      │
    │ - Per-recipient     │
    │ - Aggregate stats   │
    └─────────────────────┘
```

## State Flow Diagram

```
┌──────────────┐
│   INITIAL    │
│              │
│ - No state   │
│ - Ready      │
└──────┬───────┘
       │ initializeGroupTransfer()
       ▼
┌──────────────┐
│  PREPARING   │
│              │
│ - Creating   │
│   managers   │
│ - Setting up │
│   channels   │
└──────┬───────┘
       │ startKeyExchange()
       ▼
┌──────────────┐
│ NEGOTIATING  │
│              │
│ - Key        │
│   exchange   │
│ - Waiting    │
│   for ready  │
└──────┬───────┘
       │ All managers ready
       ▼
┌──────────────┐
│TRANSFERRING  │
│              │
│ - Sending    │
│   chunks     │
│ - Tracking   │
│   progress   │
└──────┬───────┘
       │ All complete/failed
       ▼
    ┌─────┴──────┐
    │            │
    ▼            ▼
┌────────┐  ┌────────┐  ┌────────┐
│COMPLETED│ │PARTIAL │  │FAILED  │
│        │  │        │  │        │
│All OK  │  │Some OK │  │All fail│
└────────┘  └────────┘  └────────┘
```

## Error Handling Flow

```
┌────────────────────────────────────────────────────────────┐
│                    Error Detection                          │
└────────────────────────────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐  ┌──────────────┐  ┌────────────────┐
│Initialization   │  │Key Exchange  │  │Transfer Error  │
│Error            │  │Error         │  │                │
│                 │  │              │  │- Network loss  │
│- Channel fail   │  │- Timeout     │  │- ACK timeout   │
│- Manager fail   │  │- Invalid key │  │- Chunk fail    │
└────────┬────────┘  └──────┬───────┘  └───────┬────────┘
         │                  │                   │
         ▼                  ▼                   ▼
┌──────────────────────────────────────────────────────┐
│              Error Handler (per recipient)           │
├──────────────────────────────────────────────────────┤
│                                                      │
│ 1. Mark recipient as failed                          │
│ 2. Update failure count                              │
│ 3. Continue with other recipients                    │
│ 4. Call onRecipientError callback                    │
│ 5. Log error details                                 │
│                                                      │
└───────────────────────┬──────────────────────────────┘
                        │
                        ▼
                ┌───────────────┐
                │ Final Status  │
                ├───────────────┤
                │               │
                │ If any success:│
                │   → PARTIAL   │
                │               │
                │ If all fail:  │
                │   → FAILED    │
                │               │
                └───────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                           │
└─────────────────────────────────────────────────────────────┘

Recipient #1          Recipient #2          Recipient #3
     │                     │                     │
     ▼                     ▼                     ▼
┌──────────┐         ┌──────────┐         ┌──────────┐
│Independent│        │Independent│        │Independent│
│ML-KEM-768│         │ML-KEM-768│         │ML-KEM-768│
│Keypair #1│         │Keypair #2│         │Keypair #3│
└─────┬────┘         └─────┬────┘         └─────┬────┘
      │                    │                    │
      ▼                    ▼                    ▼
┌──────────┐         ┌──────────┐         ┌──────────┐
│ X25519   │         │ X25519   │         │ X25519   │
│ Keypair  │         │ Keypair  │         │ Keypair  │
│   #1     │         │   #2     │         │   #3     │
└─────┬────┘         └─────┬────┘         └─────┬────┘
      │                    │                    │
      │ Hybrid             │ Hybrid             │ Hybrid
      │ Encapsulation      │ Encapsulation      │ Encapsulation
      ▼                    ▼                    ▼
┌──────────┐         ┌──────────┐         ┌──────────┐
│ Shared   │         │ Shared   │         │ Shared   │
│ Secret   │         │ Secret   │         │ Secret   │
│   #1     │         │   #2     │         │   #3     │
└─────┬────┘         └─────┬────┘         └─────┬────┘
      │                    │                    │
      │ HKDF               │ HKDF               │ HKDF
      ▼                    ▼                    ▼
┌──────────┐         ┌──────────┐         ┌──────────┐
│ Session  │         │ Session  │         │ Session  │
│ Keys #1  │         │ Keys #2  │         │ Keys #3  │
│          │         │          │         │          │
│- Encrypt │         │- Encrypt │         │- Encrypt │
│- Auth    │         │- Auth    │         │- Auth    │
│- SessionID│        │- SessionID│        │- SessionID│
└─────┬────┘         └─────┬────┘         └─────┬────┘
      │                    │                    │
      │ AES-GCM            │ AES-GCM            │ AES-GCM
      ▼                    ▼                    ▼
┌──────────┐         ┌──────────┐         ┌──────────┐
│Encrypted │         │Encrypted │         │Encrypted │
│ Chunks   │         │ Chunks   │         │ Chunks   │
│   #1     │         │   #2     │         │   #3     │
└──────────┘         └──────────┘         └──────────┘

ISOLATION: Compromise of any single connection does NOT affect others
```

## Performance Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Bandwidth Management                        │
└─────────────────────────────────────────────────────────────┘

Total Upload Bandwidth: B bytes/sec
                │
                ├─> Recipient #1: B/N bytes/sec (throttled)
                ├─> Recipient #2: B/N bytes/sec (throttled)
                └─> Recipient #3: B/N bytes/sec (throttled)

Each recipient:
    │
    ├─> Chunk size: 64KB
    ├─> Backpressure monitoring
    └─> Adaptive sending rate

┌─────────────────────────────────────────────────────────────┐
│                  Progress Aggregation                        │
└─────────────────────────────────────────────────────────────┘

Update Interval: 100-200ms
                │
                ├─> Poll Recipient #1 progress
                ├─> Poll Recipient #2 progress
                ├─> Poll Recipient #3 progress
                │
                └─> Calculate aggregate:
                    (P1 + P2 + P3) / 3
                    │
                    └─> Batch update UI
```

This architecture ensures:
- **Security**: Independent encryption per recipient
- **Performance**: Parallel transfers with bandwidth management
- **Reliability**: Graceful failure handling
- **Usability**: Real-time progress feedback
- **Maintainability**: Clean separation of concerns
