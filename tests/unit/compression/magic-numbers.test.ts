import { describe, it, expect } from 'vitest';
import {
  detectFileType,
  isCompressible,
  getFileTypeDescription,
} from '../../../lib/compression/magic-numbers';

describe('Magic Numbers', () => {
  describe('detectFileType', () => {
    // Image formats
    it('should detect JPEG', () => {
      const jpeg = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0]);
      expect(detectFileType(jpeg.buffer)).toBe('image/jpeg');
    });

    it('should detect PNG', () => {
      const png = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      expect(detectFileType(png.buffer)).toBe('image/png');
    });

    it('should detect GIF87a', () => {
      const gif = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]);
      expect(detectFileType(gif.buffer)).toBe('image/gif');
    });

    it('should detect GIF89a', () => {
      const gif = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
      expect(detectFileType(gif.buffer)).toBe('image/gif');
    });

    it('should detect WebP', () => {
      const webp = new Uint8Array([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x00, 0x00, 0x00, 0x00, // size
        0x57, 0x45, 0x42, 0x50, // WEBP
      ]);
      expect(detectFileType(webp.buffer)).toBe('image/webp');
    });

    it('should detect BMP', () => {
      const bmp = new Uint8Array([0x42, 0x4D]);
      expect(detectFileType(bmp.buffer)).toBe('image/bmp');
    });

    // Video formats
    it('should detect MP4', () => {
      const mp4 = new Uint8Array([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]);
      expect(detectFileType(mp4.buffer)).toBe('video/mp4');
    });

    it('should detect WebM', () => {
      const webm = new Uint8Array([0x1A, 0x45, 0xDF, 0xA3]);
      expect(detectFileType(webm.buffer)).toBe('video/webm');
    });

    // Audio formats
    it('should detect MP3 (MPEG-1)', () => {
      const mp3 = new Uint8Array([0xFF, 0xFB]);
      expect(detectFileType(mp3.buffer)).toBe('audio/mpeg');
    });

    it('should detect MP3 with ID3v2', () => {
      const mp3 = new Uint8Array([0x49, 0x44, 0x33]); // ID3
      expect(detectFileType(mp3.buffer)).toBe('audio/mpeg');
    });

    it('should detect OGG', () => {
      const ogg = new Uint8Array([0x4F, 0x67, 0x67, 0x53]);
      expect(detectFileType(ogg.buffer)).toBe('audio/ogg');
    });

    it('should detect FLAC', () => {
      const flac = new Uint8Array([0x66, 0x4C, 0x61, 0x43]); // fLaC
      expect(detectFileType(flac.buffer)).toBe('audio/flac');
    });

    // Archives
    it('should detect ZIP', () => {
      const zip = new Uint8Array([0x50, 0x4B, 0x03, 0x04]); // PK
      expect(detectFileType(zip.buffer)).toBe('application/zip');
    });

    it('should detect GZIP', () => {
      const gzip = new Uint8Array([0x1F, 0x8B]);
      expect(detectFileType(gzip.buffer)).toBe('application/gzip');
    });

    it('should detect 7Z', () => {
      const sevenZip = new Uint8Array([0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C]);
      expect(detectFileType(sevenZip.buffer)).toBe('application/x-7z-compressed');
    });

    it('should detect RAR 1.5+', () => {
      const rar = new Uint8Array([0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x00]);
      expect(detectFileType(rar.buffer)).toBe('application/x-rar-compressed');
    });

    // Documents
    it('should detect PDF', () => {
      const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF
      expect(detectFileType(pdf.buffer)).toBe('application/pdf');
    });

    // Text formats
    it('should detect XML', () => {
      const xml = new Uint8Array([0x3C, 0x3F, 0x78, 0x6D, 0x6C]); // <?xml
      expect(detectFileType(xml.buffer)).toBe('application/xml');
    });

    it('should detect HTML (DOCTYPE)', () => {
      const html = new Uint8Array([0x3C, 0x21, 0x44, 0x4F, 0x43, 0x54, 0x59, 0x50, 0x45]); // <!DOCTYPE
      expect(detectFileType(html.buffer)).toBe('text/html');
    });

    it('should detect JSON', () => {
      const json = new Uint8Array([0x7B, 0x22]); // {"
      expect(detectFileType(json.buffer)).toBe('application/json');
    });

    // Executables
    it('should detect WASM', () => {
      const wasm = new Uint8Array([0x00, 0x61, 0x73, 0x6D]); // \0asm
      expect(detectFileType(wasm.buffer)).toBe('application/wasm');
    });

    it('should detect EXE', () => {
      const exe = new Uint8Array([0x4D, 0x5A]); // MZ
      expect(detectFileType(exe.buffer)).toBe('application/x-msdownload');
    });

    it('should detect ELF', () => {
      const elf = new Uint8Array([0x7F, 0x45, 0x4C, 0x46]); // .ELF
      expect(detectFileType(elf.buffer)).toBe('application/x-elf');
    });

    it('should return null for unknown type', () => {
      const unknown = new Uint8Array([0xAB, 0xCD, 0xEF, 0x12]);
      expect(detectFileType(unknown.buffer)).toBeNull();
    });

    it('should return null for empty buffer', () => {
      const empty = new Uint8Array([]);
      expect(detectFileType(empty.buffer)).toBeNull();
    });

    it('should return null for too small buffer', () => {
      const tiny = new Uint8Array([0xFF]);
      expect(detectFileType(tiny.buffer)).toBeNull();
    });
  });

  describe('isCompressible', () => {
    it('should mark JPEG as incompressible', () => {
      expect(isCompressible('image/jpeg')).toBe(false);
    });

    it('should mark PNG as incompressible', () => {
      expect(isCompressible('image/png')).toBe(false);
    });

    it('should mark GIF as incompressible', () => {
      expect(isCompressible('image/gif')).toBe(false);
    });

    it('should mark video as incompressible', () => {
      expect(isCompressible('video/mp4')).toBe(false);
      expect(isCompressible('video/webm')).toBe(false);
    });

    it('should mark audio as incompressible', () => {
      expect(isCompressible('audio/mpeg')).toBe(false);
      expect(isCompressible('audio/ogg')).toBe(false);
    });

    it('should mark archives as incompressible', () => {
      expect(isCompressible('application/zip')).toBe(false);
      expect(isCompressible('application/gzip')).toBe(false);
    });

    it('should mark PDF as incompressible', () => {
      expect(isCompressible('application/pdf')).toBe(false);
    });

    it('should mark text/* as compressible', () => {
      expect(isCompressible('text/plain')).toBe(true);
      expect(isCompressible('text/html')).toBe(true);
      expect(isCompressible('text/css')).toBe(true);
    });

    it('should mark JSON as compressible', () => {
      expect(isCompressible('application/json')).toBe(true);
    });

    it('should mark XML as compressible', () => {
      expect(isCompressible('application/xml')).toBe(true);
      expect(isCompressible('text/xml')).toBe(true);
    });

    it('should mark JavaScript as compressible', () => {
      expect(isCompressible('application/javascript')).toBe(true);
      expect(isCompressible('text/javascript')).toBe(true);
    });

    it('should mark SVG as compressible', () => {
      expect(isCompressible('image/svg+xml')).toBe(true);
    });

    it('should mark unknown types as compressible by default', () => {
      expect(isCompressible(null)).toBe(true);
      expect(isCompressible('application/unknown')).toBe(true);
    });
  });

  describe('getFileTypeDescription', () => {
    it('should describe JPEG', () => {
      expect(getFileTypeDescription('image/jpeg')).toBe('JPEG Image');
    });

    it('should describe PNG', () => {
      expect(getFileTypeDescription('image/png')).toBe('PNG Image');
    });

    it('should describe MP4', () => {
      expect(getFileTypeDescription('video/mp4')).toBe('MP4 Video');
    });

    it('should describe MP3', () => {
      expect(getFileTypeDescription('audio/mpeg')).toBe('MP3 Audio');
    });

    it('should describe ZIP', () => {
      expect(getFileTypeDescription('application/zip')).toBe('ZIP Archive');
    });

    it('should describe PDF', () => {
      expect(getFileTypeDescription('application/pdf')).toBe('PDF Document');
    });

    it('should return MIME type for unknown', () => {
      expect(getFileTypeDescription('application/unknown')).toBe('application/unknown');
    });

    it('should return "Unknown" for null', () => {
      expect(getFileTypeDescription(null)).toBe('Unknown');
    });
  });

  describe('Edge Cases', () => {
    it('should not confuse RIFF formats', () => {
      // RIFF without WEBP should not match WebP
      const riffNotWebp = new Uint8Array([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x00, 0x00, 0x00, 0x00, // size
        0x57, 0x41, 0x56, 0x45, // WAVE (not WEBP)
      ]);
      expect(detectFileType(riffNotWebp.buffer)).not.toBe('image/webp');
    });

    it('should handle buffer at exact minimum size', () => {
      const twoBytes = new Uint8Array([0xFF, 0xD8]); // JPEG start (needs 3 bytes)
      expect(detectFileType(twoBytes.buffer)).toBeNull();
    });

    it('should handle all signatures correctly', () => {
      // Test that longer signatures take precedence
      const docx = new Uint8Array([0x50, 0x4B, 0x03, 0x04]); // ZIP signature (DOCX is ZIP)
      const type = detectFileType(docx.buffer);
      expect(type).toMatch(/zip|openxmlformats/i);
    });
  });

  describe('Real-World File Detection', () => {
    it('should detect common image types', () => {
      const jpegSignatures = [
        [0xFF, 0xD8, 0xFF, 0xE0],
        [0xFF, 0xD8, 0xFF, 0xE1],
        [0xFF, 0xD8, 0xFF, 0xE2],
      ];

      jpegSignatures.forEach(sig => {
        expect(detectFileType(new Uint8Array(sig).buffer)).toBe('image/jpeg');
      });
    });

    it('should detect common archive types', () => {
      const zipVariants = [
        [0x50, 0x4B, 0x03, 0x04], // Standard ZIP
        [0x50, 0x4B, 0x05, 0x06], // Empty ZIP
        [0x50, 0x4B, 0x07, 0x08], // Spanned ZIP
      ];

      zipVariants.forEach(sig => {
        expect(detectFileType(new Uint8Array(sig).buffer)).toBe('application/zip');
      });
    });
  });
});
