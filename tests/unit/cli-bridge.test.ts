/**
 * CLI Bridge Unit Tests
 *
 * Tests the protocol compatibility between Web App and CLI
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  RoomCode,
  MessageCodec,
  FileInfoCodec,
  ChunkCodec,
  MessageType,
  generateRoomCode,
  PROTOCOL_VERSION,
  CHUNK_SIZE,
} from '@/lib/cli-bridge';

describe('RoomCode', () => {
  describe('normalize', () => {
    it('should lowercase codes', () => {
      expect(RoomCode.normalize('Alpha-Bear-Cat')).toBe('alpha-bear-cat');
      expect(RoomCode.normalize('ALPHA-BEAR-CAT')).toBe('alpha-bear-cat');
    });

    it('should trim whitespace', () => {
      expect(RoomCode.normalize('  alpha-bear-cat  ')).toBe('alpha-bear-cat');
    });

    it('should replace spaces with hyphens', () => {
      expect(RoomCode.normalize('alpha bear cat')).toBe('alpha-bear-cat');
    });

    it('should collapse multiple hyphens', () => {
      expect(RoomCode.normalize('alpha--bear---cat')).toBe('alpha-bear-cat');
    });
  });

  describe('validate', () => {
    it('should accept valid 2-6 word codes', () => {
      expect(RoomCode.validate('alpha-bear')).toBe(true);
      expect(RoomCode.validate('alpha-bear-cat')).toBe(true);
      expect(RoomCode.validate('alpha-bear-cat-dog')).toBe(true);
      expect(RoomCode.validate('alpha-bear-cat-dog-eagle')).toBe(true);
      expect(RoomCode.validate('alpha-bear-cat-dog-eagle-fox')).toBe(true);
    });

    it('should reject single word codes', () => {
      expect(RoomCode.validate('alpha')).toBe(false);
    });

    it('should reject more than 6 words', () => {
      expect(RoomCode.validate('alpha-bear-cat-dog-eagle-fox-gorilla')).toBe(false);
    });

    it('should reject codes with special characters', () => {
      expect(RoomCode.validate('alpha-bear!')).toBe(false);
      expect(RoomCode.validate('alpha@bear')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(RoomCode.validate('Alpha-Bear-Cat')).toBe(true);
      expect(RoomCode.validate('ALPHA-BEAR-CAT')).toBe(true);
    });
  });

  describe('toRoomId', () => {
    it('should return 32-character hex string', () => {
      const roomId = RoomCode.toRoomId('alpha-bear-cat');
      expect(roomId).toHaveLength(32);
      expect(roomId).toMatch(/^[0-9a-f]+$/);
    });

    it('should be deterministic', () => {
      const id1 = RoomCode.toRoomId('alpha-bear-cat');
      const id2 = RoomCode.toRoomId('alpha-bear-cat');
      expect(id1).toBe(id2);
    });

    it('should normalize before hashing', () => {
      const id1 = RoomCode.toRoomId('alpha-bear-cat');
      const id2 = RoomCode.toRoomId('ALPHA-BEAR-CAT');
      const id3 = RoomCode.toRoomId('Alpha-Bear-Cat');
      expect(id1).toBe(id2);
      expect(id1).toBe(id3);
    });

    it('should produce different IDs for different codes', () => {
      const id1 = RoomCode.toRoomId('alpha-bear-cat');
      const id2 = RoomCode.toRoomId('delta-echo-fox');
      expect(id1).not.toBe(id2);
    });
  });

  describe('toKeyMaterial', () => {
    it('should return 32 bytes', () => {
      const keyMaterial = RoomCode.toKeyMaterial('alpha-bear-cat');
      expect(keyMaterial).toHaveLength(32);
    });

    it('should be deterministic', () => {
      const km1 = RoomCode.toKeyMaterial('alpha-bear-cat');
      const km2 = RoomCode.toKeyMaterial('alpha-bear-cat');
      expect(km1).toEqual(km2);
    });

    it('should normalize before deriving', () => {
      const km1 = RoomCode.toKeyMaterial('alpha-bear-cat');
      const km2 = RoomCode.toKeyMaterial('ALPHA-BEAR-CAT');
      expect(km1).toEqual(km2);
    });
  });
});

describe('MessageCodec', () => {
  describe('encode', () => {
    it('should encode messages with correct header', () => {
      const payload = new Uint8Array([1, 2, 3, 4, 5]);
      const encoded = MessageCodec.encode(MessageType.CHUNK, payload);

      // 4 bytes length + 1 byte type + 5 bytes payload = 10 bytes
      expect(encoded).toHaveLength(10);

      // Length field should be 6 (type + payload)
      expect(encoded[0]).toBe(0);
      expect(encoded[1]).toBe(0);
      expect(encoded[2]).toBe(0);
      expect(encoded[3]).toBe(6);

      // Type
      expect(encoded[4]).toBe(MessageType.CHUNK);

      // Payload
      expect(encoded.slice(5)).toEqual(payload);
    });

    it('should handle empty payload', () => {
      const encoded = MessageCodec.encode(MessageType.DONE, new Uint8Array(0));
      expect(encoded).toHaveLength(5);
      expect(encoded[3]).toBe(1); // Length = 1 (just type byte)
      expect(encoded[4]).toBe(MessageType.DONE);
    });
  });

  describe('decode', () => {
    it('should decode valid messages', () => {
      const payload = new Uint8Array([1, 2, 3]);
      const encoded = MessageCodec.encode(MessageType.FILE_INFO, payload);
      const decoded = MessageCodec.decode(encoded);

      expect(decoded).not.toBeNull();
      expect(decoded!.type).toBe(MessageType.FILE_INFO);
      expect(decoded!.payload).toEqual(payload);
    });

    it('should return null for incomplete messages', () => {
      const partial = new Uint8Array([0, 0, 0, 10]); // Claims 10 bytes but only has header
      expect(MessageCodec.decode(partial)).toBeNull();
    });

    it('should return null for messages shorter than header', () => {
      expect(MessageCodec.decode(new Uint8Array([0, 0]))).toBeNull();
    });
  });

  describe('roundtrip', () => {
    it('should encode and decode all message types', () => {
      const types = [
        MessageType.HELLO,
        MessageType.FILE_INFO,
        MessageType.CHUNK,
        MessageType.ACK,
        MessageType.ERROR,
        MessageType.DONE,
      ];

      for (const type of types) {
        const payload = new Uint8Array([0x42, 0x43, 0x44]);
        const encoded = MessageCodec.encode(type, payload);
        const decoded = MessageCodec.decode(encoded);

        expect(decoded).not.toBeNull();
        expect(decoded!.type).toBe(type);
        expect(decoded!.payload).toEqual(payload);
      }
    });
  });
});

describe('FileInfoCodec', () => {
  const sampleFileInfo = {
    name: 'test-file.pdf',
    size: 1024 * 1024, // 1MB
    compressed: true,
    compressedSize: 512 * 1024, // 512KB
    checksum: new Uint8Array(32).fill(0x42),
    totalChunks: 16,
    chunkSize: 65536,
  };

  describe('encode', () => {
    it('should encode file info correctly', () => {
      const encoded = FileInfoCodec.encode(sampleFileInfo);

      // Should have: 2 + name.length + 8 + 1 + 8 + 32 + 4 + 4 bytes
      const expectedLength = 2 + sampleFileInfo.name.length + 8 + 1 + 8 + 32 + 4 + 4;
      expect(encoded).toHaveLength(expectedLength);
    });
  });

  describe('decode', () => {
    it('should decode file info correctly', () => {
      const encoded = FileInfoCodec.encode(sampleFileInfo);
      const decoded = FileInfoCodec.decode(encoded);

      expect(decoded).not.toBeNull();
      expect(decoded!.name).toBe(sampleFileInfo.name);
      expect(decoded!.size).toBe(sampleFileInfo.size);
      expect(decoded!.compressed).toBe(sampleFileInfo.compressed);
      expect(decoded!.compressedSize).toBe(sampleFileInfo.compressedSize);
      expect(decoded!.totalChunks).toBe(sampleFileInfo.totalChunks);
      expect(decoded!.chunkSize).toBe(sampleFileInfo.chunkSize);
    });

    it('should return null for invalid data', () => {
      expect(FileInfoCodec.decode(new Uint8Array(10))).toBeNull();
    });
  });

  describe('roundtrip', () => {
    it('should preserve all fields', () => {
      const infos = [
        { ...sampleFileInfo, name: 'short.txt' },
        { ...sampleFileInfo, name: 'very-long-filename-with-special-chars.document.pdf' },
        { ...sampleFileInfo, size: 0, totalChunks: 1 },
        { ...sampleFileInfo, size: 10 * 1024 * 1024 * 1024, totalChunks: 10000 }, // 10GB
        { ...sampleFileInfo, compressed: false },
      ];

      for (const info of infos) {
        const encoded = FileInfoCodec.encode(info);
        const decoded = FileInfoCodec.decode(encoded);

        expect(decoded).not.toBeNull();
        expect(decoded!.name).toBe(info.name);
        expect(decoded!.size).toBe(info.size);
        expect(decoded!.compressed).toBe(info.compressed);
      }
    });
  });
});

describe('ChunkCodec', () => {
  describe('encodeHeader', () => {
    it('should encode chunk header', () => {
      const header = {
        index: 42,
        size: 65536,
        checksum: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
      };

      const encoded = ChunkCodec.encodeHeader(header);
      expect(encoded).toHaveLength(16);
    });
  });

  describe('decodeHeader', () => {
    it('should decode chunk header', () => {
      const header = {
        index: 42,
        size: 65536,
        checksum: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
      };

      const encoded = ChunkCodec.encodeHeader(header);
      const decoded = ChunkCodec.decodeHeader(encoded);

      expect(decoded).not.toBeNull();
      expect(decoded!.index).toBe(header.index);
      expect(decoded!.size).toBe(header.size);
      expect(decoded!.checksum).toEqual(header.checksum);
    });

    it('should return null for short data', () => {
      expect(ChunkCodec.decodeHeader(new Uint8Array(10))).toBeNull();
    });
  });

  describe('computeChecksum', () => {
    it('should return 8 bytes', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const checksum = ChunkCodec.computeChecksum(data);
      expect(checksum).toHaveLength(8);
    });

    it('should be deterministic', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const cs1 = ChunkCodec.computeChecksum(data);
      const cs2 = ChunkCodec.computeChecksum(data);
      expect(cs1).toEqual(cs2);
    });

    it('should produce different checksums for different data', () => {
      const data1 = new Uint8Array([1, 2, 3]);
      const data2 = new Uint8Array([4, 5, 6]);
      const cs1 = ChunkCodec.computeChecksum(data1);
      const cs2 = ChunkCodec.computeChecksum(data2);
      expect(cs1).not.toEqual(cs2);
    });
  });

  describe('verifyChecksum', () => {
    it('should verify correct checksum', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const checksum = ChunkCodec.computeChecksum(data);
      expect(ChunkCodec.verifyChecksum(data, checksum)).toBe(true);
    });

    it('should reject incorrect checksum', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const badChecksum = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]);
      expect(ChunkCodec.verifyChecksum(data, badChecksum)).toBe(false);
    });
  });
});

describe('generateRoomCode', () => {
  it('should generate valid codes', () => {
    for (let i = 0; i < 10; i++) {
      const code = generateRoomCode(3);
      expect(RoomCode.validate(code)).toBe(true);
    }
  });

  it('should generate codes with specified word count', () => {
    for (let numWords = 2; numWords <= 6; numWords++) {
      const code = generateRoomCode(numWords);
      const words = code.split('-');
      expect(words.length).toBe(numWords);
    }
  });

  it('should generate unique codes', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateRoomCode(3));
    }
    // Should have high uniqueness (collision possible but very unlikely)
    expect(codes.size).toBeGreaterThan(95);
  });
});

describe('Protocol Constants', () => {
  it('should have correct version', () => {
    expect(PROTOCOL_VERSION).toBe(1);
  });

  it('should have correct chunk size', () => {
    expect(CHUNK_SIZE).toBe(65536); // 64KB
  });
});
