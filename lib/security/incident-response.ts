'use client';

/**
 * Incident Response Module
 * Codifies incident response procedures for Tallow security events
 *
 * Supports critical security incidents with structured response workflows,
 * escalation procedures, and timeline tracking.
 */

/**
 * Incident severity levels with response time SLAs
 */
export type Severity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Incident types relevant to P2P file transfer security
 */
export type IncidentType =
  | 'key_compromise' // Private key exposed
  | 'unauthorized_access' // Unauthorized device connection
  | 'data_breach' // Encrypted data potentially exposed
  | 'crypto_failure' // Cryptographic operation failure
  | 'relay_compromise' // Relay server compromised
  | 'mitm_detected' // Man-in-the-middle attack detected
  | 'brute_force' // Brute force login attempts
  | 'malware_detected'; // Malicious file detected

/**
 * Current status of an incident through its lifecycle
 */
export type IncidentStatus = 'detected' | 'investigating' | 'contained' | 'resolved';

/**
 * Structured incident report
 */
export interface IncidentReport {
  id: string;
  type: IncidentType;
  severity: Severity;
  timestamp: string;
  description: string;
  affectedSystems: string[];
  responseSteps: string[];
  status: IncidentStatus;
  escalatedAt?: string;
  containedAt?: string;
  resolvedAt?: string;
  notes?: string;
}

/**
 * Response procedure for each incident type
 */
interface ResponseProcedure {
  type: IncidentType;
  severity: Severity;
  immediateActions: string[];
  investigationSteps: string[];
  containmentActions: string[];
  recoverySteps: string[];
  notificationRequired: boolean;
}

/**
 * Response time SLAs by severity
 */
interface ResponseTimeline {
  severity: Severity;
  initialResponseTime: string;
  responseTimeMinutes: number;
  escalationRequired: boolean;
  notificationDeadline?: string;
}

/**
 * Generate unique incident ID with timestamp
 */
function generateIncidentId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `incident-${timestamp}-${random}`;
}

/**
 * Response procedures for each incident type
 */
const responseProcedures: Record<IncidentType, ResponseProcedure> = {
  key_compromise: {
    type: 'key_compromise',
    severity: 'critical',
    immediateActions: [
      'ISOLATE: Disconnect affected device from network',
      'DISABLE: Invalidate compromised keys immediately',
      'NOTIFY: Alert user of key compromise',
      'PRESERVE: Capture forensic evidence of compromise',
    ],
    investigationSteps: [
      'Determine scope of key exposure',
      'Identify which transfers used compromised key',
      'Check if key was exposed to network',
      'Review access logs for unauthorized usage',
      'Analyze timeline of compromise',
    ],
    containmentActions: [
      'Revoke all certificates signed with compromised key',
      'Rotate all session keys derived from compromised key',
      'Clear all sensitive data from affected systems',
      'Reset all authentication credentials',
      'Block affected device from new sessions',
    ],
    recoverySteps: [
      'Generate new key pairs on clean device',
      'Redistribute new public keys to contacts',
      'Establish new secure channels',
      'Resume normal operations with fresh keys',
      'Implement key rotation policy',
    ],
    notificationRequired: true,
  },
  unauthorized_access: {
    type: 'unauthorized_access',
    severity: 'high',
    immediateActions: [
      'ALERT: Notify user of unauthorized connection attempt',
      'BLOCK: Reject unauthorized device connection',
      'LOG: Capture source IP and connection details',
      'ISOLATE: Quarantine affected session',
    ],
    investigationSteps: [
      'Identify source of unauthorized access attempt',
      'Determine attack vector used',
      'Check for other unauthorized connections',
      'Review authentication logs',
      'Analyze pattern of access attempts',
    ],
    containmentActions: [
      'Terminate all unauthorized sessions',
      'Reset authentication tokens',
      'Enable enhanced security checks',
      'Require re-authentication for all active sessions',
      'Implement rate limiting on connection attempts',
    ],
    recoverySteps: [
      'Verify legitimate user devices',
      'Update device trust list',
      'Resume normal access for authorized devices',
      'Monitor for further suspicious activity',
    ],
    notificationRequired: true,
  },
  data_breach: {
    type: 'data_breach',
    severity: 'critical',
    immediateActions: [
      'ASSESS: Determine scope of data exposure',
      'NOTIFY: Alert affected users immediately',
      'PRESERVE: Preserve all evidence and logs',
      'CONTAIN: Prevent further data exposure',
    ],
    investigationSteps: [
      'Identify which files were exposed',
      'Determine when exposure occurred',
      'Check if data was accessed before exposure',
      'Analyze breach source and method',
      'Estimate impact and affected users',
    ],
    containmentActions: [
      'Shut down affected services temporarily',
      'Reset all encryption keys and credentials',
      'Clear any exposed data from storage',
      'Review and strengthen security controls',
      'Implement additional monitoring',
    ],
    recoverySteps: [
      'Restore systems from clean backups',
      'Implement additional security controls',
      'Re-enable services with enhanced protection',
      'Provide guidance to affected users',
      'Conduct security audit',
    ],
    notificationRequired: true,
  },
  crypto_failure: {
    type: 'crypto_failure',
    severity: 'high',
    immediateActions: [
      'STOP: Halt all cryptographic operations',
      'LOG: Record full error details and context',
      'ISOLATE: Stop affected transfers immediately',
      'ALERT: Notify user of operation failure',
    ],
    investigationSteps: [
      'Analyze cryptographic operation that failed',
      'Check environmental factors (memory, CPU)',
      'Review recent code changes',
      'Verify algorithm implementation correctness',
      'Test with known good test vectors',
    ],
    containmentActions: [
      'Disable failing cryptographic operation',
      'Invalidate data encrypted with failed operation',
      'Force re-authentication with working methods',
      'Clear operation queues',
      'Roll back to last known good version if needed',
    ],
    recoverySteps: [
      'Fix underlying cryptographic issue',
      'Re-test with comprehensive test suite',
      'Resume operations with working implementation',
      'Audit all data encrypted during failure window',
    ],
    notificationRequired: false,
  },
  relay_compromise: {
    type: 'relay_compromise',
    severity: 'critical',
    immediateActions: [
      'DEACTIVATE: Immediately disable compromised relay',
      'NOTIFY: Alert all users of relay compromise',
      'REROUTE: Switch users to backup relay servers',
      'PRESERVE: Preserve forensic evidence',
    ],
    investigationSteps: [
      'Determine scope of relay compromise',
      'Identify what data was accessible',
      'Check if relay logs were accessed',
      'Analyze attacker capabilities and access level',
      'Review relay server access controls',
    ],
    containmentActions: [
      'Take compromised relay offline',
      'Revoke relay server credentials',
      'Reset all relay authentication tokens',
      'Clear relay server logs if compromised',
      'Require re-authentication through new relay',
    ],
    recoverySteps: [
      'Deploy new relay server infrastructure',
      'Verify security of new relay implementation',
      'Migrate users to new relay servers',
      'Conduct comprehensive relay security audit',
      'Implement stronger relay access controls',
    ],
    notificationRequired: true,
  },
  mitm_detected: {
    type: 'mitm_detected',
    severity: 'high',
    immediateActions: [
      'ALERT: Warn user of MITM detection',
      'VERIFY: Request user to verify peer identity',
      'BLOCK: Reject current session until verified',
      'LOG: Record MITM detection details',
    ],
    investigationSteps: [
      'Analyze how MITM was detected',
      'Identify attacker network location if possible',
      'Check for compromised network infrastructure',
      'Review certificate and key exchange logs',
      'Determine attack sophistication level',
    ],
    containmentActions: [
      'Terminate affected session immediately',
      'Require cryptographic verification of peer',
      'Implement certificate pinning if applicable',
      'Force fresh key exchange',
      'Enable additional security checks',
    ],
    recoverySteps: [
      'Verify both peers identity through out-of-band channel',
      'Establish new secure session with verification',
      'Resume transfer with enhanced protection',
      'Audit network security',
    ],
    notificationRequired: true,
  },
  brute_force: {
    type: 'brute_force',
    severity: 'medium',
    immediateActions: [
      'RATE_LIMIT: Apply rate limiting to affected endpoint',
      'LOG: Record all brute force attempts',
      'ALERT: Notify user of brute force attempts',
      'BLOCK: Temporarily block attacking IP address',
    ],
    investigationSteps: [
      'Identify source IP(s) of brute force attacks',
      'Determine target of attacks (username/email)',
      'Calculate number of attempts and pattern',
      'Identify if coordinated or isolated attack',
      'Check for compromised credentials',
    ],
    containmentActions: [
      'Implement aggressive rate limiting',
      'Require CAPTCHA after failed attempts',
      'Add IP to blocklist',
      'Force password reset if account compromised',
      'Enable two-factor authentication requirement',
    ],
    recoverySteps: [
      'Monitor for pattern changes',
      'Gradually relax rate limiting if attack subsides',
      'Maintain IP blocklist',
      'Encourage security best practices to users',
    ],
    notificationRequired: false,
  },
  malware_detected: {
    type: 'malware_detected',
    severity: 'critical',
    immediateActions: [
      'QUARANTINE: Isolate detected malware',
      'ALERT: Notify user immediately',
      'PRESERVE: Save malware sample for analysis',
      'SCAN: Initiate full system scan',
    ],
    investigationSteps: [
      'Analyze malware to determine capabilities',
      'Identify what data it may have accessed',
      'Check for persistence mechanisms',
      'Review system logs for suspicious activity',
      'Determine infection vector',
    ],
    containmentActions: [
      'Delete malware from all systems',
      'Reset all cryptographic keys',
      'Revoke all authentication tokens',
      'Clear sensitive data caches',
      'Require clean system reinstall if needed',
    ],
    recoverySteps: [
      'Rebuild affected systems from clean source',
      'Generate new keys and credentials',
      'Restore encrypted backups to clean system',
      'Implement additional security monitoring',
      'Enhance malware detection capabilities',
    ],
    notificationRequired: true,
  },
};

/**
 * Response time SLAs by severity level
 */
const responseTimes: Record<Severity, ResponseTimeline> = {
  critical: {
    severity: 'critical',
    initialResponseTime: 'Immediate (< 15 minutes)',
    responseTimeMinutes: 15,
    escalationRequired: true,
    notificationDeadline: '1 hour',
  },
  high: {
    severity: 'high',
    initialResponseTime: 'Urgent (< 1 hour)',
    responseTimeMinutes: 60,
    escalationRequired: true,
  },
  medium: {
    severity: 'medium',
    initialResponseTime: 'Timely (< 4 hours)',
    responseTimeMinutes: 240,
    escalationRequired: false,
  },
  low: {
    severity: 'low',
    initialResponseTime: 'Standard (< 24 hours)',
    responseTimeMinutes: 1440,
    escalationRequired: false,
  },
};

/**
 * Create a new incident report
 *
 * @param type - Type of incident
 * @param severity - Severity level
 * @param description - Detailed incident description
 * @returns Structured incident report
 */
export function createIncidentReport(
  type: IncidentType,
  severity: Severity,
  description: string
): IncidentReport {
  const procedure = responseProcedures[type];

  return {
    id: generateIncidentId(),
    type,
    severity,
    timestamp: new Date().toISOString(),
    description,
    affectedSystems: [],
    responseSteps: [
      ...procedure.immediateActions,
      ...procedure.investigationSteps,
      ...procedure.containmentActions,
      ...procedure.recoverySteps,
    ],
    status: 'detected',
  };
}

/**
 * Get the response procedure for an incident type
 *
 * @param type - Incident type
 * @returns Response procedure with all steps
 */
export function getResponseProcedure(type: IncidentType): ResponseProcedure {
  return responseProcedures[type];
}

/**
 * Get response timeline for a severity level
 *
 * @param severity - Incident severity
 * @returns Response timeline with SLA information
 */
export function getResponseTimeline(severity: Severity): ResponseTimeline {
  return responseTimes[severity];
}

/**
 * Escalate an incident - logs to console and localStorage
 *
 * @param report - Incident report to escalate
 */
export function escalate(report: IncidentReport): void {
  const timeline = getResponseTimeline(report.severity);
  const escalationTime = new Date().toISOString();

  // Update report
  const escalatedReport = {
    ...report,
    status: 'investigating' as IncidentStatus,
    escalatedAt: escalationTime,
  };

  // Console logging with severity styling
  const logLevel = report.severity === 'critical' ? 'error' : 'warn';
  const logStyle =
    report.severity === 'critical'
      ? 'color: red; font-weight: bold; font-size: 14px;'
      : 'color: orange; font-weight: bold; font-size: 12px;';

  console[logLevel as 'error' | 'warn'](
    `%c[INCIDENT ESCALATION] ${report.type.toUpperCase()}`,
    logStyle
  );
  console.log('Report:', escalatedReport);
  console.log('Response Timeline:', timeline);
  console.log('Next Steps:', getResponseProcedure(report.type).investigationSteps);

  // Store in localStorage for persistence
  try {
    const incidents = JSON.parse(localStorage.getItem('security:incidents') || '[]');
    incidents.push(escalatedReport);

    // Keep only last 100 incidents to prevent localStorage bloat
    const recentIncidents = incidents.slice(-100);
    localStorage.setItem('security:incidents', JSON.stringify(recentIncidents));

    // Also store as current active incident
    localStorage.setItem('security:activeIncident', JSON.stringify(escalatedReport));
  } catch (error) {
    console.error('Failed to store incident in localStorage:', error);
  }
}

/**
 * Update incident status
 *
 * @param report - Incident report to update
 * @param newStatus - New status
 * @returns Updated incident report
 */
export function updateIncidentStatus(
  report: IncidentReport,
  newStatus: IncidentStatus
): IncidentReport {
  const updated = { ...report, status: newStatus };

  if (newStatus === 'contained' && !report.containedAt) {
    updated.containedAt = new Date().toISOString();
  }

  if (newStatus === 'resolved' && !report.resolvedAt) {
    updated.resolvedAt = new Date().toISOString();
  }

  // Persist update
  try {
    localStorage.setItem('security:activeIncident', JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to update incident status:', error);
  }

  return updated;
}

/**
 * Get incident by ID from history
 *
 * @param id - Incident ID
 * @returns Incident report or undefined
 */
export function getIncidentById(id: string): IncidentReport | undefined {
  try {
    const incidents = JSON.parse(localStorage.getItem('security:incidents') || '[]');
    return incidents.find((incident: IncidentReport) => incident.id === id);
  } catch {
    return undefined;
  }
}

/**
 * Get all stored incidents
 *
 * @returns Array of incident reports
 */
export function getAllIncidents(): IncidentReport[] {
  try {
    return JSON.parse(localStorage.getItem('security:incidents') || '[]');
  } catch {
    return [];
  }
}

/**
 * Get incidents filtered by severity
 *
 * @param severity - Severity level to filter by
 * @returns Filtered incident reports
 */
export function getIncidentsBySeverity(severity: Severity): IncidentReport[] {
  return getAllIncidents().filter((incident) => incident.severity === severity);
}

/**
 * Get incidents filtered by type
 *
 * @param type - Incident type to filter by
 * @returns Filtered incident reports
 */
export function getIncidentsByType(type: IncidentType): IncidentReport[] {
  return getAllIncidents().filter((incident) => incident.type === type);
}

/**
 * Clear all incident history
 * Use with caution - cannot be undone
 */
export function clearIncidentHistory(): void {
  try {
    localStorage.removeItem('security:incidents');
    localStorage.removeItem('security:activeIncident');
    console.log('Incident history cleared');
  } catch (error) {
    console.error('Failed to clear incident history:', error);
  }
}

/**
 * Format incident summary for logging
 *
 * @param report - Incident report
 * @returns Formatted summary string
 */
export function formatIncidentSummary(report: IncidentReport): string {
  const duration = report.resolvedAt
    ? `${Math.floor((new Date(report.resolvedAt).getTime() - new Date(report.timestamp).getTime()) / 60000)} minutes`
    : 'Ongoing';

  return `
[${report.severity.toUpperCase()}] ${report.type}
ID: ${report.id}
Status: ${report.status}
Duration: ${duration}
Description: ${report.description}
Affected Systems: ${report.affectedSystems.join(', ') || 'None specified'}
  `.trim();
}

/**
 * Incident response utilities namespace
 */
export const incidentResponse = {
  createReport: createIncidentReport,
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
};

export default incidentResponse;
