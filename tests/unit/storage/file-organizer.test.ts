import { describe, it, expect } from 'vitest';
import {
  organizeByType,
  organizeBySender,
  organizeByDate,
  getStats,
} from '../../../lib/storage/file-organizer';
import type { TransferRecord } from '../../../lib/storage/transfer-history';

describe('File Organizer', () => {
  const createTransferRecord = (
    files: Array<{ name: string; size: number }>,
    direction: 'send' | 'receive',
    peerId: string,
    peerName: string,
    date: Date
  ): TransferRecord => ({
    id: `transfer-${Date.now()}-${Math.random()}`,
    direction,
    files: files.map(f => ({ ...f, type: 'application/octet-stream' })),
    totalSize: files.reduce((sum, f) => sum + f.size, 0),
    peerId,
    peerName,
    peerEmail: undefined,
    status: 'completed',
    startedAt: date,
    completedAt: date,
    duration: 1000,
    speed: 1000000,
  });

  describe('organizeByType', () => {
    it('should categorize image files', () => {
      const transfers = [
        createTransferRecord(
          [{ name: 'photo.jpg', size: 1000 }, { name: 'image.png', size: 2000 }],
          'receive',
          'peer1',
          'Device 1',
          new Date()
        ),
      ];

      const organized = organizeByType(transfers);
      const images = organized.find(o => o.category === 'images');

      expect(images).toBeDefined();
      expect(images?.transfers.length).toBe(1);
      expect(images?.fileCount).toBe(2);
      expect(images?.totalSize).toBe(3000);
    });

    it('should categorize video files', () => {
      const transfers = [
        createTransferRecord(
          [{ name: 'video.mp4', size: 5000000 }],
          'receive',
          'peer1',
          'Device 1',
          new Date()
        ),
      ];

      const organized = organizeByType(transfers);
      const videos = organized.find(o => o.category === 'videos');

      expect(videos).toBeDefined();
      expect(videos?.transfers.length).toBe(1);
    });

    it('should categorize documents', () => {
      const transfers = [
        createTransferRecord(
          [{ name: 'document.pdf', size: 50000 }, { name: 'sheet.xlsx', size: 30000 }],
          'receive',
          'peer1',
          'Device 1',
          new Date()
        ),
      ];

      const organized = organizeByType(transfers);
      const docs = organized.find(o => o.category === 'documents');

      expect(docs).toBeDefined();
      expect(docs?.fileCount).toBe(2);
    });

    it('should categorize audio files', () => {
      const transfers = [
        createTransferRecord(
          [{ name: 'song.mp3', size: 3000000 }],
          'receive',
          'peer1',
          'Device 1',
          new Date()
        ),
      ];

      const organized = organizeByType(transfers);
      const audio = organized.find(o => o.category === 'audio');

      expect(audio).toBeDefined();
    });

    it('should categorize archives', () => {
      const transfers = [
        createTransferRecord(
          [{ name: 'archive.zip', size: 10000000 }],
          'receive',
          'peer1',
          'Device 1',
          new Date()
        ),
      ];

      const organized = organizeByType(transfers);
      const archives = organized.find(o => o.category === 'archives');

      expect(archives).toBeDefined();
    });

    it('should categorize code files', () => {
      const transfers = [
        createTransferRecord(
          [{ name: 'script.js', size: 5000 }, { name: 'style.css', size: 3000 }],
          'receive',
          'peer1',
          'Device 1',
          new Date()
        ),
      ];

      const organized = organizeByType(transfers);
      const code = organized.find(o => o.category === 'code');

      expect(code).toBeDefined();
      expect(code?.fileCount).toBe(2);
    });

    it('should categorize unknown files as "other"', () => {
      const transfers = [
        createTransferRecord(
          [{ name: 'unknown.xyz', size: 1000 }],
          'receive',
          'peer1',
          'Device 1',
          new Date()
        ),
      ];

      const organized = organizeByType(transfers);
      const other = organized.find(o => o.category === 'other');

      expect(other).toBeDefined();
    });

    it('should only include received transfers', () => {
      const transfers = [
        createTransferRecord([{ name: 'sent.txt', size: 100 }], 'send', 'peer1', 'Device 1', new Date()),
        createTransferRecord([{ name: 'received.txt', size: 200 }], 'receive', 'peer2', 'Device 2', new Date()),
      ];

      const organized = organizeByType(transfers);
      const allTransfers = organized.flatMap(o => o.transfers);

      expect(allTransfers.every(t => t.direction === 'receive')).toBe(true);
    });

    it('should filter out empty categories', () => {
      const transfers = [
        createTransferRecord([{ name: 'doc.pdf', size: 1000 }], 'receive', 'peer1', 'Device 1', new Date()),
      ];

      const organized = organizeByType(transfers);

      // Should only have categories with files
      expect(organized.every(o => o.transfers.length > 0)).toBe(true);
    });
  });

  describe('organizeBySender', () => {
    it('should group by sender', () => {
      const transfers = [
        createTransferRecord([{ name: 'file1.txt', size: 100 }], 'receive', 'peer1', 'Device 1', new Date()),
        createTransferRecord([{ name: 'file2.txt', size: 200 }], 'receive', 'peer1', 'Device 1', new Date()),
        createTransferRecord([{ name: 'file3.txt', size: 300 }], 'receive', 'peer2', 'Device 2', new Date()),
      ];

      const organized = organizeBySender(transfers);

      expect(organized.length).toBe(2);

      const sender1 = organized.find(o => o.senderId === 'peer1');
      expect(sender1?.transfers.length).toBe(2);
      expect(sender1?.fileCount).toBe(2);
      expect(sender1?.totalSize).toBe(300);

      const sender2 = organized.find(o => o.senderId === 'peer2');
      expect(sender2?.transfers.length).toBe(1);
    });

    it('should use sender name', () => {
      const transfers = [
        createTransferRecord([{ name: 'file.txt', size: 100 }], 'receive', 'peer1', 'Alice Device', new Date()),
      ];

      const organized = organizeBySender(transfers);

      expect(organized[0].senderName).toBe('Alice Device');
    });

    it('should sort by most recent first', () => {
      const oldDate = new Date('2024-01-01');
      const newDate = new Date('2024-12-31');

      const transfers = [
        createTransferRecord([{ name: 'old.txt', size: 100 }], 'receive', 'peer1', 'Device 1', oldDate),
        createTransferRecord([{ name: 'new.txt', size: 200 }], 'receive', 'peer2', 'Device 2', newDate),
      ];

      const organized = organizeBySender(transfers);

      expect(organized[0].senderId).toBe('peer2'); // Most recent first
    });

    it('should only include received transfers', () => {
      const transfers = [
        createTransferRecord([{ name: 'sent.txt', size: 100 }], 'send', 'peer1', 'Device 1', new Date()),
        createTransferRecord([{ name: 'received.txt', size: 200 }], 'receive', 'peer2', 'Device 2', new Date()),
      ];

      const organized = organizeBySender(transfers);

      expect(organized.length).toBe(1);
      expect(organized[0].senderId).toBe('peer2');
    });
  });

  describe('organizeByDate', () => {
    it('should categorize today transfers', () => {
      const today = new Date();
      const transfers = [
        createTransferRecord([{ name: 'today.txt', size: 100 }], 'receive', 'peer1', 'Device 1', today),
      ];

      const organized = organizeByDate(transfers);
      const todayCategory = organized.find(o => o.category === 'today');

      expect(todayCategory).toBeDefined();
      expect(todayCategory?.transfers.length).toBe(1);
    });

    it('should categorize yesterday transfers', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const transfers = [
        createTransferRecord([{ name: 'yesterday.txt', size: 100 }], 'receive', 'peer1', 'Device 1', yesterday),
      ];

      const organized = organizeByDate(transfers);
      const yesterdayCategory = organized.find(o => o.category === 'yesterday');

      expect(yesterdayCategory).toBeDefined();
    });

    it('should categorize this week transfers', () => {
      const thisWeek = new Date();
      thisWeek.setDate(thisWeek.getDate() - 5);

      const transfers = [
        createTransferRecord([{ name: 'week.txt', size: 100 }], 'receive', 'peer1', 'Device 1', thisWeek),
      ];

      const organized = organizeByDate(transfers);
      const weekCategory = organized.find(o => o.category === 'this-week');

      expect(weekCategory).toBeDefined();
    });

    it('should categorize this month transfers', () => {
      const thisMonth = new Date();
      thisMonth.setDate(thisMonth.getDate() - 20);

      const transfers = [
        createTransferRecord([{ name: 'month.txt', size: 100 }], 'receive', 'peer1', 'Device 1', thisMonth),
      ];

      const organized = organizeByDate(transfers);
      const monthCategory = organized.find(o => o.category === 'this-month');

      expect(monthCategory).toBeDefined();
    });

    it('should categorize older transfers', () => {
      const older = new Date();
      older.setMonth(older.getMonth() - 2);

      const transfers = [
        createTransferRecord([{ name: 'old.txt', size: 100 }], 'receive', 'peer1', 'Device 1', older),
      ];

      const organized = organizeByDate(transfers);
      const olderCategory = organized.find(o => o.category === 'older');

      expect(olderCategory).toBeDefined();
    });

    it('should maintain chronological order', () => {
      const organized = organizeByDate([]);

      const expectedOrder: Array<'today' | 'yesterday' | 'this-week' | 'this-month' | 'older'> = [
        'today',
        'yesterday',
        'this-week',
        'this-month',
        'older',
      ];

      const actualOrder = organized.map(o => o.category);
      const filteredExpected = expectedOrder.filter(cat => actualOrder.includes(cat));

      expect(actualOrder).toEqual(filteredExpected);
    });
  });

  describe('getStats', () => {
    it('should calculate total statistics', () => {
      const transfers = [
        createTransferRecord([{ name: 'file1.txt', size: 100 }], 'receive', 'peer1', 'Device 1', new Date()),
        createTransferRecord([{ name: 'file2.jpg', size: 200 }, { name: 'file3.mp4', size: 300 }], 'receive', 'peer1', 'Device 1', new Date()),
      ];

      const stats = getStats(transfers);

      expect(stats.totalFiles).toBe(3);
      expect(stats.totalSize).toBe(600);
    });

    it('should categorize by type', () => {
      const transfers = [
        createTransferRecord([{ name: 'image.png', size: 1000 }], 'receive', 'peer1', 'Device 1', new Date()),
        createTransferRecord([{ name: 'video.mp4', size: 2000 }], 'receive', 'peer1', 'Device 1', new Date()),
        createTransferRecord([{ name: 'doc.pdf', size: 500 }], 'receive', 'peer1', 'Device 1', new Date()),
      ];

      const stats = getStats(transfers);

      expect(stats.byType.images.count).toBe(1);
      expect(stats.byType.images.size).toBe(1000);
      expect(stats.byType.videos.count).toBe(1);
      expect(stats.byType.videos.size).toBe(2000);
      expect(stats.byType.documents.count).toBe(1);
      expect(stats.byType.documents.size).toBe(500);
    });

    it('should handle empty transfers', () => {
      const stats = getStats([]);

      expect(stats.totalFiles).toBe(0);
      expect(stats.totalSize).toBe(0);
      Object.values(stats.byType).forEach(type => {
        expect(type.count).toBe(0);
        expect(type.size).toBe(0);
      });
    });

    it('should only count received transfers', () => {
      const transfers = [
        createTransferRecord([{ name: 'sent.txt', size: 100 }], 'send', 'peer1', 'Device 1', new Date()),
        createTransferRecord([{ name: 'received.txt', size: 200 }], 'receive', 'peer2', 'Device 2', new Date()),
      ];

      const stats = getStats(transfers);

      expect(stats.totalFiles).toBe(1);
      expect(stats.totalSize).toBe(200);
    });
  });

  describe('Edge Cases', () => {
    it('should handle transfers with no files', () => {
      const transfers = [
        createTransferRecord([], 'receive', 'peer1', 'Device 1', new Date()),
      ];

      const stats = getStats(transfers);
      expect(stats.totalFiles).toBe(0);
    });

    it('should handle multiple file extensions correctly', () => {
      const transfers = [
        createTransferRecord(
          [
            { name: 'image.JPG', size: 1000 }, // uppercase
            { name: 'photo.jpeg', size: 2000 },
            { name: 'pic.png', size: 3000 },
          ],
          'receive',
          'peer1',
          'Device 1',
          new Date()
        ),
      ];

      const organized = organizeByType(transfers);
      const images = organized.find(o => o.category === 'images');

      expect(images?.fileCount).toBe(3);
    });

    it('should handle files without extensions', () => {
      const transfers = [
        createTransferRecord([{ name: 'README', size: 1000 }], 'receive', 'peer1', 'Device 1', new Date()),
      ];

      const organized = organizeByType(transfers);
      const other = organized.find(o => o.category === 'other');

      expect(other).toBeDefined();
    });
  });
});
