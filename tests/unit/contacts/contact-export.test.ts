import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  exportContacts,
  downloadContactsJSON,
  exportSingleContact,
  importContacts,
  importContactsFromFile,
  exportAsVCard,
  downloadContactsVCard,
  generateShareableLink,
  parseShareableLink,
  generateQRCodeData,
  copyShareableLink,
  shareContactNative,
} from '../../../lib/contacts/contact-export';
import type { Friend } from '../../../lib/stores/friends-store';

const initialFriends = [
  {
    id: 'device-1',
    name: 'Alice',
    platform: 'ios' as const,
    publicKey: 'public-key-alice',
    pairingCode: 'ABC123',
    isOnline: true,
    lastSeen: Date.now(),
    isTrusted: true,
    avatar: null,
    addedAt: 1704067200000,
    notes: 'My best friend',
    transferCount: 5,
    lastTransferAt: Date.now(),
  },
  {
    id: 'device-2',
    name: 'Bob',
    platform: 'android' as const,
    publicKey: 'public-key-bob',
    pairingCode: 'DEF456',
    isOnline: false,
    lastSeen: Date.now() - 3600000,
    isTrusted: false,
    avatar: null,
    addedAt: 1704153600000,
    notes: null,
    transferCount: 2,
    lastTransferAt: null,
  },
];

const cloneInitialFriends = () => initialFriends.map(friend => ({ ...friend }));

const setNavigatorProperty = (key: 'clipboard' | 'share', value: unknown) => {
  Object.defineProperty(navigator, key, {
    configurable: true,
    writable: true,
    value,
  });
};

// Mock friends store
const mockFriendsStore = {
  friends: cloneInitialFriends(),
  addFriend: vi.fn((friend: Friend) => {
    mockFriendsStore.friends.push(friend);
  }),
  getFriendById: (id: string) => mockFriendsStore.friends.find(f => f.id === id),
};

vi.mock('../../../lib/stores/friends-store', () => ({
  useFriendsStore: {
    getState: () => mockFriendsStore,
  },
}));

describe('Contact Export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFriendsStore.friends = cloneInitialFriends();
    mockFriendsStore.addFriend.mockImplementation((friend: Friend) => {
      mockFriendsStore.friends.push(friend);
    });
    setNavigatorProperty('clipboard', undefined);
    setNavigatorProperty('share', undefined);
  });

  describe('exportContacts', () => {
    it('should export all contacts', () => {
      const exported = exportContacts();

      expect(exported.version).toBe('1.0.0');
      expect(exported.contacts.length).toBe(2);
      expect(exported.metadata.totalContacts).toBe(2);
      expect(exported.metadata.trustedContacts).toBe(1);
    });

    it('should include contact details', () => {
      const exported = exportContacts();
      const alice = exported.contacts.find(c => c.name === 'Alice');

      expect(alice).toBeDefined();
      expect(alice?.deviceId).toBe('device-1');
      expect(alice?.publicKey).toBe('public-key-alice');
      expect(alice?.trustLevel).toBe('trusted');
      expect(alice?.platform).toBe('ios');
      expect(alice?.notes).toBe('My best friend');
    });

    it('should map trust level correctly', () => {
      const exported = exportContacts();
      const alice = exported.contacts.find(c => c.name === 'Alice');
      const bob = exported.contacts.find(c => c.name === 'Bob');

      expect(alice?.trustLevel).toBe('trusted');
      expect(bob?.trustLevel).toBe('normal');
    });

    it('should have valid timestamp', () => {
      const before = Date.now();
      const exported = exportContacts();
      const after = Date.now();

      expect(exported.exportedAt).toBeGreaterThanOrEqual(before);
      expect(exported.exportedAt).toBeLessThanOrEqual(after);
    });
  });

  describe('downloadContactsJSON', () => {
    it('should create download link', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);

      // Mock URL.createObjectURL
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();

      downloadContactsJSON();

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
  });

  describe('exportSingleContact', () => {
    it('should export single contact by ID', () => {
      const contact = exportSingleContact('device-1');

      expect(contact).toBeDefined();
      expect(contact?.name).toBe('Alice');
      expect(contact?.deviceId).toBe('device-1');
    });

    it('should return null for non-existent contact', () => {
      const contact = exportSingleContact('non-existent');

      expect(contact).toBeNull();
    });
  });

  describe('importContacts', () => {
    it('should import contacts from JSON', () => {
      const exportData = exportContacts();
      const jsonString = JSON.stringify(exportData);

      // Clear mock to see if it's called
      mockFriendsStore.addFriend.mockClear();
      mockFriendsStore.friends = []; // Start empty

      const result = importContacts(jsonString);

      expect(result.success).toBe(true);
      expect(result.imported).toBe(2);
      expect(result.skipped).toBe(0);
      expect(result.errors.length).toBe(0);
      expect(mockFriendsStore.addFriend).toHaveBeenCalledTimes(2);
    });

    it('should import from object', () => {
      const exportData = exportContacts();
      mockFriendsStore.friends = [];

      const result = importContacts(exportData);

      expect(result.success).toBe(true);
      expect(result.imported).toBe(2);
    });

    it('should skip duplicate contacts', () => {
      const exportData = exportContacts();
      // Friends already exist
      mockFriendsStore.friends = [mockFriendsStore.friends[0]];

      const result = importContacts(exportData);

      expect(result.skipped).toBeGreaterThan(0);
      expect(result.duplicates.length).toBeGreaterThan(0);
    });

    it('should handle invalid JSON', () => {
      const result = importContacts('invalid json{');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle missing contacts array', () => {
      const result = importContacts('{"version":"1.0.0"}');

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('contacts array missing');
    });

    it('should skip contacts with missing fields', () => {
      const invalidData = {
        version: '1.0.0',
        exportedAt: Date.now(),
        contacts: [
          { name: 'Invalid', deviceId: '', publicKey: '' }, // Missing required fields
        ],
        metadata: { totalContacts: 1, trustedContacts: 0, exportedBy: 'Test' },
      };

      mockFriendsStore.friends = [];
      const result = importContacts(invalidData);

      expect(result.skipped).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('importContactsFromFile', () => {
    it('should import from File object', async () => {
      const exportData = exportContacts();
      const jsonString = JSON.stringify(exportData);
      const file = new File([jsonString], 'contacts.json', { type: 'application/json' });

      mockFriendsStore.friends = [];

      const result = await importContactsFromFile(file);

      expect(result.success).toBe(true);
      expect(result.imported).toBeGreaterThan(0);
    });

    it('should handle file read error', async () => {
      const invalidFile = new File([], 'empty.json');

      const result = await importContactsFromFile(invalidFile);

      expect(result.success).toBe(false);
    });
  });

  describe('exportAsVCard', () => {
    it('should export as vCard format', () => {
      const vcard = exportAsVCard();

      expect(vcard).toContain('BEGIN:VCARD');
      expect(vcard).toContain('END:VCARD');
      expect(vcard).toContain('VERSION:3.0');
      expect(vcard).toContain('FN:Alice');
      expect(vcard).toContain('FN:Bob');
    });

    it('should include contact details in vCard', () => {
      const vcard = exportAsVCard();

      expect(vcard).toContain('Device ID: device-1');
      expect(vcard).toContain('Public Key: public-key-alice');
      expect(vcard).toContain('ORG:Tallow');
    });

    it('should include notes if present', () => {
      const vcard = exportAsVCard();

      expect(vcard).toContain('NOTE:My best friend');
    });
  });

  describe('downloadContactsVCard', () => {
    it('should create vCard download', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);

      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();

      downloadContactsVCard();

      expect(createElementSpy).toHaveBeenCalledWith('a');

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
  });

  describe('generateShareableLink', () => {
    it('should generate shareable link', () => {
      const link = generateShareableLink('device-1');

      expect(link).toBeDefined();
      expect(link).toContain('/add-contact?data=');
    });

    it('should encode contact data in base64', () => {
      const link = generateShareableLink('device-1');

      expect(link).toMatch(/data=[A-Za-z0-9+/=%]+/);
    });

    it('should return null for non-existent contact', () => {
      const link = generateShareableLink('non-existent');

      expect(link).toBeNull();
    });
  });

  describe('parseShareableLink', () => {
    it('should parse shareable link', () => {
      const link = generateShareableLink('device-1');
      expect(link).not.toBeNull();

      const contact = parseShareableLink(link!);

      expect(contact).toBeDefined();
      expect(contact?.name).toBe('Alice');
      expect(contact?.deviceId).toBe('device-1');
      expect(contact?.publicKey).toBe('public-key-alice');
    });

    it('should return null for invalid URL', () => {
      const contact = parseShareableLink('invalid-url');

      expect(contact).toBeNull();
    });

    it('should return null for missing data parameter', () => {
      const contact = parseShareableLink('https://example.com/add-contact');

      expect(contact).toBeNull();
    });

    it('should handle decode errors', () => {
      const contact = parseShareableLink('https://example.com/add-contact?data=invalid!!!');

      expect(contact).toBeNull();
    });
  });

  describe('Round-trip: generate and parse', () => {
    it('should generate and parse correctly', () => {
      const originalLink = generateShareableLink('device-1');
      expect(originalLink).not.toBeNull();

      const parsed = parseShareableLink(originalLink!);
      expect(parsed).not.toBeNull();

      expect(parsed?.name).toBe('Alice');
      expect(parsed?.deviceId).toBe('device-1');
      expect(parsed?.publicKey).toBe('public-key-alice');
      expect(parsed?.platform).toBe('ios');
      expect(parsed?.trustLevel).toBe('trusted');
    });
  });

  describe('generateQRCodeData', () => {
    it('should return shareable link for QR code', () => {
      const qrData = generateQRCodeData('device-1');

      expect(qrData).toBeDefined();
      expect(qrData).toContain('/add-contact?data=');
    });

    it('should return null for non-existent contact', () => {
      const qrData = generateQRCodeData('non-existent');

      expect(qrData).toBeNull();
    });
  });

  describe('copyShareableLink', () => {
    it('should copy link to clipboard', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      setNavigatorProperty('clipboard', {
        writeText: writeTextMock,
      });

      const success = await copyShareableLink('device-1');

      expect(success).toBe(true);
      expect(writeTextMock).toHaveBeenCalled();
    });

    it('should return false for non-existent contact', async () => {
      const success = await copyShareableLink('non-existent');

      expect(success).toBe(false);
    });

    it('should handle clipboard API unavailable', async () => {
      setNavigatorProperty('clipboard', undefined);

      const success = await copyShareableLink('device-1');

      expect(success).toBe(false);
    });

    it('should handle clipboard write error', async () => {
      const writeTextMock = vi.fn().mockRejectedValue(new Error('Permission denied'));
      setNavigatorProperty('clipboard', {
        writeText: writeTextMock,
      });

      const success = await copyShareableLink('device-1');

      expect(success).toBe(false);
    });
  });

  describe('shareContactNative', () => {
    it('should use Web Share API', async () => {
      const shareMock = vi.fn().mockResolvedValue(undefined);
      setNavigatorProperty('share', shareMock);

      const success = await shareContactNative('device-1');

      expect(success).toBe(true);
      expect(shareMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('Alice'),
          text: expect.any(String),
          url: expect.any(String),
        })
      );
    });

    it('should return false if Web Share unavailable', async () => {
      setNavigatorProperty('share', undefined);

      const success = await shareContactNative('device-1');

      expect(success).toBe(false);
    });

    it('should return false for non-existent contact', async () => {
      const shareMock = vi.fn();
      setNavigatorProperty('share', shareMock);

      const success = await shareContactNative('non-existent');

      expect(success).toBe(false);
      expect(shareMock).not.toHaveBeenCalled();
    });

    it('should handle share cancellation', async () => {
      const shareMock = vi.fn().mockRejectedValue(new Error('Share cancelled'));
      setNavigatorProperty('share', shareMock);

      const success = await shareContactNative('device-1');

      expect(success).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle contacts with null notes', () => {
      const bob = exportSingleContact('device-2');

      expect(bob).toBeDefined();
      expect(bob?.notes).toBeNull();
    });

    it('should handle empty friends list', () => {
      mockFriendsStore.friends = [];
      const exported = exportContacts();

      expect(exported.contacts.length).toBe(0);
      expect(exported.metadata.totalContacts).toBe(0);
      expect(exported.metadata.trustedContacts).toBe(0);
    });

    it('should handle import with default values', () => {
      const minimalContact = {
        version: '1.0.0',
        exportedAt: Date.now(),
        contacts: [
          {
            name: 'Minimal',
            deviceId: 'device-min',
            publicKey: 'key-min',
            platform: 'web' as const,
            trustLevel: 'normal' as const,
            addedAt: Date.now(),
            transferCount: 0,
            notes: null,
          },
        ],
        metadata: { totalContacts: 1, trustedContacts: 0, exportedBy: 'Test' },
      };

      mockFriendsStore.friends = [];
      const result = importContacts(minimalContact);

      expect(result.success).toBe(true);
      expect(result.imported).toBe(1);
    });
  });
});
