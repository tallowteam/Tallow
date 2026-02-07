# Delta Sync Quick Reference

## 30-Second Overview

Delta sync sends only changed file blocks instead of entire files, saving 25-95% bandwidth.

## Quick Start

```typescript
import { DeltaSyncManager } from '@/lib/transfer';

const manager = new DeltaSyncManager();

// 1. Initialize (sender)
const signatures = await manager.initDeltaSync(fileId, file);
const sigJson = manager.exportSignatures(fileId);
// → Send sigJson to peer

// 2. Sync (sender receives peer signatures)
const peerSigs = manager.importSignatures(receivedJson);
const result = await manager.syncFile(fileId, updatedFile, peerSigs);

if (result.success && result.patch && result.savings.savingsPercent > 25) {
  const { metadata, blocks } = manager.exportPatch(result.patch);
  // → Send metadata + blocks to peer
} else {
  // → Send full file
}

// 3. Apply (receiver)
const patch = manager.importPatch(metadata, blocks);
const updated = await manager.applyReceivedPatch(fileId, originalFile, patch);
```

## API Cheat Sheet

### DeltaSyncManager

```typescript
// Initialize
new DeltaSyncManager({
  maxCacheSize: 100,      // Max cached signature sets
  cacheExpiryMs: 86400000, // 24 hours
  autoCleanup: true
})

// Core methods
await initDeltaSync(fileId, file)           // Compute signatures
await syncFile(fileId, file, peerSigs)      // Create patch
await applyReceivedPatch(fileId, orig, patch) // Apply patch

// Import/Export
exportSignatures(fileId)        // → JSON string
importSignatures(json)          // → FileSignatures
exportPatch(patch)              // → { metadata, blocks[] }
importPatch(metadata, blocks)   // → FilePatch

// Cache
getCacheStats()                 // Get cache info
clearCache()                    // Clear all
clearExpiredCache()             // Clear expired only
hasSignatures(fileId)           // Check if cached

// Session
getSession(fileId)              // Get session info
getAllSessions()                // Get all sessions
clearSession(fileId)            // Clear session

// Cleanup
destroy()                       // Cleanup resources
```

### Core Functions

```typescript
import {
  computeBlockSignatures,
  computeDelta,
  createPatch,
  applyPatch,
  estimateSavings,
  calculateOptimalBlockSize
} from '@/lib/transfer';

// Compute signatures
const sigs = await computeBlockSignatures(file, 4096);

// Compare signatures
const delta = computeDelta(localSigs, remoteSigs);

// Create patch
const patch = await createPatch(file, delta, 4096);

// Apply patch
const result = await applyPatch(originalFile, patch, delta, 4096);

// Estimate savings
const savings = estimateSavings(delta, totalBlocks, 4096);
```

## When to Use

### ✅ Good For

- Text files (.txt, .md, .log)
- Source code (.js, .ts, .py)
- Configuration (.json, .yaml, .xml)
- Documents (.html, .tex)
- Databases (.sql, .csv)
- Incremental logs

### ❌ Avoid For

- Compressed files (.zip, .gz)
- Encrypted files (.enc, .gpg)
- Small files (<10KB)
- Completely new/rewritten files
- Binary executables

## Decision Logic

```typescript
function shouldUseDelta(
  fileSize: number,
  hasRemoteVersion: boolean,
  fileType: string
): boolean {
  if (!hasRemoteVersion) return false;
  if (fileSize < 10 * 1024) return false;
  if (fileType.endsWith('.zip')) return false;
  if (fileType.endsWith('.enc')) return false;
  return true;
}
```

## Block Sizes

| File Size | Block Size | Why |
|-----------|------------|-----|
| <100KB    | 1KB        | Fine-grained |
| 100KB-1MB | 4KB        | Balanced |
| 1MB-10MB  | 16KB       | Efficient |
| 10MB-100MB| 64KB       | Fast |
| >100MB    | 256KB      | Throughput |

## Performance Expectations

| Scenario | Savings | Efficiency |
|----------|---------|------------|
| Document edit | 70-90% | Excellent |
| Log append | 85-95% | Excellent |
| Code changes | 50-70% | Good |
| Binary update | 20-40% | Moderate |

## Common Patterns

### Pattern 1: Send with Auto-Fallback

```typescript
async function smartSend(fileId: string, file: File) {
  const peerSigs = await requestPeerSignatures(fileId);

  if (peerSigs) {
    const result = await manager.syncFile(fileId, file, peerSigs);
    if (result.success && result.savings.savingsPercent > 25) {
      return sendPatch(result.patch);
    }
  }

  return sendFullFile(file);
}
```

### Pattern 2: Receive and Apply

```typescript
async function receiveUpdate(fileId: string, originalFile: File) {
  // Receive patch metadata + blocks
  const { metadata, blocks } = await receivePatch();

  // Apply patch
  const patch = manager.importPatch(metadata, blocks);
  const updated = await manager.applyReceivedPatch(
    fileId,
    originalFile,
    patch
  );

  return new File([updated], originalFile.name);
}
```

### Pattern 3: Track Progress

```typescript
const session = manager.getSession(fileId);

setInterval(() => {
  const s = manager.getSession(fileId);
  console.log(`${s.status}: ${s.progress}%`);

  if (s.status === 'complete') {
    console.log('Delta sync complete!');
  }
}, 100);
```

## Troubleshooting

### Low Savings
- **Problem**: <25% savings
- **Solution**: Fall back to full file transfer

### Slow Computation
- **Problem**: Signature computation takes too long
- **Solution**: Increase block size or use Web Workers

### High Memory
- **Problem**: Out of memory errors
- **Solution**: Reduce cache size or block size

### Cache Not Working
- **Problem**: Signatures not cached
- **Solution**: Check file lastModified timestamp

## Message Protocol Example

```typescript
// WebRTC message handler
channel.onmessage = async (event) => {
  const msg = JSON.parse(event.data);

  switch (msg.type) {
    case 'delta-check':
      // Send signatures if we have file
      if (hasFile(msg.fileId)) {
        const sigs = await manager.initDeltaSync(msg.fileId, localFile);
        channel.send(JSON.stringify({
          type: 'delta-signatures',
          fileId: msg.fileId,
          payload: manager.exportSignatures(msg.fileId)
        }));
      }
      break;

    case 'delta-signatures':
      // Compute delta and send patch
      const peerSigs = manager.importSignatures(msg.payload);
      const result = await manager.syncFile(msg.fileId, file, peerSigs);
      if (result.patch) {
        const { metadata, blocks } = manager.exportPatch(result.patch);
        channel.send(JSON.stringify({ type: 'delta-patch', metadata }));
        blocks.forEach(b => channel.send(b));
      }
      break;

    case 'delta-patch':
      // Collect blocks and apply when complete
      // Implementation depends on your block collection strategy
      break;
  }
};
```

## Error Handling

```typescript
try {
  const result = await manager.syncFile(fileId, file, peerSigs);

  if (!result.success) {
    console.error('Delta sync failed:', result.error);
    return sendFullFile(file);
  }

  if (result.savings.savingsPercent < 25) {
    console.log('Savings too low, sending full file');
    return sendFullFile(file);
  }

  return sendPatch(result.patch);
} catch (error) {
  console.error('Delta sync error:', error);
  return sendFullFile(file);
}
```

## Cache Management

```typescript
// Get stats
const stats = manager.getCacheStats();
console.log(`Cache: ${stats.size}/${stats.maxSize}`);

// Clear expired (automatic with autoCleanup: true)
manager.clearExpiredCache();

// Clear all
manager.clearCache();

// Check if cached
if (manager.hasSignatures(fileId)) {
  console.log('Signatures already cached');
}
```

## Constants

```typescript
DEFAULT_BLOCK_SIZE = 4096    // 4KB
MIN_BLOCK_SIZE = 1024        // 1KB
MAX_BLOCK_SIZE = 1048576     // 1MB
```

## Types

```typescript
interface FileSignatures {
  blockSize: number;
  totalSize: number;
  blocks: BlockSignature[];
}

interface BlockSignature {
  index: number;
  offset: number;
  size: number;
  hash: string; // SHA-256 hex
}

interface DeltaResult {
  unchanged: number[];
  changed: number[];
  added: number[];
  removed: number[];
}

interface FilePatch {
  blockSize: number;
  totalBlocks: number;
  blocks: PatchBlock[];
  delta: DeltaResult;
}

interface SavingsEstimate {
  originalBytes: number;
  patchBytes: number;
  savedBytes: number;
  savingsPercent: number;
  efficiency: 'excellent' | 'good' | 'moderate' | 'poor';
}
```

## Examples

### Example 1: Document Update

```typescript
// Original
const original = new File(['Version 1'], 'doc.txt');

// Updated (later)
const updated = new File(['Version 2'], 'doc.txt');

// Compute delta
const origSigs = await manager.initDeltaSync('doc', original);
const result = await manager.syncFile('doc', updated, origSigs);

console.log(`Savings: ${result.savings.savingsPercent.toFixed(1)}%`);
// Output: Savings: 75.0%
```

### Example 2: Log Append

```typescript
// Original log
const log1 = new File(['Line 1\nLine 2\n'], 'app.log');

// Appended log
const log2 = new File(['Line 1\nLine 2\nLine 3\n'], 'app.log');

const sigs1 = await manager.initDeltaSync('log', log1);
const result = await manager.syncFile('log', log2, sigs1);

console.log(`Efficiency: ${result.savings.efficiency}`);
// Output: Efficiency: excellent
```

## Tips

1. **Cache signatures** for files you send frequently
2. **Check savings** before sending patch (>25% recommended)
3. **Use optimal block size** based on file size
4. **Handle errors** with fallback to full transfer
5. **Monitor cache** to prevent memory issues
6. **Clear sessions** after transfer complete
7. **Validate** signatures and patches before use

## Resources

- Full Guide: `DELTA_SYNC_GUIDE.md`
- Integration Example: `delta-sync-integration-example.ts`
- Tests: `delta-sync.test.ts`, `delta-sync-manager.test.ts`
- Implementation: `delta-sync.ts`, `delta-sync-manager.ts`

---

**Quick Start**: `import { DeltaSyncManager } from '@/lib/transfer'`
