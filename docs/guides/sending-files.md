# Sending Files with TALLOW

Complete guide to sending files securely using TALLOW.

## Table of Contents

- [Basic File Send](#basic-file-send)
- [Advanced Options](#advanced-options)
- [Group Transfers](#group-transfers)
- [Password Protection](#password-protection)
- [Privacy Features](#privacy-features)
- [Troubleshooting](#troubleshooting)

## Basic File Send

### Method 1: Drag and Drop

1. **Open** TALLOW in your browser
2. **Drag** files from your computer onto the TALLOW window
3. **Drop** to add files to transfer queue
4. **Connection code** is generated automatically
5. **Share** code with recipient

### Method 2: File Picker

1. **Click** "Send Files" button
2. **Browse** and select files from dialog
3. **Click** "Open" to add to queue
4. **Get** connection code
5. **Share** with recipient

### Method 3: Folder Transfer

1. **Click** "Send Folder" option
2. **Select** entire folder
3. **Folder structure** is preserved
4. **Get** connection code
5. **Share** with recipient

## File Selection

### Supported File Types

TALLOW supports **all file types**:
- Documents (PDF, DOCX, XLSX, etc.)
- Images (JPG, PNG, GIF, SVG, etc.)
- Videos (MP4, AVI, MOV, etc.)
- Audio (MP3, WAV, FLAC, etc.)
- Archives (ZIP, RAR, 7Z, etc.)
- Executables (EXE, DMG, APK, etc.)
- Source code
- Databases
- Any other file format

### File Size Limits

| Transfer Method | Max File Size | Max Total Size |
|----------------|---------------|----------------|
| P2P Direct | Unlimited | Unlimited |
| Local Network | Unlimited | Unlimited |
| Email Fallback | 5 GB per file | 25 GB total |

### Multiple Files

**Add multiple files**:
- Drag and drop multiple files at once
- Use Ctrl/Cmd+Click in file picker
- Add files incrementally

**File queue management**:
- Remove individual files (click X)
- Clear all (click "Clear All")
- Reorder files (drag in queue)

## Connection Code

### Code Format

```
Standard:    ABCD-1234
Compact:     ABCD1234
Custom:      your-custom-code
QR Code:     Scannable QR image
```

### Code Properties

- **Length**: 4-8 characters
- **Characters**: Letters and numbers
- **Case**: Insensitive (ABCD = abcd)
- **Expiration**: 10 minutes default (configurable)
- **One-time**: Code expires after successful use

### Sharing the Code

**Option 1: QR Code**
1. **Click** QR code icon
2. **Recipient scans** with phone camera
3. **Opens** TALLOW automatically

**Option 2: Copy Code**
1. **Click** "Copy Code" button
2. **Paste** in message to recipient
3. **Send** via SMS, email, or chat

**Option 3: Share Link**
1. **Click** "Copy Link"
2. **Share** full URL
3. **Recipient** clicks link to open

## Advanced Options

### Encryption

#### Standard Encryption (AES-256-GCM)

**Enabled by default**:
- Industry-standard encryption
- Fast and efficient
- Suitable for most files

#### Post-Quantum Encryption (ML-KEM-768)

**Maximum security**:
1. **Enable** in Settings → Security → PQC Encryption
2. **All transfers** use quantum-resistant algorithms
3. **Slight performance overhead** (5-10%)

**When to use**:
- Highly sensitive data
- Long-term confidentiality required
- Government/enterprise security policies
- Defense against future quantum computers

### Compression

**Auto-compression**:
- **Enabled** by default for files >10MB
- **Algorithms**: GZIP, Brotli
- **Compression ratio**: Typically 20-60%
- **Best for**: Text, documents, code

**Disable compression** for:
- Already compressed files (ZIP, MP4, JPG)
- Very small files (<1MB)
- Maximum speed transfers

### Metadata Stripping

**Remove sensitive metadata**:

1. **Check** "Strip Metadata" option when selecting files
2. **TALLOW removes**:

   **From Images (JPG, PNG, etc.)**:
   - EXIF data (camera, lens, settings)
   - GPS coordinates
   - Timestamps
   - Creator/author info
   - Software used
   - Copyright info

   **From Documents (PDF, DOCX, etc.)**:
   - Author name
   - Company name
   - Revision history
   - Comments
   - Hidden data
   - Template info

   **From Videos/Audio**:
   - GPS tracks
   - Device info
   - Creator metadata
   - Copyright info

3. **Original** file remains on your device
4. **Stripped** version sent to recipient

## Group Transfers

Send files to multiple recipients simultaneously.

### Creating Group Transfer

1. **Select** files to send
2. **Click** "Group Transfer" button
3. **Add recipients**:
   - Enter recipient names/IDs
   - Click "Add Recipient"
   - Or import from friends list
4. **Generate codes**:
   - Unique code per recipient
   - Or single room code for all
5. **Share codes** with respective recipients

### Group Transfer Options

**Individual tracking**:
- See each recipient's progress
- Individual success/failure status
- Per-recipient speed monitoring

**Bandwidth management**:
- Set bandwidth limit per recipient
- Fair distribution of upload speed
- Priority recipients (optional)

**Group settings**:
```
• Max recipients: 50
• Code expiration: 15 minutes (default)
• Auto-accept: Skip confirmation for all
• Notification: Alert on completion
```

### Group Transfer Scenarios

**Scenario 1: Team File Share**
```
Use Case: Share project files with team
Setup:    Create room code
Benefit:  Everyone gets same files
```

**Scenario 2: Client Deliverables**
```
Use Case: Send different files to each client
Setup:    Individual codes per client
Benefit:  Custom files per recipient
```

**Scenario 3: Emergency Broadcast**
```
Use Case: Urgent file distribution
Setup:    High-priority group transfer
Benefit:  Maximize upload bandwidth
```

## Password Protection

### Setting Password

1. **Select** files to send
2. **Click** "Advanced Options"
3. **Check** "Password Protect"
4. **Enter** password (minimum 4 characters)
5. **Confirm** password
6. **Optional**: Add password hint

### Password Requirements

```
Minimum Length:    4 characters
Maximum Length:    128 characters
Allowed:           Letters, numbers, symbols
Recommended:       12+ characters
Case-Sensitive:    Yes
```

### Sharing Password

**IMPORTANT**: Share password via different channel than connection code!

**Secure methods**:
1. **Phone call** - Speak password
2. **SMS** - Send via text message
3. **In person** - Tell recipient directly
4. **Encrypted messaging** - Signal, WhatsApp

**Insecure methods** (avoid):
- ❌ Same email as connection code
- ❌ Same chat message
- ❌ Unencrypted email
- ❌ Post-it note on screen

### Password Hints

**Good hints**:
- "Your dog's name + birth year"
- "Our meeting room number"
- "The answer to life, universe, everything"

**Bad hints**:
- "12345" (reveals password)
- "password" (too obvious)
- "" (no hint)

## Privacy Features

### Onion Routing

**Enable multi-hop routing**:

1. **Go to** Settings → Privacy
2. **Toggle** "Enable Onion Routing"
3. **Choose hops**: 1-3 relay nodes

**Performance vs Privacy**:
```
1 hop:  Fastest, basic anonymity
2 hops: Balanced, good anonymity
3 hops: Slowest, maximum anonymity
```

**How it works**:
```
Your Device → Relay 1 → Relay 2 → Relay 3 → Recipient
```
Each relay only knows the previous and next hop.

### VPN Integration

**Automatic VPN detection**:
- **Warns** if VPN disconnects during transfer
- **Pauses** transfer if VPN drops
- **Resumes** when VPN reconnects

**Best practices**:
1. Connect to VPN before starting transfer
2. Use reliable VPN provider
3. Enable "kill switch" in VPN settings
4. Monitor VPN status during transfer

### Secure Deletion

**Wipe transferred files**:

1. **Enable** Settings → Privacy → Secure Deletion
2. **After transfer**:
   - Original file overwritten 7 times (DoD 5220.22-M)
   - Metadata wiped
   - File renamed randomly
   - Finally deleted
3. **Recovery impossible**

**Use when**:
- Transferring from public computer
- Sending highly sensitive data
- Compliance requirements (GDPR, HIPAA)

## Transfer Monitoring

### Progress Tracking

**Real-time metrics**:
```
Progress:       [████████░░] 80%
Speed:          15.2 MB/s
Time Remaining: 2m 15s
Total Size:     150 MB
Transferred:    120 MB
Quality:        Excellent
```

### Connection Quality

| Indicator | Speed Range | Meaning |
|-----------|-------------|---------|
| Excellent | >10 MB/s | Optimal connection |
| Good | 1-10 MB/s | Normal connection |
| Fair | 100 KB/s - 1 MB/s | Slow connection |
| Poor | <100 KB/s | Very slow |

### Transfer States

```
Pending      → Waiting for recipient to connect
Connecting   → Establishing P2P connection
Transferring → Actively sending data
Paused       → Transfer paused by user
Completed    → Transfer successful
Failed       → Transfer error occurred
Cancelled    → User cancelled transfer
```

## Error Handling

### Auto-Retry

**TALLOW automatically retries**:
- Network interruptions (up to 3 retries)
- Connection timeouts
- Temporary peer disconnection

### Fallback Methods

**If P2P fails**:
1. **Try** different network (mobile hotspot)
2. **Use** TURN relay server
3. **Fallback** to email transfer
4. **Option** to cancel and retry later

### Common Errors

**"Connection timeout"**
- Recipient may be offline
- Firewall blocking connection
- Try email fallback

**"Transfer interrupted"**
- Network disconnected
- Will auto-resume
- Or restart transfer

**"Recipient rejected"**
- Recipient declined transfer
- Verify connection code
- Confirm with recipient

## Best Practices

### For Large Files

1. **Enable compression** (if not compressed)
2. **Stable connection** (wired > WiFi)
3. **Close** other apps
4. **Don't** sleep computer
5. **Monitor** progress

### For Multiple Files

1. **Zip** files if many small files
2. **Preserve** folder structure
3. **Verify** total size
4. **Test** with one file first

### For Sensitive Data

1. **Enable PQC** encryption
2. **Enable onion** routing
3. **Password protect** transfer
4. **Strip metadata** from files
5. **Verify recipient** identity
6. **Enable secure** deletion

### For Remote Locations

1. **Check** internet speed
2. **Consider** compression
3. **Use** smaller chunks
4. **Expect** longer transfer time
5. **Monitor** connection quality

## Keyboard Shortcuts

```
Ctrl/Cmd + D        Start send transfer
Ctrl/Cmd + Shift+D  Group transfer
Ctrl/Cmd + P        Password protect
Ctrl/Cmd + C        Copy connection code
Ctrl/Cmd + Q        Copy QR code
Esc                 Cancel transfer
```

## Next Steps

- [Receiving Files Guide](./receiving-files.md)
- [Group Transfer Guide](./group-transfer.md)
- [Privacy Mode Guide](./privacy-mode.md)
- [Troubleshooting](./troubleshooting.md)
