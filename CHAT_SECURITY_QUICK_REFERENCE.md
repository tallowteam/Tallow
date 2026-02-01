# Encrypted Chat Security - Quick Reference

## Security Features Overview

### 1. HMAC Message Authentication
**Purpose:** Verify message authenticity and integrity
**Algorithm:** HMAC-SHA256
**Key Derivation:** HKDF from session encryption key

```typescript
// Signing (sender)
const dataToSign = JSON.stringify({ encrypted, nonce, sequence, messageId });
const hmac = await signMessageData(dataToSign);

// Verification (receiver)
const isValid = await verifyMessageSignature(dataToSign, hmac);
if (!isValid) {
  throw new Error('HMAC verification failed');
}
```

### 2. Replay Attack Protection
**Purpose:** Prevent old/duplicate messages
**Method:** Monotonically increasing sequence numbers
**Validation:** Strict ordering enforcement

```typescript
// Sequence tracking
private outgoingSequence = 0;  // Messages we send
private incomingSequence = -1; // Messages we receive

// Verification
if (sequence <= incomingSequence) {
  throw new Error('Replay attack detected');
}
```

### 3. XSS Prevention
**Purpose:** Safely display user-generated content
**Library:** DOMPurify v3.2.3+
**Mode:** Whitelist-based sanitization

```typescript
const sanitized = DOMPurify.sanitize(html, {
  ALLOWED_TAGS: ['strong', 'em', 'code', 'a', 'br', 'p'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):)/i,
});
```

---

## Security Message Flow

### Outgoing Message
```
User Input
  ↓
Assign Sequence Number
  ↓
Serialize to JSON
  ↓
AES-256-GCM Encrypt
  ↓
Generate HMAC Signature
  ↓
Send {encrypted, nonce, sequence, messageId, hmac}
```

### Incoming Message
```
Receive {encrypted, nonce, sequence, messageId, hmac}
  ↓
Verify HMAC Signature ⚠️ (REJECT if invalid)
  ↓
Verify Sequence Number ⚠️ (REJECT if replay)
  ↓
AES-256-GCM Decrypt ⚠️ (REJECT if tampered)
  ↓
Parse JSON
  ↓
Sanitize with DOMPurify
  ↓
Display Message
```

---

## Common Pitfalls

### ❌ DON'T: Bypass HMAC verification
```typescript
// INSECURE - Don't skip verification
const decrypted = await decrypt(encrypted, nonce);
```

### ✅ DO: Always verify before decryption
```typescript
// SECURE - Verify first
if (!await verifyMessageSignature(data, hmac)) {
  throw new Error('Invalid signature');
}
const decrypted = await decrypt(encrypted, nonce);
```

### ❌ DON'T: Accept duplicate sequences
```typescript
// INSECURE - Allows replays
if (sequence >= incomingSequence) {
  accept(message);
}
```

### ✅ DO: Enforce strict ordering
```typescript
// SECURE - Strictly increasing
if (sequence <= incomingSequence) {
  throw new Error('Replay detected');
}
```

### ❌ DON'T: Use dangerouslySetInnerHTML directly
```typescript
// INSECURE - XSS vulnerability
<div dangerouslySetInnerHTML={{ __html: userContent }} />
```

### ✅ DO: Always sanitize first
```typescript
// SECURE - Sanitized
<div dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(userContent, config)
}} />
```

---

## Security Constants

```typescript
// HMAC Configuration
const HMAC_ALGORITHM = 'HMAC-SHA256';
const HMAC_KEY_INFO = 'chat-hmac-key';

// Replay Protection
const MAX_SEQUENCE_GAP = 1000;
const INITIAL_SEQUENCE = -1;

// DOMPurify Configuration
const ALLOWED_TAGS = ['strong', 'em', 'code', 'a', 'br', 'p'];
const ALLOWED_ATTR = ['href', 'target', 'rel', 'class'];
const ALLOWED_URI_REGEXP = /^(?:(?:https?|mailto):)/i;
```

---

## Testing Checklist

### HMAC Authentication
- [ ] Valid HMAC passes verification
- [ ] Invalid HMAC rejected
- [ ] Modified ciphertext rejected
- [ ] Missing HMAC rejected

### Replay Protection
- [ ] Duplicate sequence rejected
- [ ] Old sequence rejected
- [ ] Large gap rejected
- [ ] Monotonic increase accepted

### XSS Prevention
- [ ] Script tags stripped
- [ ] Event handlers removed
- [ ] JavaScript URLs blocked
- [ ] Safe HTML preserved
- [ ] Markdown formatting works

---

## Error Handling

### HMAC Verification Failure
```typescript
if (!isValidSignature) {
  secureLog.error('[Chat] HMAC verification failed');
  // DO NOT process message
  return;
}
```

### Replay Detection
```typescript
if (!verifySequenceNumber(sequence)) {
  secureLog.error('[Chat] Replay attack detected');
  // DO NOT process message
  return;
}
```

### Decryption Failure
```typescript
try {
  const decrypted = await decrypt(encrypted, nonce);
} catch (error) {
  secureLog.error('[Chat] Decryption failed:', error);
  // DO NOT display message
  return;
}
```

---

## Performance Considerations

| Operation | Time | Impact |
|-----------|------|--------|
| HMAC Sign/Verify | ~0.5ms | Negligible |
| Sequence Check | ~0.1ms | Negligible |
| DOMPurify Sanitize | ~1-2ms | Minimal |
| **Total Overhead** | **~3ms** | **Acceptable** |

---

## Security Monitoring

### Metrics to Track
- HMAC verification failures (potential tampering)
- Replay attack attempts (suspicious sequences)
- Large sequence gaps (network issues or attacks)
- Decryption failures (corruption or attacks)

### Log Examples
```typescript
secureLog.error('[Chat] HMAC verification failed - message rejected');
secureLog.error('[Chat] Replay attack detected: sequence 100 already seen');
secureLog.error('[Chat] Suspicious sequence jump: 1500');
secureLog.error('[Chat] Decryption failed - tampered message');
```

---

## Dependency Updates

### DOMPurify
- **Current:** v3.2.3+
- **Update frequency:** Monthly security checks
- **CVE monitoring:** Required
- **Breaking changes:** Review changelog

```bash
npm update dompurify
npm audit
```

---

## Quick Debugging

### Message Not Received?
1. Check HMAC signature validity
2. Check sequence number ordering
3. Check AES-GCM decryption
4. Check network connectivity

### Message Shows HTML Tags?
1. Verify DOMPurify is imported
2. Check sanitization configuration
3. Verify allowed tags list

### Sequence Number Errors?
1. Check for session reset
2. Check for network packet loss
3. Check MAX_SEQUENCE_GAP setting
4. Check sequence counter initialization

---

## Security Best Practices

### DO
✅ Always verify HMAC before decryption
✅ Always check sequence numbers
✅ Always sanitize user content
✅ Always log security events
✅ Always validate all inputs
✅ Always use constant-time comparisons

### DON'T
❌ Never skip security checks
❌ Never trust user input
❌ Never use Math.random() for crypto
❌ Never store HMAC keys in localStorage
❌ Never expose sequence numbers to users
❌ Never disable DOMPurify in production

---

## Code Review Checklist

When reviewing chat-related code:

- [ ] HMAC verification present and correct
- [ ] Sequence number validated
- [ ] No dangerouslySetInnerHTML without DOMPurify
- [ ] Proper error handling (fail-secure)
- [ ] No security checks disabled
- [ ] Cryptographic keys properly managed
- [ ] No sensitive data in logs
- [ ] Constants not hardcoded (use config)

---

## Integration Example

```typescript
import { ChatManager } from '@/lib/chat/chat-manager';
import DOMPurify from 'dompurify';

// Initialize with security features
const chatManager = new ChatManager(sessionId, userId, userName);
await chatManager.initialize(dataChannel, sessionKeys, peerId, peerName);

// Send secure message (HMAC + sequence added automatically)
const message = await chatManager.sendMessage('Hello, secure world!');

// Receive secure message (HMAC + sequence verified automatically)
chatManager.addEventListener('message', (event) => {
  if (event.type === 'message') {
    // Message already verified and decrypted
    const sanitized = DOMPurify.sanitize(event.message.content, {
      ALLOWED_TAGS: ['strong', 'em', 'code', 'a'],
    });
    displayMessage(sanitized);
  }
});

// Cleanup
chatManager.destroy(); // Clears HMAC key and sequence state
```

---

## Security Contacts

**Security Issues:** Report privately via security contact
**Questions:** Technical team or security team
**Updates:** Monitor CVE databases for dependencies

---

**Last Updated:** 2026-01-27
**Security Version:** 2.0 (HMAC + Replay Protection + XSS Prevention)
