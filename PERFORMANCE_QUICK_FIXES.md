# Performance Quick Fixes - Immediate Actions

**Priority:** CRITICAL - Must fix before production deployment
**Time Required:** 5-8 hours total
**Expected Improvement:** 60% bundle size reduction, 2-3s faster load time

---

## 🔴 BLOCKING: Fix TypeScript Errors (4-6 hours)

**Issue:** 82 TypeScript errors preventing production build

### Quick Fix Commands

```bash
# 1. Check errors
npm run type-check > typescript-errors.log

# 2. Fix most common patterns
# Pattern 1: Missing return in useEffect
# WRONG:
useEffect(() => {
  if (condition) {
    return cleanup;
  }
}, []);

# RIGHT:
useEffect(() => {
  if (condition) {
    return cleanup;
  }
  return undefined;
}, []);

# Pattern 2: Index signature access
# WRONG:
data.propertyName

# RIGHT:
data['propertyName']

# Pattern 3: Null safety
# WRONG:
const value = maybeNull.property;

# RIGHT:
const value = maybeNull?.property ?? defaultValue;
```

### Top Files to Fix (in order)
1. `lib/hooks/use-lazy-component.ts` (9 errors)
2. `lib/hooks/use-p2p-connection.ts` (22 errors)
3. `lib/storage/temp-file-storage.ts` (18 errors)
4. `lib/storage/my-devices.ts` (9 errors)
5. `lib/search/search-utils.ts` (8 errors)

---

## ⚡ QUICK WIN: Remove Unused Fonts (5 minutes)

**Impact:** -189KB (-50% font size), immediate improvement

```bash
# Windows PowerShell
cd public/fonts
Remove-Item GeistVF.woff2
Remove-Item inter-latin-wght-italic.woff2
Remove-Item playfair-display-*.woff2

# Verify
npm run build
# Check bundle size decreased
```

**Fonts to DELETE:**
- ❌ GeistVF.woff2 (28KB)
- ❌ inter-latin-wght-italic.woff2 (51KB)
- ❌ playfair-display-latin-400-italic.woff2 (22KB)
- ❌ playfair-display-latin-400-normal.woff2 (22KB)
- ❌ playfair-display-latin-500-normal.woff2 (23KB)
- ❌ playfair-display-latin-600-normal.woff2 (23KB)
- ❌ playfair-display-latin-700-normal.woff2 (22KB)

**Fonts to KEEP:**
- ✅ inter-latin-wght-normal.woff2 (48KB) - Used
- ✅ GeistMonoVF.woff2 (57KB) - Used
- ✅ cormorant-garamond-*.woff2 (135KB) - Used

---

## ⚡ QUICK WIN: Add Font Preloading (30 minutes)

**Impact:** -500ms First Contentful Paint

### Step 1: Add to `app/layout.tsx`

Find the `<head>` section (around line 80) and add:

```tsx
<head>
  {/* Existing analytics */}
  <PlausibleScriptExtended />

  {/* ADD THIS - Font Preloading */}
  <link
    rel="preload"
    href="/fonts/inter-latin-wght-normal.woff2"
    as="font"
    type="font/woff2"
    crossOrigin="anonymous"
  />
  <link
    rel="preload"
    href="/fonts/cormorant-garamond-latin-400-normal.woff2"
    as="font"
    type="font/woff2"
    crossOrigin="anonymous"
  />
</head>
```

### Step 2: Test

```bash
npm run dev
# Open Chrome DevTools > Network > Fonts
# Verify fonts load early in waterfall
```

---

## 🔥 HIGH IMPACT: Lazy Load Crypto (2-3 hours)

**Impact:** -500KB initial bundle, +2s faster Time to Interactive

### Step 1: Create Lazy Loader

Create file: `lib/crypto/crypto-loader.ts` (already exists, use it!)

```typescript
// lib/crypto/crypto-loader.ts
let cryptoLoaded = false;
let cryptoPromise: Promise<any> | null = null;

export async function loadCrypto() {
  if (cryptoLoaded) return;

  if (!cryptoPromise) {
    cryptoPromise = Promise.all([
      import('pqc-kyber'),
      import('@noble/curves'),
      import('@noble/hashes'),
      import('@noble/ciphers'),
    ]);
  }

  await cryptoPromise;
  cryptoLoaded = true;
}

export async function loadPQCCrypto() {
  const [pqc] = await Promise.all([
    import('./pqc-crypto'),
    loadCrypto(),
  ]);
  return pqc;
}
```

### Step 2: Update PQC Hook

File: `lib/hooks/use-pqc-transfer.ts`

```typescript
// BEFORE:
import { PQCTransferManager } from '../transfer/pqc-transfer-manager';

// AFTER:
const [manager, setManager] = useState<PQCTransferManager | null>(null);

useEffect(() => {
  let mounted = true;

  async function init() {
    const { PQCTransferManager } = await import('../transfer/pqc-transfer-manager');
    if (mounted) {
      setManager(new PQCTransferManager());
    }
  }

  init();

  return () => {
    mounted = false;
  };
}, []);
```

### Step 3: Test

```bash
npm run build
# Check bundle size - crypto should be in separate chunk
npm run dev
# Test PQC transfer - should still work after lazy load
```

---

## 🐛 Fix Memory Leaks (2 hours)

**Files to fix:**
1. `lib/hooks/use-p2p-connection.ts`
2. `lib/hooks/use-transfer-room.ts`
3. `lib/hooks/use-screen-share.ts`

### Pattern to Apply

```typescript
// BEFORE (Memory Leak):
useEffect(() => {
  peer.on('data', handleData);
  peer.on('close', handleClose);
  // ❌ Event listeners never removed
}, [peer]);

// AFTER (Fixed):
useEffect(() => {
  peer.on('data', handleData);
  peer.on('close', handleClose);

  return () => {
    peer.off('data', handleData);
    peer.off('close', handleClose);
    peer.destroy(); // If applicable
  };
}, [peer]);
```

### Search and Replace Pattern

```bash
# Find all useEffect without return
# VSCode regex search: useEffect\(\(\) => \{[^}]+\n(?!.*return)
```

---

## 📊 Performance Testing

### After Each Fix, Run:

```bash
# 1. Build check
npm run build

# 2. Bundle analysis
ANALYZE=true npm run build

# 3. Lighthouse audit
npm run dev
npm run perf:lighthouse

# 4. Type check
npm run type-check
```

### Success Criteria

```
Metric                  Before      After       Target
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Bundle Size             1.2MB       <500KB      ✅
TypeScript Errors       82          0           ✅
First Contentful Paint  2-3s        <1.5s       ✅
Largest Contentful Paint 3-4s       <3.0s       ✅
Time to Interactive     4-5s        <3.5s       ✅
Lighthouse Score        ~70         >90         ✅
```

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] All TypeScript errors fixed (`npm run type-check` passes)
- [ ] Production build succeeds (`npm run build` works)
- [ ] Bundle size <500KB gzipped
- [ ] Fonts optimized (189KB removed)
- [ ] Crypto lazy-loaded (500KB not in initial bundle)
- [ ] Memory leaks fixed (event listeners cleaned up)
- [ ] Performance tested (Lighthouse >90)
- [ ] Manual testing:
  - [ ] Transfer files successfully
  - [ ] PQC encryption works
  - [ ] PWA installs correctly
  - [ ] Offline mode works

---

## 📞 Need Help?

### Common Issues

**Q: Build still failing after fixes?**
A: Check typescript-errors.log for remaining errors. Focus on null safety and optional property issues.

**Q: Fonts not preloading?**
A: Verify crossOrigin="anonymous" is set and font paths are correct (relative to public folder).

**Q: Crypto not loading?**
A: Check browser console for import errors. Ensure crypto-loader.ts properly handles async imports.

**Q: Memory still leaking?**
A: Use Chrome DevTools > Memory > Take Heap Snapshot before/after transfers. Look for detached DOM nodes and retained event listeners.

### Performance Tools

```bash
# Bundle analysis
npm run build:analyze

# Performance profiling
npm run perf:full

# Memory profiling
node --expose-gc scripts/performance-test.js memory

# Lighthouse CI
npm run perf:ci
```

---

## 📈 Expected Results

### Immediate (After Quick Fixes)
- ✅ -189KB bundle size
- ✅ -500ms First Contentful Paint
- ✅ Production build working

### After Full Implementation
- ✅ -700KB total bundle reduction (189KB fonts + 500KB lazy crypto)
- ✅ -2s Time to Interactive
- ✅ -30% unnecessary re-renders
- ✅ Lighthouse score 90+
- ✅ No memory leaks

### Business Impact
- ⚡ 60% faster initial load
- 📱 Better mobile experience
- 💰 Lower bandwidth costs
- 😊 Improved user satisfaction
- 🎯 Better Core Web Vitals scores (SEO benefit)

---

**Last Updated:** 2026-01-28
**Estimated Total Effort:** 8-10 hours
**Priority:** CRITICAL - Required for production
