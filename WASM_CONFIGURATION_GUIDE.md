# WebAssembly Configuration Guide for Next.js

## Quick Reference

### Current Configuration

The Tallow application uses WebAssembly for post-quantum cryptography (pqc-kyber). The webpack configuration in `next.config.ts` has been optimized to handle WASM modules properly.

### Key Configuration Points

```typescript
// next.config.ts
webpack: (config, { isServer, dev }) => {
  // 1. Enable WASM experiments
  config.experiments = {
    asyncWebAssembly: true,  // Enable async WASM loading
    topLevelAwait: true,     // Allow top-level await
    layers: true,            // Enable layer optimization
  };

  // 2. Configure browser target (client-side only)
  if (!isServer) {
    config.target = 'web';
    config.output.environment = {
      asyncFunction: true,   // Support async/await
      module: true,          // Support ES modules
      dynamicImport: true,   // Support dynamic imports
      // ... other ES6+ features
    };
  }

  // 3. Set WASM output paths
  config.output.webassemblyModuleFilename = isServer
    ? './../static/wasm/[modulehash].wasm'
    : 'static/wasm/[modulehash].wasm';

  // 4. Configure WASM module rules
  config.module.rules.push({
    test: /\.wasm$/,
    type: 'webassembly/async',
  });
}
```

## WASM Module Usage

### Importing WASM Modules

The pqc-kyber library imports WASM using ES modules:

```javascript
// node_modules/pqc-kyber/pqc_kyber.js
import * as wasm from "./pqc_kyber_bg.wasm";
import { __wbg_set_wasm } from "./pqc_kyber_bg.js";
__wbg_set_wasm(wasm);
```

### Using in Your Code

```typescript
// lib/crypto/pqc-crypto.ts
import * as kyber from 'pqc-kyber';

export class PQCryptoService {
  async generateHybridKeypair(): Promise<HybridKeyPair> {
    // WASM loads asynchronously
    const kyberKeys = kyber.keypair();
    // ...
  }
}
```

## Lazy Loading Pattern

For better performance, WASM can be loaded on-demand:

```typescript
// lib/crypto/pqc-crypto-lazy.ts
let pqcKyber: typeof import('pqc-kyber') | null = null;

async function loadPQC() {
  if (!pqcKyber) {
    pqcKyber = await import('pqc-kyber');
  }
  return pqcKyber;
}

export async function generateKeypair() {
  const kyber = await loadPQC();
  return kyber.keypair();
}
```

## Build Output

WASM files are output to:
- **Client**: `.next/static/wasm/[hash].wasm`
- **Server**: `.next/static/wasm/[hash].wasm`

These files are:
- Automatically code-split
- Lazy-loaded when needed
- Cached by hash for optimal performance

## Troubleshooting

### Warning: "async/await not supported"

**Fix**: Ensure `config.output.environment.asyncFunction = true` and `topLevelAwait = true`

### Error: "Cannot find module .wasm"

**Fix**: Ensure webpack rule for `.wasm` files is present:
```typescript
config.module.rules.push({
  test: /\.wasm$/,
  type: 'webassembly/async',
});
```

### Error: "Top-level await is not available"

**Fix**: Enable in experiments:
```typescript
config.experiments = {
  topLevelAwait: true,
};
```

### WASM file not found in production

**Fix**: Ensure webassemblyModuleFilename paths are correct:
- Client builds use `static/wasm/[modulehash].wasm`
- Server builds use `./../static/wasm/[modulehash].wasm`

## Performance Optimization

### 1. Code Splitting

WASM modules are automatically split into separate chunks:

```typescript
config.optimization.splitChunks = {
  cacheGroups: {
    pqcCrypto: {
      test: /[\\/]node_modules[\\/](pqc-kyber|@noble)[\\/]/,
      priority: 30,
      reuseExistingChunk: true,
      enforce: true,
    },
  },
};
```

### 2. Lazy Loading

Load WASM only when cryptographic features are used:

```typescript
// Instead of importing at top level
import * as kyber from 'pqc-kyber';

// Use dynamic import
const kyber = await import('pqc-kyber');
```

### 3. Caching

WASM files are cached with content hash in filename:
- Changes to WASM invalidate cache
- Unchanged WASM uses cached version
- Browser caches WASM files indefinitely

## Browser Compatibility

WASM with async/await requires:

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| WebAssembly | 57+ | 52+ | 11+ | 79+ |
| Async/Await | 55+ | 52+ | 10.1+ | 79+ |
| ES Modules | 61+ | 60+ | 11+ | 79+ |
| Top-level Await | 89+ | 89+ | 15+ | 89+ |

**Recommended**: Target modern browsers (2020+) for full support.

## Security Considerations

### 1. WASM Integrity

WASM files are:
- Included in build output
- Hashed for integrity
- Served from same origin
- Protected by CSP headers

### 2. CSP Configuration

Ensure Content Security Policy allows WASM:

```typescript
// next.config.ts headers
{
  key: 'Content-Security-Policy',
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval'", // Required for WASM
    // ...
  ].join('; ')
}
```

Note: `unsafe-eval` is required for WASM but safe in this context.

### 3. CORS Headers

WASM requires proper CORS headers:

```typescript
{
  key: 'Cross-Origin-Embedder-Policy',
  value: 'require-corp'
},
{
  key: 'Cross-Origin-Opener-Policy',
  value: 'same-origin'
}
```

## Testing

### Unit Tests

```typescript
// tests/unit/crypto/pqc-crypto.test.ts
import { pqCrypto } from '@/lib/crypto/pqc-crypto';

describe('PQC Crypto', () => {
  it('should generate keypair', async () => {
    const keypair = await pqCrypto.generateHybridKeypair();
    expect(keypair.kyber.publicKey).toHaveLength(1184);
  });
});
```

### E2E Tests

```typescript
// tests/e2e/pqc-transfer.spec.ts
test('should encrypt file with PQC', async ({ page }) => {
  await page.goto('/app');
  // Wait for WASM to load
  await page.waitForFunction(() => window.crypto !== undefined);
  // Test PQC features
});
```

## Deployment

### Vercel

WASM works out-of-the-box on Vercel:
- WASM files are deployed with static assets
- Proper MIME types are set automatically
- CDN caching is configured

### Docker

Ensure WASM files are included in build:

```dockerfile
# Dockerfile
COPY --from=builder /app/.next/static ./public/_next/static
# WASM files are in static/wasm/
```

### AWS/Cloudflare

Configure MIME type for `.wasm` files:
```
Content-Type: application/wasm
```

## Monitoring

### Performance Metrics

Track WASM loading performance:

```typescript
performance.mark('wasm-load-start');
await import('pqc-kyber');
performance.mark('wasm-load-end');
performance.measure('wasm-load', 'wasm-load-start', 'wasm-load-end');
```

### Error Tracking

Monitor WASM errors:

```typescript
try {
  await import('pqc-kyber');
} catch (error) {
  console.error('WASM load failed:', error);
  // Report to monitoring service
}
```

## References

- [Webpack WebAssembly](https://webpack.js.org/configuration/module/#ruletypewebassembly)
- [Next.js Webpack Config](https://nextjs.org/docs/app/api-reference/next-config-js/webpack)
- [WebAssembly on MDN](https://developer.mozilla.org/en-US/docs/WebAssembly)
- [pqc-kyber Documentation](https://github.com/Argyle-Software/kyber)

## Related Files

- `C:\Users\aamir\Documents\Apps\Tallow\next.config.ts` - Webpack configuration
- `C:\Users\aamir\Documents\Apps\Tallow\lib\crypto\pqc-crypto.ts` - WASM usage
- `C:\Users\aamir\Documents\Apps\Tallow\lib\crypto\pqc-crypto-lazy.ts` - Lazy loading
- `C:\Users\aamir\Documents\Apps\Tallow\WASM_ASYNC_AWAIT_FIX.md` - Fix documentation
