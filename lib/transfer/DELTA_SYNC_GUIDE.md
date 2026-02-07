# Delta Synchronization Guide

## Overview

The delta synchronization system enables efficient file updates by sending only changed blocks instead of entire files. This significantly reduces bandwidth usage and transfer time for file updates.

## Architecture

### Core Modules

1. **delta-sync.ts** - Core delta sync algorithms
   - Block-based signature computation using SHA-256
   - Delta computation comparing signature sets
   - Patch creation containing only changed blocks
   - Patch application to reconstruct files

2. **delta-sync-manager.ts** - Session and cache management
   - In-memory signature caching with LRU eviction
   - Session tracking for active delta sync operations
   - Automatic cleanup of expired cache entries

## Key Features

- **Block-Level Diffing**: Files split into configurable blocks (default 4KB)
- **SHA-256 Signatures**: Each block hashed for integrity verification
- **Efficient Delta Computation**: Only changed/added blocks transmitted
- **Smart Block Sizing**: Automatic block size based on file size
- **LRU Cache**: Signatures cached for quick re-sync
- **No External Dependencies**: Uses Web Crypto API only
- **Async/Non-Blocking**: Operations batched to avoid blocking main thread

## Usage Examples

### Basic Delta Sync Workflow

```typescript
import {
  DeltaSyncManager,
  computeBlockSignatures,
  computeDelta,
  createPatch,
  applyPatch
} from '@/lib/transfer';

// Initialize manager
const manager = new DeltaSyncManager({
  maxCacheSize: 100,
  cacheExpiryMs: 24 * 60 * 60 * 1000, // 24 hours
  autoCleanup: true
});

// SENDER SIDE: File was updated
async function sendFileUpdate(fileId: string, updatedFile: File, peerSignatures: FileSignatures) {
  // Perform delta sync
  const result = await manager.syncFile(fileId, updatedFile, peerSignatures);

  if (result.success && result.patch) {
    console.log(`Savings: ${result.savings.savingsPercent.toFixed(1)}%`);
    console.log(`Efficiency: ${result.savings.efficiency}`);

    // Export patch for transmission
    const { metadata, blocks } = manager.exportPatch(result.patch);

    // Send metadata + blocks to peer
    await sendToPeer({ metadata, blocks });
  }
}

// RECEIVER SIDE: Apply received patch
async function receiveFileUpdate(
  fileId: string,
  originalFile: File,
  metadata: string,
  blocks: ArrayBuffer[]
) {
  // Import patch
  const patch = manager.importPatch(metadata, blocks);

  // Apply patch to reconstruct updated file
  const updatedBlob = await manager.applyReceivedPatch(fileId, originalFile, patch);

  // Convert to File
  const updatedFile = new File([updatedBlob], originalFile.name, {
    type: originalFile.type
  });

  return updatedFile;
}
```

### Computing and Caching Signatures

```typescript
// Initialize delta sync for a file
const fileId = 'unique-file-id';
const file = new File(['content'], 'document.txt');

// Compute and cache signatures
const signatures = await manager.initDeltaSync(fileId, file);

console.log(`Computed ${signatures.blocks.length} blocks`);
console.log(`Block size: ${signatures.blockSize} bytes`);

// Export signatures for peer
const signaturesJson = manager.exportSignatures(fileId);

// Send to peer for comparison
await sendToPeer({ type: 'signatures', data: signaturesJson });
```

### Receiving Peer Signatures and Computing Delta

```typescript
// Peer sends their signatures
const peerSignaturesJson = await receiveFromPeer();
const peerSignatures = manager.importSignatures(peerSignaturesJson);

// Compare with local file
const result = await manager.syncFile(fileId, localFile, peerSignatures);

if (result.success) {
  console.log('Delta Analysis:');
  console.log(`  Unchanged blocks: ${result.delta.unchanged.length}`);
  console.log(`  Changed blocks: ${result.delta.changed.length}`);
  console.log(`  Added blocks: ${result.delta.added.length}`);
  console.log(`  Removed blocks: ${result.delta.removed.length}`);

  console.log('Bandwidth Savings:');
  console.log(`  Original size: ${formatBytes(result.savings.originalBytes)}`);
  console.log(`  Patch size: ${formatBytes(result.savings.patchBytes)}`);
  console.log(`  Saved: ${formatBytes(result.savings.savedBytes)} (${result.savings.savingsPercent.toFixed(1)}%)`);
  console.log(`  Efficiency: ${result.savings.efficiency}`);
}
```

### Low-Level API Usage

```typescript
import {
  computeBlockSignatures,
  computeDelta,
  createPatch,
  applyPatch,
  estimateSavings
} from '@/lib/transfer/delta-sync';

// Compute signatures manually
const originalFile = new File(['version 1'], 'doc.txt');
const updatedFile = new File(['version 2'], 'doc.txt');

const originalSigs = await computeBlockSignatures(originalFile, 4096);
const updatedSigs = await computeBlockSignatures(updatedFile, 4096);

// Compute delta
const delta = computeDelta(updatedSigs, originalSigs);

// Create patch
const patch = await createPatch(updatedFile, delta, 4096);

// Estimate savings
const savings = estimateSavings(delta, updatedSigs.blocks.length, 4096);
console.log(`Will save ${savings.savingsPercent.toFixed(1)}% bandwidth`);

// Apply patch (on receiver side)
const reconstructed = await applyPatch(originalFile, patch, delta, 4096);
```

### Optimal Block Size Calculation

```typescript
import { calculateOptimalBlockSize } from '@/lib/transfer/delta-sync';

// Automatic block size based on file size
const fileSize = 50 * 1024 * 1024; // 50MB
const blockSize = calculateOptimalBlockSize(fileSize);

console.log(`Optimal block size: ${blockSize} bytes`);

// Use custom block size
const customBlockSize = 16 * 1024; // 16KB
const signatures = await computeBlockSignatures(file, customBlockSize);
```

### Cache Management

```typescript
// Get cache statistics
const stats = manager.getCacheStats();
console.log(`Cache: ${stats.size}/${stats.maxSize} entries`);

stats.entries.forEach(entry => {
  console.log(`  ${entry.fileName}: ${entry.accessCount} accesses, age: ${entry.age}ms`);
});

// Clear expired entries manually
const cleared = manager.clearExpiredCache();
console.log(`Cleared ${cleared} expired entries`);

// Clear specific file
manager.clearSession(fileId);

// Clear all cache
manager.clearCache();

// Destroy manager
manager.destroy();
```

### Session Monitoring

```typescript
// Get active session
const session = manager.getSession(fileId);

if (session) {
  console.log(`Status: ${session.status}`);
  console.log(`Progress: ${session.progress}%`);

  if (session.error) {
    console.error(`Error: ${session.error}`);
  }

  if (session.delta) {
    console.log(`Delta computed: ${session.delta.changed.length} changed blocks`);
  }
}

// Get all sessions
const allSessions = manager.getAllSessions();
allSessions.forEach(s => {
  console.log(`${s.fileId}: ${s.status} (${s.progress}%)`);
});
```

### Error Handling

```typescript
try {
  const result = await manager.syncFile(fileId, file, peerSignatures);

  if (!result.success) {
    console.error('Sync failed:', result.error);
    // Fallback to full file transfer
    await sendFullFile(file);
  }
} catch (error) {
  console.error('Delta sync error:', error);
  // Fallback strategy
  await sendFullFile(file);
}
```

## Integration with Existing Transfer System

### Integration with PQCTransferManager

```typescript
import { PQCTransferManager } from '@/lib/transfer';
import { DeltaSyncManager } from '@/lib/transfer';

class EnhancedTransferManager extends PQCTransferManager {
  private deltaManager = new DeltaSyncManager();

  async sendFileWithDeltaSync(
    file: File,
    fileId: string,
    peerHasFile: boolean,
    peerSignatures?: FileSignatures
  ) {
    if (peerHasFile && peerSignatures) {
      // Use delta sync
      const result = await this.deltaManager.syncFile(fileId, file, peerSignatures);

      if (result.success && result.patch && result.savings.savingsPercent > 25) {
        // Send patch (significant savings)
        const { metadata, blocks } = this.deltaManager.exportPatch(result.patch);
        await this.sendDeltaPatch(fileId, metadata, blocks);
        return;
      }
    }

    // Fallback to full file transfer
    await this.sendFile(file);
  }

  async receiveDeltaPatch(
    fileId: string,
    originalFile: File,
    metadata: string,
    blocks: ArrayBuffer[]
  ) {
    const patch = this.deltaManager.importPatch(metadata, blocks);
    const updated = await this.deltaManager.applyReceivedPatch(fileId, originalFile, patch);
    return updated;
  }
}
```

### WebRTC Message Protocol

```typescript
// Message types for delta sync over WebRTC
interface DeltaSyncMessage {
  type: 'delta-signatures' | 'delta-patch' | 'delta-request';
  fileId: string;
  payload: any;
}

// Sender: Send signatures
channel.send(JSON.stringify({
  type: 'delta-signatures',
  fileId: 'abc123',
  payload: manager.exportSignatures('abc123')
}));

// Receiver: Receive signatures and compute delta
channel.addEventListener('message', async (event) => {
  const msg: DeltaSyncMessage = JSON.parse(event.data);

  if (msg.type === 'delta-signatures') {
    const peerSigs = manager.importSignatures(msg.payload);
    const result = await manager.syncFile(msg.fileId, localFile, peerSigs);

    if (result.patch) {
      const { metadata, blocks } = manager.exportPatch(result.patch);

      // Send patch back
      channel.send(JSON.stringify({
        type: 'delta-patch',
        fileId: msg.fileId,
        payload: { metadata }
      }));

      // Send blocks separately
      blocks.forEach((block, i) => {
        channel.send(block);
      });
    }
  }
});
```

## Performance Considerations

### Block Size Selection

- **Small files (<100KB)**: 1KB blocks
- **Medium files (100KB-1MB)**: 4KB blocks
- **Large files (1MB-10MB)**: 16KB blocks
- **Very large files (10MB-100MB)**: 64KB blocks
- **Huge files (>100MB)**: 256KB blocks

### Memory Usage

The system processes blocks in batches (default: 50 blocks) to avoid blocking the main thread:

- Signature computation: ~50 blocks at a time
- Patch creation: ~50 blocks at a time
- Patch application: ~50 blocks at a time

### Cache Optimization

- Default cache size: 100 signature sets
- Default expiry: 24 hours
- LRU eviction when cache full
- Automatic cleanup every hour

## When to Use Delta Sync

### Best Use Cases

✅ **Good for**:
- Document updates (text files, PDFs)
- Configuration file changes
- Database exports with minor changes
- Source code files
- Log files with appended data
- Incremental backups

❌ **Not suitable for**:
- New files (no previous version)
- Completely rewritten files
- Compressed archives (small changes = different output)
- Encrypted files (encryption changes all bytes)
- Binary files with scattered changes

### Decision Logic

```typescript
async function shouldUseDeltaSync(
  fileId: string,
  file: File,
  peerHasFile: boolean,
  peerSignatures?: FileSignatures
): Promise<boolean> {
  // No delta sync if peer doesn't have file
  if (!peerHasFile || !peerSignatures) {
    return false;
  }

  // Skip delta sync for small files (<10KB)
  if (file.size < 10 * 1024) {
    return false;
  }

  // Perform delta analysis
  const result = await manager.syncFile(fileId, file, peerSignatures);

  // Use delta sync if savings > 25%
  return result.success && result.savings.savingsPercent > 25;
}
```

## API Reference

### DeltaSyncManager

#### Constructor
```typescript
new DeltaSyncManager(options?: DeltaSyncOptions)
```

Options:
- `maxCacheSize`: Maximum signature cache entries (default: 100)
- `cacheExpiryMs`: Cache expiry time in ms (default: 24 hours)
- `blockSize`: Override automatic block size (default: auto)
- `autoCleanup`: Enable automatic cleanup (default: true)

#### Methods

- `initDeltaSync(fileId, file)`: Initialize and cache signatures
- `syncFile(fileId, file, peerSignatures)`: Perform delta sync
- `applyReceivedPatch(fileId, originalFile, patch)`: Apply patch
- `exportSignatures(fileId)`: Export signatures as JSON
- `importSignatures(json)`: Import signatures from JSON
- `exportPatch(patch)`: Export patch for transmission
- `importPatch(metadata, blocks)`: Import received patch
- `getSession(fileId)`: Get session info
- `getCacheStats()`: Get cache statistics
- `clearCache()`: Clear all cache
- `destroy()`: Cleanup and destroy manager

### Core Functions

- `computeBlockSignatures(file, blockSize?)`: Compute file signatures
- `computeDelta(local, remote)`: Compare signature sets
- `createPatch(file, delta, blockSize)`: Create patch
- `applyPatch(original, patch, delta, blockSize)`: Apply patch
- `estimateSavings(delta, totalBlocks, blockSize)`: Estimate savings
- `calculateOptimalBlockSize(fileSize)`: Calculate optimal block size

## Troubleshooting

### Issue: Low Bandwidth Savings

**Cause**: File has many scattered changes
**Solution**: Fall back to full file transfer if savings < 25%

### Issue: High Memory Usage

**Cause**: Large block size or many simultaneous operations
**Solution**:
- Reduce block size for large files
- Reduce cache size
- Process files sequentially

### Issue: Slow Signature Computation

**Cause**: Very large files or small block size
**Solution**:
- Increase block size
- Use Web Workers for computation (future enhancement)

### Issue: Cache Not Working

**Cause**: File lastModified timestamp changes
**Solution**: Use stable file identifiers

## Future Enhancements

- **Web Worker Support**: Offload computation to workers
- **Rolling Hash**: Implement proper Rabin fingerprinting for better detection
- **Compression**: Compress patch data before transmission
- **IndexedDB Cache**: Persistent signature cache
- **Progress Events**: Fine-grained progress callbacks
- **Chunk Streaming**: Stream patch blocks for large files

## License

Part of Tallow - Secure P2P File Transfer
