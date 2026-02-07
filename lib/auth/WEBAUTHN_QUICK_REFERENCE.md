# WebAuthn Quick Reference

Fast reference for common WebAuthn operations in Tallow.

## Installation

No installation needed - already included in Tallow!

## Basic Usage

### Check Availability

```tsx
import { webauthn } from '@/lib/auth/webauthn';

if (webauthn.isAvailable()) {
  console.log('WebAuthn supported!');
}
```

### Register Credential

```tsx
import { BiometricAuth } from '@/components/transfer/BiometricAuth';

<BiometricAuth
  mode="register"
  username="alice"
  displayName="Alice Johnson"
  onRegisterSuccess={(id) => console.log('Registered:', id)}
/>
```

### Authenticate

```tsx
<BiometricAuth
  mode="authenticate"
  onAuthSuccess={(result) => console.log('Verified!', result)}
/>
```

## Component Props

```tsx
<BiometricAuth
  // User identification
  username="alice"              // Default: 'User'
  displayName="Alice Johnson"   // Default: 'Tallow User'

  // Mode
  mode="authenticate"           // or 'register'

  // Callbacks
  onAuthSuccess={handleSuccess}
  onAuthError={handleError}
  onRegisterSuccess={handleRegSuccess}
  onRegisterError={handleRegError}

  // Appearance
  size="md"                     // 'sm' | 'md' | 'lg'
  buttonText="Verify Identity"
  showDeviceList={true}
/>
```

## Programmatic API

### Registration

```tsx
import { webauthn } from '@/lib/auth/webauthn';
import { useWebAuthnStore, webauthnStore } from '@/lib/auth/webauthn-store';

const credential = await webauthn.register('alice', 'Alice Johnson');
const stored = webauthnStore.createStoredCredential(credential);

const { addCredential } = useWebAuthnStore.getState();
addCredential(stored);
```

### Authentication

```tsx
const result = await webauthn.authenticate();

if (result.success) {
  console.log('Authenticated!');
  console.log('Credential ID:', result.credentialId);
  console.log('Signature:', result.signature);
} else {
  console.error('Failed:', result.error);
}
```

### Check Platform Support

```tsx
const hasBiometrics = await webauthn.isPlatformAvailable();
const supported = await webauthn.getSupportedAuthenticators();

console.log('Platform (Touch ID/Face ID):', supported.platform);
console.log('Security Keys:', supported.crossPlatform);
```

### Get Biometric Name

```tsx
const name = await webauthn.getBiometricMethodName();
// Returns: "Touch ID", "Face ID", "Windows Hello", etc.
```

## Store Operations

### Get Credentials

```tsx
import { useWebAuthnStore } from '@/lib/auth/webauthn-store';

const store = useWebAuthnStore();

// All credentials
const allCreds = store.credentials;

// Primary (most recent)
const primary = store.getPrimaryCredential();

// By type
const biometrics = store.getCredentialsByType('platform');
const securityKeys = store.getCredentialsByType('cross-platform');

// By ID
const specific = store.getCredentialById('cred-123');
```

### Manage Credentials

```tsx
const { addCredential, removeCredential, clearCredentials } = useWebAuthnStore();

// Add
addCredential(newCredential);

// Remove
removeCredential('cred-id-123');

// Clear all
clearCredentials();

// Mark as used (updates lastUsedAt)
store.markCredentialUsed('cred-id-123');
```

## Common Patterns

### Verify Before Action

```tsx
function ConfirmTransfer({ onConfirm }) {
  const [verified, setVerified] = useState(false);

  return (
    <>
      <BiometricAuth
        mode="authenticate"
        onAuthSuccess={() => setVerified(true)}
        size="lg"
      />
      {verified && (
        <button onClick={onConfirm}>Proceed</button>
      )}
    </>
  );
}
```

### Conditional Registration

```tsx
function SetupBiometrics() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    webauthn.isPlatformAvailable().then(setAvailable);
  }, []);

  if (!available) {
    return <p>Biometrics not available</p>;
  }

  return <BiometricAuth mode="register" />;
}
```

### Multiple Devices

```tsx
function DeviceManager() {
  const { credentials, removeCredential } = useWebAuthnStore();

  return (
    <div>
      <h3>Your Devices</h3>
      {credentials.map(cred => (
        <div key={cred.id}>
          {cred.deviceName}
          <button onClick={() => removeCredential(cred.credentialId)}>
            Remove
          </button>
        </div>
      ))}
      <BiometricAuth mode="register" buttonText="Add Device" />
    </div>
  );
}
```

### Auto-Authentication

```tsx
function AutoAuth() {
  const { autoAuthenticate, credentials } = useWebAuthnStore();

  useEffect(() => {
    if (autoAuthenticate && credentials.length > 0) {
      webauthn.authenticate().then(result => {
        if (result.success) {
          console.log('Auto-authenticated');
        }
      });
    }
  }, [autoAuthenticate, credentials]);

  return <BiometricAuth mode="authenticate" />;
}
```

## Error Handling

```tsx
try {
  const credential = await webauthn.register('alice', 'Alice');
} catch (error) {
  if (error.message.includes('NotAllowedError')) {
    console.log('User cancelled');
  } else if (error.message.includes('NotSupportedError')) {
    console.log('Device not supported');
  } else if (error.message.includes('SecurityError')) {
    console.log('Use HTTPS');
  } else {
    console.error('Unknown error:', error);
  }
}
```

## Styling

### Design Tokens Used

- `--primary-500` (#5E5CE6)
- `--text-primary`
- `--bg-base`
- `--bg-surface`
- `--border-default`
- `--space-*` (spacing scale)
- `--radius-*` (border radius)
- `--font-size-*` (typography)

### Custom Styles

```tsx
<div className="custom-wrapper">
  <BiometricAuth size="lg" />
</div>

<style jsx>{`
  .custom-wrapper {
    max-width: 400px;
    margin: 0 auto;
  }
`}</style>
```

## Size Variants

```tsx
// Small - inline usage
<BiometricAuth size="sm" />

// Medium - default
<BiometricAuth size="md" />

// Large - primary actions
<BiometricAuth size="lg" />
```

## Configuration

### Custom Timeout

```tsx
const credential = await registerCredential(
  'alice',
  'Alice',
  undefined,
  { timeout: 120000 } // 2 minutes
);
```

### Custom RP ID

```tsx
const credential = await registerCredential(
  'alice',
  'Alice',
  undefined,
  { rpId: 'example.com', rpName: 'My App' }
);
```

### Require User Verification

```tsx
const credential = await registerCredential(
  'alice',
  'Alice',
  undefined,
  { userVerification: 'required' }
);
```

## Testing

### Mock for Tests

```tsx
// tests/mocks/webauthn.ts
export function mockWebAuthn() {
  global.PublicKeyCredential = class {};
  global.navigator.credentials = {
    create: jest.fn(),
    get: jest.fn(),
  };
}
```

### Test Example

```tsx
import { mockWebAuthn } from '@/tests/mocks/webauthn';

beforeEach(() => {
  mockWebAuthn();
});

test('registers credential', async () => {
  const cred = await webauthn.register('test', 'Test User');
  expect(cred).toBeDefined();
});
```

## Debugging

### Enable Verbose Logging

```tsx
import { addBreadcrumb } from '@/lib/monitoring/sentry';

// Check browser console for breadcrumbs
// They show all WebAuthn operations
```

### Check State

```tsx
const state = useWebAuthnStore.getState();
console.log('Credentials:', state.credentials);
console.log('Selected:', state.selectedCredentialId);
console.log('Auto-auth:', state.autoAuthenticate);
```

### Verify Storage

```tsx
// Check localStorage
const stored = localStorage.getItem('tallow-webauthn-store');
console.log(JSON.parse(stored));
```

## Browser Console Snippets

### Quick Test

```js
// Check availability
console.log('WebAuthn:', !!window.PublicKeyCredential);

// Check platform authenticator
PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  .then(available => console.log('Platform auth:', available));
```

### List Credentials

```js
const store = JSON.parse(localStorage.getItem('tallow-webauthn-store'));
console.table(store.state.credentials);
```

## TypeScript Types

```tsx
import type {
  SerializedCredential,
  StoredCredential,
  WebAuthnConfig,
  AuthenticationResult,
} from '@/lib/auth/webauthn';

import type {
  WebAuthnStoreState,
} from '@/lib/auth/webauthn-store';

import type {
  BiometricAuthProps,
} from '@/components/transfer/BiometricAuth';
```

## Security Checklist

- ✅ Use HTTPS in production (localhost OK for dev)
- ✅ Set correct `rpId` matching your domain
- ✅ Handle errors gracefully
- ✅ Provide fallback authentication methods
- ✅ Clear credentials on logout
- ✅ Verify signatures on server (if using server-side)
- ✅ Use `userVerification: 'preferred'` or `'required'`
- ✅ Don't request attestation unless necessary

## Performance Tips

- ✅ Check availability once on mount
- ✅ Use lazy loading for registration flow
- ✅ Cache biometric method name
- ✅ Debounce rapid authentication attempts
- ✅ Preload component before showing
- ✅ Use `React.memo()` for device list

## Accessibility

- ✅ Keyboard navigation support
- ✅ Focus management
- ✅ ARIA labels
- ✅ Screen reader announcements
- ✅ Error messages in `role="alert"`
- ✅ Reduced motion support

## Resources

- [Full Documentation](./WEBAUTHN_README.md)
- [W3C Spec](https://www.w3.org/TR/webauthn-2/)
- [MDN Guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)
- [FIDO Alliance](https://fidoalliance.org/)
