# WebAuthn/FIDO2 Biometric Authentication

Complete implementation of WebAuthn/FIDO2 biometric authentication for optional device verification in Tallow.

## Overview

This module provides passwordless authentication using biometrics (Touch ID, Face ID, Windows Hello, fingerprint sensors) or hardware security keys. The implementation is privacy-first, standards-based, and production-ready.

## Features

- ✅ **Platform Authenticators**: Touch ID, Face ID, Windows Hello, fingerprint sensors
- ✅ **Cross-Platform Authenticators**: USB security keys (YubiKey, etc.)
- ✅ **Privacy-First**: Biometric data never leaves the device
- ✅ **Phishing-Resistant**: Cryptographic authentication prevents credential theft
- ✅ **Multi-Device Support**: Register multiple devices per user
- ✅ **Graceful Fallback**: Detects availability and shows appropriate UI
- ✅ **TypeScript**: Fully typed with comprehensive interfaces
- ✅ **Encrypted Storage**: Credentials stored securely in localStorage
- ✅ **User-Friendly Errors**: Clear error messages for all failure scenarios

## Architecture

### Core Modules

```
lib/auth/
├── webauthn.ts           # Core WebAuthn functionality
├── webauthn-store.ts     # Credential storage with Zustand
└── WEBAUTHN_README.md    # This file

components/transfer/
├── BiometricAuth.tsx               # Main UI component
├── BiometricAuth.module.css        # Styles
├── BiometricAuthExample.tsx        # Demo/examples
└── BiometricAuthExample.module.css # Example styles
```

## Quick Start

### 1. Registration (First Time Setup)

```tsx
import { BiometricAuth } from '@/components/transfer/BiometricAuth';

function SetupPage() {
  return (
    <BiometricAuth
      username="alice"
      displayName="Alice Johnson"
      mode="register"
      onRegisterSuccess={(credentialId) => {
        console.log('Registered:', credentialId);
      }}
      onRegisterError={(error) => {
        console.error('Registration failed:', error);
      }}
    />
  );
}
```

### 2. Authentication (Subsequent Access)

```tsx
import { BiometricAuth } from '@/components/transfer/BiometricAuth';

function TransferPage() {
  return (
    <BiometricAuth
      mode="authenticate"
      onAuthSuccess={(result) => {
        console.log('Authenticated:', result);
        // Proceed with sensitive operation
      }}
      onAuthError={(error) => {
        console.error('Authentication failed:', error);
      }}
    />
  );
}
```

### 3. Programmatic Usage (Without UI)

```tsx
import { webauthn } from '@/lib/auth/webauthn';
import { useWebAuthnStore } from '@/lib/auth/webauthn-store';

async function authenticateDevice() {
  // Check availability
  if (!webauthn.isAvailable()) {
    console.log('WebAuthn not available');
    return;
  }

  // Register a new credential
  try {
    const credential = await webauthn.register('alice', 'Alice Johnson');
    console.log('Registered:', credential);

    // Store it
    const { addCredential } = useWebAuthnStore.getState();
    const storedCred = webauthnStore.createStoredCredential(credential);
    addCredential(storedCred);
  } catch (error) {
    console.error('Registration failed:', error);
  }

  // Authenticate with stored credential
  try {
    const result = await webauthn.authenticate();
    if (result.success) {
      console.log('Authenticated!');
    }
  } catch (error) {
    console.error('Authentication failed:', error);
  }
}
```

## API Reference

### Core Functions (`lib/auth/webauthn.ts`)

#### `isWebAuthnAvailable(): boolean`

Check if WebAuthn is supported in the current browser.

```tsx
if (isWebAuthnAvailable()) {
  // Show biometric authentication option
}
```

#### `isPlatformAuthenticatorAvailable(): Promise<boolean>`

Check if platform authenticator (biometrics) is available.

```tsx
const hasBiometrics = await isPlatformAuthenticatorAvailable();
if (hasBiometrics) {
  console.log('Device supports Touch ID/Face ID/Windows Hello');
}
```

#### `registerCredential(username, displayName, userId?, config?): Promise<PublicKeyCredential>`

Register a new credential with the platform authenticator.

**Parameters:**
- `username` (string): User-friendly username
- `displayName` (string): Full display name
- `userId` (Uint8Array, optional): Custom user ID
- `config` (WebAuthnConfig, optional): Custom configuration

**Returns:** Promise resolving to PublicKeyCredential

```tsx
const credential = await registerCredential(
  'alice',
  'Alice Johnson'
);
```

#### `authenticateCredential(credentialId?, config?): Promise<AuthenticationResult>`

Authenticate using a registered credential.

**Parameters:**
- `credentialId` (string, optional): Specific credential to use
- `config` (WebAuthnConfig, optional): Custom configuration

**Returns:** Promise resolving to AuthenticationResult

```tsx
const result = await authenticateCredential();
if (result.success) {
  console.log('Credential ID:', result.credentialId);
  console.log('Signature:', result.signature);
}
```

#### `encodeCredentialForStorage(credential): SerializedCredential`

Encode a credential for storage in localStorage.

```tsx
const serialized = encodeCredentialForStorage(credential);
localStorage.setItem('credential', JSON.stringify(serialized));
```

#### `decodeStoredCredential(data): PublicKeyCredentialDescriptor`

Decode a stored credential for authentication.

```tsx
const stored = JSON.parse(localStorage.getItem('credential'));
const descriptor = decodeStoredCredential(stored);
```

#### `getBiometricMethodName(): Promise<string>`

Get platform-specific biometric method name.

```tsx
const name = await getBiometricMethodName();
// Returns: "Touch ID", "Face ID", "Windows Hello", "Fingerprint", etc.
```

### Store (`lib/auth/webauthn-store.ts`)

Zustand store for managing credentials with persistence.

#### State

```tsx
interface WebAuthnStoreState {
  credentials: StoredCredential[];
  selectedCredentialId: string | null;
  autoAuthenticate: boolean;
  preferPlatformAuthenticator: boolean;
}
```

#### Actions

```tsx
const {
  // Credential management
  addCredential,
  removeCredential,
  updateCredential,
  clearCredentials,

  // Selection
  selectCredential,

  // Preferences
  setAutoAuthenticate,
  setPreferPlatformAuthenticator,

  // Selectors
  getCredentialById,
  getCredentialsByType,
  getPrimaryCredential,
  getRecentCredential,

  // Usage tracking
  markCredentialUsed,
} = useWebAuthnStore();
```

### UI Component (`components/transfer/BiometricAuth.tsx`)

#### Props

```tsx
interface BiometricAuthProps {
  username?: string;                    // Default: 'User'
  displayName?: string;                 // Default: 'Tallow User'
  onAuthSuccess?: (result: AuthenticationResult) => void;
  onAuthError?: (error: string) => void;
  onRegisterSuccess?: (credentialId: string) => void;
  onRegisterError?: (error: string) => void;
  mode?: 'authenticate' | 'register';   // Default: 'authenticate'
  buttonText?: string;                  // Custom button text
  size?: 'sm' | 'md' | 'lg';           // Default: 'md'
  showDeviceList?: boolean;             // Default: true
}
```

## Use Cases

### 1. File Transfer Verification

Require biometric authentication before sending sensitive files:

```tsx
function TransferConfirmation({ file, recipient }) {
  const [verified, setVerified] = useState(false);

  return (
    <div>
      <h2>Confirm Transfer</h2>
      <p>Send {file.name} to {recipient}?</p>

      <BiometricAuth
        mode="authenticate"
        onAuthSuccess={() => setVerified(true)}
        buttonText="Verify & Send"
      />

      {verified && (
        <button onClick={() => sendFile(file, recipient)}>
          Complete Transfer
        </button>
      )}
    </div>
  );
}
```

### 2. Encryption Key Access

Protect encryption keys with biometric authentication:

```tsx
async function unlockEncryptionKey() {
  const result = await webauthn.authenticate();

  if (result.success) {
    // Derive encryption key from authentication result
    const key = await deriveKeyFromSignature(result.signature);
    return key;
  }

  throw new Error('Authentication failed');
}
```

### 3. Device Pairing

Verify device identity during pairing:

```tsx
function DevicePairing({ deviceId }) {
  return (
    <BiometricAuth
      mode="register"
      username={deviceId}
      displayName={`Device ${deviceId}`}
      onRegisterSuccess={() => {
        pairDevice(deviceId);
      }}
    />
  );
}
```

### 4. Settings Protection

Require authentication for sensitive settings:

```tsx
function PrivacySettings() {
  const [unlocked, setUnlocked] = useState(false);

  if (!unlocked) {
    return (
      <div>
        <h2>Privacy Settings</h2>
        <p>Verify your identity to access privacy settings</p>
        <BiometricAuth
          mode="authenticate"
          onAuthSuccess={() => setUnlocked(true)}
          size="lg"
        />
      </div>
    );
  }

  return <PrivacySettingsForm />;
}
```

## Security Considerations

### What Gets Stored

**Stored Securely:**
- Public key (safe to store)
- Credential ID (public identifier)
- Metadata (device name, timestamps)

**Never Stored:**
- Private key (stays in secure hardware)
- Biometric data (never leaves device)
- Authentication signatures (ephemeral)

### Security Features

1. **Hardware-Backed**: Private keys stored in secure enclave/TPM
2. **Phishing-Resistant**: Origin-bound credentials prevent phishing
3. **Attestation Optional**: Privacy-focused (no attestation by default)
4. **User Verification**: Requires biometric or PIN for authentication
5. **Challenge-Response**: Cryptographic proof without exposing secrets

### Threat Model

**Protects Against:**
- ✅ Password phishing
- ✅ Credential stuffing
- ✅ Man-in-the-middle attacks
- ✅ Database breaches
- ✅ Keyloggers

**Does Not Protect Against:**
- ❌ Device theft (without device lock)
- ❌ Malware on the device
- ❌ Physical coercion

## Browser Support

| Browser | Version | Platform Authenticator | Security Keys |
|---------|---------|------------------------|---------------|
| Chrome  | 67+     | ✅                     | ✅            |
| Firefox | 60+     | ✅                     | ✅            |
| Safari  | 14+     | ✅                     | ✅            |
| Edge    | 18+     | ✅                     | ✅            |

### Platform Support

| Platform | Biometric Method |
|----------|-----------------|
| macOS    | Touch ID        |
| iOS      | Face ID / Touch ID |
| Windows  | Windows Hello   |
| Android  | Fingerprint / Face Unlock |
| Linux    | Varies by hardware |

## Configuration

### Custom RP Configuration

```tsx
const credential = await registerCredential(
  'alice',
  'Alice Johnson',
  undefined,
  {
    rpName: 'My App',
    rpId: 'example.com',
    timeout: 120000, // 2 minutes
    userVerification: 'required',
    attestation: 'direct',
  }
);
```

### Store Customization

```tsx
// Clear all credentials (logout)
const { clearCredentials } = useWebAuthnStore();
clearCredentials();

// Get platform-specific credentials
const { getCredentialsByType } = useWebAuthnStore();
const biometrics = getCredentialsByType('platform');
const securityKeys = getCredentialsByType('cross-platform');

// Enable auto-authentication
const { setAutoAuthenticate } = useWebAuthnStore();
setAutoAuthenticate(true);
```

## Testing

### Manual Testing

1. **Registration Flow:**
   - Navigate to registration page
   - Click "Register" button
   - Complete biometric authentication
   - Verify credential is stored

2. **Authentication Flow:**
   - Navigate to authentication page
   - Click "Verify Identity" button
   - Complete biometric authentication
   - Verify callback is triggered

3. **Device Management:**
   - Register multiple credentials
   - View device list
   - Remove a device
   - Verify it can no longer authenticate

### Automated Testing

```tsx
// Mock WebAuthn API for testing
import { mockWebAuthn } from '@/tests/mocks/webauthn';

describe('BiometricAuth', () => {
  beforeEach(() => {
    mockWebAuthn();
  });

  it('should register credential', async () => {
    const { result } = renderHook(() => useWebAuthnStore());

    const credential = await webauthn.register('test', 'Test User');
    expect(credential).toBeDefined();

    act(() => {
      result.current.addCredential(
        webauthnStore.createStoredCredential(credential)
      );
    });

    expect(result.current.credentials).toHaveLength(1);
  });
});
```

## Troubleshooting

### "WebAuthn not available"

**Cause:** Browser doesn't support WebAuthn or not using HTTPS

**Solution:**
- Use a modern browser (Chrome 67+, Firefox 60+, Safari 14+, Edge 18+)
- Ensure site is served over HTTPS (localhost is exempt)
- Check browser settings for disabled features

### "No registered authenticator found"

**Cause:** User hasn't registered any credentials

**Solution:**
- Show registration flow first
- Provide clear call-to-action to set up biometrics
- Offer alternative authentication methods

### "Registration was cancelled"

**Cause:** User cancelled the browser prompt or timeout occurred

**Solution:**
- Increase timeout in configuration
- Provide clear instructions to users
- Add retry functionality

### "Security error"

**Cause:** Site not served over HTTPS or RP ID mismatch

**Solution:**
- Ensure HTTPS is used (except localhost)
- Verify RP ID matches domain
- Check for mixed content warnings

## Standards & References

- [W3C WebAuthn Specification](https://www.w3.org/TR/webauthn-2/)
- [FIDO2 CTAP Specification](https://fidoalliance.org/specs/fido-v2.0-ps-20190130/fido-client-to-authenticator-protocol-v2.0-ps-20190130.html)
- [WebAuthn Guide (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)
- [FIDO Alliance](https://fidoalliance.org/)

## License

Part of the Tallow project. See main LICENSE file.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review browser console for specific errors
3. Open an issue on GitHub with browser/platform details
