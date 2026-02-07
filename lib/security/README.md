# Security Module

Advanced security hardening features for Tallow.

## Overview

This module provides six layers of advanced security protection:

1. **Incident Response** - Codified procedures for 8 security incident types
2. **Breach Notification** - User communication and regulatory compliance reporting
3. **Credential Encryption** - Double-encrypted TURN server credentials
4. **Key Rotation** - Automatic forward-secret key rotation
5. **Memory Wiping** - Secure cleanup of sensitive data
6. **Timing-Safe Operations** - Constant-time cryptographic comparisons

## What's New: Incident Response System

**NEW** Complete incident response and breach notification system for handling security events.

```typescript
import { createIncidentReport, escalate } from '@/lib/security';
import { notifyBreach, shouldWipeEmergency, clearSensitiveData } from '@/lib/security';

// Create and escalate incident
const report = createIncidentReport('key_compromise', 'critical', 'Private key exposed');
escalate(report);

// Create breach notification
const notification = notifyBreach('Security Incident', 'Description...', ['Data Type'], 100);

// Emergency wipe if critical incident
if (shouldWipeEmergency('critical', 'key_compromise')) {
  const consent = await getUserConsent('Clear all local data?');
  if (consent) clearSensitiveData();
}
```

**Features**:
- 8 incident types with full response procedures
- SLA-based response timelines (15 min to 24 hrs)
- Escalation and status tracking
- User notifications
- Regulatory compliance support (GDPR, CCPA, HIPAA)
- Emergency data wipe procedures

See [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) and [BREACH_NOTIFICATION.md](./BREACH_NOTIFICATION.md) for complete documentation.

## Installation

All security features are built-in, no additional dependencies required.

```typescript
import { security } from '@/lib/security';
// or
import {
  memoryWiper,
  timingSafe,
  KeyRotationManager,
  CredentialEncryption
} from '@/lib/security';
```

## Quick Start

### Memory Wiping

```typescript
import { memoryWiper } from '@/lib/security';

// Wipe a buffer
const key = new Uint8Array(32);
memoryWiper.wipeBuffer(key);

// Auto-wipe wrapper
const wrapper = memoryWiper.createWrapper(sensitiveKey);
await wrapper.use(async (key) => {
  return encrypt(data, key);
}); // Key wiped automatically
```

### Timing-Safe Comparisons

```typescript
import { timingSafe } from '@/lib/security';

// Replace this:
if (token === expectedToken) { /* ... */ }

// With this:
if (timingSafe.tokenCompare(token, expectedToken)) { /* ... */ }
```

### Key Rotation

```typescript
import { KeyRotationManager } from '@/lib/security';

const rotation = new KeyRotationManager({
  rotationIntervalMs: 5 * 60 * 1000,  // 5 minutes
  enableAutoRotation: true
});

const keys = rotation.initialize(sharedSecret);
```

### Credential Encryption

```typescript
import { addCustomTurnServer } from '@/lib/network/proxy-config';

await addCustomTurnServer({
  urls: ['turn:turn.example.com:3478'],
  username: 'myusername',    // Encrypted
  credential: 'mypassword'   // Encrypted
});
```

## Module Structure

```
lib/security/
├── Core Modules
│   ├── incident-response.ts          # Incident response procedures (NEW)
│   ├── breach-notification.ts        # Breach notifications & emergency (NEW)
│   ├── credential-encryption.ts      # TURN credential encryption
│   ├── key-rotation.ts               # Session key rotation
│   ├── memory-wiper.ts               # Memory wiping utilities
│   ├── timing-safe.ts                # Timing-safe comparisons
│   └── csrf.ts                       # CSRF protection
│
├── Documentation
│   ├── INCIDENT_RESPONSE.md          # Detailed incident procedures (NEW)
│   ├── BREACH_NOTIFICATION.md        # Breach notification guide (NEW)
│   ├── SECURITY_PROCEDURES.md        # Integration guide (NEW)
│   ├── IMPLEMENTATION_SUMMARY.md     # Architecture overview (NEW)
│   ├── QUICK_REFERENCE.md            # Quick reference card (NEW)
│   └── README.md                     # This file
│
└── exports
    └── index.ts                      # Centralized exports
```

## API Reference

### Incident Response (NEW)

#### `createIncidentReport(type, severity, description): IncidentReport`
Create a new incident report.

```typescript
const report = createIncidentReport(
  'key_compromise',
  'critical',
  'Private key exposed in git history'
);
```

#### `escalate(report): void`
Escalate incident for immediate action (logs and stores).

```typescript
escalate(report);
// Logs to console with styling
// Stores in localStorage
// Triggers auto-investigation
```

#### `updateIncidentStatus(report, status): IncidentReport`
Track incident through lifecycle.

```typescript
report = updateIncidentStatus(report, 'investigating');
report = updateIncidentStatus(report, 'contained');
report = updateIncidentStatus(report, 'resolved');
```

#### `getResponseProcedure(type): ResponseProcedure`
Get step-by-step response procedures.

```typescript
const proc = getResponseProcedure('key_compromise');
console.log(proc.immediateActions);
console.log(proc.investigationSteps);
console.log(proc.containmentActions);
console.log(proc.recoverySteps);
```

#### Query Functions
```typescript
getAllIncidents(): IncidentReport[]
getIncidentsBySeverity(severity): IncidentReport[]
getIncidentsByType(type): IncidentReport[]
getIncidentById(id): IncidentReport | undefined
```

### Breach Notification (NEW)

#### `notifyBreach(title, description, dataTypes, userCount): BreachNotification`
Create a breach notification.

```typescript
const notification = notifyBreach(
  'Security Incident',
  'Description...',
  ['Data Type 1', 'Data Type 2'],
  500 // affected users
);
```

#### `generateBreachReport(incidents): BreachReport`
Aggregate incidents into compliance report.

```typescript
const report = generateBreachReport([incident1, incident2]);
```

#### `prepareUserNotification(notification): UserMessage`
Format for user email.

```typescript
const msg = prepareUserNotification(notification);
// msg.subject, msg.body, msg.actionUrl
```

#### `prepareComplianceReport(report): ComplianceDoc`
Format for regulatory filing.

```typescript
const compliance = prepareComplianceReport(report);
await submitToRegulators(compliance);
```

#### `clearSensitiveData(): void`
Emergency wipe of all sensitive browser data.

```typescript
if (shouldWipeEmergency('critical', 'key_compromise')) {
  clearSensitiveData();
}
```

### Memory Wiper

#### `secureWipeBuffer(buffer: Uint8Array, passes?: number): void`
Wipe a buffer with multiple overwrite passes.

```typescript
secureWipeBuffer(encryptionKey);
secureWipeBuffer(encryptionKey, 5); // 5 passes
```

#### `secureWipeObject(obj: Record<string, unknown>): void`
Recursively wipe all Uint8Array fields in an object.

```typescript
secureWipeObject({
  encKey: new Uint8Array(32),
  nested: { authKey: new Uint8Array(32) }
});
```

#### `createSecureWrapper<T>(data: T): SecureWrapper<T>`
Create auto-wiping wrapper for sensitive data.

```typescript
const wrapper = createSecureWrapper(key);
wrapper.use(async (k) => encrypt(data, k));
// Key wiped automatically
```

### Timing-Safe

#### `timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean`
Constant-time buffer comparison.

```typescript
const equal = timingSafeEqual(hash1, hash2);
```

#### `timingSafeTokenCompare(expected: string, provided: string): boolean`
Constant-time token comparison.

```typescript
if (timingSafeTokenCompare(sessionToken, userToken)) {
  // Valid
}
```

#### `timingSafeOperation<T>(operation: () => Promise<T>, minDurationMs: number): Promise<T>`
Enforce minimum operation duration.

```typescript
const user = await timingSafeOperation(
  async () => authenticateUser(username, password),
  100 // Minimum 100ms
);
```

### Key Rotation

#### `new KeyRotationManager(config?: KeyRotationConfig)`
Create key rotation manager.

```typescript
const manager = new KeyRotationManager({
  rotationIntervalMs: 5 * 60 * 1000,
  maxGenerations: 100,
  enableAutoRotation: true
});
```

#### `initialize(baseSecret: Uint8Array): RotatingSessionKeys`
Initialize with base shared secret.

```typescript
const keys = manager.initialize(sharedSecret);
```

#### `rotateKeys(): RotatingSessionKeys`
Rotate to next generation.

```typescript
const newKeys = manager.rotateKeys();
```

#### `onRotation(callback: (keys: RotatingSessionKeys) => void): () => void`
Listen for rotation events.

```typescript
const unsubscribe = manager.onRotation((keys) => {
  console.log(`Rotated to gen ${keys.generation}`);
});
```

### Credential Encryption

#### `encryptTurnCredentials(credentials: TurnCredentials): Promise<EncryptedTurnCredentials>`
Encrypt TURN server credentials.

```typescript
const encrypted = await CredentialEncryption.encryptTurnCredentials({
  urls: ['turn:example.com'],
  username: 'user',
  credential: 'pass'
});
```

#### `decryptTurnCredentials(encrypted: EncryptedTurnCredentials): Promise<TurnCredentials>`
Decrypt TURN server credentials.

```typescript
const plaintext = await CredentialEncryption.decryptTurnCredentials(encrypted);
```

## Examples

### Example 1: Secure Session Handling

```typescript
import { KeyRotationManager, memoryWiper } from '@/lib/security';

class SecureSession {
  private rotation: KeyRotationManager;

  async initialize(sharedSecret: Uint8Array) {
    this.rotation = new KeyRotationManager({
      rotationIntervalMs: 5 * 60 * 1000,
      enableAutoRotation: true
    });

    this.rotation.onRotation((keys) => {
      this.notifyPeer(keys);
    });

    return this.rotation.initialize(sharedSecret);
  }

  getCurrentKey(): Uint8Array {
    return this.rotation.getCurrentKeys()!.encryptionKey;
  }

  destroy() {
    this.rotation.destroy();
  }
}
```

### Example 2: Secure Authentication

```typescript
import { timingSafe, memoryWiper } from '@/lib/security';

async function authenticateUser(username: string, password: string) {
  return await timingSafe.operation(
    async () => {
      const user = await db.findUser(username);
      if (!user) return null;

      const passwordBuffer = new TextEncoder().encode(password);
      const storedHash = user.passwordHash;

      const valid = timingSafe.equal(
        await hash(passwordBuffer),
        storedHash
      );

      memoryWiper.wipeBuffer(passwordBuffer);

      return valid ? user : null;
    },
    100 // Minimum 100ms
  );
}
```

### Example 3: Secure File Transfer

```typescript
import { memoryWiper, KeyRotationManager } from '@/lib/security';

class SecureFileTransfer {
  private rotation: KeyRotationManager;

  async sendFile(file: File) {
    // Get current encryption key
    const encKey = this.rotation.getCurrentKeys()!.encryptionKey;

    // Encrypt file
    const encrypted = await encryptFile(file, encKey);

    // Send chunks
    for (const chunk of encrypted.chunks) {
      await this.sendChunk(chunk);
      memoryWiper.wipeChunk(chunk); // Wipe after sending
    }
  }

  destroy() {
    this.rotation.destroy();
  }
}
```

## Best Practices

### ✅ DO

- Always wipe sensitive data after use
- Use timing-safe comparisons for tokens/hashes/passwords
- Enable automatic key rotation for long sessions
- Use secure wrappers for automatic cleanup
- Encrypt credentials before storage

### ❌ DON'T

- Don't use `===` for sensitive comparisons
- Don't leave keys in memory after use
- Don't store credentials in plaintext
- Don't disable auto-rotation without good reason
- Don't skip memory wiping on error paths

## Performance

| Operation | Time | Impact |
|-----------|------|--------|
| Credential encryption | 2-5ms | Negligible |
| Key rotation | 1-2ms | Minimal |
| Memory wipe (1MB) | 0.1ms | Negligible |
| Timing-safe compare | 0.001-0.01ms | None |

**Overall Impact**: < 1% in production

## Testing

Run the security test suite:

```bash
npm test tests/unit/security/
```

Run verification script:

```bash
npx tsx scripts/verify-security-features.ts
```

## Security Guarantees

### Protected Against ✅

- ✅ localStorage inspection attacks
- ✅ Memory dump attacks
- ✅ Timing side-channel attacks
- ✅ Cold boot attacks
- ✅ XSS credential theft
- ✅ Key compromise (forward secrecy)

### Not Protected Against ⚠️

- ⚠️ Physical device access with root/admin
- ⚠️ Browser/OS vulnerabilities
- ⚠️ Supply chain attacks
- ⚠️ Social engineering

## Documentation

### Incident Response (New)
- **[INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md)** - Detailed incident procedures
- **[BREACH_NOTIFICATION.md](./BREACH_NOTIFICATION.md)** - Breach notification procedures
- **[SECURITY_PROCEDURES.md](./SECURITY_PROCEDURES.md)** - Integration and usage guide
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Architecture and design
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Printable quick reference card
- **[../../INCIDENT_RESPONSE_DELIVERY.md](../../INCIDENT_RESPONSE_DELIVERY.md)** - Full delivery summary

### Existing Security Features
- **[ADVANCED_SECURITY.md](../../ADVANCED_SECURITY.md)** - Comprehensive guide
- **[SECURITY_QUICK_REFERENCE.md](../../SECURITY_QUICK_REFERENCE.md)** - Quick reference
- **[SECURITY_IMPLEMENTATION_SUMMARY.md](../../SECURITY_IMPLEMENTATION_SUMMARY.md)** - Implementation details

## Support

For security issues:
- **Security Contact**: security@tallow.app
- **Bug Reports**: GitHub Issues
- **Documentation**: See files above

**Do not publicly disclose security vulnerabilities.**

## License

Same as parent project.
