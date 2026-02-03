# Tallow Build System - Quick Reference Guide

**Version:** 2.0 **Last Updated:** 2026-02-03

---

## Most-Used Scripts

### Development

```bash
npm run dev              # Start dev server (clears SW cache)
npm run dev:simple      # Webpack dev server (stable)
npm run dev:inspect     # Dev server with Node debugger
npm run quality         # Check types + lint
npm run type-check:watch # Watch TypeScript errors
```

### Production

```bash
npm run build           # Build for production
npm run build:analyze   # Build with bundle analysis
npm run start           # Start production server
```

### Testing

```bash
npm run test:unit       # Run unit tests
npm run test            # Run E2E tests on all 9 browsers
npm run test:ui         # E2E tests with interactive UI
npm run test:headed     # E2E tests with visible browser
```

### Code Quality

```bash
npm run lint            # Find linting violations
npm run lint:fix        # Auto-fix linting violations
npm run security:full   # Check security (npm audit + custom)
```

### Performance

```bash
npm run perf:full       # Run all performance tests
npm run perf:lighthouse # Lighthouse audit (opens report)
npm run bench:all       # Run all benchmarks
```

---

## Core Dependencies (Must-Know)

### Crypto & Security

- **@noble/hashes, @noble/curves, @noble/ciphers**: Audited cryptography
- **pqc-kyber**: Post-quantum key exchange
- **dompurify**: HTML/SVG sanitization

### P2P & Networking

- **simple-peer**: WebRTC wrapper
- **socket.io**: WebSocket signaling
- **hash-wasm**: Fast WASM hashing

### Data & Files

- **jszip, fflate**: ZIP compression
- **exifreader, piexifjs**: EXIF metadata handling
- **qrcode, jsqr**: QR code generation/decoding

### Framework

- **next@16.1.2**: Next.js framework
- **react@19.2.3**: React with latest features
- **zustand**: Lightweight state management

---

## TypeScript Strict Flags (All Enabled)

```
strict: true            # Master switch
strictNullChecks        # null/undefined type-safe
noImplicitAny           # Must type variables
strictFunctionTypes     # Function type checking
strictPropertyInitialization # Properties must initialize
noImplicitReturns       # All paths must return
noUnusedLocals          # Error on unused variables
noUnusedParameters      # Error on unused parameters
```

**Result:** Maximum type safety, catches most errors at compile time

---

## ESLint Rules - Quick Summary

### Critical (ERROR)

- React Hooks rules (must obey)
- Security: eval detection, CSRF, pseudoRandom
- Type-aware rules requiring strict typing
- Accessibility: ARIA attributes, keyboard support

### Warnings (Gradual Fix)

- console.log (allow warn/error/info)
- Unused alt-text
- Click-events without keyboard support
- Label associations

### Disabled (With Rationale)

- Type-aware rules (no parserOptions.project)
- Static element interactions (many divs in codebase)
- Require-await (conflicts with async patterns)

---

## Security Headers Cheat Sheet

| Header                 | Purpose               | Value                           |
| ---------------------- | --------------------- | ------------------------------- |
| HSTS                   | Force HTTPS           | 2 years, preload                |
| X-Frame-Options        | Block iframes         | DENY                            |
| CSP                    | Control resources     | Comprehensive directives        |
| Permissions-Policy     | Restrict features     | Camera/mic allowed, rest denied |
| X-Content-Type-Options | Prevent MIME sniffing | nosniff                         |
| Referrer-Policy        | Control referrer data | strict-origin-when-cross-origin |

---

## Next.js Config Key Settings

```typescript
// Development: 5-minute timeout (prevent 408 errors)
proxyTimeout: 300000

// WASM: Async loading, fingerprinted output
asyncWebAssembly: true
webassemblyModuleFilename: 'static/wasm/[modulehash].wasm'

// Production: No source maps, remove console.log, compress
productionBrowserSourceMaps: false
removeConsole: { exclude: ['error', 'warn'] }
compress: true

// Cache: 1-year immutable for static assets
Cache-Control: 'public, max-age=31536000, immutable'
```

---

## Environment Variables - Essential

```bash
# API Security (REQUIRED)
API_SECRET_KEY=<64-char-hex>

# Email Fallback (REQUIRED for production)
RESEND_API_KEY=<your-key>
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-key>
AWS_S3_BUCKET=<bucket-name>

# WebRTC Relay (REQUIRED for production)
NEXT_PUBLIC_TURN_SERVER=turns:relay.metered.ca:443?transport=tcp
NEXT_PUBLIC_TURN_USERNAME=<your-username>
NEXT_PUBLIC_TURN_CREDENTIAL=<your-credential>

# Privacy First
NEXT_PUBLIC_FORCE_RELAY=true      # Hide IP addresses
NEXT_PUBLIC_ALLOW_DIRECT=false    # No direct P2P
```

---

## Prettier Rules - Key Settings

| Rule          | Value  | Why                                          |
| ------------- | ------ | -------------------------------------------- |
| printWidth    | 100    | Fits most screens, readable                  |
| semi          | true   | Prevent automatic semicolon insertion issues |
| singleQuote   | true   | Less escaping                                |
| trailingComma | es5    | Better diffs                                 |
| tabWidth      | 2      | Node.js convention                           |
| endOfLine     | lf     | Cross-platform                               |
| arrowParens   | always | Consistency: (x) => x                        |

---

## Git Hooks - What They Do

### Pre-Commit (on `git commit`)

1. Run lint-staged on staged files only
2. ESLint --fix on .ts/.tsx files
3. Type-check with tsc-files
4. Prettier format .json and .md
5. Abort if errors remain

### Pre-Push (on `git push`)

1. Run full type-check (tsc --noEmit)
2. Abort if type errors exist
3. Prevent pushing broken code

---

## Playwright Test Config - Quick Facts

### 9 Browsers Tested

- Chromium, Firefox, WebKit, Edge (desktop)
- Chrome Mobile (Pixel 5), Safari Mobile (iPhone 13)
- Tablet (iPad Pro), Large (1920x1080), Small (1024x768)

### Timeouts

- Per test: 90 seconds
- Assertions: 15 seconds
- Navigation: 60 seconds
- Actions: 20 seconds
- Server startup: 3 minutes

### Retries

- Local: 1 retry
- CI: 2 retries

### Reporting

- HTML report (visual diff viewer)
- Console list (real-time progress)
- Screenshots/videos on failure only

---

## Vitest Coverage - What's Measured

```
Minimum 80% coverage for:
- lib/crypto/**          # Encryption/decryption
- lib/api/**             # API utilities
- lib/utils/**           # General utilities
- lib/validation/**      # Input validation
- lib/middleware/**      # Auth/logging
- lib/security/**        # Security features
- app/api/**             # Route handlers
```

---

## SVGO Optimization - What It Does

| Plugin          | Purpose                | Settings                                |
| --------------- | ---------------------- | --------------------------------------- |
| preset-default  | Default optimizations  | mergePaths: false (preserve animations) |
| removeScripts   | Remove script tags     | Security (prevent script injection)     |
| convertPathData | Optimize path commands | Float precision: 2 decimal places       |
| sortAttrs       | Sort attributes        | Better gzip compression                 |

**Runs automatically:** `npm run build` or `npm run optimize:svg`

---

## Common Development Workflows

### Feature Development

```bash
npm run dev             # Start dev server
npm run type-check:watch # Watch for type errors in separate terminal
```

### Before Committing

```bash
npm run quality         # Type-check + lint
npm run test:unit       # Run unit tests
# Pre-commit hook runs lint-staged automatically
```

### Before Pushing

```bash
npm run type-check      # Full type check
npm run test            # Run E2E tests (headless)
# Pre-push hook runs automatically
```

### Debugging Tests

```bash
npm run test:ui         # Interactive Playwright UI
npm run test:headed     # See browser during test execution
npm run test -- --debug # Step through with debugger
```

### Performance Regression

```bash
npm run perf:full       # All perf tests
npm run bench:all       # Benchmark suite
npm run bench:baseline  # Set new baseline
```

---

## Bundle Size Targets

| Metric            | Target      | Status                          |
| ----------------- | ----------- | ------------------------------- |
| Production bundle | <200KB gzip | Main + critical routes          |
| WASM modules      | ~500KB      | Lazy loaded                     |
| Lighthouse Score  | >90         | All metrics (LCP, FID, CLS)     |
| Core Web Vitals   | Green       | <2.5s LCP, <100ms FID, <0.1 CLS |

---

## Security Checklist

### Before Commit

- [ ] No secrets in code (use .env.local)
- [ ] No dangerous HTML injection without sanitization
- [ ] No code generation from user input
- [ ] No target="\_blank" without rel="noopener noreferrer"

### Before Push

- [ ] Type-check passes (npm run type-check)
- [ ] No console.log statements (use debug module)
- [ ] No deprecated React patterns

### Before Deploy

- [ ] npm audit --audit-level=moderate passes
- [ ] npm run security:full passes
- [ ] All env variables set in production
- [ ] HTTPS certificate valid (required for HSTS)
- [ ] TURN server configured (required for P2P)
- [ ] S3 bucket configured (required for email fallback)

---

## Useful References

### File Paths

- **Configuration:** /package.json, /next.config.ts, /tsconfig.json
- **Linting:** /eslint.config.mjs, /.prettierrc.json
- **Testing:** /playwright.config.ts, /vitest.config.ts
- **Git Hooks:** /.husky/pre-commit, /.husky/pre-push
- **SVG Optimization:** /svgo.config.js
- **Environment:** /.env.example, /.env.local

### Commands by Purpose

**Quick Checks:**

```bash
npm run type-check      # 15s
npm run lint            # 20s
npm run quality         # 35s
```

**Testing:**

```bash
npm run test:unit       # 2m (9 browsers)
npm run test            # 5m (full suite)
npm run test:ui         # Interactive
```

**Performance:**

```bash
npm run perf:full       # Complete analysis
npm run perf:lighthouse # Audits (opens report)
npm run bench:all       # Benchmarks
```

**Build:**

```bash
npm run build           # 60s (cold)
npm run build:analyze   # 60s + analysis
npm run start           # Serve locally
```

---

## Troubleshooting

### Type Check Errors

```bash
npm run type-check:watch  # Watch mode
npm run lint:fix          # Auto-fix style issues
```

### Linting Violations

```bash
npm run lint:fix          # Auto-fix everything possible
npm run lint              # Review remaining issues
```

### Build Size Issues

```bash
npm run build:analyze     # See bundle composition
npm run perf:test         # Compare to baseline
npm run bench:bundle      # Track over time
```

### Test Failures

```bash
npm run test:headed       # See browser
npm run test:ui           # Debug interactively
npm run test -- --debug   # Step through
```

### Dev Server Issues

```bash
npm run clear:cache:full  # Clear all caches
npm run dev:noclear       # Skip cache clearing
npm run dev:inspect       # Debug Node.js
```

---

## Key Metrics to Track

### Build Performance

- Cold build time: Aim for <60s
- Incremental build: Aim for <10s
- Type-check time: Aim for <15s

### Bundle Size

- Total gzipped: <200KB
- JS per route: <50KB
- CSS per route: <30KB
- Images: WebP/AVIF only

### Test Coverage

- Lines: >80%
- Functions: >80%
- Branches: >80%
- Statements: >80%

### Web Vitals

- LCP (Largest Contentful Paint): <2.5s
- FID (First Input Delay): <100ms (replaced by INP)
- CLS (Cumulative Layout Shift): <0.1
- INP (Interaction to Next Paint): <200ms

---

## When to Run Scripts

| Script                | When                 | Why                     |
| --------------------- | -------------------- | ----------------------- |
| npm run dev           | Always (development) | Fast feedback loop      |
| npm run quality       | Before commit        | Catch errors early      |
| npm run type-check    | Before push          | Prevent broken commits  |
| npm run test          | After changes        | Regression detection    |
| npm run perf:full     | Weekly               | Track performance       |
| npm run security:full | Monthly              | Audit dependencies      |
| npm run build         | Before deploy        | Production verification |

---

## Pro Tips

1. **Use type-check:watch** - Separate terminal for instant feedback
2. **Use dev:inspect** - Debug Node.js code in Chrome DevTools
3. **Use test:ui** - Visual Playwright debugger is powerful
4. **Use build:analyze** - Understand bundle composition
5. **Use perf:lighthouse** - Opens visual report automatically
6. **Commit before rebase** - Pre-commit hook prevents broken commits
7. **Check git hooks** - Pre-push ensures type safety
8. **Monitor bundle size** - Use npm run bench:bundle regularly
9. **Keep deps updated** - npm audit monthly
10. **Document changes** - Security/performance impact notes

---

## Configuration Decision Tree

**Building?**

- Fast feedback → npm run dev
- Production → npm run build (Webpack)
- Analyze bundle → npm run build:analyze

**Testing?**

- Unit tests → npm run test:unit
- Full test → npm run test (all 9 browsers)
- Debug tests → npm run test:ui

**Code Quality?**

- Check everything → npm run quality
- Auto-fix → npm run lint:fix
- Type-only check → npm run type-check

**Performance?**

- Complete analysis → npm run perf:full
- Visual audit → npm run perf:lighthouse
- Track over time → npm run bench:all

**Security?**

- Full audit → npm run security:full
- Npm vulnerabilities → npm run security:audit
- Custom checks → npm run security:check

---

## Summary

**Tallow's build system is optimized for:**

1. **Developer Experience**: Fast dev server, instant feedback, clear errors
2. **Type Safety**: Strict TypeScript with 16+ flags enabled
3. **Code Quality**: ESLint + Prettier enforce standards
4. **Security**: Comprehensive CSP headers + OWASP best practices
5. **Performance**: Aggressive code splitting + caching strategies
6. **Testing**: 9-browser E2E testing + 80% unit test coverage
7. **Reliability**: Pre-commit/pre-push hooks prevent broken code
8. **Scalability**: Modular config supports growth from solo to enterprise

**Remember:** The build system is your ally. Use the scripts, follow the hooks,
and trust the type system.
