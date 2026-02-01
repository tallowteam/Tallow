#!/usr/bin/env node

/**
 * Security Features Verification Script
 *
 * This script verifies that all security features are properly implemented:
 * 1. Credential encryption
 * 2. Key rotation
 * 3. Memory wiping
 * 4. Timing-safe comparisons
 *
 * Run: npx tsx scripts/verify-security-features.ts
 */

import { performance } from 'perf_hooks';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message: string) {
  log(`✅ ${message}`, colors.green);
}

function error(message: string) {
  log(`❌ ${message}`, colors.red);
}

function info(message: string) {
  log(`ℹ️  ${message}`, colors.blue);
}

function section(title: string) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(title, colors.cyan);
  log('='.repeat(60), colors.cyan);
}

// Verification functions
async function verifyMemoryWiper() {
  section('Task #22: Memory Wiping');

  try {
    const { memoryWiper } = await import('../lib/security/memory-wiper');

    // Test 1: Buffer wiping
    const buffer = new Uint8Array([1, 2, 3, 4, 5]);
    memoryWiper.wipeBuffer(buffer);
    const isWiped = buffer.every((byte) => byte === 0);

    if (isWiped) {
      success('Buffer wiping works correctly');
    } else {
      error('Buffer wiping failed - data not zeroed');
      return false;
    }

    // Test 2: Object wiping
    const obj = {
      key: new Uint8Array([1, 2, 3]),
      nested: { secret: new Uint8Array([4, 5, 6]) },
    };
    memoryWiper.wipeObject(obj);
    const objWiped =
      obj.key.every((b) => b === 0) &&
      obj.nested.secret.every((b) => b === 0);

    if (objWiped) {
      success('Object wiping works correctly');
    } else {
      error('Object wiping failed');
      return false;
    }

    // Test 3: Secure wrapper
    const wrapper = memoryWiper.createWrapper(new Uint8Array([1, 2, 3]));
    const data = wrapper.data;
    wrapper.dispose();

    if (data.every((b) => b === 0)) {
      success('Secure wrapper auto-wipe works correctly');
    } else {
      error('Secure wrapper failed to wipe');
      return false;
    }

    return true;
  } catch (err) {
    error(`Memory wiper verification failed: ${err}`);
    return false;
  }
}

async function verifyTimingSafe() {
  section('Task #23: Timing-Safe Comparisons');

  try {
    const { timingSafe } = await import('../lib/security/timing-safe');

    // Test 1: Equal buffers
    const buf1 = new Uint8Array([1, 2, 3]);
    const buf2 = new Uint8Array([1, 2, 3]);
    const equal = timingSafe.equal(buf1, buf2);

    if (equal) {
      success('Timing-safe buffer comparison works (equal case)');
    } else {
      error('Timing-safe comparison failed for equal buffers');
      return false;
    }

    // Test 2: Different buffers
    const buf3 = new Uint8Array([1, 2, 4]);
    const notEqual = !timingSafe.equal(buf1, buf3);

    if (notEqual) {
      success('Timing-safe buffer comparison works (not equal case)');
    } else {
      error('Timing-safe comparison failed for different buffers');
      return false;
    }

    // Test 3: String comparison
    const strEqual = timingSafe.stringCompare('test', 'test');
    const strNotEqual = !timingSafe.stringCompare('test', 'wrong');

    if (strEqual && strNotEqual) {
      success('Timing-safe string comparison works');
    } else {
      error('Timing-safe string comparison failed');
      return false;
    }

    // Test 4: Token comparison
    const token1 = 'secret-token-123';
    const token2 = 'secret-token-123';
    const tokenMatch = timingSafe.tokenCompare(token1, token2);

    if (tokenMatch) {
      success('Timing-safe token comparison works');
    } else {
      error('Timing-safe token comparison failed');
      return false;
    }

    // Test 5: Timing enforcement
    const start = performance.now();
    await timingSafe.operation(async () => {
      // Fast operation
      return 'done';
    }, 50);
    const elapsed = performance.now() - start;

    if (elapsed >= 45) {
      // Allow some variance
      success(`Timing enforcement works (${elapsed.toFixed(2)}ms)`);
    } else {
      error('Timing enforcement failed - operation too fast');
      return false;
    }

    return true;
  } catch (err) {
    error(`Timing-safe verification failed: ${err}`);
    return false;
  }
}

async function verifyKeyRotation() {
  section('Task #21: Session Key Rotation');

  try {
    const { KeyRotationManager } = await import('../lib/security/key-rotation');

    // Test 1: Initialization
    const manager = new KeyRotationManager({
      rotationIntervalMs: 1000,
      maxGenerations: 10,
      enableAutoRotation: false,
    });

    const secret = new Uint8Array(32);
    crypto.getRandomValues(secret);

    const keys = manager.initialize(secret);

    if (keys.generation === 0) {
      success('Key rotation manager initialized correctly');
    } else {
      error('Key rotation initialization failed');
      return false;
    }

    // Test 2: Rotation
    const oldEncKey = new Uint8Array(keys.encryptionKey);
    const rotatedKeys = manager.rotateKeys();

    if (
      rotatedKeys.generation === 1 &&
      !timingSafeEqual(rotatedKeys.encryptionKey, oldEncKey)
    ) {
      success('Key rotation works correctly');
    } else {
      error('Key rotation failed');
      return false;
    }

    // Test 3: Forward secrecy (old key wiped)
    if (oldEncKey.every((b) => b === 0)) {
      success('Forward secrecy verified - old keys wiped');
    } else {
      error('Forward secrecy failed - old keys not wiped');
      return false;
    }

    // Test 4: State export
    const state = manager.exportState();
    if (state && state.generation === 1) {
      success('State export works correctly');
    } else {
      error('State export failed');
      return false;
    }

    // Test 5: Cleanup
    manager.destroy();
    if (rotatedKeys.encryptionKey.every((b) => b === 0)) {
      success('Cleanup wipes keys correctly');
    } else {
      error('Cleanup failed to wipe keys');
      return false;
    }

    return true;
  } catch (err) {
    error(`Key rotation verification failed: ${err}`);
    return false;
  }
}

async function verifyCredentialEncryption() {
  section('Task #20: Credential Encryption');

  try {
    const { default: CredentialEncryption } = await import(
      '../lib/security/credential-encryption'
    );

    // Test 1: Encrypt credentials
    const plaintext = {
      urls: ['turn:example.com:3478'],
      username: 'testuser',
      credential: 'testpassword',
      credentialType: 'password' as const,
    };

    const encrypted = await CredentialEncryption.encryptTurnCredentials(
      plaintext
    );

    if (encrypted.encrypted && encrypted.encryptedUsername) {
      success('Credential encryption works');
    } else {
      error('Credential encryption failed');
      return false;
    }

    // Test 2: Decrypt credentials
    const decrypted = await CredentialEncryption.decryptTurnCredentials(
      encrypted
    );

    if (
      decrypted.username === plaintext.username &&
      decrypted.credential === plaintext.credential
    ) {
      success('Credential decryption works');
    } else {
      error('Credential decryption failed');
      return false;
    }

    // Test 3: Batch operations
    const batch = [plaintext, plaintext];
    const encryptedBatch = await CredentialEncryption.migrateCredentials(batch);
    const firstEncrypted = encryptedBatch[0];

    if (encryptedBatch.length === 2 && firstEncrypted && firstEncrypted.encrypted) {
      success('Batch credential encryption works');
    } else {
      error('Batch credential encryption failed');
      return false;
    }

    return true;
  } catch (err) {
    error(`Credential encryption verification failed: ${err}`);
    return false;
  }
}

// Helper for timing-safe equal (Node.js environment)
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    const aVal = a[i];
    const bVal = b[i];
    if (aVal !== undefined && bVal !== undefined) {
      result |= aVal ^ bVal;
    }
  }
  return result === 0;
}

// Performance benchmarks
async function runBenchmarks() {
  section('Performance Benchmarks');

  try {
    const { memoryWiper } = await import('../lib/security/memory-wiper');
    const { timingSafe } = await import('../lib/security/timing-safe');
    const { KeyRotationManager } = await import('../lib/security/key-rotation');

    // Benchmark 1: Memory wiping (1MB)
    const largeBuf = new Uint8Array(1024 * 1024);
    const wipeStart = performance.now();
    memoryWiper.wipeBuffer(largeBuf);
    const wipeTime = performance.now() - wipeStart;

    info(`Memory wipe (1MB): ${wipeTime.toFixed(2)}ms`);
    if (wipeTime < 10) {
      success('Memory wipe performance acceptable');
    } else {
      error('Memory wipe too slow');
    }

    // Benchmark 2: Timing-safe comparison
    const compBuf1 = new Uint8Array(1000);
    const compBuf2 = new Uint8Array(1000);
    const compStart = performance.now();
    for (let i = 0; i < 1000; i++) {
      timingSafe.equal(compBuf1, compBuf2);
    }
    const compTime = (performance.now() - compStart) / 1000;

    info(`Timing-safe compare: ${compTime.toFixed(3)}ms per call`);
    if (compTime < 0.1) {
      success('Timing-safe comparison performance acceptable');
    } else {
      error('Timing-safe comparison too slow');
    }

    // Benchmark 3: Key rotation
    const manager = new KeyRotationManager();
    const secret = new Uint8Array(32);
    crypto.getRandomValues(secret);
    manager.initialize(secret);

    const rotStart = performance.now();
    manager.rotateKeys();
    const rotTime = performance.now() - rotStart;

    info(`Key rotation: ${rotTime.toFixed(2)}ms`);
    if (rotTime < 5) {
      success('Key rotation performance acceptable');
    } else {
      error('Key rotation too slow');
    }

    manager.destroy();
  } catch (err) {
    error(`Benchmarks failed: ${err}`);
  }
}

// Main verification
async function main() {
  log('\n🔐 Security Features Verification Tool\n', colors.cyan);

  const results = {
    memoryWiper: false,
    timingSafe: false,
    keyRotation: false,
    credentialEncryption: false,
  };

  // Run verifications
  results.memoryWiper = await verifyMemoryWiper();
  results.timingSafe = await verifyTimingSafe();
  results.keyRotation = await verifyKeyRotation();
  results.credentialEncryption = await verifyCredentialEncryption();

  // Run benchmarks
  await runBenchmarks();

  // Summary
  section('Verification Summary');

  const allPassed = Object.values(results).every((r) => r === true);

  if (allPassed) {
    success('All security features verified successfully! ✨');
    process.exit(0);
  } else {
    error('Some security features failed verification');
    log('\nFailed features:', colors.red);
    Object.entries(results).forEach(([feature, passed]) => {
      if (!passed) {
        log(`  - ${feature}`, colors.red);
      }
    });
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((err) => {
    error(`Fatal error: ${err}`);
    process.exit(1);
  });
}

export { verifyMemoryWiper, verifyTimingSafe, verifyKeyRotation, verifyCredentialEncryption };
