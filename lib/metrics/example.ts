/**
 * Metrics System Example
 *
 * Demonstrates how to use the Tallow metrics system for monitoring
 * transfers, connections, encryption operations, and errors.
 *
 * Run this example:
 * ```bash
 * npm run dev
 * # In another terminal:
 * ts-node lib/metrics/example.ts
 * # Then check: curl http://localhost:3000/api/metrics
 * ```
 */

import {
  recordTransfer,
  recordBytes,
  recordConnection,
  updateActiveConnections,
  recordWebRTCConnectionTime,
  recordEncryption,
  recordDiscoveredDevices,
  recordActiveRooms,
  recordRoom,
  recordError,
  recordNetworkLatency,
  recordMetadataStripping,
  recordMemoryUsage,
  timedEncryption,
  timedTransfer,
  startTimer,
  getMetricsSnapshot,
} from './index';

/**
 * Simulate file transfer operations
 */
async function simulateFileTransfers() {
  console.log('📊 Simulating file transfers...');

  // Successful P2P transfer
  recordTransfer(
    5242880,     // 5 MB
    2.5,         // 2.5 seconds
    'success',
    'p2p',
    'image/png'
  );

  // Successful relay transfer
  recordTransfer(
    1048576,     // 1 MB
    5.0,         // 5 seconds
    'success',
    'relay',
    'application/pdf'
  );

  // Failed transfer
  recordTransfer(
    10485760,    // 10 MB
    8.0,         // 8 seconds
    'failed',
    'p2p',
    'video/mp4'
  );

  // Cancelled transfer
  recordTransfer(
    2097152,     // 2 MB
    1.5,         // 1.5 seconds
    'cancelled',
    'p2p',
    'text/plain'
  );

  // Record individual bytes
  recordBytes(1024000, 'sent');
  recordBytes(512000, 'received');

  console.log('✅ File transfers recorded');
}

/**
 * Simulate connection lifecycle
 */
async function simulateConnections() {
  console.log('📊 Simulating connections...');

  // Establish WebRTC connections
  recordConnection('webrtc', true, 'host');
  updateActiveConnections('webrtc', 1);
  recordWebRTCConnectionTime(0.5, 'host');

  recordConnection('webrtc', true, 'srflx');
  updateActiveConnections('webrtc', 1);
  recordWebRTCConnectionTime(1.2, 'srflx');

  recordConnection('webrtc', true, 'relay');
  updateActiveConnections('webrtc', 1);
  recordWebRTCConnectionTime(2.5, 'relay');

  // Failed connection attempt
  recordConnection('webrtc', false, 'host');
  recordError('network', 'medium');

  // Local network connections
  recordConnection('local', true);
  updateActiveConnections('local', 1);

  recordConnection('local', true);
  updateActiveConnections('local', 1);

  // Internet peer connections
  recordConnection('internet', true);
  updateActiveConnections('internet', 1);

  console.log('✅ Connections recorded');
}

/**
 * Simulate encryption operations
 */
async function simulateEncryption() {
  console.log('📊 Simulating encryption operations...');

  // ML-KEM (post-quantum) operations
  recordEncryption('ml-kem', 'keygen', 0.125);
  recordEncryption('ml-kem', 'encrypt', 0.015);
  recordEncryption('ml-kem', 'decrypt', 0.012);

  // ChaCha20-Poly1305 operations
  recordEncryption('chacha20', 'encrypt', 0.005);
  recordEncryption('chacha20', 'decrypt', 0.004);
  recordEncryption('chacha20', 'encrypt', 0.006);
  recordEncryption('chacha20', 'decrypt', 0.005);

  // AES-GCM operations
  recordEncryption('aes-gcm', 'encrypt', 0.003);
  recordEncryption('aes-gcm', 'decrypt', 0.003);

  // Ed25519 digital signatures
  recordEncryption('ed25519', 'sign', 0.002);
  recordEncryption('ed25519', 'verify', 0.004);

  console.log('✅ Encryption operations recorded');
}

/**
 * Simulate timed operations
 */
async function simulateTimedOperations() {
  console.log('📊 Simulating timed operations...');

  // Timed encryption
  await timedEncryption('aes-gcm', 'encrypt', async () => {
    // Simulate encryption work
    await new Promise(resolve => setTimeout(resolve, 10));
    return Buffer.from('encrypted data');
  });

  // Timed transfer
  await timedTransfer(
    'p2p',
    async () => {
      // Simulate transfer work
      await new Promise(resolve => setTimeout(resolve, 50));
    },
    3145728, // 3 MB
    'image/jpeg'
  );

  // Manual timing
  const stopTimer = startTimer();
  await new Promise(resolve => setTimeout(resolve, 25));
  const duration = stopTimer();
  recordEncryption('chacha20', 'encrypt', duration);

  console.log('✅ Timed operations recorded');
}

/**
 * Simulate discovery and rooms
 */
async function simulateDiscoveryAndRooms() {
  console.log('📊 Simulating discovery and rooms...');

  // Device discovery
  recordDiscoveredDevices(8);
  setTimeout(() => recordDiscoveredDevices(12), 100);
  setTimeout(() => recordDiscoveredDevices(15), 200);

  // Room operations
  recordRoom('created');
  recordActiveRooms(1);

  recordRoom('created');
  recordActiveRooms(2);

  recordRoom('joined');

  recordRoom('closed');
  recordActiveRooms(1);

  recordRoom('expired');
  recordActiveRooms(0);

  console.log('✅ Discovery and rooms recorded');
}

/**
 * Simulate errors
 */
async function simulateErrors() {
  console.log('📊 Simulating errors...');

  recordError('crypto', 'high');
  recordError('network', 'medium');
  recordError('transfer', 'low');
  recordError('validation', 'medium');
  recordError('auth', 'critical');
  recordError('storage', 'low');

  console.log('✅ Errors recorded');
}

/**
 * Simulate network metrics
 */
async function simulateNetworkMetrics() {
  console.log('📊 Simulating network metrics...');

  // Local network latency (low)
  recordNetworkLatency(0.002, 'local');
  recordNetworkLatency(0.003, 'local');
  recordNetworkLatency(0.001, 'local');

  // Internet latency (medium)
  recordNetworkLatency(0.045, 'internet');
  recordNetworkLatency(0.052, 'internet');
  recordNetworkLatency(0.038, 'internet');

  // Relay latency (high)
  recordNetworkLatency(0.125, 'relay');
  recordNetworkLatency(0.150, 'relay');

  console.log('✅ Network metrics recorded');
}

/**
 * Simulate privacy operations
 */
async function simulatePrivacyOperations() {
  console.log('📊 Simulating privacy operations...');

  recordMetadataStripping('image/jpeg');
  recordMetadataStripping('image/png');
  recordMetadataStripping('application/pdf');
  recordMetadataStripping('video/mp4');

  console.log('✅ Privacy operations recorded');
}

/**
 * Simulate system metrics
 */
async function simulateSystemMetrics() {
  console.log('📊 Simulating system metrics...');

  recordMemoryUsage(52428800, 'heap');      // 50 MB heap
  recordMemoryUsage(10485760, 'external');  // 10 MB external
  recordMemoryUsage(104857600, 'rss');      // 100 MB RSS

  console.log('✅ System metrics recorded');
}

/**
 * Main example runner
 */
async function runExample() {
  console.log('🚀 Starting Tallow Metrics Example\n');

  try {
    await simulateFileTransfers();
    await simulateConnections();
    await simulateEncryption();
    await simulateTimedOperations();
    await simulateDiscoveryAndRooms();
    await simulateErrors();
    await simulateNetworkMetrics();
    await simulatePrivacyOperations();
    await simulateSystemMetrics();

    console.log('\n✅ All metrics recorded successfully!');
    console.log('\n📊 Metrics Snapshot:');
    console.log('─'.repeat(80));
    console.log(getMetricsSnapshot());
    console.log('─'.repeat(80));

    console.log('\n💡 View metrics at: http://localhost:3000/api/metrics');
    console.log('💡 Or run: curl http://localhost:3000/api/metrics\n');

  } catch (error) {
    console.error('❌ Error running example:', error);
    throw error;
  }
}

/**
 * Run if executed directly
 */
if (require.main === module) {
  runExample().catch(console.error);
}

export {
  runExample,
  simulateFileTransfers,
  simulateConnections,
  simulateEncryption,
  simulateTimedOperations,
  simulateDiscoveryAndRooms,
  simulateErrors,
  simulateNetworkMetrics,
  simulatePrivacyOperations,
  simulateSystemMetrics,
};
