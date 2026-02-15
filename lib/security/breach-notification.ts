'use client';

/**
 * Breach Notification Module
 * Handles creation of breach notifications and sensitive data cleanup
 *
 * Implements data breach notification procedures and emergency data wiping
 * to minimize exposure in case of compromise.
 */

import {
  secureWipeBuffer as _secureWipeBuffer,
  secureWipeString,
  secureWipeObject as _secureWipeObject,
  secureWipeBuffers as _secureWipeBuffers,
} from './memory-wiper';

/**
 * Breach notification details
 */
export interface BreachNotification {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  affectedDataTypes: string[];
  impactedUserCount: number;
  recommendedActions: string[];
  contactEmail: string;
  moreInfoUrl: string;
  status: 'draft' | 'ready' | 'sent' | 'acknowledged';
}

/**
 * Comprehensive breach report combining multiple incidents
 */
export interface BreachReport {
  reportId: string;
  generatedAt: string;
  breachDate: string;
  discoveryDate: string;
  affectedUsers: number;
  dataCategories: string[];
  incidentCount: number;
  timeline: {
    detected: string;
    reported: string;
    discovered: string;
    contained: string;
  };
  summary: string;
  detailedFindings: string[];
  notificationsSent: boolean;
}

/**
 * Generate a unique breach notification ID
 */
function generateBreachId(): string {
  const timestamp = Date.now().toString(36);
  const random = Array.from(crypto.getRandomValues(new Uint8Array(4))).map(b => b.toString(36)).join('').substring(0, 6);
  return `breach-${timestamp}-${random}`;
}

/**
 * Create a breach notification
 *
 * @param title - Breach notification title
 * @param description - Detailed breach description
 * @param affectedDataTypes - Types of data affected
 * @param impactedUserCount - Number of users impacted
 * @returns Breach notification object
 */
export function notifyBreach(
  title: string,
  description: string,
  affectedDataTypes: string[],
  impactedUserCount: number
): BreachNotification {
  return {
    id: generateBreachId(),
    timestamp: new Date().toISOString(),
    title,
    description,
    affectedDataTypes,
    impactedUserCount,
    recommendedActions: [
      'Change your password immediately',
      'Enable two-factor authentication',
      'Monitor your account for suspicious activity',
      'Review your connected devices and sessions',
      'Contact support if you notice any unauthorized access',
    ],
    contactEmail: 'security@tallow.io',
    moreInfoUrl: 'https://tallow.io/security-incident',
    status: 'draft',
  };
}

/**
 * Generate a comprehensive breach report from multiple incidents
 *
 * @param incidents - Array of incident details
 * @returns Complete breach report
 */
export function generateBreachReport(
  incidents: Array<{
    id: string;
    type: string;
    timestamp: string;
    description: string;
    affectedSystems: string[];
    severity: string;
  }>
): BreachReport {
  const sortedIncidents = [...incidents].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const firstIncident = sortedIncidents[0];
  const lastIncident = sortedIncidents[sortedIncidents.length - 1];

  // Collect unique affected data types
  const affectedDataTypes = new Set<string>();
  sortedIncidents.forEach((incident) => {
    if (incident.type === 'data_breach') {affectedDataTypes.add('User Files');}
    if (incident.type === 'key_compromise') {affectedDataTypes.add('Encryption Keys');}
    if (incident.type === 'unauthorized_access')
      {affectedDataTypes.add('Session Information');}
    if (incident.type === 'relay_compromise') {affectedDataTypes.add('Relay Logs');}
    if (incident.type === 'malware_detected') {affectedDataTypes.add('System Files');}
  });

  // Summarize findings by type
  const findingsByType: Record<string, number> = {};
  sortedIncidents.forEach((incident) => {
    findingsByType[incident.type] = (findingsByType[incident.type] || 0) + 1;
  });

  const detailedFindings = Object.entries(findingsByType).map(
    ([type, count]) => `${count} incident(s) of type: ${type}`
  );

  return {
    reportId: generateBreachId(),
    generatedAt: new Date().toISOString(),
    breachDate: firstIncident?.timestamp || new Date().toISOString(),
    discoveryDate: new Date().toISOString(),
    affectedUsers: 0, // To be populated from actual user impact analysis
    dataCategories: Array.from(affectedDataTypes),
    incidentCount: incidents.length,
    timeline: {
      detected: firstIncident?.timestamp || 'Unknown',
      reported: new Date().toISOString(),
      discovered: new Date().toISOString(),
      contained: lastIncident?.timestamp || 'Unknown',
    },
    summary: `A total of ${incidents.length} security incident(s) were detected. Affected data categories include: ${Array.from(affectedDataTypes).join(', ')}`,
    detailedFindings,
    notificationsSent: false,
  };
}

/**
 * Emergency function to clear all sensitive data from browser storage
 * This should only be called in case of confirmed compromise
 *
 * Wipes:
 * - Session keys and tokens
 * - Cached credentials
 * - User authentication data
 * - Temporary encryption keys
 * - Device information
 */
export async function clearSensitiveData(): Promise<void> {
  console.warn('EMERGENCY: Clearing all sensitive data from browser storage');

  // List of localStorage keys to wipe
  const keysToWipe = [
    // Security-related
    'security:activeIncident',
    'security:incidents',
    'auth:token',
    'auth:refreshToken',
    'auth:session',
    'crypto:sessionKey',
    'crypto:deviceKey',
    'crypto:ephemeralKey',

    // Device and session
    'device:id',
    'device:publicKey',
    'device:privateKey',
    'device:credentials',
    'session:token',
    'session:data',

    // User data
    'user:preferences',
    'user:settings',
    'user:metadata',
    'transfer:history',
    'transfer:cache',

    // Relay and connection data
    'relay:credentials',
    'relay:token',
    'peer:list',
    'connection:data',

    // Chat and messaging
    'chat:history',
    'chat:keys',
    'message:cache',

    // Cache data
    'cache:files',
    'cache:thumbnails',
    'cache:metadata',
  ];

  // Wipe each key
  keysToWipe.forEach((key) => {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        // Try to securely wipe string data
        if (typeof value === 'string') {
          secureWipeString(value);
        }
        // Remove from storage
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Failed to wipe ${key}:`, error);
    }
  });

  // Clear entire localStorage if all individual wipes failed
  try {
    // Only do full clear as last resort
    const canClearAll = keysToWipe.every((key) => {
      try {
        return localStorage.getItem(key) === null;
      } catch {
        return false;
      }
    });

    if (!canClearAll) {
      console.warn('Falling back to localStorage.clear()');
      localStorage.clear();
    }
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }

  // Wipe sessionStorage as well
  try {
    const sessionKeys = Object.keys(sessionStorage);
    sessionKeys.forEach((key) => {
      const value = sessionStorage.getItem(key);
      if (value && typeof value === 'string') {
        secureWipeString(value);
      }
      sessionStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Failed to wipe sessionStorage:', error);
  }

  // Clear IndexedDB if it was used for caching
  try {
    const dbs = await (indexedDB.databases?.() || Promise.resolve([]));
    dbs.forEach((db) => {
      try {
        if (!db.name) {
          return;
        }
        indexedDB.deleteDatabase(db.name);
      } catch (error) {
        console.error(`Failed to delete IndexedDB ${db.name}:`, error);
      }
    });
  } catch (error) {
    console.warn('Could not access IndexedDB for cleanup:', error);
  }

  // Notify that cleanup is complete
  console.log('EMERGENCY: Sensitive data cleared. System requires restart.');
}

/**
 * Format breach notification for display
 *
 * @param notification - Breach notification object
 * @returns Formatted string for user display
 */
export function formatBreachNotification(notification: BreachNotification): string {
  return `
SECURITY INCIDENT NOTIFICATION
================================
Incident ID: ${notification.id}
Date: ${new Date(notification.timestamp).toLocaleString()}

${notification.title}

${notification.description}

Affected Data:
${notification.affectedDataTypes.map((type) => `  - ${type}`).join('\n')}

Estimated Users Impacted: ${notification.impactedUserCount}

RECOMMENDED ACTIONS:
${notification.recommendedActions.map((action) => `  1. ${action}`).join('\n')}

For more information: ${notification.moreInfoUrl}
Support Email: ${notification.contactEmail}
  `.trim();
}

/**
 * Format breach report for compliance and internal use
 *
 * @param report - Breach report object
 * @returns Formatted string for internal documentation
 */
export function formatBreachReport(report: BreachReport): string {
  return `
BREACH INCIDENT REPORT
======================
Report ID: ${report.reportId}
Generated: ${new Date(report.generatedAt).toLocaleString()}

TIMELINE:
  Breach Date: ${report.breachDate}
  Discovery Date: ${report.discoveryDate}
  Contained: ${report.timeline.contained}
  Reported: ${report.timeline.reported}

IMPACT:
  Total Incidents: ${report.incidentCount}
  Affected Users: ${report.affectedUsers}
  Data Categories: ${report.dataCategories.join(', ')}

SUMMARY:
${report.summary}

DETAILED FINDINGS:
${report.detailedFindings.map((finding) => `  - ${finding}`).join('\n')}

Notifications Sent: ${report.notificationsSent ? 'Yes' : 'No'}
  `.trim();
}

/**
 * Prepare breach notification for external communication
 * Returns a sanitized version safe to send to users
 *
 * @param notification - Breach notification
 * @returns User-facing notification
 */
export function prepareUserNotification(notification: BreachNotification): {
  subject: string;
  body: string;
  actionUrl: string;
} {
  return {
    subject: `Important Security Notice: ${notification.title}`,
    body: formatBreachNotification(notification),
    actionUrl: notification.moreInfoUrl,
  };
}

/**
 * Prepare breach report for regulators/compliance
 * Returns formal compliance-ready documentation
 *
 * @param report - Breach report
 * @returns Compliance documentation
 */
export function prepareComplianceReport(report: BreachReport): {
  reportId: string;
  timestamp: string;
  summary: string;
  details: string;
} {
  return {
    reportId: report.reportId,
    timestamp: report.generatedAt,
    summary: report.summary,
    details: formatBreachReport(report),
  };
}

/**
 * Check if emergency data wipe is needed
 * (Implement logic based on your threat assessment)
 *
 * @param incidentSeverity - Severity of the incident
 * @param incidentType - Type of incident
 * @returns true if emergency wipe should be initiated
 */
export function shouldWipeEmergency(
  incidentSeverity: 'critical' | 'high' | 'medium' | 'low',
  incidentType: string
): boolean {
  // Trigger emergency wipe for critical incidents involving key compromise
  // or malware detection
  return (
    (incidentSeverity === 'critical' &&
      (incidentType === 'key_compromise' ||
        incidentType === 'malware_detected' ||
        incidentType === 'relay_compromise')) ||
    incidentType === 'data_breach'
  );
}

/**
 * Breach notification utilities namespace
 */
export const breachNotification = {
  createNotification: notifyBreach,
  generateReport: generateBreachReport,
  clearData: clearSensitiveData,
  formatNotification: formatBreachNotification,
  formatReport: formatBreachReport,
  prepareUserNotification,
  prepareComplianceReport,
  shouldWipeEmergency,
};

export default breachNotification;
