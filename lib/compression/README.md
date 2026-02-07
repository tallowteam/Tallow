# Tallow Compression System

Complete compression pipeline with multiple algorithms optimized for different use cases.

## Architecture

```
lib/compression/
├── index.ts                    # Main export & algorithm selection
├── compression-pipeline.ts     # Core compression pipeline
├── magic-numbers.ts           # File type detection
├── brotli.ts                  # Brotli compression (text-optimized)
├── lzma.ts                    # LZMA compression (maximum ratio)
├── lz4.ts                     # LZ4 compression (ultra-fast)
└── zstd.ts                    # Zstandard compression (balanced)
```

## Algorithms Overview

| Algorithm | Speed | Ratio | Best For | Use Case |
|-----------|-------|-------|----------|----------|
| **LZ4** | Ultra-fast | Low | LAN transfers | Real-time, speed critical |
| **gzip/deflate** | Fast | Medium | General files | Default browser compression |
| **Zstd** | Fast | Good | Internet transfers | Balanced speed/ratio |
| **Brotli** | Medium | High | Text files | JSON, HTML, logs, code |
| **LZMA** | Slow | Very High | Archival | Large files, batch processing |

## Brotli Implementation

### Features

- Native browser Brotli support detection (`'br'` in CompressionStream)
- Fallback to deflate with custom framing for older browsers
- Quality levels 0-11 (configurable)
- Streaming API for large files
- Custom header format with magic bytes `0xCE 0xB2 0xCF 0x81`

### Header Format (16 bytes)

```
Offset | Size | Description
-------|------|-------------
0      | 4    | Magic bytes: 0xCE 0xB2 0xCF 0x81 (UTF-8 "βρ")
4      | 1    | Version: 0x01
5      | 1    | Quality level: 0-11
6      | 1    | Compression type: 0x01=native, 0x02=fallback
7      | 1    | Reserved: 0x00
8      | 8    | Original size (uint64, little-endian)
```

### API

```typescript
import { compressBrotli, decompressBrotli, isBrotliSupported } from '@/lib/compression/brotli';

// Check browser support
if (isBrotliSupported()) {
  console.log('Native Brotli available');
}

// Compress with quality level
const compressed = await compressBrotli(data, 6); // Quality 0-11

// Decompress
const decompressed = await decompressBrotli(compressed);

// Streaming for large files
const compressedStream = compressBrotliStream(fileStream, 6);

// Get recommended quality based on file size
const quality = getRecommendedQuality(fileSize, 'balanced');
```

### Quality Level Guide

| Quality | Speed | Ratio | Best For |
|---------|-------|-------|----------|
| 0-3 | Fast | 20-30% better than gzip | Real-time compression |
| 4-6 | Medium | 30-40% better than gzip | General use (default) |
| 7-11 | Slow | 40-50% better than gzip | Archival, batch processing |

### Performance Characteristics

- **Compression**: 1.5-3x slower than gzip (depends on quality)
- **Decompression**: Similar to gzip
- **Ratio on text**: 30-50% better than gzip
- **Ratio on binary**: Similar to gzip
- **Memory**: Moderate (window size up to 16MB)

## LZMA Implementation

### Features

- Simplified LZMA implementation (LZ77 + Range coding)
- Maximum compression ratio
- Best for large text files and archival
- Standard LZMA header format (13 bytes)
- Compatible with LZMA SDK format

### Header Format (13 bytes)

```
Offset | Size | Description
-------|------|-------------
0      | 1    | Properties: (pb*5+lp)*9+lc
1      | 4    | Dictionary size (little-endian)
5      | 8    | Uncompressed size (uint64, little-endian)
```

Default properties:
- `lc` (literal context bits): 3
- `lp` (literal position bits): 0
- `pb` (position bits): 2

### API

```typescript
import { compressLZMA, decompressLZMA, isLZMACompressed } from '@/lib/compression/lzma';

// Compress with default 1MB dictionary
const compressed = compressLZMA(data);

// Compress with custom dictionary size
const compressed = compressLZMA(data, 4 * 1024 * 1024); // 4MB

// Decompress
const decompressed = decompressLZMA(compressed);

// Check if data is LZMA-compressed
if (isLZMACompressed(data)) {
  const decompressed = decompressLZMA(data);
}

// Get estimated ratio
const ratio = getEstimatedLZMARatio('text'); // 6.0x for text

// Check if LZMA is recommended
if (isLZMARecommended(fileSize, true)) {
  // Use LZMA for archival
}
```

### Performance Characteristics

- **Compression**: 5-10x slower than gzip
- **Decompression**: 2-3x slower than gzip
- **Ratio on text**: 40-60% better than gzip (6x vs 3.5x)
- **Ratio on binary**: 20-30% better than gzip
- **Memory**: High (dictionary size up to 16MB in browser)

### Algorithm Details

LZMA combines three techniques:

1. **LZ77 Dictionary Compression**: Finds repeated sequences in a sliding window
2. **Range Encoding**: Arithmetic coding for better entropy compression than Huffman
3. **Markov Chain**: Context modeling for improved compression of repeated patterns

### When to Use LZMA

✅ **Good for:**
- Large text files (> 1MB)
- Log files, source code repositories
- Archival storage (compress once, decompress rarely)
- Batch processing scenarios
- Maximum compression ratio is critical

❌ **Not good for:**
- Real-time compression
- Small files (< 100KB)
- Binary files already optimized
- Interactive/streaming scenarios
- Mobile devices (high CPU/memory)

## Automatic Algorithm Selection

The compression pipeline includes intelligent algorithm selection:

```typescript
import { selectCompression } from '@/lib/compression';

// Auto-select based on file and priority
const algorithm = await selectCompression(file, 'balanced');
// Returns: 'lz4' | 'gzip' | 'zstd' | 'brotli' | 'lzma' | 'none'

// Selection logic:
// 1. Check if file is compressible (magic bytes)
// 2. Detect content type (text/binary/mixed)
// 3. Consider file size
// 4. Apply priority (speed/balanced/size)
```

### Selection Rules

| Condition | Algorithm |
|-----------|-----------|
| File < 10KB | gzip |
| Priority = speed | gzip |
| Binary file | gzip |
| Text + size priority + > 10MB | LZMA |
| Text + size priority | Brotli |
| Text + balanced + Brotli supported | Brotli |
| Default | gzip |

## Integration Example

```typescript
import {
  compressFile,
  decompressFile,
  selectCompression,
  analyzeCompressibility,
  type CompressionAlgorithm,
  type CompressionResult
} from '@/lib/compression';

async function compressFileIntelligently(file: File): Promise<CompressionResult> {
  // 1. Analyze compressibility
  const analysis = await analyzeCompressibility(file);
  if (!analysis.isCompressible) {
    console.log('Skipping compression:', analysis.reason);
  }

  // 2. Select best algorithm
  const algorithm = await selectCompression(file, 'balanced');
  console.log('Selected algorithm:', algorithm);

  // 3. Compress
  const result = await compressFile(file, algorithm);
  console.log(`Compressed: ${result.stats.ratio.toFixed(2)}x in ${result.stats.timeTaken}ms`);

  return result;
}

// Decompress
async function decompressData(
  data: ArrayBuffer,
  algorithm: CompressionAlgorithm
): Promise<ArrayBuffer> {
  return decompressFile(data, algorithm);
}
```

## Magic Bytes Detection

Both Brotli and LZMA compressed files can be detected:

```typescript
import { isBrotliCompressed } from '@/lib/compression/brotli';
import { isLZMACompressed } from '@/lib/compression/lzma';
import { detectFileType } from '@/lib/compression';

const data = new Uint8Array(buffer);

if (isBrotliCompressed(data)) {
  console.log('Brotli compressed file detected');
  // application/x-brotli
}

if (isLZMACompressed(data)) {
  console.log('LZMA compressed file detected');
  // application/x-lzma
}

// Or use generic detection
const mimeType = detectFileType(buffer);
// Returns: 'application/x-brotli' | 'application/x-lzma' | ...
```

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Native Brotli | 109+ | ❌ | 16.4+ | 109+ |
| Deflate fallback | All | All | All | All |
| LZMA (pure TS) | All | All | All | All |

## Performance Tips

1. **Small files (< 10KB)**: Use gzip (overhead not worth it)
2. **LAN transfers**: Use LZ4 (speed matters more than ratio)
3. **Internet transfers**: Use Zstd or Brotli (balanced)
4. **Text-heavy**: Prefer Brotli over gzip (30-50% better)
5. **Archival**: Use LZMA for maximum compression
6. **Real-time**: Avoid LZMA (too slow)

## Testing

```typescript
// Test compression ratio on sample
import { sampleTest } from '@/lib/compression';

const result = await sampleTest(file);
console.log(`Estimated ratio: ${result.ratio.toFixed(2)}x`);
console.log(`Sample size: ${result.sampleSize} bytes`);
console.log(`Test took: ${result.timeTaken}ms`);
```

## Future Enhancements

Potential improvements:

1. **WebAssembly LZMA**: Port LZMA SDK to WASM for better performance
2. **Worker threads**: Compress in background worker
3. **Streaming compression**: Real-time compression during transfer
4. **Adaptive quality**: Adjust quality based on file size and CPU load
5. **Dictionary sharing**: Reuse compression dictionaries across files
6. **Zstandard dictionaries**: Pre-trained dictionaries for specific file types

## License

Part of the Tallow secure file transfer system.
