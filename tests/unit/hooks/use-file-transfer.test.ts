/**
 * Unit tests for useFileTransfer hook
 * Tests file selection, drag-and-drop, and file management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileTransfer } from '@/lib/hooks/use-file-transfer';

// Mock dependencies
vi.mock('@/lib/utils/uuid', () => ({
  generateUUID: vi.fn(() => 'mock-uuid-' + Math.random().toString(36).substring(7)),
}));

vi.mock('@/lib/storage/download-location', () => ({
  saveFileToDirectory: vi.fn().mockResolvedValue(false),
}));

// Helper to create mock File objects
function createMockFile(
  name: string,
  size: number,
  type: string = 'text/plain',
  lastModified: number = Date.now()
): File {
  // Keep fixture memory bounded for very large synthetic files.
  const byteLength = Math.min(size, 1024);
  const file = new File([new Uint8Array(byteLength)], name, { type, lastModified });
  if (file.size !== size) {
    Object.defineProperty(file, 'size', { value: size });
  }
  return file;
}

// Helper to create mock FileList
function createMockFileList(files: File[]): FileList {
  const fileList = {
    length: files.length,
    item: (index: number) => files[index] || null,
    [Symbol.iterator]: function* () {
      for (let i = 0; i < files.length; i++) {
        yield files[i];
      }
    },
  };
  // Add indexed access
  files.forEach((file, index) => {
    (fileList as any)[index] = file;
  });
  return fileList as FileList;
}

// Helper to create mock drag event
function createMockDragEvent(files: File[]): React.DragEvent {
  const fileList = createMockFileList(files);
  return {
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    dataTransfer: {
      files: fileList,
    },
  } as unknown as React.DragEvent;
}

describe('useFileTransfer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with empty files array', () => {
      const { result } = renderHook(() => useFileTransfer());

      expect(result.current.files).toEqual([]);
      expect(result.current.isDragging).toBe(false);
    });

    it('should provide a ref for file input', () => {
      const { result } = renderHook(() => useFileTransfer());

      expect(result.current.inputRef).toBeDefined();
      expect(result.current.inputRef.current).toBeNull();
    });
  });

  describe('addFiles', () => {
    it('should add a single file', () => {
      const { result } = renderHook(() => useFileTransfer());
      const mockFile = createMockFile('test.txt', 1024, 'text/plain');

      act(() => {
        result.current.addFiles([mockFile]);
      });

      expect(result.current.files).toHaveLength(1);
      expect(result.current.files[0].name).toBe('test.txt');
      expect(result.current.files[0].size).toBe(1024);
      expect(result.current.files[0].type).toBe('text/plain');
      expect(result.current.files[0].file).toBe(mockFile);
      expect(result.current.files[0].id).toBeDefined();
    });

    it('should add multiple files', () => {
      const { result } = renderHook(() => useFileTransfer());
      const mockFiles = [
        createMockFile('file1.txt', 1024),
        createMockFile('file2.pdf', 2048, 'application/pdf'),
        createMockFile('file3.jpg', 4096, 'image/jpeg'),
      ];

      act(() => {
        result.current.addFiles(mockFiles);
      });

      expect(result.current.files).toHaveLength(3);
      expect(result.current.files[0].name).toBe('file1.txt');
      expect(result.current.files[1].name).toBe('file2.pdf');
      expect(result.current.files[2].name).toBe('file3.jpg');
    });

    it('should append files to existing list', () => {
      const { result } = renderHook(() => useFileTransfer());
      const file1 = createMockFile('file1.txt', 1024);
      const file2 = createMockFile('file2.txt', 2048);

      act(() => {
        result.current.addFiles([file1]);
      });

      expect(result.current.files).toHaveLength(1);

      act(() => {
        result.current.addFiles([file2]);
      });

      expect(result.current.files).toHaveLength(2);
      expect(result.current.files[0].name).toBe('file1.txt');
      expect(result.current.files[1].name).toBe('file2.txt');
    });

    it('should set default MIME type for unknown types', () => {
      const { result } = renderHook(() => useFileTransfer());
      const mockFile = createMockFile('unknown.xyz', 1024, '');

      act(() => {
        result.current.addFiles([mockFile]);
      });

      expect(result.current.files[0].type).toBe('application/octet-stream');
    });

    it('should generate unique IDs for each file', () => {
      const { result } = renderHook(() => useFileTransfer());
      const mockFiles = [
        createMockFile('file1.txt', 1024),
        createMockFile('file2.txt', 2048),
      ];

      act(() => {
        result.current.addFiles(mockFiles);
      });

      const ids = result.current.files.map(f => f.id);
      expect(new Set(ids).size).toBe(2); // All IDs should be unique
    });
  });

  describe('removeFile', () => {
    it('should remove a file by ID', () => {
      const { result } = renderHook(() => useFileTransfer());
      const mockFiles = [
        createMockFile('file1.txt', 1024),
        createMockFile('file2.txt', 2048),
      ];

      act(() => {
        result.current.addFiles(mockFiles);
      });

      const fileId = result.current.files[0].id;

      act(() => {
        result.current.removeFile(fileId);
      });

      expect(result.current.files).toHaveLength(1);
      expect(result.current.files[0].name).toBe('file2.txt');
    });

    it('should not throw if removing non-existent ID', () => {
      const { result } = renderHook(() => useFileTransfer());

      expect(() => {
        act(() => {
          result.current.removeFile('non-existent-id');
        });
      }).not.toThrow();

      expect(result.current.files).toHaveLength(0);
    });
  });

  describe('clearFiles', () => {
    it('should clear all files', () => {
      const { result } = renderHook(() => useFileTransfer());
      const mockFiles = [
        createMockFile('file1.txt', 1024),
        createMockFile('file2.txt', 2048),
      ];

      act(() => {
        result.current.addFiles(mockFiles);
      });

      expect(result.current.files).toHaveLength(2);

      act(() => {
        result.current.clearFiles();
      });

      expect(result.current.files).toEqual([]);
    });
  });

  describe('Drag and Drop', () => {
    it('should set isDragging to true on dragOver', () => {
      const { result } = renderHook(() => useFileTransfer());
      const event = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDragOver(event);
      });

      expect(result.current.isDragging).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should set isDragging to false on dragLeave', () => {
      const { result } = renderHook(() => useFileTransfer());

      act(() => {
        result.current.handleDragOver({
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
        } as unknown as React.DragEvent);
      });

      expect(result.current.isDragging).toBe(true);

      act(() => {
        result.current.handleDragLeave({
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
        } as unknown as React.DragEvent);
      });

      expect(result.current.isDragging).toBe(false);
    });

    it('should add files on drop', () => {
      const { result } = renderHook(() => useFileTransfer());
      const mockFiles = [
        createMockFile('dropped.txt', 1024),
      ];
      const event = createMockDragEvent(mockFiles);

      act(() => {
        result.current.handleDrop(event);
      });

      expect(result.current.files).toHaveLength(1);
      expect(result.current.files[0].name).toBe('dropped.txt');
      expect(result.current.isDragging).toBe(false);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should handle drop with no files', () => {
      const { result } = renderHook(() => useFileTransfer());
      const event = createMockDragEvent([]);

      act(() => {
        result.current.handleDrop(event);
      });

      expect(result.current.files).toHaveLength(0);
      expect(result.current.isDragging).toBe(false);
    });
  });

  describe('handleFileInputChange', () => {
    it('should add files from input change event', () => {
      const { result } = renderHook(() => useFileTransfer());
      const mockFiles = [createMockFile('input.txt', 1024)];
      const fileList = createMockFileList(mockFiles);

      const event = {
        target: {
          files: fileList,
          value: 'C:\\fakepath\\input.txt',
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleFileInputChange(event);
      });

      expect(result.current.files).toHaveLength(1);
      expect(result.current.files[0].name).toBe('input.txt');
      expect(event.target.value).toBe(''); // Should reset
    });

    it('should not add files if no files selected', () => {
      const { result } = renderHook(() => useFileTransfer());

      const event = {
        target: {
          files: null,
          value: '',
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleFileInputChange(event);
      });

      expect(result.current.files).toHaveLength(0);
    });
  });

  describe('getTotalSize', () => {
    it('should return 0 for no files', () => {
      const { result } = renderHook(() => useFileTransfer());

      expect(result.current.getTotalSize()).toBe(0);
    });

    it('should calculate total size of all files', () => {
      const { result } = renderHook(() => useFileTransfer());
      const mockFiles = [
        createMockFile('file1.txt', 1024),
        createMockFile('file2.txt', 2048),
        createMockFile('file3.txt', 4096),
      ];

      act(() => {
        result.current.addFiles(mockFiles);
      });

      expect(result.current.getTotalSize()).toBe(7168); // 1024 + 2048 + 4096
    });
  });

  describe('getFileById', () => {
    it('should return file by ID', () => {
      const { result } = renderHook(() => useFileTransfer());
      const mockFile = createMockFile('test.txt', 1024);

      act(() => {
        result.current.addFiles([mockFile]);
      });

      const fileId = result.current.files[0].id;
      const file = result.current.getFileById(fileId);

      expect(file).toBeDefined();
      expect(file?.name).toBe('test.txt');
    });

    it('should return undefined for non-existent ID', () => {
      const { result } = renderHook(() => useFileTransfer());

      const file = result.current.getFileById('non-existent');

      expect(file).toBeUndefined();
    });
  });

  describe('getAllFiles', () => {
    it('should return array of File objects', () => {
      const { result } = renderHook(() => useFileTransfer());
      const mockFiles = [
        createMockFile('file1.txt', 1024),
        createMockFile('file2.txt', 2048),
      ];

      act(() => {
        result.current.addFiles(mockFiles);
      });

      const files = result.current.getAllFiles();

      expect(files).toHaveLength(2);
      expect(files[0]).toBeInstanceOf(File);
      expect(files[1]).toBeInstanceOf(File);
      expect(files[0].name).toBe('file1.txt');
      expect(files[1].name).toBe('file2.txt');
    });

    it('should return empty array when no files', () => {
      const { result } = renderHook(() => useFileTransfer());

      const files = result.current.getAllFiles();

      expect(files).toEqual([]);
    });
  });

  describe('openFilePicker', () => {
    it('should call click on input ref', () => {
      const { result } = renderHook(() => useFileTransfer());
      const mockInput = { click: vi.fn() };
      result.current.inputRef.current = mockInput as unknown as HTMLInputElement;

      act(() => {
        result.current.openFilePicker();
      });

      expect(mockInput.click).toHaveBeenCalled();
    });

    it('should not throw if input ref is null', () => {
      const { result } = renderHook(() => useFileTransfer());

      expect(() => {
        act(() => {
          result.current.openFilePicker();
        });
      }).not.toThrow();
    });
  });

  describe('File Metadata', () => {
    it('should preserve file lastModified timestamp', () => {
      const { result } = renderHook(() => useFileTransfer());
      const timestamp = Date.now() - 10000;
      const mockFile = createMockFile('test.txt', 1024, 'text/plain', timestamp);

      act(() => {
        result.current.addFiles([mockFile]);
      });

      expect(result.current.files[0].lastModified).toBe(timestamp);
    });

    it('should initialize hash as empty string', () => {
      const { result } = renderHook(() => useFileTransfer());
      const mockFile = createMockFile('test.txt', 1024);

      act(() => {
        result.current.addFiles([mockFile]);
      });

      expect(result.current.files[0].hash).toBe('');
    });

    it('should initialize thumbnail as null', () => {
      const { result } = renderHook(() => useFileTransfer());
      const mockFile = createMockFile('test.txt', 1024);

      act(() => {
        result.current.addFiles([mockFile]);
      });

      expect(result.current.files[0].thumbnail).toBeNull();
    });

    it('should initialize path as null', () => {
      const { result } = renderHook(() => useFileTransfer());
      const mockFile = createMockFile('test.txt', 1024);

      act(() => {
        result.current.addFiles([mockFile]);
      });

      expect(result.current.files[0].path).toBeNull();
    });
  });

  describe('Large File Lists', () => {
    it('should handle adding 100 files efficiently', () => {
      const { result } = renderHook(() => useFileTransfer());
      const mockFiles = Array.from({ length: 100 }, (_, i) =>
        createMockFile(`file${i}.txt`, 1024 * (i + 1))
      );

      act(() => {
        result.current.addFiles(mockFiles);
      });

      expect(result.current.files).toHaveLength(100);
      expect(result.current.getTotalSize()).toBe(1024 * 5050); // Sum of 1 to 100
    });

    it('should handle removing files from large list', () => {
      const { result } = renderHook(() => useFileTransfer());
      const mockFiles = Array.from({ length: 50 }, (_, i) =>
        createMockFile(`file${i}.txt`, 1024)
      );

      act(() => {
        result.current.addFiles(mockFiles);
      });

      const idsToRemove = result.current.files.slice(0, 25).map(f => f.id);

      act(() => {
        idsToRemove.forEach(id => result.current.removeFile(id));
      });

      expect(result.current.files).toHaveLength(25);
    });
  });

  describe('Edge Cases', () => {
    it('should handle files with special characters in name', () => {
      const { result } = renderHook(() => useFileTransfer());
      const specialNames = [
        'file with spaces.txt',
        'file-with-dashes.txt',
        'file_with_underscores.txt',
        'file.multiple.dots.txt',
        'файл.txt', // Cyrillic
        '文件.txt', // Chinese
      ];

      const mockFiles = specialNames.map(name =>
        createMockFile(name, 1024)
      );

      act(() => {
        result.current.addFiles(mockFiles);
      });

      expect(result.current.files).toHaveLength(6);
      specialNames.forEach((name, i) => {
        expect(result.current.files[i].name).toBe(name);
      });
    });

    it('should handle zero-byte files', () => {
      const { result } = renderHook(() => useFileTransfer());
      const mockFile = createMockFile('empty.txt', 0);

      act(() => {
        result.current.addFiles([mockFile]);
      });

      expect(result.current.files).toHaveLength(1);
      expect(result.current.files[0].size).toBe(0);
      expect(result.current.getTotalSize()).toBe(0);
    });

    it('should handle very large file sizes', () => {
      const { result } = renderHook(() => useFileTransfer());
      const largeSize = 10 * 1024 * 1024 * 1024; // 10GB
      const mockFile = createMockFile('large.iso', largeSize);

      act(() => {
        result.current.addFiles([mockFile]);
      });

      expect(result.current.files[0].size).toBe(largeSize);
      expect(result.current.getTotalSize()).toBe(largeSize);
    });
  });
});
