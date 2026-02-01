# Advanced Encryption Features

This document describes the advanced encryption features available in Tallow for secure file transfers.

## Overview

Tallow now supports four advanced encryption features that provide additional layers of security and control over your file transfers:

1. **Password-Based File Encryption** - Add password protection to files
2. **Expiring Transfers** - Set automatic expiration times for transfers
3. **One-Time Transfers** - Auto-delete files after first download
4. **Digital Signatures** - Verify file authenticity with Ed25519 signatures

## 1. Password-Based File Encryption

### Features

- **Layered Encryption**: Combines PQC session encryption with password encryption
- **Strong Key Derivation**: Uses PBKDF2 with 600,000 iterations (OWASP 2023 recommendation)
- **Password Strength Meter**: Real-time feedback on password security
- **Optional Hints**: Store password hints (without revealing the password)
- **Secure Salt Generation**: Each file gets a unique 32-byte cryptographic salt

### Usage

```typescript
import { encryptFileWithPasswordLayer } from '@/lib/crypto/password-file-encryption';

// Encrypt file with both session key and password
const encrypted = await encryptFileWithPasswordLayer(
  file,
  sessionKey,
  'MySecurePassword123!',
  'My first pet\'s name' // Optional hint
);
```

### Security Considerations

- Passwords are never stored or transmitted
- Each file uses a unique salt to prevent rainbow table attacks
- Password hints are optional and should not contain the actual password
- Minimum password length: 8 characters
- Recommended password strength: Strong (score 3+)

### Password Strength Scoring

| Score | Strength | Criteria |
|-------|----------|----------|
| 0 | Very Weak | < 8 characters, no complexity |
| 1 | Weak | 8+ characters, minimal complexity |
| 2 | Medium | 12+ characters, some complexity |
| 3 | Strong | 12+ characters, good complexity |
| 4 | Very Strong | 16+ characters, high complexity |

Complexity factors:
- Lowercase letters
- Uppercase letters
- Numbers
- Special characters
- Avoidance of common patterns

## 2. Expiring Transfers

### Features

- **Automatic Cleanup**: Files are automatically deleted after expiration
- **Preset Durations**: Choose from 1h, 24h, 7d, or 30d
- **Countdown Timer**: Real-time display of time remaining
- **Expiration Warnings**: Visual indicators for expiring transfers

### Usage

```typescript
import { transferMetadata, EXPIRATION_PRESETS } from '@/lib/transfer/transfer-metadata';

// Set expiration to 24 hours
const expiresAt = Date.now() + EXPIRATION_PRESETS['24h'];

await transferMetadata.setMetadata(transferId, {
  transferId,
  expiresAt,
  expirationDuration: EXPIRATION_PRESETS['24h'],
  createdAt: Date.now(),
});
```

### Available Durations

| Preset | Duration |
|--------|----------|
| `1h` | 1 hour |
| `24h` | 24 hours |
| `7d` | 7 days |
| `30d` | 30 days |
| `never` | No expiration |

### Automatic Cleanup

The system automatically:
- Checks for expired transfers on app load
- Removes expired transfer metadata
- Displays warnings as expiration approaches

## 3. One-Time Transfers

### Features

- **Auto-Delete**: Files are automatically deleted after first download
- **Download Tracking**: Monitor how many times a file has been downloaded
- **Visual Indicators**: "One-Time" badges show transfer status
- **Max Downloads**: Optionally set maximum download count

### Usage

```typescript
import { transferMetadata } from '@/lib/transfer/transfer-metadata';

// Create one-time transfer
await transferMetadata.setMetadata(transferId, {
  transferId,
  oneTimeTransfer: true,
  downloadCount: 0,
  maxDownloads: 1,
  createdAt: Date.now(),
});

// Track downloads
const shouldDelete = await transferMetadata.incrementDownloadCount(transferId);
if (shouldDelete) {
  console.log('Transfer auto-deleted after download');
}
```

### Use Cases

- Sensitive documents that should only be accessed once
- Time-sensitive information
- One-time sharing with specific recipients
- Preventing unauthorized redistribution

## 4. Digital Signatures

### Features

- **Ed25519 Signatures**: Industry-standard elliptic curve signatures
- **File Authenticity**: Verify files haven't been tampered with
- **Public Key Fingerprints**: Visual verification of sender identity
- **Timestamp Inclusion**: Signatures include creation timestamp
- **Secure Storage**: Private keys stored in encrypted secure storage

### Usage

```typescript
import { signFile, verifyFileSignature, getPublicKeyFingerprint } from '@/lib/crypto/digital-signatures';

// Sign a file
const fileData = new Uint8Array(await file.arrayBuffer());
const signature = await signFile(fileData);

// Get fingerprint for display
const fingerprint = getPublicKeyFingerprint(signature.publicKey);
console.log('Key fingerprint:', fingerprint);

// Verify signature
const isValid = verifyFileSignature(fileData, signature);
console.log('Signature valid:', isValid);
```

### Signature Components

- **Signature**: 64-byte Ed25519 signature
- **Public Key**: 32-byte sender public key
- **File Hash**: SHA-256 hash of file contents
- **Timestamp**: Unix timestamp of signing

### Verification Process

1. Hash the received file with SHA-256
2. Compare hash with signature's file hash
3. Verify Ed25519 signature using sender's public key
4. Check timestamp for replay attack prevention

### Security Properties

- **Non-repudiation**: Sender cannot deny signing the file
- **Integrity**: Detects any modification to the file
- **Authentication**: Confirms file came from claimed sender
- **Tamper Evidence**: Any changes invalidate the signature

## Integration with Transfer Manager

### Complete Transfer Flow

```typescript
import { useAdvancedTransfer } from '@/lib/hooks/use-advanced-transfer';

const { prepareFileTransfer, decryptReceivedFile } = useAdvancedTransfer();

// Sender: Prepare file with all options
const { encryptedFile, metadata, signature } = await prepareFileTransfer(
  file,
  sessionKey,
  {
    password: 'SecurePassword123!',
    passwordHint: 'My favorite color',
    expiration: '24h',
    oneTime: true,
    signed: true,
  }
);

// Receiver: Decrypt and verify
const { blob, verified, fingerprint } = await decryptReceivedFile(
  encryptedFile,
  sessionKey,
  metadata,
  'SecurePassword123!' // If password protected
);

console.log('Signature verified:', verified);
console.log('Sender fingerprint:', fingerprint);
```

## UI Components

### TransferOptionsDialog

Configure all transfer options before sending:

```tsx
<TransferOptionsDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  fileName="document.pdf"
  onConfirm={(options) => {
    // Handle options: passwordProtected, expiration, oneTime, signed
  }}
/>
```

### PasswordProtectionDialog

Set password and hint for file encryption:

```tsx
<PasswordProtectionDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  fileName="document.pdf"
  onConfirm={(password, hint) => {
    // Handle password protection
  }}
/>
```

### PasswordInputDialog

Prompt user to enter password for decryption:

```tsx
<PasswordInputDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  fileName="document.pdf"
  onSubmit={async (password) => {
    // Attempt decryption
    return success;
  }}
/>
```

### TransferStatusBadges

Display transfer status and security features:

```tsx
<TransferStatusBadges metadata={transferMetadata} />
```

Shows badges for:
- Password protected
- Digitally signed
- One-time download
- Expiration countdown
- Download count

### SignatureVerificationBadge

Display signature verification status:

```tsx
<SignatureVerificationBadge
  verified={true}
  publicKeyFingerprint="A1:B2:C3:D4:E5:F6:07:08"
/>
```

## Best Practices

### Password Protection

1. **Use Strong Passwords**: Aim for "Strong" (3) or "Very Strong" (4) rating
2. **Avoid Personal Information**: Don't use easily guessable passwords
3. **Share Passwords Securely**: Use a separate communication channel
4. **Use Hints Wisely**: Hints should help memory without revealing the password

### Expiring Transfers

1. **Match Sensitivity**: More sensitive = shorter expiration
2. **Consider Time Zones**: Account for recipient's timezone
3. **Add Buffer Time**: Set expiration longer than strictly needed
4. **Communicate Expiration**: Inform recipient of the deadline

### One-Time Transfers

1. **Verify Recipient**: Ensure only intended recipient has access
2. **Test First**: For important files, test with non-sensitive data
3. **Provide Notification**: Let recipient know it's one-time only
4. **Have Backup**: Keep original file until confirmed received

### Digital Signatures

1. **Always Sign Sensitive Files**: Enable signing for important documents
2. **Verify Fingerprints**: Out-of-band verification of public key fingerprints
3. **Check Timestamps**: Verify signature timestamp makes sense
4. **Archive Public Keys**: Keep record of sender public keys for future verification

## Security Architecture

### Layered Encryption

Files can have multiple layers of protection:

1. **Base Layer**: ML-KEM-768 (Kyber) + X25519 hybrid encryption
2. **Session Layer**: AES-256-GCM with derived session keys
3. **Password Layer**: PBKDF2-derived key with AES-256-GCM
4. **Signature Layer**: Ed25519 signature over file hash

### Key Derivation Chain

```
Master Secret (from PQC key exchange)
  ↓ HKDF
Session Keys (encryption, auth, sessionId)
  ↓ AES-256-GCM
Encrypted File Chunks
  ↓ PBKDF2 (if password protected)
Password Key
  ↓ AES-256-GCM
Double-Encrypted Chunks
```

### Storage Security

- **Secure Storage**: Uses AES-256-GCM encrypted localStorage
- **Key Isolation**: Different keys for different purposes
- **Memory Protection**: Sensitive keys zeroed after use
- **Metadata Encryption**: Transfer metadata encrypted at rest

## Performance Considerations

### Password Derivation

- PBKDF2 with 600,000 iterations takes ~200-500ms on modern hardware
- Consider showing loading indicator during key derivation
- Derivation is done once per transfer, not per chunk

### Signature Generation

- Ed25519 signing is very fast (~0.1ms per signature)
- Verification is equally fast
- Minimal impact on transfer performance

### Expiration Checks

- Cleanup runs on app load (async, non-blocking)
- Metadata checks are O(1) lookups
- No performance impact on transfers

### One-Time Tracking

- Download count updated asynchronously
- No blocking operations
- Cleanup triggered after download completes

## Troubleshooting

### Password Decryption Fails

**Problem**: "Incorrect password" error when decrypting

**Solutions**:
- Verify password was entered correctly
- Check if Caps Lock is on
- Ensure password hint matches expectations
- Verify file wasn't corrupted during transfer

### Signature Verification Fails

**Problem**: Signature shows as "Unverified"

**Solutions**:
- Check if file was modified after signing
- Verify sender's public key matches expected value
- Ensure signature wasn't corrupted during transfer
- Check if signature timestamp seems reasonable

### Transfer Expired

**Problem**: Cannot access transfer, shows as expired

**Solutions**:
- Check system clock is accurate
- Request sender to resend with longer expiration
- Verify timezone settings are correct

### One-Time Download Used

**Problem**: Cannot download, shows as already downloaded

**Solutions**:
- Verify this wasn't accessed by someone else
- Request sender to resend file
- Check transfer history for download timestamp

## Testing

Run comprehensive tests:

```bash
# Test password encryption
npm run test:unit tests/unit/crypto/password-encryption.test.ts

# Test digital signatures
npm run test:unit tests/unit/crypto/digital-signatures.test.ts

# Run all crypto tests
npm run test:crypto
```

## API Reference

See the following files for detailed API documentation:

- `/lib/crypto/argon2-browser.ts` - Password key derivation
- `/lib/crypto/password-file-encryption.ts` - Password-based file encryption
- `/lib/crypto/digital-signatures.ts` - Digital signature operations
- `/lib/transfer/transfer-metadata.ts` - Transfer metadata management
- `/lib/hooks/use-advanced-transfer.ts` - React hook for advanced transfers

## Future Enhancements

Planned improvements:

1. **True Argon2id**: WebAssembly implementation for better password security
2. **Multi-Signature**: Support for multiple signers on same file
3. **Revocation**: Ability to revoke signatures
4. **Key Rotation**: Automatic rotation of signing keys
5. **Transfer Limits**: Set download count limits beyond one-time
6. **Custom Expiration**: Precise date/time picker for expiration
7. **Notification System**: Alerts for expiring or accessed transfers
8. **Transfer History**: Detailed logs of all transfer operations

## Support

For issues or questions:
- Check existing documentation
- Review test files for usage examples
- Open an issue on GitHub
- Contact support team

## License

These features are part of the Tallow secure file transfer application and are subject to the same license terms.
