# Folder Transfer Flow Diagram

Visual guide to understand how folder transfers work in Tallow.

## Overview Flow

```
┌─────────────┐
│   Sender    │
└─────┬───────┘
      │
      ▼
┌─────────────────────┐
│  Select Folder      │ ◄── User drops/selects folder
│  (FolderSelector)   │
└─────┬───────────────┘
      │
      ▼
┌─────────────────────┐
│  Build Structure    │ ◄── buildFolderStructure()
│  - Read files       │
│  - Extract paths    │
│  - Filter system    │
└─────┬───────────────┘
      │
      ▼
      ┌──────────────┐
      │ Compress?    │
      └───┬──────┬───┘
          │      │
     Yes  │      │  No
          ▼      ▼
    ┌─────────┐  │
    │ ZIP it  │  │
    └────┬────┘  │
         └───────┘
              │
              ▼
   ┌────────────────────┐
   │  PQC Encryption    │ ◄── Per-file encryption
   │  - Encrypt files   │
   │  - Encrypt paths   │
   └────┬───────────────┘
        │
        ▼
   ┌────────────────────┐
   │  WebRTC Transfer   │ ◄── Chunked transfer
   │  - Send metadata   │
   │  - Send chunks     │
   │  - Track progress  │
   └────┬───────────────┘
        │
        │  Network
        ▼
┌────────────────────┐
│  Receiver          │
│  - Decrypt chunks  │
│  - Decrypt paths   │
│  - Verify hashes   │
└────┬───────────────┘
     │
     ▼
┌─────────────────────┐
│  Reconstruct        │ ◄── Build folder structure
│  - Assemble files   │
│  - Restore paths    │
│  - [Decompress]     │
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│  Download/Display   │ ◄── User action
│  - Show tree        │
│  - Download ZIP     │
└─────────────────────┘
```

## Component Interaction

```
┌──────────────────┐
│  User Interface  │
└────────┬─────────┘
         │
    ┌────┴────┬──────────┬─────────────┐
    ▼         ▼          ▼             ▼
┌─────────┐ ┌────────┐ ┌─────────┐ ┌──────────┐
│ Folder  │ │ Folder │ │ Folder  │ │  Folder  │
│Selector │ │  Tree  │ │Progress │ │ Download │
└────┬────┘ └───┬────┘ └────┬────┘ └────┬─────┘
     │          │           │           │
     └──────────┴───────────┴───────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │  Transfer Integration  │
        │  - sendFolder()        │
        │  - FolderReceiver      │
        │  - BatchFileTransfer   │
        └───────────┬────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Core Utilities       │
        │  - buildStructure()   │
        │  - compressFolder()   │
        │  - filterFiles()      │
        │  - getFolderStats()   │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  PQC Transfer Manager │
        │  - Encryption         │
        │  - Key Exchange       │
        │  - Chunk Transfer     │
        └───────────────────────┘
```

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Browser FileList                     │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │  webkitRelativePath
              │  file1.txt → "Folder/file1.txt"
              │  file2.jpg → "Folder/sub/file2.jpg"
              │  file3.js  → "Folder/sub/nested/file3.js"
              └───────────┬──────┘
                          │
                          ▼
              ┌──────────────────────┐
              │  FolderStructure      │
              │  {                    │
              │    name: "Folder",    │
              │    files: [           │
              │      { name, path, file },
              │      ...              │
              │    ],                 │
              │    totalSize,         │
              │    fileCount          │
              │  }                    │
              └───────────┬──────────┘
                          │
          ┌───────────────┴───────────────┐
          │ Compress?                     │
          ▼                               ▼
    ┌─────────────┐             ┌──────────────────┐
    │  ZIP Blob   │             │  File Array      │
    │  - Folder.zip│             │  - file1.txt     │
    └──────┬──────┘             │  - file2.jpg     │
           │                     │  - file3.js      │
           │                     └──────┬───────────┘
           └─────────────────────────┬──┘
                                     │
                                     ▼
                          ┌──────────────────┐
                          │  Encrypted Data  │
                          │  {               │
                          │    metadata: {   │
                          │      encName,    │
                          │      encPath,    │
                          │      nonce       │
                          │    },            │
                          │    chunks: []    │
                          │  }               │
                          └────────┬─────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │  WebRTC Stream   │
                          │  chunk[0], chunk[1], ...
                          └────────┬─────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │  Receiver        │
                          │  - Decrypt       │
                          │  - Reassemble    │
                          │  - Decompress    │
                          └────────┬─────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │  FolderStructure │
                          │  (Reconstructed) │
                          └────────┬─────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │  Download ZIP    │
                          │  or              │
                          │  Display Tree    │
                          └──────────────────┘
```

## State Management

```
┌──────────────────────────────────────────────────┐
│                Sender State                      │
├──────────────────────────────────────────────────┤
│  selectedFolder: FolderStructure | null          │
│  compressedBlob: Blob | null                     │
│  isTransferring: boolean                         │
│  transferProgress: {                             │
│    currentFile: string                           │
│    transferredFiles: number                      │
│    totalFiles: number                            │
│  }                                                │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│               Receiver State                     │
├──────────────────────────────────────────────────┤
│  receivedChunks: Map<number, EncryptedChunk>     │
│  fileMetadata: FileMetadataPayload | null        │
│  isReceiving: boolean                            │
│  receiveProgress: {                              │
│    currentFile: string                           │
│    receivedFiles: number                         │
│    totalFiles: number                            │
│  }                                                │
│  receivedFolder: FolderStructure | null          │
└──────────────────────────────────────────────────┘
```

## Compression Flow

```
┌─────────────────┐
│  FolderStructure│
│  - 1000 files   │
│  - 100MB total  │
└────────┬────────┘
         │
         ▼
    ┌─────────────────────┐
    │  Read Files         │
    │  - Convert to Uint8 │
    │  - Build ZIP map    │
    └────────┬────────────┘
             │
             ▼
    ┌─────────────────────┐
    │  Compress           │
    │  - fflate level 6   │
    │  - Track progress   │
    └────────┬────────────┘
             │
             ▼
    ┌─────────────────────┐
    │  ZIP Blob           │
    │  - 30MB (70% saved) │
    │  - Single file      │
    └────────┬────────────┘
             │
             ▼
    ┌─────────────────────┐
    │  Transfer           │
    │  - Faster transfer  │
    │  - Single metadata  │
    └─────────────────────┘
```

## File Tree Building

```
Files:
  MyProject/README.md
  MyProject/src/index.ts
  MyProject/src/utils/helper.ts

              ┌──────────────┐
              │  MyProject   │ (folder)
              └───┬──────────┘
                  │
          ┌───────┴───────┐
          ▼               ▼
    ┌──────────┐    ┌────────┐
    │README.md │    │  src   │ (folder)
    └──────────┘    └───┬────┘
                        │
                ┌───────┴────────┐
                ▼                ▼
          ┌──────────┐    ┌────────────┐
          │index.ts  │    │   utils    │ (folder)
          └──────────┘    └─────┬──────┘
                                │
                                ▼
                          ┌──────────┐
                          │helper.ts │
                          └──────────┘
```

## Progress Tracking

```
Transfer Progress Timeline:

0%    ────────────────────────────────────────► 100%
│          │          │          │          │
▼          ▼          ▼          ▼          ▼
Start    File 1     File 2     File 3    Complete
         Ready      Ready      Ready
         │          │          │          │
         ▼          ▼          ▼          ▼
      Encrypt    Encrypt    Encrypt    All Done
         │          │          │          │
         ▼          ▼          ▼          ▼
      Transfer   Transfer   Transfer   Success
         │          │          │
         ▼          ▼          ▼
       ACK        ACK        ACK

At any point:
- Current file name
- Files transferred / Total files
- Bytes transferred / Total bytes
- Transfer speed (KB/s)
- ETA (seconds)
```

## Error Handling

```
┌─────────────────┐
│  Send Folder    │
└────────┬────────┘
         │
         ▼
    ┌────────────────┐
    │ Try Compress   │
    └───┬────────┬───┘
        │        │
     OK │        │ Error
        ▼        ▼
    ┌────────┐ ┌──────────────┐
    │Transfer│ │Log & Notify  │
    └───┬────┘ │"Compression  │
        │      │ failed"      │
        │      └──────────────┘
        ▼
    ┌────────────────┐
    │ Try Transfer   │
    └───┬────────┬───┘
        │        │
     OK │        │ Error
        ▼        ▼
    ┌────────┐ ┌──────────────┐
    │Success │ │Retry or Fail │
    └────────┘ │- Pause/Resume│
               │- Notify User │
               └──────────────┘
```

## Memory Management

```
┌──────────────────────────────────────┐
│           Browser Heap               │
├──────────────────────────────────────┤
│  ┌────────────────────────────────┐  │
│  │  FileList (from input)         │  │ ◄─ Native browser object
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  FolderStructure               │  │ ◄─ ~1KB per file
│  │  - Metadata only               │  │
│  │  - References to File objects  │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  Compression Buffer            │  │ ◄─ Temp, freed after
│  │  - Uint8Array[]                │  │
│  │  - ~1.5x folder size           │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  Transfer Chunks               │  │ ◄─ 64KB chunks
│  │  - Encrypted chunks            │  │
│  │  - Sent and freed              │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘

Peak memory: ~2x folder size (during compression)
Steady state: ~0.5x folder size (metadata + refs)
```

## Security Layers

```
┌─────────────────────────────────────────┐
│         Plaintext File                  │
│         "Hello World"                   │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│     [Optional] ZIP Compression          │
│     Reduces size, no encryption yet     │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│     AES-256-GCM Encryption              │
│     - Encrypted content                 │
│     - 12-byte nonce                     │
│     - 16-byte tag                       │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│     WebRTC DTLS-SRTP Transport          │
│     - Additional transport encryption   │
│     - Perfect forward secrecy           │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         Network                         │
│     Double-encrypted traffic            │
└─────────────────────────────────────────┘
```

## Folder Types - Compression Impact

```
Code Project (Text Heavy):
Original:     ████████████████████ 100MB
Compressed:   ██████               30MB (70% saved)
Transfer:     ~10 seconds

Photo Album (Already Compressed):
Original:     ████████████████████ 100MB
Compressed:   ███████████████████  95MB (5% saved)
Transfer:     ~30 seconds (skip compression)

Mixed Documents:
Original:     ████████████████████ 100MB
Compressed:   ████████████         60MB (40% saved)
Transfer:     ~15 seconds

Video Files (Skip Compression):
Original:     ████████████████████ 100MB
No compression - transfer directly
Transfer:     ~30 seconds
```

---

This visual guide helps understand the complete folder transfer flow from user selection to final download.
