/**
 * Security Module - Centralized Export
 * Advanced security hardening features for Tallow
 */

// Import for local use
import { memoryWiper } from './memory-wiper';
import { timingSafe } from './timing-safe';
import { CredentialEncryption } from './credential-encryption';
import { createKeyRotationManager } from './key-rotation';

// Memory wiping utilities
export {
  secureWipeBuffer,
  secureWipeString,
  secureWipeBuffers,
  secureWipeObject,
  secureWipeChunk,
  compareAndWipe,
  createAutoWipeCleanup,
  SecureWrapper,
  createSecureWrapper,
  memoryWiper,
  type ChunkData,
} from './memory-wiper';

// Timing-safe comparison utilities
export {
  timingSafeEqual,
  timingSafeStringCompare,
  timingSafeHMACVerify,
  timingSafeTokenCompare,
  timingSafeHashCompare,
  timingSafePrefixCheck,
  timingSafeIndexCheck,
  timingSafeCompare,
  createTimingSafeValidator,
  timingSafeAuthCheck,
  timingSafeTokenLookup,
  timingSafeDelay,
  timingSafeOperation,
  timingSafe,
} from './timing-safe';

// Key rotation with forward secrecy
export {
  KeyRotationManager,
  createKeyRotationManager,
  type RotatingSessionKeys,
  type KeyRotationConfig,
} from './key-rotation';

// Credential encryption
export {
  CredentialEncryption,
  storeTurnCredentials,
  retrieveTurnCredentials,
  rotateAllCredentials,
  type EncryptedCredential,
  type TurnCredentials,
  type EncryptedTurnCredentials,
  type EncryptedField,
} from './credential-encryption';

// Incident response procedures
export {
  createIncidentReport,
  getResponseProcedure,
  getResponseTimeline,
  escalate,
  updateIncidentStatus,
  getIncidentById,
  getAllIncidents,
  getIncidentsBySeverity,
  getIncidentsByType,
  clearIncidentHistory,
  formatIncidentSummary,
  incidentResponse,
  type Severity,
  type IncidentType,
  type IncidentStatus,
  type IncidentReport,
} from './incident-response';

// Breach notification and emergency procedures
export {
  notifyBreach,
  generateBreachReport,
  clearSensitiveData,
  formatBreachNotification,
  formatBreachReport,
  prepareUserNotification,
  prepareComplianceReport,
  shouldWipeEmergency,
  breachNotification,
  type BreachNotification,
  type BreachReport,
} from './breach-notification';

/**
 * Convenience object with all security utilities
 */
export const security = {
  // Memory management
  memory: memoryWiper,

  // Timing-safe operations
  timing: timingSafe,

  // Key rotation
  keyRotation: {
    create: createKeyRotationManager,
  },

  // Credential encryption
  credentials: CredentialEncryption,

  // Incident response
  incidents: {
    create: createIncidentReport,
    getProcedure: getResponseProcedure,
    getTimeline: getResponseTimeline,
    escalate,
    updateStatus: updateIncidentStatus,
    getById: getIncidentById,
    getAll: getAllIncidents,
    getBySeverity: getIncidentsBySeverity,
    getByType: getIncidentsByType,
    clearHistory: clearIncidentHistory,
    formatSummary: formatIncidentSummary,
  },

  // Breach notification
  breach: {
    notifyBreach,
    generateReport: generateBreachReport,
    clearData: clearSensitiveData,
    formatNotification: formatBreachNotification,
    formatReport: formatBreachReport,
    prepareUserNotification,
    prepareComplianceReport,
    shouldWipeEmergency,
  },
};

export default security;
