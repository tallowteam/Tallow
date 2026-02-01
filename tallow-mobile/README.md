# Tallow Mobile

Quantum-resistant P2P file transfer application built with Flutter.

## Features

- **Post-Quantum Encryption**: ML-KEM-768 + X25519 hybrid key exchange
- **End-to-End Encryption**: AES-256-GCM for all data
- **P2P Transfer**: WebRTC DataChannels with 64KB chunks
- **Local Discovery**: mDNS-based device discovery
- **Online Rooms**: Signaling server for remote connections
- **Relay Fallback**: Encrypted relay when P2P fails
- **Multi-Platform**: iOS, Android, macOS, Windows, Linux
- **22 Languages**: Full internationalization with RTL support
- **4 Themes**: Dark, Light, Forest, Ocean

## Getting Started

### Prerequisites

- Flutter 3.16.0 or higher
- Dart 3.2.0 or higher

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/tallow-mobile.git
cd tallow-mobile
```

2. Install dependencies:
```bash
flutter pub get
```

3. Generate code (if using freezed/json_serializable):
```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

4. Run the app:
```bash
flutter run
```

## Project Structure

```
lib/
├── main.dart                 # App entry point
├── app.dart                  # App widget with navigation
├── core/
│   ├── crypto/              # Cryptographic implementations
│   │   ├── pqc_crypto.dart  # ML-KEM-768
│   │   ├── aes_gcm.dart     # AES-256-GCM
│   │   ├── blake3.dart      # BLAKE3 hashing
│   │   └── key_exchange.dart # Hybrid key exchange
│   ├── network/             # Networking
│   │   ├── webrtc_manager.dart
│   │   ├── mdns_discovery.dart
│   │   ├── signaling_client.dart
│   │   └── relay_client.dart
│   └── storage/             # Secure storage
│       ├── secure_storage.dart
│       └── transfer_history.dart
├── features/                # Feature modules
│   ├── transfer/
│   ├── discovery/
│   ├── chat/
│   ├── settings/
│   └── history/
├── shared/
│   ├── widgets/            # Reusable widgets
│   ├── theme/              # Theme configuration
│   └── utils/              # Utility functions
└── l10n/                   # Localizations
```

## Cryptography

### Key Exchange
- **Post-Quantum**: ML-KEM-768 (Kyber768)
- **Classical**: X25519
- **Hybrid**: Combined using BLAKE3 key derivation

### Encryption
- **Algorithm**: AES-256-GCM
- **Nonce**: 96-bit (12 bytes)
- **Tag**: 128-bit (16 bytes)

### Hashing
- **Algorithm**: BLAKE3
- **Output**: 256-bit default

## Supported Platforms

| Platform | Status |
|----------|--------|
| iOS | ✅ |
| Android | ✅ |
| macOS | ✅ |
| Windows | ✅ |
| Linux | ✅ |

## Supported Languages

English, Spanish, French, German, Italian, Portuguese, Russian, Chinese, Japanese, Korean, Arabic (RTL), Hindi, Bengali, Indonesian, Thai, Vietnamese, Turkish, Polish, Dutch, Ukrainian, Urdu (RTL), Hebrew (RTL)

## License

This project is proprietary software. All rights reserved.
