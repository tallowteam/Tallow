/**
 * Web Worker IPC Examples
 * Comprehensive examples demonstrating all features of the worker IPC system.
 */

import { WorkerBridge } from './worker-bridge';
import { createIPCProtocol } from './ipc-protocol';
import { createWorkerPool } from './worker-pool';
import {
  isSharedArrayBufferAvailable,
  createProgressTracker,
  createCancellationToken,
} from './shared-state';

/**
 * Example 1: Basic File Encryption
 * Demonstrates using WorkerBridge for simple encryption
 */
export async function example1_basicEncryption() {
  const file = new File(['Hello, World!'], 'test.txt');
  const data = await file.arrayBuffer();

  // Generate encryption key and nonce
  const key = crypto.getRandomValues(new Uint8Array(32));
  const nonce = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt using worker (with automatic fallback)
  const result = await WorkerBridge.crypto.encryptFile(data, key, nonce);

  console.log('Encrypted:', result.ciphertext.byteLength, 'bytes');

  // Decrypt
  const decrypted = await WorkerBridge.crypto.decryptFile(
    result.ciphertext,
    key,
    new Uint8Array(result.nonce)
  );

  const text = new TextDecoder().decode(decrypted);
  console.log('Decrypted:', text); // "Hello, World!"
}

/**
 * Example 2: File Processing with Progress
 * Demonstrates progress tracking during file operations
 */
export async function example2_progressTracking() {
  const file = new File([new Uint8Array(1024 * 1024 * 10)], 'large.bin'); // 10 MB
  const data = await file.arrayBuffer();

  let currentProgress = 0;

  const hash = await WorkerBridge.crypto.hashFile(data, {
    onProgress: (progress) => {
      currentProgress = progress.progress;
      console.log(`Hashing: ${currentProgress.toFixed(1)}%`);

      // Update UI
      const progressBar = document.getElementById('progress-bar');
      if (progressBar) {
        progressBar.style.width = `${currentProgress}%`;
      }
    },
  });

  console.log('File hash:', hash);
}

/**
 * Example 3: Parallel File Processing
 * Demonstrates processing multiple files in parallel using worker pool
 */
export async function example3_parallelProcessing() {
  const files = [
    new File([new Uint8Array(1024 * 1024)], 'file1.bin'),
    new File([new Uint8Array(1024 * 1024)], 'file2.bin'),
    new File([new Uint8Array(1024 * 1024)], 'file3.bin'),
    new File([new Uint8Array(1024 * 1024)], 'file4.bin'),
  ];

  // Process all files in parallel
  const results = await Promise.all(
    files.map(async (file) => {
      const data = await file.arrayBuffer();
      const hash = await WorkerBridge.crypto.hashFile(data);
      return { file: file.name, hash };
    })
  );

  console.log('Hashes:', results);

  // Get pool statistics
  const stats = WorkerBridge.crypto.getStats();
  console.log('Worker pool stats:', stats);
}

/**
 * Example 4: Cancellable Long Operation
 * Demonstrates cancellation using SharedCancellation
 */
export async function example4_cancellation() {
  const { cancellation, cancel, cleanup } = createCancellationToken();

  // Create large file to process
  const largeFile = new File([new Uint8Array(100 * 1024 * 1024)], 'huge.bin'); // 100 MB
  const data = await largeFile.arrayBuffer();

  // Setup cancel button
  const cancelButton = document.getElementById('cancel-btn');
  if (cancelButton) {
    cancelButton.onclick = () => {
      console.log('Cancelling operation...');
      cancel();
    };
  }

  try {
    cancellation.toAbortSignal();

    const hash = await WorkerBridge.crypto.hashFile(data, {
      onProgress: (progress) => {
        console.log(`Progress: ${progress.progress}%`);

        // Check for cancellation
        if (cancellation.isCancelled()) {
          console.log('Operation cancelled!');
        }
      },
    });

    console.log('Hash:', hash);
  } catch (error) {
    if ((error as any).name === 'AbortError') {
      console.log('Operation was cancelled');
    } else {
      console.error('Error:', error);
    }
  } finally {
    cleanup();
  }
}

/**
 * Example 5: Network Connectivity Testing
 * Demonstrates parallel network testing
 */
export async function example5_networkTesting() {
  const urls = [
    'https://www.google.com',
    'https://www.cloudflare.com',
    'https://www.github.com',
    'https://www.npmjs.com',
  ];

  console.log('Testing connectivity...');

  const results = await WorkerBridge.network.testConnectivity(urls, 5000);

  results.forEach((result) => {
    console.log(
      `${result.url}: ${result.reachable ? '✓' : '✗'} (${result.responseTime.toFixed(0)}ms)`
    );
  });

  // Test latency to fastest server
  const reachable = results.filter((r) => r.reachable);
  if (reachable.length > 0) {
    const fastest = reachable.reduce((prev, curr) =>
      prev.responseTime < curr.responseTime ? prev : curr
    );

    const latency = await WorkerBridge.network.latencyCheck(fastest.url, 10);

    console.log(`Latency to ${fastest.url}:`, {
      average: `${latency.averageLatency.toFixed(1)}ms`,
      min: `${latency.minLatency.toFixed(1)}ms`,
      max: `${latency.maxLatency.toFixed(1)}ms`,
    });
  }
}

/**
 * Example 6: File Chunking and Reassembly
 * Demonstrates splitting and merging files
 */
export async function example6_fileChunking() {
  const file = new File([new Uint8Array(10 * 1024 * 1024)], 'data.bin'); // 10 MB
  const data = await file.arrayBuffer();

  const CHUNK_SIZE = 1024 * 1024; // 1 MB chunks

  console.log('Chunking file...');

  // Split into chunks
  const { chunks, metadata } = await WorkerBridge.file.chunkFile(
    data,
    CHUNK_SIZE,
    file.name,
    {
      onProgress: (progress) => {
        console.log(`Chunking: ${progress.progress}%`);
      },
    }
  );

  console.log('Chunk metadata:', metadata);
  console.log(`Created ${chunks.length} chunks`);

  // Simulate transfer/processing of chunks...

  console.log('Reassembling file...');

  // Merge chunks back
  const reassembled = await WorkerBridge.file.mergeChunks(chunks, {
    onProgress: (progress) => {
      console.log(`Merging: ${progress.progress}%`);
    },
  });

  console.log('Original size:', data.byteLength);
  console.log('Reassembled size:', reassembled.byteLength);
  console.log('Match:', data.byteLength === reassembled.byteLength);
}

/**
 * Example 7: Data Compression
 * Demonstrates compression and decompression
 */
export async function example7_compression() {
  const text = 'Hello, World! '.repeat(1000); // Repetitive text compresses well
  const data = new TextEncoder().encode(text);

  console.log('Original size:', data.byteLength, 'bytes');

  // Compress
  const compressed = await WorkerBridge.compression.compressData(data.buffer, {
    algorithm: 'gzip',
    level: 6,
  });

  console.log('Compressed size:', compressed.byteLength, 'bytes');
  console.log(
    'Compression ratio:',
    ((1 - compressed.byteLength / data.byteLength) * 100).toFixed(1) + '%'
  );

  // Decompress
  const decompressed = await WorkerBridge.compression.decompressData(
    compressed,
    'gzip'
  );

  const decompressedText = new TextDecoder().decode(decompressed);
  console.log('Decompressed matches original:', decompressedText === text);
}

/**
 * Example 8: Shared Progress Across Workers
 * Demonstrates SharedArrayBuffer-based progress tracking
 */
export async function example8_sharedProgress() {
  if (!isSharedArrayBufferAvailable()) {
    console.warn('SharedArrayBuffer not available, using fallback');
  }

  const { progress, cleanup } = createProgressTracker(1000);

  // Simulate work in main thread
  const interval = setInterval(() => {
    console.log(`Progress: ${progress.getPercent().toFixed(1)}%`);

    if (progress.get() >= progress.getTotal()) {
      clearInterval(interval);
      cleanup();
    }
  }, 100);

  // Simulate incremental work
  for (let i = 0; i < 1000; i++) {
    await new Promise((resolve) => setTimeout(resolve, 10));
    progress.increment();
  }
}

/**
 * Example 9: Custom Worker with IPC Protocol
 * Demonstrates creating a custom worker with proper IPC
 */
export async function example9_customWorker() {
  const protocol = createIPCProtocol({
    defaultTimeout: 30000,
    debug: true,
  });

  // Create custom worker (would need actual worker file)
  // const worker = new Worker('/workers/custom.worker.ts');

  // Setup message handler
  // worker.onmessage = (event) => {
  //   protocol.handleMessage(event);
  // };

  // Send request
  // const result = await protocol.request(
  //   worker,
  //   'custom-operation',
  //   'custom',
  //   { input: 'test data' },
  //   {
  //     timeout: 60000,
  //     onProgress: (progress) => {
  //       console.log('Progress:', progress.progress);
  //     }
  //   }
  // );

  // console.log('Result:', result);

  // Cleanup
  protocol.destroy();
  // worker.terminate();
}

/**
 * Example 10: Worker Pool Statistics and Monitoring
 * Demonstrates monitoring worker pool health
 */
export async function example10_poolMonitoring() {
  const pool = createWorkerPool('/workers/crypto.worker.ts', 4, {
    strategy: 'least-busy',
    taskTimeout: 30000,
  });

  // Submit multiple tasks
  const tasks = Array.from({ length: 20 }, (_, i) => ({
    id: `task-${i}`,
    type: 'hash',
    channel: 'crypto' as const,
    payload: { data: new Uint8Array(1024 * 1024).buffer },
    timestamp: Date.now(),
  }));

  const taskPromises = tasks.map((task) => pool.execute(task));

  // Monitor pool in real-time
  const monitorInterval = setInterval(() => {
    const stats = pool.getStats();
    console.log('Pool Stats:', {
      busy: `${stats.busyWorkers}/${stats.poolSize}`,
      queued: stats.queuedTasks,
      processed: stats.totalTasksProcessed,
      errors: stats.totalErrors,
    });
  }, 500);

  // Wait for all tasks
  await Promise.all(taskPromises);

  clearInterval(monitorInterval);

  // Final stats
  const finalStats = pool.getStats();
  console.log('Final Stats:', finalStats);

  pool.terminate();
}

/**
 * Example 11: Error Handling and Retries
 * Demonstrates robust error handling
 */
export async function example11_errorHandling() {
  try {
    // This will fail with invalid data
    const invalidData = new ArrayBuffer(0);
    const key = new Uint8Array(32);
    const nonce = new Uint8Array(12);

    await WorkerBridge.crypto.encryptFile(invalidData, key, nonce);
  } catch (error) {
    console.error('Expected error caught:', error);
  }

  // Retry logic
  async function hashWithRetry(
    data: ArrayBuffer,
    maxRetries: number = 3
  ): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${maxRetries}`);
        return await WorkerBridge.crypto.hashFile(data);
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt} failed:`, error);

        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }

  const data = new Uint8Array(1024).buffer;
  const hash = await hashWithRetry(data);
  console.log('Hash with retry:', hash);
}

/**
 * Example 12: Batch Processing with Rate Limiting
 * Demonstrates processing large batches with concurrency control
 */
export async function example12_batchProcessing() {
  const files = Array.from({ length: 100 }, (_, i) => ({
    name: `file-${i}.bin`,
    data: new Uint8Array(1024 * 1024).buffer, // 1 MB each
  }));

  // Process in batches of 5
  const BATCH_SIZE = 5;

  console.log(`Processing ${files.length} files in batches of ${BATCH_SIZE}...`);

  const results: string[] = [];

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);

    console.log(
      `Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(files.length / BATCH_SIZE)}`
    );

    const batchResults = await Promise.all(
      batch.map((file) => WorkerBridge.crypto.hashFile(file.data))
    );

    results.push(...batchResults);

    // Small delay between batches
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`Processed ${results.length} files`);
}

/**
 * Example 13: Complete File Transfer Simulation
 * Demonstrates a realistic file transfer scenario with encryption, chunking, and progress
 */
export async function example13_fileTransfer() {
  // Simulated large file
  const fileSize = 50 * 1024 * 1024; // 50 MB
  const file = new File([new Uint8Array(fileSize)], 'transfer.bin');
  const data = await file.arrayBuffer();

  console.log('=== File Transfer Simulation ===');
  console.log(`File: ${file.name}, Size: ${(fileSize / 1024 / 1024).toFixed(1)} MB`);

  // Step 1: Hash original file
  console.log('\n1. Hashing original file...');
  const originalHash = await WorkerBridge.crypto.hashFile(data, {
    onProgress: (p) => console.log(`   Hashing: ${p.progress.toFixed(1)}%`),
  });
  console.log(`   Hash: ${originalHash.substring(0, 16)}...`);

  // Step 2: Compress file
  console.log('\n2. Compressing file...');
  const compressed = await WorkerBridge.compression.compressData(data, {
    algorithm: 'gzip',
    level: 6,
  });
  const compressionRatio = ((1 - compressed.byteLength / fileSize) * 100).toFixed(1);
  console.log(
    `   Compressed: ${(compressed.byteLength / 1024 / 1024).toFixed(1)} MB (${compressionRatio}% reduction)`
  );

  // Step 3: Encrypt compressed data
  console.log('\n3. Encrypting compressed file...');
  const key = crypto.getRandomValues(new Uint8Array(32));
  const nonce = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await WorkerBridge.crypto.encryptFile(compressed, key, nonce, {
    onProgress: (p) => console.log(`   Encrypting: ${p.progress.toFixed(1)}%`),
  });
  console.log(`   Encrypted: ${(encrypted.ciphertext.byteLength / 1024 / 1024).toFixed(1)} MB`);

  // Step 4: Chunk encrypted data for transfer
  console.log('\n4. Chunking for transfer...');
  const CHUNK_SIZE = 1024 * 1024; // 1 MB chunks
  const { chunks, metadata } = await WorkerBridge.file.chunkFile(
    encrypted.ciphertext,
    CHUNK_SIZE,
    file.name,
    {
      onProgress: (p) => console.log(`   Chunking: ${p.progress.toFixed(1)}%`),
    }
  );
  console.log(`   Created ${chunks.length} chunks`);
  console.log(`   Chunk size: ${metadata.chunkSize} bytes`);

  // Simulate transfer...
  console.log('\n5. Simulating transfer...');
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log('   Transfer complete');

  // Step 5: Reassemble chunks
  console.log('\n6. Reassembling chunks...');
  const reassembled = await WorkerBridge.file.mergeChunks(chunks, {
    onProgress: (p) => console.log(`   Merging: ${p.progress.toFixed(1)}%`),
  });

  // Step 6: Decrypt
  console.log('\n7. Decrypting...');
  const decrypted = await WorkerBridge.crypto.decryptFile(
    reassembled,
    key,
    new Uint8Array(encrypted.nonce),
    {
      onProgress: (p) => console.log(`   Decrypting: ${p.progress.toFixed(1)}%`),
    }
  );

  // Step 7: Decompress
  console.log('\n8. Decompressing...');
  const decompressed = await WorkerBridge.compression.decompressData(decrypted, 'gzip');

  // Step 8: Verify integrity
  console.log('\n9. Verifying integrity...');
  const finalHash = await WorkerBridge.crypto.hashFile(decompressed, {
    onProgress: (p) => console.log(`   Hashing: ${p.progress.toFixed(1)}%`),
  });

  const verified = originalHash === finalHash;
  console.log(`   Original hash: ${originalHash.substring(0, 16)}...`);
  console.log(`   Final hash:    ${finalHash.substring(0, 16)}...`);
  console.log(`   Verified: ${verified ? '✓' : '✗'}`);

  console.log('\n=== Transfer Complete ===');
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  const examples = [
    { name: 'Basic Encryption', fn: example1_basicEncryption },
    { name: 'Progress Tracking', fn: example2_progressTracking },
    { name: 'Parallel Processing', fn: example3_parallelProcessing },
    { name: 'Cancellation', fn: example4_cancellation },
    { name: 'Network Testing', fn: example5_networkTesting },
    { name: 'File Chunking', fn: example6_fileChunking },
    { name: 'Compression', fn: example7_compression },
    { name: 'Shared Progress', fn: example8_sharedProgress },
    { name: 'Custom Worker', fn: example9_customWorker },
    { name: 'Pool Monitoring', fn: example10_poolMonitoring },
    { name: 'Error Handling', fn: example11_errorHandling },
    { name: 'Batch Processing', fn: example12_batchProcessing },
    { name: 'File Transfer', fn: example13_fileTransfer },
  ];

  for (const example of examples) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Running: ${example.name}`);
    console.log('='.repeat(60));

    try {
      await example.fn();
      console.log(`✓ ${example.name} completed`);
    } catch (error) {
      console.error(`✗ ${example.name} failed:`, error);
    }

    // Delay between examples
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('All examples completed');
  console.log('='.repeat(60));

  // Cleanup
  WorkerBridge.destroyAll();
}
