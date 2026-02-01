# Advanced Encryption Features - Quick Start Guide

This guide provides quick examples for implementing the advanced encryption features in Tallow.

## Quick Reference

```typescript
// Import everything you need
import { useAdvancedTransfer } from '@/lib/hooks/use-advanced-transfer';
import { TransferOptionsDialog } from '@/components/transfer/transfer-options-dialog';
import { PasswordInputDialog } from '@/components/transfer/password-input-dialog';
import { TransferStatusBadges } from '@/components/transfer/transfer-status-badges';
```

## 1. Basic Password Protection

```typescript
// Sender
const { prepareFileTransfer } = useAdvancedTransfer();

const result = await prepareFileTransfer(file, sessionKey, {
  password: 'MySecurePassword123!',
  passwordHint: 'My favorite color',
  signed: true,
});

// Receiver
const { decryptReceivedFile } = useAdvancedTransfer();

const { blob, verified } = await decryptReceivedFile(
  encryptedFile,
  sessionKey,
  metadata,
  'MySecurePassword123!'
);
```

## 2. One-Time Transfer

```typescript
// Set up one-time transfer
const result = await prepareFileTransfer(file, sessionKey, {
  oneTime: true,
  signed: true,
});

// The file will auto-delete after first download
// No additional code needed - handled automatically
```

## 3. Expiring Transfer

```typescript
// Set expiration to 24 hours
const result = await prepareFileTransfer(file, sessionKey, {
  expiration: '24h', // Options: '1h', '24h', '7d', '30d', 'never'
  signed: true,
});

// Check if still valid before download
if (!isTransferValid(metadata)) {
  console.log('Transfer expired');
}
```

## 4. Digital Signatures

```typescript
// Automatically sign file
const result = await prepareFileTransfer(file, sessionKey, {
  signed: true,
});

// Verify on receive
const { blob, verified, fingerprint } = await decryptReceivedFile(
  encryptedFile,
  sessionKey,
  metadata
);

console.log('Signature verified:', verified);
console.log('Sender fingerprint:', fingerprint);
```

## 5. All Features Combined

```typescript
// Maximum security transfer
const result = await prepareFileTransfer(file, sessionKey, {
  password: 'SecurePassword123!',
  passwordHint: 'My first pet',
  expiration: '24h',
  oneTime: true,
  signed: true,
});

// This creates a transfer that:
// - Requires password to decrypt
// - Expires in 24 hours
// - Auto-deletes after first download
// - Is digitally signed
```

## 6. UI Integration

### Show Transfer Options Dialog

```tsx
const [showOptions, setShowOptions] = useState(false);

<TransferOptionsDialog
  open={showOptions}
  onOpenChange={setShowOptions}
  fileName={file.name}
  onConfirm={(options) => {
    // options contains: passwordProtected, expiration, oneTime, signed
    handleTransferOptions(options);
  }}
/>
```

### Show Password Input for Decryption

```tsx
const [showPasswordInput, setShowPasswordInput] = useState(false);

<PasswordInputDialog
  open={showPasswordInput}
  onOpenChange={setShowPasswordInput}
  fileName={metadata.fileName}
  onSubmit={async (password) => {
    const success = await attemptDecryption(password);
    return success;
  }}
/>
```

### Display Transfer Status

```tsx
<TransferStatusBadges metadata={transferMetadata} />
// Shows badges for: password, signed, one-time, expiration
```

## 7. Checking Transfer Status

```typescript
import { isExpired, isDownloadExhausted, formatTimeRemaining } from '@/lib/transfer/transfer-metadata';

// Check if expired
if (isExpired(metadata)) {
  console.log('Transfer has expired');
}

// Check if download limit reached
if (isDownloadExhausted(metadata)) {
  console.log('Transfer already downloaded');
}

// Get time remaining
const remaining = formatTimeRemaining(metadata.expiresAt);
console.log('Time left:', remaining); // e.g., "2h 15m remaining"
```

## 8. Password Strength Validation

```typescript
import { calculatePasswordStrength } from '@/lib/crypto/argon2-browser';

const strength = calculatePasswordStrength('MyPassword123!');
console.log('Score:', strength.score); // 0-4
console.log('Feedback:', strength.feedback); // Array of suggestions

// Only accept strong passwords
if (strength.score < 3) {
  alert('Please use a stronger password');
}
```

## 9. Manual Signature Operations

```typescript
import { signFile, verifyFileSignature, getPublicKeyFingerprint } from '@/lib/crypto/digital-signatures';

// Sign file manually
const fileData = new Uint8Array(await file.arrayBuffer());
const signature = await signFile(fileData);

// Get fingerprint for out-of-band verification
const fingerprint = getPublicKeyFingerprint(signature.publicKey);
console.log('Share this fingerprint:', fingerprint);

// Verify manually
const isValid = verifyFileSignature(fileData, signature);
```

## 10. Cleanup and Management

```typescript
const { cleanupExpired, removeTransfer, getActiveTransfers } = useAdvancedTransfer();

// Clean up all expired transfers
await cleanupExpired();

// Get list of active transfers
const active = await getActiveTransfers();
console.log('Active transfers:', active.length);

// Remove specific transfer
await removeTransfer(transferId);
```

## Common Patterns

### Pattern 1: Secure Document Sharing

```typescript
// For sensitive documents
await prepareFileTransfer(file, sessionKey, {
  password: userPassword,
  expiration: '24h',
  oneTime: true,
  signed: true,
});
```

### Pattern 2: Public File Sharing

```typescript
// For less sensitive, public files
await prepareFileTransfer(file, sessionKey, {
  expiration: '7d',
  signed: true,
});
```

### Pattern 3: Internal Team Sharing

```typescript
// For team collaboration
await prepareFileTransfer(file, sessionKey, {
  expiration: '30d',
  signed: true,
});
```

### Pattern 4: Temporary Share

```typescript
// For quick, temporary sharing
await prepareFileTransfer(file, sessionKey, {
  expiration: '1h',
  oneTime: true,
  signed: false, // Skip for performance
});
```

## Error Handling

```typescript
try {
  const result = await prepareFileTransfer(file, sessionKey, options);
} catch (error) {
  if (error.message.includes('password')) {
    // Handle password-related errors
  } else if (error.message.includes('expired')) {
    // Handle expiration errors
  } else {
    // Handle other errors
  }
}
```

## Performance Tips

1. **Password Derivation**: Show loading indicator (takes 200-500ms)
2. **Signatures**: Very fast, minimal impact
3. **Expiration**: No runtime cost, checked on access
4. **One-Time**: Negligible overhead

## Security Checklist

- [ ] Use strong passwords (score 3+)
- [ ] Enable signatures for sensitive files
- [ ] Set appropriate expiration times
- [ ] Use one-time for highly sensitive data
- [ ] Verify signatures on receive
- [ ] Share passwords through separate channel
- [ ] Clean up expired transfers regularly

## Testing Examples

```typescript
// Test password strength
const weak = calculatePasswordStrength('123');
expect(weak.score).toBeLessThan(2);

const strong = calculatePasswordStrength('MySecure123!Password');
expect(strong.score).toBeGreaterThanOrEqual(3);

// Test signature verification
const fileData = new Uint8Array([1, 2, 3, 4, 5]);
const sig = await signFile(fileData);
expect(verifyFileSignature(fileData, sig)).toBe(true);

// Test tampering detection
const tampered = new Uint8Array([1, 2, 3, 4, 6]);
expect(verifyFileSignature(tampered, sig)).toBe(false);
```

## Next Steps

1. Read [ADVANCED_ENCRYPTION_FEATURES.md](./ADVANCED_ENCRYPTION_FEATURES.md) for detailed documentation
2. Review [API_EXAMPLES.md](./API_EXAMPLES.md) for integration patterns
3. Check test files for more examples
4. Integrate into your existing transfer flow

## Support

For questions or issues:
- Review the comprehensive documentation
- Check test files for usage examples
- Open an issue on GitHub
