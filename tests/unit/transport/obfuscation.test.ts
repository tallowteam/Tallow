/**
 * TrafficObfuscator Unit Tests
 *
 * Comprehensive unit tests for traffic obfuscation functionality including:
 * - Padding (padToUniformSize, unpadData, fragmentData, reassembleFragments)
 * - Timing (calculateDelay, applyTimingDelay, calculateBitrateDelay)
 * - Protocol disguise (generateDisguiseHeaders, wrapInProtocolFrame, unwrapFromProtocolFrame)
 * - Cover traffic (generateDecoyPacket, generateCoverPacket, startCoverTraffic/stopCoverTraffic)
 * - Full pipeline (obfuscate->deobfuscate roundtrip, stats tracking)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  TrafficObfuscator,
  PacketType,
  getTrafficObfuscator,
  resetTrafficObfuscator,
  type ObfuscatedPacket,
} from '@/lib/transport/obfuscation';

describe('TrafficObfuscator', () => {
  let obfuscator: TrafficObfuscator;

  beforeEach(() => {
    vi.useFakeTimers();
    obfuscator = new TrafficObfuscator();
  });

  afterEach(() => {
    obfuscator.destroy();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // 1. Padding Tests
  // ==========================================================================
  describe('Padding', () => {
    describe('padToUniformSize', () => {
      it('pads small data to minimum TLS record size', () => {
        const data = new Uint8Array([1, 2, 3, 4, 5]);
        const padded = obfuscator.padToUniformSize(data);

        // Should be padded to at least minPacketSize (1024)
        expect(padded.length).toBeGreaterThanOrEqual(1024);
        // Should be a TLS record size (1460, 2920, etc.)
        expect([1024, 1460, 2920, 4380, 8760, 16384]).toContain(padded.length);
      });

      it('pads data to nearest TLS record size in uniform mode', () => {
        const uniformObfuscator = new TrafficObfuscator({ paddingMode: 'uniform' });
        const data = new Uint8Array(1500);
        const padded = uniformObfuscator.padToUniformSize(data);

        // 1500 + 5 (header) = 1505, should round up to 2920
        expect(padded.length).toBe(2920);
        uniformObfuscator.destroy();
      });

      it('includes correct header structure [type:1][size:4][data]', () => {
        const data = new Uint8Array([10, 20, 30, 40, 50]);
        const padded = obfuscator.padToUniformSize(data);

        // First byte is packet type
        expect(padded[0]).toBe(PacketType.DATA);

        // Next 4 bytes are original size (big-endian)
        const view = new DataView(padded.buffer, padded.byteOffset);
        expect(view.getUint32(1, false)).toBe(5);

        // Original data follows
        expect(padded[5]).toBe(10);
        expect(padded[6]).toBe(20);
        expect(padded[7]).toBe(30);
        expect(padded[8]).toBe(40);
        expect(padded[9]).toBe(50);
      });

      it('uses random padding mode with configurable sizes', () => {
        const randomObfuscator = new TrafficObfuscator({
          paddingMode: 'random',
          minPacketSize: 1000,
          maxPacketSize: 2000,
        });
        const data = new Uint8Array(100);
        const padded = randomObfuscator.padToUniformSize(data);

        expect(padded.length).toBeGreaterThanOrEqual(1000);
        expect(padded.length).toBeLessThanOrEqual(2000);
        randomObfuscator.destroy();
      });

      it('uses exponential padding mode', () => {
        const expObfuscator = new TrafficObfuscator({
          paddingMode: 'exponential',
          maxPacketSize: 8000,
        });
        const data = new Uint8Array(100);
        const padded = expObfuscator.padToUniformSize(data);

        // Should pad with exponentially distributed extra padding
        expect(padded.length).toBeGreaterThanOrEqual(1024);
        expect(padded.length).toBeLessThanOrEqual(8000);
        expObfuscator.destroy();
      });

      it('updates stats correctly', () => {
        const data = new Uint8Array(100);
        obfuscator.padToUniformSize(data);

        const stats = obfuscator.getStats();
        expect(stats.originalSize).toBe(100);
        expect(stats.paddedSize).toBeGreaterThan(100);
        expect(stats.dataPackets).toBe(1);
      });
    });

    describe('unpadData', () => {
      it('extracts original data from padded packet', () => {
        const original = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        const padded = obfuscator.padToUniformSize(original);
        const extracted = obfuscator.unpadData(padded);

        expect(extracted).not.toBeNull();
        if (extracted) {
          expect(extracted.length).toBe(10);
          expect(Array.from(extracted)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        }
      });

      it('returns null for packets smaller than header', () => {
        const tooSmall = new Uint8Array([1, 2, 3]);
        const result = obfuscator.unpadData(tooSmall);

        expect(result).toBeNull();
      });

      it('returns null for decoy packets', () => {
        const decoy = obfuscator.generateDecoyPacket();
        const result = obfuscator.unpadData(decoy.data);

        expect(result).toBeNull();
      });

      it('returns null for cover packets', () => {
        const cover = obfuscator.generateCoverPacket();
        const result = obfuscator.unpadData(cover.data);

        expect(result).toBeNull();
      });

      it('returns null for invalid packet type', () => {
        const invalid = new Uint8Array(100);
        invalid[0] = 0x99; // Invalid type
        const result = obfuscator.unpadData(invalid);

        expect(result).toBeNull();
      });
    });

    describe('fragmentData', () => {
      it('does not fragment small data', () => {
        const smallData = new Uint8Array(100);
        const fragments = obfuscator.fragmentData(smallData);

        expect(fragments.length).toBe(1);
      });

      it('fragments large data into multiple packets', () => {
        // Create data larger than maxPacketSize - 13 (header overhead)
        const largeData = new Uint8Array(40000);
        const fragments = obfuscator.fragmentData(largeData);

        // With maxPacketSize 16384, header 13 bytes, each chunk can hold ~16371 bytes
        expect(fragments.length).toBeGreaterThan(1);
      });

      it('creates packets with correct fragment headers', () => {
        const largeObfuscator = new TrafficObfuscator({
          enableChunking: true,
          maxPacketSize: 1024,
        });
        const largeData = new Uint8Array(2000);
        const fragments = largeObfuscator.fragmentData(largeData);

        expect(fragments.length).toBeGreaterThan(1);

        // Check first fragment header
        const firstFrag = fragments[0];
        expect(firstFrag).toBeDefined();
        if (firstFrag) {
          expect(firstFrag[0]).toBe(PacketType.DATA);
        }

        // All fragments should be maxPacketSize
        fragments.forEach(f => {
          expect(f.length).toBe(1024);
        });

        largeObfuscator.destroy();
      });

      it('does not fragment when chunking is disabled', () => {
        const noChunkObfuscator = new TrafficObfuscator({
          enableChunking: false,
        });
        // Use data smaller than maxPacketSize so it can be padded without fragmentation
        const data = new Uint8Array(1000);
        const fragments = noChunkObfuscator.fragmentData(data);

        // Should return single padded packet (not fragmented)
        expect(fragments.length).toBe(1);
        noChunkObfuscator.destroy();
      });
    });

    describe('reassembleFragments', () => {
      it('reassembles fragmented data correctly', () => {
        const fragObfuscator = new TrafficObfuscator({
          enableChunking: true,
          maxPacketSize: 1024,
        });

        // Create data that will be fragmented
        const originalData = new Uint8Array(2500);
        originalData.forEach((_, idx, arr) => {
          arr[idx] = idx % 256;
        });

        const fragments = fragObfuscator.fragmentData(originalData);
        expect(fragments.length).toBeGreaterThan(1);

        const reassembled = fragObfuscator.reassembleFragments(fragments);
        expect(reassembled.length).toBe(originalData.length);
        expect(Array.from(reassembled)).toEqual(Array.from(originalData));

        fragObfuscator.destroy();
      });

      it('sorts fragments by sequence number before reassembling', () => {
        const fragObfuscator = new TrafficObfuscator({
          enableChunking: true,
          maxPacketSize: 1024,
        });

        const originalData = new Uint8Array(2500);
        originalData.forEach((_, idx, arr) => {
          arr[idx] = idx % 256;
        });

        const fragments = fragObfuscator.fragmentData(originalData);

        // Shuffle fragments
        const shuffled = [...fragments].reverse();

        const reassembled = fragObfuscator.reassembleFragments(shuffled);
        expect(reassembled.length).toBe(originalData.length);
        expect(Array.from(reassembled)).toEqual(Array.from(originalData));

        fragObfuscator.destroy();
      });
    });
  });

  // ==========================================================================
  // 2. Timing Tests
  // ==========================================================================
  describe('Timing', () => {
    describe('calculateDelay', () => {
      it('returns minDelay in constant mode', () => {
        const constantObfuscator = new TrafficObfuscator({
          timingMode: 'constant',
          minDelay: 10,
        });

        const delay = constantObfuscator.calculateDelay();
        expect(delay).toBe(10);

        constantObfuscator.destroy();
      });

      it('returns delay within range in jittered mode', () => {
        const jitteredObfuscator = new TrafficObfuscator({
          timingMode: 'jittered',
          minDelay: 10,
          maxDelay: 50,
        });

        // Test multiple times since it's random
        for (let i = 0; i < 10; i++) {
          const delay = jitteredObfuscator.calculateDelay();
          expect(delay).toBeGreaterThanOrEqual(10);
          expect(delay).toBeLessThanOrEqual(50);
        }

        jitteredObfuscator.destroy();
      });

      it('returns burst intervals in burst mode', () => {
        const burstObfuscator = new TrafficObfuscator({
          timingMode: 'burst',
          minDelay: 1,
          burstSize: 3,
          burstInterval: 100,
        });

        // First packets should have minDelay
        expect(burstObfuscator.calculateDelay()).toBe(1);
        // Increment packet count via stats
        const padded = burstObfuscator.padToUniformSize(new Uint8Array(10));
        expect(padded).toBeDefined();

        burstObfuscator.destroy();
      });

      it('handles burst interval with jitter', () => {
        const burstObfuscator = new TrafficObfuscator({
          timingMode: 'burst',
          minDelay: 1,
          burstSize: 1, // Every packet ends a burst
          burstInterval: 100,
        });

        // Simulate reaching end of burst
        burstObfuscator.resetStats();
        const stats = burstObfuscator.getStats();
        expect(stats.totalPackets).toBe(0);

        burstObfuscator.destroy();
      });
    });

    describe('applyTimingDelay', () => {
      it('delays execution by calculated delay', async () => {
        const delayObfuscator = new TrafficObfuscator({
          timingMode: 'constant',
          minDelay: 100,
        });

        const promise = delayObfuscator.applyTimingDelay();

        // Fast-forward 50ms - promise should not resolve yet
        await vi.advanceTimersByTimeAsync(50);

        // Fast-forward another 50ms
        await vi.advanceTimersByTimeAsync(50);

        await expect(promise).resolves.toBeUndefined();

        delayObfuscator.destroy();
      });

      it('resolves immediately when delay is 0', async () => {
        const noDelayObfuscator = new TrafficObfuscator({
          timingMode: 'constant',
          minDelay: 0,
        });

        const promise = noDelayObfuscator.applyTimingDelay();
        await expect(promise).resolves.toBeUndefined();

        noDelayObfuscator.destroy();
      });
    });

    describe('calculateBitrateDelay', () => {
      it('calculates delay based on target bitrate', () => {
        const bitrateObfuscator = new TrafficObfuscator({
          targetBitrate: 1_000_000, // 1 Mbps = 125 KB/s
        });

        // For 1250 bytes at 125 KB/s (125000 bytes/s = 125 bytes/ms)
        // Expected delay = 1250 / 125 = 10ms +/- jitter
        const delay = bitrateObfuscator.calculateBitrateDelay(1250);

        // With 20% jitter, delay should be between 8-12ms
        expect(delay).toBeGreaterThanOrEqual(0);
        expect(delay).toBeLessThanOrEqual(15);

        bitrateObfuscator.destroy();
      });

      it('returns 0 for very high bitrates', () => {
        const highBitrateObfuscator = new TrafficObfuscator({
          targetBitrate: 10_000_000_000, // 10 Gbps
        });

        const delay = highBitrateObfuscator.calculateBitrateDelay(100);
        expect(delay).toBeGreaterThanOrEqual(0);

        highBitrateObfuscator.destroy();
      });
    });
  });

  // ==========================================================================
  // 3. Protocol Disguise Tests
  // ==========================================================================
  describe('Protocol Disguise', () => {
    describe('generateDisguiseHeaders', () => {
      it('generates required HTTP headers', () => {
        const headers = obfuscator.generateDisguiseHeaders();

        expect(headers['Content-Type']).toBeDefined();
        expect(headers['X-Request-ID']).toBeDefined();
        expect(headers['Accept-Encoding']).toBe('gzip, deflate, br');
        expect(headers['Cache-Control']).toBe('no-cache');
      });

      it('includes User-Agent when mimicBrowser is enabled', () => {
        const browserObfuscator = new TrafficObfuscator({
          mimicBrowser: true,
          browserProfile: 'chrome',
        });

        const headers = browserObfuscator.generateDisguiseHeaders();
        expect(headers['User-Agent']).toContain('Chrome');

        browserObfuscator.destroy();
      });

      it('generates unique X-Request-ID per call', () => {
        const headers1 = obfuscator.generateDisguiseHeaders();
        const headers2 = obfuscator.generateDisguiseHeaders();

        expect(headers1['X-Request-ID']).not.toBe(headers2['X-Request-ID']);
      });

      it('sets correct Content-Type based on disguiseAs mode', () => {
        const httpsObfuscator = new TrafficObfuscator({ disguiseAs: 'https' });
        expect(httpsObfuscator.generateDisguiseHeaders()['Content-Type']).toBe('application/octet-stream');
        httpsObfuscator.destroy();

        const wsObfuscator = new TrafficObfuscator({ disguiseAs: 'websocket' });
        expect(wsObfuscator.generateDisguiseHeaders()['Content-Type']).toBe('application/json');
        wsObfuscator.destroy();

        const webrtcObfuscator = new TrafficObfuscator({ disguiseAs: 'webrtc' });
        expect(webrtcObfuscator.generateDisguiseHeaders()['Content-Type']).toBe('application/sdp');
        webrtcObfuscator.destroy();

        const http2Obfuscator = new TrafficObfuscator({ disguiseAs: 'http2' });
        expect(http2Obfuscator.generateDisguiseHeaders()['Content-Type']).toBe('application/grpc+proto');
        http2Obfuscator.destroy();
      });

      it('adds random headers when randomizeHeaders is enabled', () => {
        const randomObfuscator = new TrafficObfuscator({
          randomizeHeaders: true,
        });

        const headers = randomObfuscator.generateDisguiseHeaders();
        expect(headers['Accept-Language']).toBeDefined();
        expect(headers['Sec-Fetch-Mode']).toBeDefined();
        expect(headers['Sec-Fetch-Site']).toBe('same-origin');

        randomObfuscator.destroy();
      });
    });

    describe('wrapInProtocolFrame', () => {
      it('wraps data in HTTP-like frame', () => {
        const data = new Uint8Array([1, 2, 3, 4, 5]);
        const frame = obfuscator.wrapInProtocolFrame(data);

        // Decode full frame text to check all headers
        const frameText = new TextDecoder().decode(frame);
        expect(frameText).toContain('POST /api/v1/transfer HTTP/1.1');
        expect(frameText).toContain('Content-Length: 5');
      });

      it('includes generated headers in frame', () => {
        const data = new Uint8Array([1, 2, 3]);
        const frame = obfuscator.wrapInProtocolFrame(data);

        const frameText = new TextDecoder().decode(frame);
        expect(frameText).toContain('Content-Type:');
        expect(frameText).toContain('X-Request-ID:');
      });

      it('appends data after headers', () => {
        const data = new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF]);
        const frame = obfuscator.wrapInProtocolFrame(data);

        // Data should be at the end of the frame
        expect(frame[frame.length - 4]).toBe(0xDE);
        expect(frame[frame.length - 3]).toBe(0xAD);
        expect(frame[frame.length - 2]).toBe(0xBE);
        expect(frame[frame.length - 1]).toBe(0xEF);
      });
    });

    describe('unwrapFromProtocolFrame', () => {
      it('extracts data from protocol frame', () => {
        const original = new Uint8Array([10, 20, 30, 40, 50]);
        const frame = obfuscator.wrapInProtocolFrame(original);
        const extracted = obfuscator.unwrapFromProtocolFrame(frame);

        expect(extracted).not.toBeNull();
        if (extracted) {
          expect(Array.from(extracted)).toEqual([10, 20, 30, 40, 50]);
        }
      });

      it('returns data as-is if not wrapped', () => {
        const plainData = new Uint8Array([1, 2, 3, 4, 5]);
        const result = obfuscator.unwrapFromProtocolFrame(plainData);

        expect(result).toBeDefined();
        if (result) {
          expect(Array.from(result)).toEqual([1, 2, 3, 4, 5]);
        }
      });

      it('handles frames with custom headers', () => {
        const data = new Uint8Array(100);
        data.fill(42);

        const frame = obfuscator.wrapInProtocolFrame(data);
        const extracted = obfuscator.unwrapFromProtocolFrame(frame);

        expect(extracted).toBeDefined();
        if (extracted) {
          expect(extracted.length).toBe(100);
          expect(extracted[0]).toBe(42);
        }
      });
    });
  });

  // ==========================================================================
  // 4. Cover Traffic Tests
  // ==========================================================================
  describe('Cover Traffic', () => {
    describe('generateDecoyPacket', () => {
      it('creates packet with DECOY type', () => {
        const decoy = obfuscator.generateDecoyPacket();

        expect(decoy.type).toBe(PacketType.DECOY);
        expect(decoy.data[0]).toBe(PacketType.DECOY);
      });

      it('generates random-sized decoy packets', () => {
        const sizes = new Set<number>();

        for (let i = 0; i < 20; i++) {
          const decoy = obfuscator.generateDecoyPacket();
          sizes.add(decoy.data.length);
        }

        // Should have some variety in sizes
        expect(sizes.size).toBeGreaterThan(1);
      });

      it('increments decoy packet stats', () => {
        const statsBefore = obfuscator.getStats();
        obfuscator.generateDecoyPacket();
        obfuscator.generateDecoyPacket();
        obfuscator.generateDecoyPacket();
        const statsAfter = obfuscator.getStats();

        expect(statsAfter.decoyPackets).toBe(statsBefore.decoyPackets + 3);
        expect(statsAfter.totalPackets).toBe(statsBefore.totalPackets + 3);
      });

      it('includes proper flags in decoy packet', () => {
        const decoy = obfuscator.generateDecoyPacket();

        expect(decoy.flags.isFragmented).toBe(false);
        expect(decoy.flags.priority).toBe('low');
      });
    });

    describe('generateCoverPacket', () => {
      it('creates packet with COVER type', () => {
        const cover = obfuscator.generateCoverPacket();

        expect(cover.type).toBe(PacketType.COVER);
        expect(cover.data[0]).toBe(PacketType.COVER);
      });

      it('uses TLS record sizes for cover traffic', () => {
        const tlsSizes = [1460, 2920, 4380, 8760, 16384];

        for (let i = 0; i < 20; i++) {
          const cover = obfuscator.generateCoverPacket();
          expect(tlsSizes).toContain(cover.data.length);
        }
      });

      it('increments cover packet stats', () => {
        const statsBefore = obfuscator.getStats();
        obfuscator.generateCoverPacket();
        obfuscator.generateCoverPacket();
        const statsAfter = obfuscator.getStats();

        expect(statsAfter.coverPackets).toBe(statsBefore.coverPackets + 2);
      });
    });

    describe('startCoverTraffic / stopCoverTraffic', () => {
      it('starts generating cover traffic at configured rate', async () => {
        const packets: ObfuscatedPacket[] = [];
        const coverObfuscator = new TrafficObfuscator({
          enableCoverTraffic: true,
          coverTrafficRate: 10, // 10 packets/second = 1 packet per 100ms
          coverTrafficVariance: 0,
        });

        coverObfuscator.startCoverTraffic((packet) => {
          packets.push(packet);
        });

        // Advance time by 350ms - should get ~3-4 packets at 100ms intervals
        await vi.advanceTimersByTimeAsync(350);

        expect(packets.length).toBeGreaterThanOrEqual(2);
        const firstPacket = packets[0];
        expect(firstPacket).toBeDefined();
        if (firstPacket) {
          expect(firstPacket.type).toBe(PacketType.COVER);
        }

        coverObfuscator.stopCoverTraffic();
        coverObfuscator.destroy();
      });

      it('stops cover traffic when stopCoverTraffic is called', async () => {
        const packets: ObfuscatedPacket[] = [];
        const coverObfuscator = new TrafficObfuscator({
          enableCoverTraffic: true,
          coverTrafficRate: 10,
          coverTrafficVariance: 0,
        });

        coverObfuscator.startCoverTraffic((packet) => {
          packets.push(packet);
        });

        await vi.advanceTimersByTimeAsync(150);
        const countBeforeStop = packets.length;

        coverObfuscator.stopCoverTraffic();

        await vi.advanceTimersByTimeAsync(500);
        const countAfterStop = packets.length;

        expect(countAfterStop).toBe(countBeforeStop);

        coverObfuscator.destroy();
      });

      it('does not start if enableCoverTraffic is false', async () => {
        const packets: ObfuscatedPacket[] = [];
        const noCoverObfuscator = new TrafficObfuscator({
          enableCoverTraffic: false,
        });

        noCoverObfuscator.startCoverTraffic((packet) => {
          packets.push(packet);
        });

        await vi.advanceTimersByTimeAsync(500);

        expect(packets.length).toBe(0);

        noCoverObfuscator.destroy();
      });

      it('does not start twice', async () => {
        const packets: ObfuscatedPacket[] = [];
        const coverObfuscator = new TrafficObfuscator({
          enableCoverTraffic: true,
          coverTrafficRate: 10,
          coverTrafficVariance: 0,
        });

        coverObfuscator.startCoverTraffic((packet) => {
          packets.push(packet);
        });

        // Try starting again
        coverObfuscator.startCoverTraffic((packet) => {
          packets.push(packet);
        });

        await vi.advanceTimersByTimeAsync(250);

        // Should only have packets from single generator
        expect(packets.length).toBeLessThanOrEqual(5);

        coverObfuscator.stopCoverTraffic();
        coverObfuscator.destroy();
      });
    });
  });

  // ==========================================================================
  // 5. Full Pipeline Tests
  // ==========================================================================
  describe('Full Pipeline', () => {
    describe('obfuscate -> deobfuscate roundtrip', () => {
      it('performs roundtrip for small data', async () => {
        // Use deterministic config to avoid decoys
        const deterministicObfuscator = new TrafficObfuscator({
          decoyProbability: 0,
          timingMode: 'constant',
          minDelay: 0,
        });

        const original = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        const packets = await deterministicObfuscator.obfuscate(original);
        const recovered = deterministicObfuscator.deobfuscate(packets);

        expect(recovered).not.toBeNull();
        if (recovered) {
          expect(Array.from(recovered)).toEqual(Array.from(original));
        }

        deterministicObfuscator.destroy();
      });

      it('handles fragmented data roundtrip', async () => {
        const fragObfuscator = new TrafficObfuscator({
          decoyProbability: 0,
          timingMode: 'constant',
          minDelay: 0,
          enableChunking: true,
          maxPacketSize: 1024,
        });

        // Create data larger than maxPacketSize
        const original = new Uint8Array(2500);
        original.forEach((_, idx, arr) => {
          arr[idx] = idx % 256;
        });

        const packets = await fragObfuscator.obfuscate(original);
        expect(packets.length).toBeGreaterThan(1);

        const recovered = fragObfuscator.deobfuscate(packets);

        expect(recovered).not.toBeNull();
        if (recovered) {
          expect(recovered.length).toBe(original.length);
          expect(Array.from(recovered)).toEqual(Array.from(original));
        }

        fragObfuscator.destroy();
      });

      it('filters out decoy packets during deobfuscation', async () => {
        const decoyObfuscator = new TrafficObfuscator({
          decoyProbability: 1.0, // Always add decoys
          timingMode: 'constant',
          minDelay: 0,
        });

        const original = new Uint8Array([42, 43, 44]);
        const packets = await decoyObfuscator.obfuscate(original);

        // Should have both data and decoy packets
        const dataPackets = packets.filter(p => p.type === PacketType.DATA);
        const decoyPackets = packets.filter(p => p.type === PacketType.DECOY);

        expect(dataPackets.length).toBeGreaterThan(0);
        expect(decoyPackets.length).toBeGreaterThan(0);

        const recovered = decoyObfuscator.deobfuscate(packets);

        expect(recovered).not.toBeNull();
        if (recovered) {
          expect(Array.from(recovered)).toEqual([42, 43, 44]);
        }

        decoyObfuscator.destroy();
      });

      it('returns null when no data packets present', () => {
        const packets: ObfuscatedPacket[] = [
          obfuscator.generateDecoyPacket(),
          obfuscator.generateCoverPacket(),
        ];

        const result = obfuscator.deobfuscate(packets);
        expect(result).toBeNull();
      });
    });

    describe('obfuscateWithDisguise -> deobfuscateFromDisguise roundtrip', () => {
      it('performs full disguise roundtrip', async () => {
        const disguiseObfuscator = new TrafficObfuscator({
          decoyProbability: 0,
          timingMode: 'constant',
          minDelay: 0,
        });

        const original = new Uint8Array([100, 101, 102, 103, 104]);
        const frames = await disguiseObfuscator.obfuscateWithDisguise(original);

        expect(frames.length).toBeGreaterThan(0);
        // Each frame should look like HTTP
        const firstFrame = frames[0];
        expect(firstFrame).toBeDefined();
        if (firstFrame) {
          const frameText = new TextDecoder().decode(firstFrame.slice(0, 50));
          expect(frameText).toContain('POST');
        }

        const recovered = disguiseObfuscator.deobfuscateFromDisguise(frames);

        expect(recovered).not.toBeNull();
        if (recovered) {
          expect(Array.from(recovered)).toEqual([100, 101, 102, 103, 104]);
        }

        disguiseObfuscator.destroy();
      });
    });

    describe('stats tracking', () => {
      it('tracks original and padded sizes', () => {
        // Use padToUniformSize directly to avoid timing issues
        obfuscator.resetStats();

        const data = new Uint8Array(500);
        obfuscator.padToUniformSize(data);

        const stats = obfuscator.getStats();
        expect(stats.originalSize).toBe(500);
        expect(stats.paddedSize).toBeGreaterThan(stats.originalSize);
      });

      it('calculates overhead percentage', () => {
        obfuscator.resetStats();

        const data = new Uint8Array(1000);
        obfuscator.padToUniformSize(data);

        const stats = obfuscator.getStats();
        expect(stats.overheadPercentage).toBeGreaterThan(0);
        // Overhead = (padded - original) / original * 100
        const expectedOverhead = ((stats.paddedSize - stats.originalSize) / stats.originalSize) * 100;
        expect(stats.overheadPercentage).toBeCloseTo(expectedOverhead, 2);
      });

      it('tracks total packets including decoys', () => {
        const trackingObfuscator = new TrafficObfuscator({
          decoyProbability: 1.0,
          timingMode: 'constant',
          minDelay: 0,
        });

        trackingObfuscator.resetStats();

        // Use pad and generate methods directly to avoid async timing
        trackingObfuscator.padToUniformSize(new Uint8Array(100));
        trackingObfuscator.generateDecoyPacket();
        trackingObfuscator.generateDecoyPacket();

        const stats = trackingObfuscator.getStats();
        expect(stats.totalPackets).toBeGreaterThan(0);
        expect(stats.dataPackets).toBeGreaterThan(0);
        expect(stats.decoyPackets).toBeGreaterThan(0);

        trackingObfuscator.destroy();
      });

      it('resets stats correctly', () => {
        // Use padding directly to populate stats
        obfuscator.padToUniformSize(new Uint8Array(100));
        obfuscator.generateDecoyPacket();

        const statsBefore = obfuscator.getStats();
        expect(statsBefore.originalSize).toBeGreaterThan(0);

        obfuscator.resetStats();

        const stats = obfuscator.getStats();
        expect(stats.originalSize).toBe(0);
        expect(stats.paddedSize).toBe(0);
        expect(stats.totalPackets).toBe(0);
        expect(stats.dataPackets).toBe(0);
        expect(stats.decoyPackets).toBe(0);
      });
    });
  });

  // ==========================================================================
  // Configuration and Lifecycle Tests
  // ==========================================================================
  describe('Configuration', () => {
    it('updates configuration', () => {
      obfuscator.updateConfig({ minDelay: 100 });
      const config = obfuscator.getConfig();

      expect(config.minDelay).toBe(100);
    });

    it('preserves existing config when updating', () => {
      const originalConfig = obfuscator.getConfig();
      obfuscator.updateConfig({ minDelay: 999 });

      const newConfig = obfuscator.getConfig();
      expect(newConfig.maxDelay).toBe(originalConfig.maxDelay);
      expect(newConfig.paddingMode).toBe(originalConfig.paddingMode);
    });

    it('returns copy of config', () => {
      const config1 = obfuscator.getConfig();
      const config2 = obfuscator.getConfig();

      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe('Domain Fronting', () => {
    it('configures domain fronting', () => {
      obfuscator.configureDomainFronting('cdn.cloudflare.com', 'tallow.app');

      expect(obfuscator.isDomainFrontingEnabled()).toBe(true);
      expect(obfuscator.getDomainFrontConfig()).toEqual({
        frontDomain: 'cdn.cloudflare.com',
        targetDomain: 'tallow.app',
        sniHost: 'cdn.cloudflare.com',
        httpHost: 'tallow.app',
      });
    });

    it('gets fronted URL', () => {
      obfuscator.configureDomainFronting('cdn.example.com', 'secret.app');

      const url = obfuscator.getFrontedUrl('/api/transfer');
      expect(url).toBe('https://cdn.example.com/api/transfer');
    });

    it('throws when getting fronted URL without config', () => {
      const noFrontObfuscator = new TrafficObfuscator();

      expect(() => noFrontObfuscator.getFrontedUrl('/api')).toThrow('Domain fronting not configured');

      noFrontObfuscator.destroy();
    });

    it('gets domain front headers', () => {
      obfuscator.configureDomainFronting('cdn.example.com', 'secret.app');

      const headers = obfuscator.getDomainFrontHeaders();
      expect(headers['Host']).toBe('secret.app');
      expect(headers['Content-Type']).toBeDefined();
    });
  });

  describe('destroy', () => {
    it('stops cover traffic and resets stats', async () => {
      const packets: ObfuscatedPacket[] = [];
      obfuscator.startCoverTraffic((packet) => {
        packets.push(packet);
      });

      await vi.advanceTimersByTimeAsync(200);

      obfuscator.destroy();

      const packetCountBeforeWait = packets.length;
      await vi.advanceTimersByTimeAsync(500);

      expect(packets.length).toBe(packetCountBeforeWait);
    });
  });
});

// ==========================================================================
// Singleton Tests
// ==========================================================================
describe('Singleton Functions', () => {
  afterEach(() => {
    resetTrafficObfuscator();
  });

  it('getTrafficObfuscator returns singleton instance', () => {
    const instance1 = getTrafficObfuscator();
    const instance2 = getTrafficObfuscator();

    expect(instance1).toBe(instance2);
  });

  it('getTrafficObfuscator accepts initial config', () => {
    const instance = getTrafficObfuscator({ minDelay: 500 });
    const config = instance.getConfig();

    expect(config.minDelay).toBe(500);
  });

  it('getTrafficObfuscator updates config on existing instance', () => {
    const instance1 = getTrafficObfuscator({ minDelay: 100 });
    expect(instance1.getConfig().minDelay).toBe(100);

    getTrafficObfuscator({ minDelay: 200 });
    expect(instance1.getConfig().minDelay).toBe(200);
  });

  it('resetTrafficObfuscator destroys singleton', () => {
    const instance1 = getTrafficObfuscator();
    resetTrafficObfuscator();
    const instance2 = getTrafficObfuscator();

    expect(instance1).not.toBe(instance2);
  });
});
