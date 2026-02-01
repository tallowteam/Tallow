/**
 * Unit Tests for Privacy Settings
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  getPrivacySettings,
  updatePrivacySettings,
  resetPrivacySettings,
  addTrustedContact,
  removeTrustedContact,
  isTrustedContact,
  shouldStripMetadata,
} from '../../../lib/privacy/privacy-settings';

describe('Privacy Settings', () => {
  // Clean up after each test
  afterEach(async () => {
    await resetPrivacySettings();
  });

  describe('getPrivacySettings', () => {
    it('should return default settings on first call', async () => {
      const settings = await getPrivacySettings();

      expect(settings).toBeDefined();
      expect(settings.stripMetadataEnabled).toBe(true);
      expect(settings.stripMetadataByDefault).toBe(true);
      expect(settings.preserveOrientation).toBe(true);
      expect(settings.showMetadataWarnings).toBe(true);
      expect(settings.trustedContacts).toEqual([]);
      expect(settings.stripFromImages).toBe(true);
      expect(settings.stripFromVideos).toBe(true);
    });

    it('should persist settings between calls', async () => {
      await updatePrivacySettings({ stripMetadataEnabled: false });

      const settings = await getPrivacySettings();
      expect(settings.stripMetadataEnabled).toBe(false);
    });
  });

  describe('updatePrivacySettings', () => {
    it('should update single setting', async () => {
      const updated = await updatePrivacySettings({
        stripMetadataEnabled: false,
      });

      expect(updated.stripMetadataEnabled).toBe(false);
    });

    it('should update multiple settings', async () => {
      const updated = await updatePrivacySettings({
        stripMetadataEnabled: false,
        showMetadataWarnings: false,
        preserveOrientation: false,
      });

      expect(updated.stripMetadataEnabled).toBe(false);
      expect(updated.showMetadataWarnings).toBe(false);
      expect(updated.preserveOrientation).toBe(false);
    });

    it('should preserve unmodified settings', async () => {
      await updatePrivacySettings({ stripMetadataEnabled: false });
      const updated = await updatePrivacySettings({ showMetadataWarnings: false });

      expect(updated.stripMetadataEnabled).toBe(false);
      expect(updated.showMetadataWarnings).toBe(false);
    });

    it('should return updated settings object', async () => {
      const result = await updatePrivacySettings({
        stripFromImages: false,
      });

      expect(result.stripFromImages).toBe(false);
      expect(result).toHaveProperty('stripMetadataEnabled');
      expect(result).toHaveProperty('trustedContacts');
    });
  });

  describe('resetPrivacySettings', () => {
    it('should reset all settings to defaults', async () => {
      // Modify settings
      await updatePrivacySettings({
        stripMetadataEnabled: false,
        stripMetadataByDefault: false,
        showMetadataWarnings: false,
      });

      // Reset
      const reset = await resetPrivacySettings();

      expect(reset.stripMetadataEnabled).toBe(true);
      expect(reset.stripMetadataByDefault).toBe(true);
      expect(reset.showMetadataWarnings).toBe(true);
    });

    it('should clear trusted contacts', async () => {
      await addTrustedContact('friend-1');
      await addTrustedContact('friend-2');

      const reset = await resetPrivacySettings();
      expect(reset.trustedContacts).toEqual([]);
    });
  });

  describe('Trusted Contacts', () => {
    describe('addTrustedContact', () => {
      it('should add a trusted contact', async () => {
        await addTrustedContact('friend-1');

        const settings = await getPrivacySettings();
        expect(settings.trustedContacts).toContain('friend-1');
      });

      it('should not add duplicates', async () => {
        await addTrustedContact('friend-1');
        await addTrustedContact('friend-1');

        const settings = await getPrivacySettings();
        expect(settings.trustedContacts.filter(id => id === 'friend-1')).toHaveLength(1);
      });

      it('should add multiple contacts', async () => {
        await addTrustedContact('friend-1');
        await addTrustedContact('friend-2');
        await addTrustedContact('friend-3');

        const settings = await getPrivacySettings();
        expect(settings.trustedContacts).toHaveLength(3);
        expect(settings.trustedContacts).toContain('friend-1');
        expect(settings.trustedContacts).toContain('friend-2');
        expect(settings.trustedContacts).toContain('friend-3');
      });
    });

    describe('removeTrustedContact', () => {
      it('should remove a trusted contact', async () => {
        await addTrustedContact('friend-1');
        await removeTrustedContact('friend-1');

        const settings = await getPrivacySettings();
        expect(settings.trustedContacts).not.toContain('friend-1');
      });

      it('should not error when removing non-existent contact', async () => {
        await removeTrustedContact('non-existent');

        const settings = await getPrivacySettings();
        expect(settings.trustedContacts).toEqual([]);
      });

      it('should only remove specified contact', async () => {
        await addTrustedContact('friend-1');
        await addTrustedContact('friend-2');
        await removeTrustedContact('friend-1');

        const settings = await getPrivacySettings();
        expect(settings.trustedContacts).not.toContain('friend-1');
        expect(settings.trustedContacts).toContain('friend-2');
      });
    });

    describe('isTrustedContact', () => {
      it('should return true for trusted contacts', async () => {
        await addTrustedContact('friend-1');

        const trusted = await isTrustedContact('friend-1');
        expect(trusted).toBe(true);
      });

      it('should return false for non-trusted contacts', async () => {
        const trusted = await isTrustedContact('stranger');
        expect(trusted).toBe(false);
      });

      it('should return false after removal', async () => {
        await addTrustedContact('friend-1');
        await removeTrustedContact('friend-1');

        const trusted = await isTrustedContact('friend-1');
        expect(trusted).toBe(false);
      });
    });
  });

  describe('shouldStripMetadata', () => {
    it('should return false when feature is disabled', async () => {
      await updatePrivacySettings({ stripMetadataEnabled: false });

      const should = await shouldStripMetadata('image/jpeg');
      expect(should).toBe(false);
    });

    it('should return false for trusted contacts', async () => {
      await addTrustedContact('friend-1');

      const should = await shouldStripMetadata('image/jpeg', 'friend-1');
      expect(should).toBe(false);
    });

    it('should return false when image stripping is disabled', async () => {
      await updatePrivacySettings({ stripFromImages: false });

      const should = await shouldStripMetadata('image/jpeg');
      expect(should).toBe(false);
    });

    it('should return false when video stripping is disabled', async () => {
      await updatePrivacySettings({ stripFromVideos: false });

      const should = await shouldStripMetadata('video/mp4');
      expect(should).toBe(false);
    });

    it('should return true for images with default settings', async () => {
      const should = await shouldStripMetadata('image/jpeg');
      expect(should).toBe(true);
    });

    it('should return true for videos with default settings', async () => {
      const should = await shouldStripMetadata('video/mp4');
      expect(should).toBe(true);
    });

    it('should return true for non-trusted contacts', async () => {
      await addTrustedContact('friend-1');

      const should = await shouldStripMetadata('image/jpeg', 'stranger');
      expect(should).toBe(true);
    });

    it('should return false when stripMetadataByDefault is off', async () => {
      await updatePrivacySettings({ stripMetadataByDefault: false });

      const should = await shouldStripMetadata('image/jpeg');
      expect(should).toBe(false);
    });
  });

  describe('File Type Handling', () => {
    it('should handle JPEG files', async () => {
      const shouldJpeg = await shouldStripMetadata('image/jpeg');
      const shouldJpg = await shouldStripMetadata('image/jpg');

      expect(shouldJpeg).toBe(true);
      expect(shouldJpg).toBe(true);
    });

    it('should handle PNG files', async () => {
      const should = await shouldStripMetadata('image/png');
      expect(should).toBe(true);
    });

    it('should handle WebP files', async () => {
      const should = await shouldStripMetadata('image/webp');
      expect(should).toBe(true);
    });

    it('should handle MP4 videos', async () => {
      const should = await shouldStripMetadata('video/mp4');
      expect(should).toBe(true);
    });

    it('should handle QuickTime videos', async () => {
      const should = await shouldStripMetadata('video/quicktime');
      expect(should).toBe(true);
    });
  });

  describe('Privacy Notification Settings', () => {
    it('should enable sensitive data notifications by default', async () => {
      const settings = await getPrivacySettings();
      expect(settings.notifyOnSensitiveData).toBe(true);
    });

    it('should allow disabling notifications', async () => {
      const updated = await updatePrivacySettings({
        notifyOnSensitiveData: false,
      });

      expect(updated.notifyOnSensitiveData).toBe(false);
    });

    it('should not require confirmation by default', async () => {
      const settings = await getPrivacySettings();
      expect(settings.requireConfirmationBeforeStrip).toBe(false);
    });

    it('should allow enabling confirmation requirement', async () => {
      const updated = await updatePrivacySettings({
        requireConfirmationBeforeStrip: true,
      });

      expect(updated.requireConfirmationBeforeStrip).toBe(true);
    });
  });

  describe('Orientation Preservation', () => {
    it('should preserve orientation by default', async () => {
      const settings = await getPrivacySettings();
      expect(settings.preserveOrientation).toBe(true);
    });

    it('should allow disabling orientation preservation', async () => {
      const updated = await updatePrivacySettings({
        preserveOrientation: false,
      });

      expect(updated.preserveOrientation).toBe(false);
    });
  });

  describe('Metadata Warnings', () => {
    it('should show warnings by default', async () => {
      const settings = await getPrivacySettings();
      expect(settings.showMetadataWarnings).toBe(true);
    });

    it('should allow disabling warnings', async () => {
      const updated = await updatePrivacySettings({
        showMetadataWarnings: false,
      });

      expect(updated.showMetadataWarnings).toBe(false);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multiple trusted contacts with mixed stripping settings', async () => {
      await addTrustedContact('friend-1');
      await addTrustedContact('friend-2');
      await updatePrivacySettings({ stripFromVideos: false });

      const imageForFriend = await shouldStripMetadata('image/jpeg', 'friend-1');
      const imageForStranger = await shouldStripMetadata('image/jpeg', 'stranger');
      const videoForFriend = await shouldStripMetadata('video/mp4', 'friend-1');
      const videoForStranger = await shouldStripMetadata('video/mp4', 'stranger');

      expect(imageForFriend).toBe(false); // Trusted, skip
      expect(imageForStranger).toBe(true); // Not trusted, strip
      expect(videoForFriend).toBe(false); // Trusted, skip
      expect(videoForStranger).toBe(false); // Video stripping disabled
    });

    it('should handle complete privacy shutdown', async () => {
      await updatePrivacySettings({
        stripMetadataEnabled: false,
        stripFromImages: false,
        stripFromVideos: false,
      });

      const imageShould = await shouldStripMetadata('image/jpeg');
      const videoShould = await shouldStripMetadata('video/mp4');

      expect(imageShould).toBe(false);
      expect(videoShould).toBe(false);
    });
  });
});
