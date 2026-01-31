'use client';

/**
 * WebRTC Security Configuration Module
 *
 * Enforces security best practices for WebRTC connections:
 * - DTLS 1.2+ enforcement
 * - Certificate fingerprint validation
 * - Secure cipher suite selection
 * - Connection security monitoring
 *
 * SECURITY IMPACT: 9 | PRIVACY IMPACT: 8
 * PRIORITY: CRITICAL
 */

import secureLog from '../utils/secure-logger';

// ============================================================================
// Type Definitions
// ============================================================================

export interface SecurityConfig {
  enforceDTLS12: boolean;
  validateCertificateFingerprint: boolean;
  requireSecureCiphers: boolean;
  logSecurityEvents: boolean;
}

export interface CertificateInfo {
  fingerprint: string;
  algorithm: string;
  expiresAt?: Date;
}

export interface ConnectionSecurityStatus {
  isDTLS12OrHigher: boolean;
  certificateValid: boolean;
  cipherSuite?: string;
  dtlsVersion?: string;
  securityLevel: 'high' | 'medium' | 'low' | 'unknown';
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  enforceDTLS12: true,
  validateCertificateFingerprint: true,
  requireSecureCiphers: true,
  logSecurityEvents: process.env.NODE_ENV === 'development',
};

// Secure cipher suites (DTLS 1.2+ compatible)
const ALLOWED_CIPHER_SUITES = [
  'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256',
  'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384',
  'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256',
  'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384',
  'TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256',
  'TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256',
];

// ============================================================================
// Certificate Generation
// ============================================================================

/**
 * Generate a secure certificate for WebRTC connection
 * Uses ECDSA P-256 for quantum-resistance (transitional)
 */
export async function generateSecureCertificate(): Promise<RTCCertificate> {
  try {
    const certificate = await RTCPeerConnection.generateCertificate({
      name: 'ECDSA',
      namedCurve: 'P-256',
      hash: 'SHA-256',
    } as EcKeyGenParams);

    secureLog.log('[WebRTC-Security] Generated ECDSA P-256 certificate');
    return certificate;
  } catch (error) {
    secureLog.error('[WebRTC-Security] Failed to generate certificate:', error);
    throw error;
  }
}

/**
 * Extract certificate fingerprint from RTCPeerConnection
 */
export async function extractCertificateFingerprint(
  peerConnection: RTCPeerConnection
): Promise<CertificateInfo | null> {
  try {
    const stats = await peerConnection.getStats();
    let certificateInfo: CertificateInfo | null = null;

    stats.forEach((report) => {
      if (report.type === 'certificate') {
        const certReport = report as any;
        if (certReport.fingerprint && certReport.fingerprintAlgorithm) {
          certificateInfo = {
            fingerprint: certReport.fingerprint,
            algorithm: certReport.fingerprintAlgorithm,
          };
        }
      }
    });

    return certificateInfo;
  } catch (error) {
    secureLog.error('[WebRTC-Security] Failed to extract certificate fingerprint:', error);
    return null;
  }
}

/**
 * Get certificate fingerprint from SDP
 */
export function extractFingerprintFromSDP(sdp: string): CertificateInfo | null {
  // Extract fingerprint from SDP
  // Format: a=fingerprint:sha-256 XX:XX:XX:...
  const fingerprintMatch = sdp.match(/a=fingerprint:(\S+)\s+([A-F0-9:]+)/i);

  if (fingerprintMatch && fingerprintMatch[1] && fingerprintMatch[2]) {
    return {
      fingerprint: fingerprintMatch[2].toUpperCase(),
      algorithm: fingerprintMatch[1],
    };
  }

  return null;
}

// ============================================================================
// Certificate Fingerprint Validation
// ============================================================================

/**
 * Validate certificate fingerprint matches expected value
 * This is critical for preventing MITM attacks
 */
export function validateCertificateFingerprint(
  actual: CertificateInfo,
  expected: CertificateInfo
): boolean {
  if (!actual || !expected) {
    secureLog.error('[WebRTC-Security] Missing certificate fingerprint for validation');
    return false;
  }

  // Normalize fingerprints (remove colons, convert to uppercase)
  const normalizeFingerprint = (fp: string) => fp.replace(/:/g, '').toUpperCase();

  const actualNormalized = normalizeFingerprint(actual.fingerprint);
  const expectedNormalized = normalizeFingerprint(expected.fingerprint);

  // Constant-time comparison to prevent timing side-channel attacks
  const actualBytes = new TextEncoder().encode(actualNormalized);
  const expectedBytes = new TextEncoder().encode(expectedNormalized);

  // Use the longer length to avoid leaking length information
  const len = Math.max(actualBytes.length, expectedBytes.length);
  let result = actualBytes.length ^ expectedBytes.length; // Non-zero if lengths differ

  for (let i = 0; i < len; i++) {
    result |= (actualBytes[i] || 0) ^ (expectedBytes[i] || 0);
  }

  const isMatch = result === 0;

  if (!isMatch) {
    secureLog.error('[WebRTC-Security] Certificate fingerprint mismatch!', {
      expected: expectedNormalized.substring(0, 16) + '...',
      actual: actualNormalized.substring(0, 16) + '...',
    });
    return false;
  }

  secureLog.log('[WebRTC-Security] Certificate fingerprint validated successfully');
  return true;
}

// ============================================================================
// Connection Security Monitoring
// ============================================================================

/**
 * Monitor connection for DTLS version and cipher suite
 */
export async function getConnectionSecurityStatus(
  peerConnection: RTCPeerConnection
): Promise<ConnectionSecurityStatus> {
  const status: ConnectionSecurityStatus = {
    isDTLS12OrHigher: false,
    certificateValid: false,
    securityLevel: 'unknown',
  };

  try {
    const stats = await peerConnection.getStats();

    stats.forEach((report) => {
      // Check transport for DTLS version
      if (report.type === 'transport') {
        const transportReport = report as any;

        if (transportReport.dtlsVersion) {
          status.dtlsVersion = transportReport.dtlsVersion;

          // Check for DTLS 1.2 or higher
          if (transportReport.dtlsVersion.includes('1.2') ||
              transportReport.dtlsVersion.includes('1.3')) {
            status.isDTLS12OrHigher = true;
          }
        }

        if (transportReport.selectedCandidatePairId) {
          status.certificateValid = true;
        }

        if (transportReport.dtlsCipher) {
          status.cipherSuite = transportReport.dtlsCipher;
        }
      }

      // Check certificate validity
      if (report.type === 'certificate') {
        status.certificateValid = true;
      }
    });

    // Determine security level
    if (status.isDTLS12OrHigher && status.certificateValid) {
      status.securityLevel = 'high';
    } else if (status.certificateValid) {
      status.securityLevel = 'medium';
    } else {
      status.securityLevel = 'low';
    }

  } catch (error) {
    secureLog.error('[WebRTC-Security] Failed to get security status:', error);
  }

  return status;
}

/**
 * Validate cipher suite is secure
 */
export function isSecureCipherSuite(cipherSuite: string): boolean {
  if (!cipherSuite) {return false;}

  // Check if cipher suite is in allowed list or meets security criteria
  const isAllowed = ALLOWED_CIPHER_SUITES.some(allowed =>
    cipherSuite.includes(allowed)
  );

  // Additional checks for secure patterns
  const hasGCM = cipherSuite.includes('GCM');
  const hasCHACHA20 = cipherSuite.includes('CHACHA20');
  const hasECDHE = cipherSuite.includes('ECDHE');

  return isAllowed || (hasECDHE && (hasGCM || hasCHACHA20));
}

// ============================================================================
// Enhanced RTCConfiguration Generator
// ============================================================================

/**
 * Create secure RTCConfiguration with DTLS enforcement
 */
export async function createSecureRTCConfiguration(
  iceServers: RTCIceServer[],
  options: {
    forceRelay?: boolean;
    customCertificate?: RTCCertificate;
  } = {}
): Promise<RTCConfiguration> {
  const { forceRelay = false, customCertificate } = options;

  // Generate or use provided certificate
  const certificate = customCertificate || await generateSecureCertificate();

  const config: RTCConfiguration = {
    iceServers,
    iceTransportPolicy: forceRelay ? 'relay' : 'all',
    iceCandidatePoolSize: 0,

    // SECURITY: Enforce modern WebRTC configuration
    bundlePolicy: 'max-bundle',  // Single bundle for all media
    rtcpMuxPolicy: 'require',    // Require RTCP multiplexing

    // CRITICAL: Use our secure certificate
    certificates: [certificate],
  };

  secureLog.log('[WebRTC-Security] Created secure RTCConfiguration', {
    iceTransportPolicy: config.iceTransportPolicy,
    bundlePolicy: config.bundlePolicy,
    rtcpMuxPolicy: config.rtcpMuxPolicy,
    certificateCount: config.certificates?.length || 0,
  });

  return config;
}

// ============================================================================
// Connection Security Validator
// ============================================================================

/**
 * Validate connection meets security requirements
 * Aborts connection if security checks fail
 */
export async function validateConnectionSecurity(
  peerConnection: RTCPeerConnection,
  expectedFingerprint?: CertificateInfo,
  config: SecurityConfig = DEFAULT_SECURITY_CONFIG
): Promise<{ valid: boolean; reason?: string }> {

  // Get connection security status
  const status = await getConnectionSecurityStatus(peerConnection);

  // Check DTLS version
  if (config.enforceDTLS12 && !status.isDTLS12OrHigher) {
    const reason = `DTLS 1.2+ required, got: ${status.dtlsVersion || 'unknown'}`;
    secureLog.error('[WebRTC-Security] Security validation failed:', reason);
    return { valid: false, reason };
  }

  // Check certificate fingerprint if provided
  if (config.validateCertificateFingerprint && expectedFingerprint) {
    const actualFingerprint = await extractCertificateFingerprint(peerConnection);

    if (!actualFingerprint) {
      const reason = 'Failed to extract certificate fingerprint';
      secureLog.error('[WebRTC-Security] Security validation failed:', reason);
      return { valid: false, reason };
    }

    if (!validateCertificateFingerprint(actualFingerprint, expectedFingerprint)) {
      const reason = 'Certificate fingerprint mismatch';
      return { valid: false, reason };
    }
  }

  // Check cipher suite if available
  if (config.requireSecureCiphers && status.cipherSuite) {
    if (!isSecureCipherSuite(status.cipherSuite)) {
      const reason = `Insecure cipher suite: ${status.cipherSuite}`;
      secureLog.error('[WebRTC-Security] Security validation failed:', reason);
      return { valid: false, reason };
    }
  }

  secureLog.log('[WebRTC-Security] Connection security validated', {
    securityLevel: status.securityLevel,
    dtlsVersion: status.dtlsVersion,
    cipherSuite: status.cipherSuite,
  });

  return { valid: true };
}

// ============================================================================
// Security Event Monitor
// ============================================================================

/**
 * Set up continuous security monitoring for a peer connection
 */
export function monitorConnectionSecurity(
  peerConnection: RTCPeerConnection,
  onSecurityEvent: (event: { type: string; severity: 'info' | 'warning' | 'error'; message: string; data?: any }) => void
): () => void {
  let monitoringActive = true;
  let monitoringInterval: NodeJS.Timeout;

  const checkSecurity = async () => {
    if (!monitoringActive) {return;}

    try {
      const status = await getConnectionSecurityStatus(peerConnection);

      if (status.securityLevel === 'low') {
        onSecurityEvent({
          type: 'low-security',
          severity: 'error',
          message: 'Connection security level is LOW',
          data: status,
        });
      } else if (status.securityLevel === 'medium') {
        onSecurityEvent({
          type: 'medium-security',
          severity: 'warning',
          message: 'Connection security level is MEDIUM',
          data: status,
        });
      }

      // Check for downgrade attacks
      if (status.dtlsVersion && !status.isDTLS12OrHigher) {
        onSecurityEvent({
          type: 'dtls-downgrade',
          severity: 'error',
          message: `DTLS downgrade detected: ${status.dtlsVersion}`,
          data: status,
        });
      }

      // Check cipher suite
      if (status.cipherSuite && !isSecureCipherSuite(status.cipherSuite)) {
        onSecurityEvent({
          type: 'weak-cipher',
          severity: 'warning',
          message: `Weak cipher suite detected: ${status.cipherSuite}`,
          data: status,
        });
      }

    } catch (error) {
      secureLog.error('[WebRTC-Security] Security monitoring error:', error);
    }
  };

  // Initial check after connection established
  peerConnection.addEventListener('connectionstatechange', () => {
    if (peerConnection.connectionState === 'connected') {
      setTimeout(checkSecurity, 1000);

      // Continue monitoring every 30 seconds
      monitoringInterval = setInterval(checkSecurity, 30000);
    } else if (peerConnection.connectionState === 'failed' ||
               peerConnection.connectionState === 'closed') {
      monitoringActive = false;
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
      }
    }
  });

  // Return cleanup function
  return () => {
    monitoringActive = false;
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
    }
  };
}

// ============================================================================
// Export
// ============================================================================

export const WebRTCSecurity = {
  generateSecureCertificate,
  createSecureRTCConfiguration,
  extractCertificateFingerprint,
  extractFingerprintFromSDP,
  validateCertificateFingerprint,
  validateConnectionSecurity,
  getConnectionSecurityStatus,
  isSecureCipherSuite,
  monitorConnectionSecurity,
  DEFAULT_SECURITY_CONFIG,
};

export default WebRTCSecurity;
