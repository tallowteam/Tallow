# Getting Started with TALLOW

Welcome to TALLOW - a secure, privacy-focused file transfer platform with post-quantum cryptography.

## What is TALLOW?

TALLOW (Transfer ALLOWance) is a modern file transfer application that provides:

- ✅ **Peer-to-Peer Direct Transfer** - Files never touch our servers
- ✅ **Post-Quantum Encryption** - ML-KEM-768 (Kyber) + X25519 hybrid crypto
- ✅ **Complete Privacy** - Onion routing, no tracking, metadata stripping
- ✅ **Cross-Platform** - Works on Windows, macOS, Linux, Android, iOS
- ✅ **No File Size Limits** - Transfer files of any size
- ✅ **Group Transfers** - Send to multiple recipients simultaneously
- ✅ **No Account Required** - Start transferring immediately

## Quick Start

### Option 1: Web App (Fastest)

1. **Visit** [tallow.manisahome.com](https://tallow.manisahome.com)
2. **Click** "Start Transfer"
3. **Select** files to send
4. **Share** the connection code with recipient
5. **Done!** Transfer starts automatically

### Option 2: Local Installation

```bash
# Clone repository
git clone https://github.com/your-org/tallow.git
cd tallow

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser
open http://localhost:3000
```

### Option 3: Docker

```bash
# Pull and run
docker run -p 3000:3000 tallow/tallow:latest

# Or use docker-compose
docker-compose up
```

## Your First Transfer

### As a Sender

1. **Open TALLOW** in your browser
2. **Click** "Send Files" or drag files onto the page
3. **Select files** from your computer
4. **Generate** a connection code (automatically created)
5. **Share** the code with your recipient via:
   - QR code (scan with phone)
   - Text code (e.g., ABCD-1234)
   - Direct link
6. **Wait** for recipient to connect
7. **Transfer** starts automatically when connected

### As a Receiver

1. **Get** the connection code from sender
2. **Open TALLOW** in your browser
3. **Click** "Receive Files"
4. **Enter** the connection code or scan QR code
5. **Accept** the transfer request
6. **Choose** download location
7. **Wait** for transfer to complete

## Key Features Guide

### 🔒 Security Features

#### Post-Quantum Encryption (PQC)

Enable quantum-resistant encryption:

1. **Go to** Settings → Security
2. **Toggle** "Enable PQC Encryption"
3. **All transfers** now use ML-KEM-768 + X25519

#### Onion Routing

Add privacy layer similar to Tor:

1. **Go to** Settings → Privacy
2. **Toggle** "Enable Onion Routing"
3. **Select** number of hops (1-3)
4. **Transfers** now route through relay nodes

#### Metadata Stripping

Remove sensitive metadata from files:

1. **When selecting files**, check "Strip Metadata"
2. **TALLOW removes**:
   - EXIF data from images
   - GPS coordinates
   - Camera info
   - Author/creator info
   - PDF metadata

### 👥 Multi-Device Features

#### My Devices

Connect your own devices without codes:

1. **Open TALLOW** on both devices
2. **Go to** "My Devices"
3. **Add Device** with auto-detected local devices
4. **Transfer** seamlessly between your devices

#### Friends List

Save frequent contacts:

1. **After a transfer**, click "Add to Friends"
2. **Assign nickname** and avatar
3. **Next time**, select from friends list
4. **No code needed** for trusted friends

### 🌐 Advanced Features

#### Group Transfer

Send to multiple people at once:

1. **Select files** to send
2. **Click** "Group Transfer"
3. **Add recipients** (up to 50)
4. **Generate codes** for each recipient
5. **Track** individual progress

#### Transfer Rooms

Create persistent transfer rooms:

1. **Click** "Create Room"
2. **Set room name** and optional password
3. **Share room code** with team
4. **Anyone** with code can join and share files
5. **Rooms expire** after 7 days (configurable)

#### Email Fallback

When P2P fails, use email:

1. **Enter recipient email**
2. **TALLOW encrypts** and uploads to S3
3. **Sends email** with download link
4. **Auto-expires** after 24 hours

## Settings Guide

### Device Settings

```
Settings → Device

• Device Name: How others see you
• Avatar: Profile picture for transfers
• Platform: Automatically detected
```

### Transfer Settings

```
Settings → Transfer

• Default encryption: Enable/disable PQC
• Auto-accept from friends: Skip confirmation
• Download location: Where files are saved
• Chunk size: Performance tuning (default: 256KB)
• Compression: Auto-compress large files
```

### Privacy Settings

```
Settings → Privacy

• Onion routing: Enable/disable
• Relay hops: Number of routing nodes (1-3)
• Metadata stripping: Remove file metadata
• Secure deletion: Wipe files after transfer
• VPN detection: Warn if VPN disconnects
```

### Notifications

```
Settings → Notifications

• Desktop notifications: System notifications
• Sound effects: Audio alerts
• Email notifications: Transfer status emails
```

## Understanding Connection Methods

TALLOW tries multiple methods to establish the fastest connection:

### 1. WebRTC P2P (Fastest)
- **Direct** device-to-device connection
- **No server** involved in transfer
- **Speeds**: Up to 1 Gbps on local network

### 2. Local Network (Very Fast)
- **Same WiFi** network
- **No internet** required
- **Speeds**: Typically 100-300 Mbps

### 3. TURN Relay (Fallback)
- **Through relay** server
- **Works** with strict firewalls
- **Speeds**: Depends on server capacity

### 4. Email Fallback (When all else fails)
- **Encrypted upload** to S3
- **Email link** to recipient
- **Speeds**: Depends on upload bandwidth

## Troubleshooting

### Connection Issues

**Problem**: "Unable to connect to peer"

**Solutions**:
1. Check both devices have internet
2. Disable VPN temporarily
3. Try different network (mobile hotspot)
4. Use email fallback option

### Slow Transfers

**Problem**: Transfer is slower than expected

**Solutions**:
1. Check both devices' internet speed
2. Close other apps using bandwidth
3. Enable compression in settings
4. Try smaller chunk size (Settings → Advanced)

### Files Not Receiving

**Problem**: Transfer completes but files missing

**Solutions**:
1. Check download location in settings
2. Check browser download settings
3. Try different browser
4. Check disk space

### Browser Compatibility

**Supported Browsers**:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

**Known Issues**:
- IE 11: Not supported
- Safari < 14: Limited WebRTC support
- Mobile browsers: May require HTTPS

## Security Best Practices

### For Maximum Security

1. **Enable PQC encryption** (Settings → Security)
2. **Enable onion routing** (Settings → Privacy)
3. **Strip metadata** from all files
4. **Use password protection** for sensitive files
5. **Verify recipient** before accepting transfers
6. **Clear history** after transfers (Settings → Privacy)

### For Sensitive Files

1. **Enable password protection** when sending
2. **Share password** via different channel (SMS, phone call)
3. **Set expiration** for transfer links
4. **Enable download limits** (max 1-3 downloads)
5. **Request download notifications**

## Next Steps

Now that you're familiar with the basics:

- 📖 Read [Advanced Features Guide](./advanced-features.md)
- 🔐 Learn about [Security & Privacy](./security-privacy.md)
- 🔧 Explore [API Documentation](../api/README.md)
- 👥 Join our [Community Forum](https://community.tallow.example)

## Getting Help

- **In-App Help**: Click "?" icon in top-right
- **Documentation**: https://tallow.manisahome.com/docs
- **FAQ**: https://tallow.manisahome.com/help/faq
- **Email Support**: support@tallow.example
- **GitHub Issues**: https://github.com/your-org/tallow/issues

## Quick Reference Card

```
KEYBOARD SHORTCUTS

Ctrl/Cmd + D    Start send transfer
Ctrl/Cmd + R    Start receive transfer
Ctrl/Cmd + ,    Open settings
Ctrl/Cmd + K    Open command palette
Ctrl/Cmd + /    Show shortcuts
Esc             Cancel/close dialog

CONNECTION CODES

Format:         XXXX-YYYY or 8-character
Case:           Insensitive
Expires:        10 minutes (default)
Sharing:        QR code, text, or link

FILE LIMITS

Max file size:  No limit (P2P)
                5 GB (email fallback)
Max files:      No limit (P2P)
                100 files (email)
Max recipients: 50 (group transfer)
```

---

**Welcome to secure, private file transfer! 🎉**
