/**
 * Biometric Capability Detection Unit Tests
 *
 * Tests the biometric authentication capability detection including:
 * - Platform detection for different user agents
 * - Biometric type inference
 * - Label generation based on platform
 * - Capability detection with mocked PublicKeyCredential
 * - Challenge generation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  detectBiometricCapabilities,
  isBiometricAvailable,
  generateBiometricChallenge,
} from '@/lib/security/biometric';

describe('Biometric Capability Detection', () => {
  const mockNavigator = (userAgent: string) => {
    Object.defineProperty(global, 'navigator', {
      writable: true,
      value: { userAgent },
    });
  };

  const mockWindow = (hasPublicKeyCredential: boolean) => {
    if (hasPublicKeyCredential) {
      vi.stubGlobal('window', {});
      vi.stubGlobal('PublicKeyCredential', {
        isUserVerifyingPlatformAuthenticatorAvailable: vi.fn(async () => true),
        isConditionalMediationAvailable: vi.fn(async () => true),
      });
    } else {
      vi.stubGlobal('window', {});
      vi.unstubAllGlobals();
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('platform detection', () => {
    it('detects macOS', async () => {
      mockNavigator('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
      mockWindow(true);

      const caps = await detectBiometricCapabilities();
      expect(caps.platform.os).toBe('macos');
      expect(caps.platform.isMobile).toBe(false);
    });

    it('detects Windows', async () => {
      mockNavigator('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
      mockWindow(true);

      const caps = await detectBiometricCapabilities();
      expect(caps.platform.os).toBe('windows');
      expect(caps.platform.isMobile).toBe(false);
    });

    it('detects Linux', async () => {
      mockNavigator('Mozilla/5.0 (X11; Linux x86_64)');
      mockWindow(true);

      const caps = await detectBiometricCapabilities();
      expect(caps.platform.os).toBe('linux');
      expect(caps.platform.isMobile).toBe(false);
    });

    it('detects Android', async () => {
      mockNavigator('Mozilla/5.0 (Linux; Android 11)');
      mockWindow(true);

      const caps = await detectBiometricCapabilities();
      expect(caps.platform.os).toBe('android');
      expect(caps.platform.isMobile).toBe(true);
    });

    it('detects iOS', async () => {
      mockNavigator('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)');
      mockWindow(true);

      const caps = await detectBiometricCapabilities();
      expect(caps.platform.os).toBe('ios');
      expect(caps.platform.isMobile).toBe(true);
    });

    it('detects iPad', async () => {
      mockNavigator('Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)');
      mockWindow(true);

      const caps = await detectBiometricCapabilities();
      expect(caps.platform.os).toBe('ios');
      expect(caps.platform.isMobile).toBe(true);
    });
  });

  describe('browser detection', () => {
    it('detects Chrome', async () => {
      mockNavigator('Mozilla/5.0 (Windows NT 10.0) Chrome/96.0.4664.45');
      mockWindow(true);

      const caps = await detectBiometricCapabilities();
      expect(caps.platform.browser).toBe('chrome');
    });

    it('detects Firefox', async () => {
      mockNavigator('Mozilla/5.0 (Windows NT 10.0; rv:94.0) Gecko/20100101 Firefox/94.0');
      mockWindow(true);

      const caps = await detectBiometricCapabilities();
      expect(caps.platform.browser).toBe('firefox');
    });

    it('detects Safari', async () => {
      mockNavigator('Mozilla/5.0 (Macintosh) Safari/605.1.15');
      mockWindow(true);

      const caps = await detectBiometricCapabilities();
      expect(caps.platform.browser).toBe('safari');
    });

    it('detects Edge', async () => {
      mockNavigator('Mozilla/5.0 (Windows NT 10.0) Edge/96.0.1054.43');
      mockWindow(true);

      const caps = await detectBiometricCapabilities();
      expect(caps.platform.browser).toBe('edge');
    });
  });

  describe('biometric type inference', () => {
    it('infers Touch ID for macOS', async () => {
      mockNavigator('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
      mockWindow(true);

      const caps = await detectBiometricCapabilities();
      expect(caps.biometricType).toBe('fingerprint');
      expect(caps.label).toBe('Touch ID');
    });

    it('infers Touch ID for iOS', async () => {
      mockNavigator('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)');
      mockWindow(true);

      const caps = await detectBiometricCapabilities();
      expect(caps.biometricType).toBe('fingerprint');
      expect(caps.label).toBe('Touch ID');
    });

    it('infers Windows Hello for Windows', async () => {
      mockNavigator('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
      mockWindow(true);

      const caps = await detectBiometricCapabilities();
      expect(caps.biometricType).toBe('face');
      expect(caps.label).toBe('Windows Hello');
    });

    it('infers fingerprint for Android', async () => {
      mockNavigator('Mozilla/5.0 (Linux; Android 11)');
      mockWindow(true);

      const caps = await detectBiometricCapabilities();
      expect(caps.biometricType).toBe('fingerprint');
      expect(caps.label).toBe('Biometric Unlock');
    });

    it('returns platform for unknown OS', async () => {
      mockNavigator('Mozilla/5.0 (Unknown OS)');
      mockWindow(true);

      const caps = await detectBiometricCapabilities();
      expect(caps.biometricType).toBe('platform');
    });
  });

  describe('capability detection', () => {
    it('detects available biometrics', async () => {
      mockNavigator('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
      mockWindow(true);

      const caps = await detectBiometricCapabilities();
      expect(caps.available).toBe(true);
      expect(caps.platformAuthenticator).toBe(true);
      expect(caps.webauthnSupported).toBe(true);
      expect(caps.publicKeyCredentialSupported).toBe(true);
    });

    it('detects unavailable biometrics', async () => {
      mockNavigator('Mozilla/5.0 (Windows NT 10.0)');
      mockWindow(false);

      const caps = await detectBiometricCapabilities();
      expect(caps.available).toBe(false);
      expect(caps.platformAuthenticator).toBe(false);
      expect(caps.webauthnSupported).toBe(false);
    });

    it('detects user verification support', async () => {
      mockNavigator('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
      mockWindow(true);

      const caps = await detectBiometricCapabilities();
      expect(caps.userVerificationAvailable).toBe(true);
    });

    it('detects conditional mediation support', async () => {
      mockNavigator('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
      mockWindow(true);

      const caps = await detectBiometricCapabilities();
      expect(caps.conditionalMediationSupported).toBe(true);
    });

    it('handles platform authenticator check failure', async () => {
      mockNavigator('Mozilla/5.0 (Windows NT 10.0)');
      vi.stubGlobal('window', {});
      vi.stubGlobal('PublicKeyCredential', {
        isUserVerifyingPlatformAuthenticatorAvailable: vi.fn(async () => {
          throw new Error('Not available');
        }),
      });

      const caps = await detectBiometricCapabilities();
      expect(caps.platformAuthenticator).toBe(false);
    });

    it('handles conditional mediation check failure', async () => {
      mockNavigator('Mozilla/5.0 (Windows NT 10.0)');
      vi.stubGlobal('window', {});
      vi.stubGlobal('PublicKeyCredential', {
        isUserVerifyingPlatformAuthenticatorAvailable: vi.fn(async () => true),
        isConditionalMediationAvailable: vi.fn(async () => {
          throw new Error('Not available');
        }),
      });

      const caps = await detectBiometricCapabilities();
      expect(caps.conditionalMediationSupported).toBe(false);
    });
  });

  describe('quick availability check', () => {
    it('returns true when available', async () => {
      mockNavigator('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
      mockWindow(true);

      const available = await isBiometricAvailable();
      expect(available).toBe(true);
    });

    it('returns false when unavailable', async () => {
      mockNavigator('Mozilla/5.0 (Windows NT 10.0)');
      mockWindow(false);

      const available = await isBiometricAvailable();
      expect(available).toBe(false);
    });

    it('returns false in non-browser environment', async () => {
      vi.unstubAllGlobals();
      const available = await isBiometricAvailable();
      expect(available).toBe(false);
    });

    it('handles platform authenticator errors', async () => {
      mockNavigator('Mozilla/5.0 (Windows NT 10.0)');
      vi.stubGlobal('window', {});
      vi.stubGlobal('PublicKeyCredential', {
        isUserVerifyingPlatformAuthenticatorAvailable: vi.fn(async () => {
          throw new Error('Error');
        }),
      });

      const available = await isBiometricAvailable();
      expect(available).toBe(false);
    });
  });

  describe('challenge generation', () => {
    it('generates biometric challenge', () => {
      const challenge = generateBiometricChallenge();

      expect(challenge.challenge).toBeInstanceOf(Uint8Array);
      expect(challenge.challenge.length).toBe(32);
      expect(challenge.rpId).toBe('tallow.app');
      expect(challenge.rpName).toBe('Tallow');
      expect(challenge.timeout).toBe(60000);
    });

    it('accepts custom RP ID', () => {
      const challenge = generateBiometricChallenge('custom.app');
      expect(challenge.rpId).toBe('custom.app');
    });

    it('accepts custom RP name', () => {
      const challenge = generateBiometricChallenge('app.test', 'Test App');
      expect(challenge.rpName).toBe('Test App');
    });

    it('accepts custom timeout', () => {
      const challenge = generateBiometricChallenge('tallow.app', 'Tallow', 30000);
      expect(challenge.timeout).toBe(30000);
    });

    it('generates random challenge bytes', () => {
      const challenge1 = generateBiometricChallenge();
      const challenge2 = generateBiometricChallenge();

      expect(challenge1.challenge).not.toEqual(challenge2.challenge);
    });
  });

  describe('biometric labels', () => {
    it('returns Touch ID for macOS', async () => {
      mockNavigator('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
      mockWindow(true);

      const caps = await detectBiometricCapabilities();
      expect(caps.label).toBe('Touch ID');
    });

    it('returns Touch ID for iOS', async () => {
      mockNavigator('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)');
      mockWindow(true);

      const caps = await detectBiometricCapabilities();
      expect(caps.label).toBe('Touch ID');
    });

    it('returns Windows Hello for Windows', async () => {
      mockNavigator('Mozilla/5.0 (Windows NT 10.0)');
      mockWindow(true);

      const caps = await detectBiometricCapabilities();
      expect(caps.label).toBe('Windows Hello');
    });

    it('returns Biometric Unlock for Android', async () => {
      mockNavigator('Mozilla/5.0 (Linux; Android 11)');
      mockWindow(true);

      const caps = await detectBiometricCapabilities();
      expect(caps.label).toBe('Biometric Unlock');
    });

    it('returns generic label for fingerprint on unknown OS', async () => {
      mockNavigator('Mozilla/5.0 (Unknown OS)');
      vi.stubGlobal('window', {});
      vi.stubGlobal('PublicKeyCredential', {
        isUserVerifyingPlatformAuthenticatorAvailable: vi.fn(async () => false),
      });

      const caps = await detectBiometricCapabilities();
      expect(caps.label).toBe('Biometric Authentication');
    });
  });

  describe('biometric type when unavailable', () => {
    it('returns none when biometrics unavailable', async () => {
      mockNavigator('Mozilla/5.0 (Windows NT 10.0)');
      mockWindow(false);

      const caps = await detectBiometricCapabilities();
      expect(caps.biometricType).toBe('none');
    });
  });

  describe('server-side rendering', () => {
    it('handles missing navigator', async () => {
      const originalNavigator = global.navigator;
      // @ts-expect-error - Testing undefined navigator
      delete global.navigator;

      const caps = await detectBiometricCapabilities();
      expect(caps.platform.os).toBe('unknown');
      expect(caps.platform.browser).toBe('unknown');
      expect(caps.available).toBe(false);

      global.navigator = originalNavigator;
    });
  });
});
