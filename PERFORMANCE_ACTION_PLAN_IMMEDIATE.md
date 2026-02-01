# Performance Optimization - Immediate Action Plan

**Priority:** CRITICAL
**Estimated Time:** 12 hours (1.5 days)
**Expected Impact:** +15 Lighthouse score, -30% memory usage, eliminate security risks

---

## Critical Issue #1: Console Statement Cleanup

### Current State
- **Found:** 314 console.log/debug/info statements across 31 files
- **Risk:** Security information leakage, performance degradation
- **Status:** 🔴 CRITICAL

### Action Items

1. **Replace console statements with secure-logger** (4 hours)
```bash
# Files to audit (production code only)
lib/utils/secure-logger.ts
signaling-server.js
components/**/*.{ts,tsx}
lib/**/*.{ts,tsx}
app/**/*.{ts,tsx}
```

2. **Find and replace pattern:**
```typescript
// BEFORE (BAD)
console.log('User data:', userData);

// AFTER (GOOD)
import { secureLog } from '@/lib/utils/secure-logger';
secureLog.log('User data loaded');
```

3. **Add ESLint rule to prevent future issues:**
```javascript
// eslint.config.mjs
rules: {
  'no-console': ['error', { allow: ['error', 'warn'] }]
}
```

### Verification
```bash
# Should return 0 results
grep -r "console\.log\|console\.debug\|console\.info" \
  --include="*.ts" --include="*.tsx" \
  lib/ components/ app/ \
  --exclude-dir=node_modules \
  --exclude-dir=.next
```

---

## Critical Issue #2: Event Listener Memory Leaks

### Current State
- **Found:** 332 addEventListener, only 137 cleanup (58.7% cleanup rate)
- **Risk:** Memory leaks in long-running sessions
- **Status:** 🔴 CRITICAL

### High-Risk Files

#### 1. lib/hooks/use-p2p-connection.ts (2 hours)
**Current Issues:**
- RTCPeerConnection event listeners
- DataChannel handlers
- DH key exchange cleanup

**Fix Template:**
```typescript
useEffect(() => {
  const pc = peerConnection.current;
  if (!pc) return;

  const handleConnectionStateChange = () => {
    secureLog.log('Connection state:', pc.connectionState);
  };

  const handleIceCandidate = (event: RTCPeerConnectionIceEvent) => {
    if (event.candidate) {
      // Handle candidate
    }
  };

  pc.addEventListener('connectionstatechange', handleConnectionStateChange);
  pc.addEventListener('icecandidate', handleIceCandidate);

  return () => {
    pc.removeEventListener('connectionstatechange', handleConnectionStateChange);
    pc.removeEventListener('icecandidate', handleIceCandidate);
  };
}, []);
```

#### 2. lib/signaling/connection-manager.ts (1 hour)
**Current Issues:**
- Socket.io event listeners
- No visible cleanup in initialization

**Fix:**
```typescript
class ConnectionManager {
  private cleanupHandlers: Array<() => void> = [];

  connect() {
    const client = getSignalingClient();

    const handler = (data) => { /* ... */ };
    client.on('event', handler);

    this.cleanupHandlers.push(() => client.off('event', handler));
  }

  disconnect() {
    this.cleanupHandlers.forEach(cleanup => cleanup());
    this.cleanupHandlers = [];
  }
}
```

#### 3. lib/discovery/local-discovery.ts (1 hour)
**Current Issues:**
- Network discovery listeners
- setInterval without cleanup

**Fix:**
```typescript
useEffect(() => {
  const discovery = getLocalDiscovery();
  const intervalId = setInterval(() => {
    discovery.scan();
  }, 5000);

  const handleDeviceFound = (device) => { /* ... */ };
  discovery.on('device-found', handleDeviceFound);

  return () => {
    clearInterval(intervalId);
    discovery.off('device-found', handleDeviceFound);
    discovery.cleanup(); // Add cleanup method
  };
}, []);
```

#### 4. components/devices/qr-scanner.tsx (1 hour)
**Current Issues:**
- Video stream listeners
- Camera access cleanup

**Fix:**
```typescript
useEffect(() => {
  let stream: MediaStream | null = null;

  const startCamera = async () => {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    // Use stream
  };

  startCamera();

  return () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };
}, []);
```

### Verification
```bash
# Run memory profiler test (create new test)
npm run test:memory-leaks

# Manual test: Leave app open for 30 minutes
# Check Chrome DevTools Memory tab
# Heap should not grow continuously
```

---

## Critical Issue #3: React Component Memoization

### Current State
- **Found:** Only 3 React.memo usages across all components
- **Impact:** Unnecessary re-renders, poor performance with lists
- **Status:** 🔴 HIGH PRIORITY

### High-Impact Components

#### 1. components/transfer/transfer-queue.tsx (1 hour)
**Current Issue:** Entire list re-renders on any change

**Fix:**
```typescript
import React from 'react';

// Memoize individual transfer items
export const TransferItem = React.memo(({
  transfer,
  onCancel,
  onRetry
}: TransferItemProps) => {
  return (
    <div className="transfer-item">
      <div className="transfer-name">{transfer.fileName}</div>
      <Progress value={transfer.progress} />
      {/* ... */}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if transfer changed
  return prevProps.transfer.id === nextProps.transfer.id &&
         prevProps.transfer.progress === nextProps.transfer.progress &&
         prevProps.transfer.status === nextProps.transfer.status;
});

// Main component
export function TransferQueue({ transfers }: TransferQueueProps) {
  return (
    <div className="transfer-queue">
      {transfers.map(transfer => (
        <TransferItem
          key={transfer.id}
          transfer={transfer}
          onCancel={handleCancel}
          onRetry={handleRetry}
        />
      ))}
    </div>
  );
}
```

#### 2. components/devices/device-list.tsx (1 hour)
**Current Issue:** Similar to transfer-queue

**Fix:**
```typescript
export const DeviceCard = React.memo(({
  device,
  onConnect
}: DeviceCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{device.name}</CardTitle>
      </CardHeader>
      {/* ... */}
    </Card>
  );
});

export function DeviceList({ devices }: DeviceListProps) {
  const handleConnect = useCallback((deviceId: string) => {
    // Connection logic
  }, []);

  return (
    <div className="device-list">
      {devices.map(device => (
        <DeviceCard
          key={device.id}
          device={device}
          onConnect={handleConnect}
        />
      ))}
    </div>
  );
}
```

#### 3. components/friends/friends-list.tsx (30 minutes)
**Similar pattern - add React.memo to FriendCard**

### Verification
```bash
# Use React DevTools Profiler
# Record interaction with list
# Verify only changed items re-render
```

---

## Implementation Schedule

### Day 1 (Morning) - Console Cleanup
- [ ] 9:00 AM - Audit all console statements
- [ ] 10:00 AM - Replace in lib/
- [ ] 11:00 AM - Replace in components/
- [ ] 12:00 PM - Replace in app/

### Day 1 (Afternoon) - Event Listeners Part 1
- [ ] 1:00 PM - Fix use-p2p-connection.ts
- [ ] 3:00 PM - Fix connection-manager.ts
- [ ] 4:00 PM - Test WebRTC cleanup

### Day 2 (Morning) - Event Listeners Part 2
- [ ] 9:00 AM - Fix local-discovery.ts
- [ ] 10:00 AM - Fix qr-scanner.tsx
- [ ] 11:00 AM - Create cleanup utility
- [ ] 12:00 PM - Memory leak tests

### Day 2 (Afternoon) - Memoization
- [ ] 1:00 PM - Memoize transfer-queue
- [ ] 2:00 PM - Memoize device-list
- [ ] 3:00 PM - Memoize friends-list
- [ ] 4:00 PM - Performance profiling
- [ ] 5:00 PM - Validation & documentation

---

## Testing Checklist

### Before Implementation
- [ ] Capture baseline metrics
- [ ] Take heap snapshots
- [ ] Record Lighthouse scores
- [ ] Profile render times

### After Implementation
- [ ] Verify console statements removed
- [ ] Run memory leak tests (30 min session)
- [ ] Profile list rendering
- [ ] Run Lighthouse CI
- [ ] Check heap snapshots (no growth)

### Success Criteria
- [ ] Zero console.log in production code
- [ ] No memory growth after 30 minutes
- [ ] List re-renders only changed items
- [ ] Lighthouse Performance > 90
- [ ] Heap size stable < 100MB

---

## Measurement Tools

### Memory Leak Detection
```typescript
// tests/memory-leak-test.ts
import { chromium } from '@playwright/test';

async function testMemoryLeaks() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('http://localhost:3000/app');

  // Get initial memory
  const initialMemory = await page.evaluate(() => {
    return (performance as any).memory?.usedJSHeapSize;
  });

  // Perform actions for 30 minutes
  for (let i = 0; i < 360; i++) {
    await page.click('[data-testid="add-file"]');
    await page.click('[data-testid="remove-file"]');
    await page.waitForTimeout(5000);
  }

  // Get final memory
  const finalMemory = await page.evaluate(() => {
    return (performance as any).memory?.usedJSHeapSize;
  });

  const growth = finalMemory - initialMemory;
  const growthPercent = (growth / initialMemory) * 100;

  console.log(`Memory growth: ${growthPercent.toFixed(2)}%`);

  // Memory should not grow more than 20%
  if (growthPercent > 20) {
    throw new Error(`Memory leak detected: ${growthPercent}% growth`);
  }

  await browser.close();
}
```

### React Profiler
```typescript
// Add to components for testing
import { Profiler, ProfilerOnRenderCallback } from 'react';

const onRender: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) => {
  console.log(`${id} ${phase} render took ${actualDuration}ms`);
};

export function ProfiledComponent() {
  return (
    <Profiler id="DeviceList" onRender={onRender}>
      <DeviceList />
    </Profiler>
  );
}
```

---

## Utility Functions to Create

### 1. Event Listener Cleanup Helper
```typescript
// lib/utils/event-cleanup.ts
export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element: Window | HTMLElement = window,
  options?: AddEventListenerOptions
) {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const eventListener = (event: Event) =>
      savedHandler.current(event as WindowEventMap[K]);

    element.addEventListener(eventName, eventListener, options);

    return () => {
      element.removeEventListener(eventName, eventListener, options);
    };
  }, [eventName, element, options]);
}
```

### 2. Interval Cleanup Helper
```typescript
// lib/utils/interval-cleanup.ts
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
```

### 3. Cleanup Registry
```typescript
// lib/utils/cleanup-registry.ts
class CleanupRegistry {
  private handlers: Map<string, () => void> = new Map();

  register(id: string, cleanup: () => void) {
    this.handlers.set(id, cleanup);
  }

  unregister(id: string) {
    const cleanup = this.handlers.get(id);
    if (cleanup) {
      cleanup();
      this.handlers.delete(id);
    }
  }

  cleanupAll() {
    this.handlers.forEach(cleanup => cleanup());
    this.handlers.clear();
  }
}

export const cleanupRegistry = new CleanupRegistry();
```

---

## Documentation Updates

### Add to README.md
```markdown
## Performance Guidelines

### Memory Management
- Always cleanup event listeners in useEffect
- Use useEventListener hook for automatic cleanup
- Stop media streams when component unmounts
- Clear intervals and timeouts

### Component Optimization
- Use React.memo for list items
- Use useCallback for event handlers passed to children
- Use useMemo for expensive computations
- Profile components with React DevTools

### Logging
- Use secureLog instead of console.log
- Never log sensitive data
- Logs are removed in production builds
```

### Add to CONTRIBUTING.md
```markdown
## Performance Requirements

All PRs must:
- Pass bundle size checks (< 800KB)
- Include proper event listener cleanup
- Use React.memo for list components
- No console.log statements
- Pass memory leak tests
```

---

## Quick Reference

### Before Committing
```bash
# Check for issues
npm run lint
npm run type-check
npm run test

# Performance checks
npm run build
npm run perf:bundle

# Find problems
grep -r "console\.log" lib/ components/ app/
grep -r "addEventListener" lib/ components/ --no-include-dir
```

### CI/CD Integration
```yaml
# .github/workflows/performance.yml
name: Performance Checks

on: [push, pull_request]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run build
      - run: npm run perf:bundle
      - run: npm run test:memory-leaks
```

---

## Success Metrics

### Target Improvements
| Metric | Before | Target | Improvement |
|--------|--------|--------|-------------|
| Console Statements | 314 | 0 | -314 |
| Listener Cleanup % | 58.7% | 100% | +41.3% |
| Memory (30min) | Unknown | <100MB | Measure |
| List Re-renders | 100% | ~10% | -90% |
| Lighthouse Score | 85 | 95+ | +10 |

### Validation
- [ ] All metrics achieved
- [ ] No regressions in functionality
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Team trained on new patterns

---

**Start Date:** Today
**Target Completion:** 1.5 days (12 hours)
**Review Date:** After completion
**Follow-up:** Weekly memory monitoring
