# Breach Notification & Emergency Procedures

Emergency data wiping and breach notification system for Tallow. Handles secure notification of security breaches and implements emergency procedures to minimize exposure in case of compromise.

## Overview

The breach notification module provides:

- **Breach Notifications**: Create user-facing breach notifications
- **Compliance Reporting**: Generate regulatory-compliant reports
- **Emergency Data Wipe**: Clear sensitive data from browser storage
- **Notification Formatting**: Prepare messages for users and regulators
- **Impact Assessment**: Summarize breach scope and affected data

## Breach Notifications

### Creating a Breach Notification

```typescript
import { notifyBreach } from '@/lib/security/breach-notification';

const notification = notifyBreach(
  'Security Incident - Key Compromise',
  'We discovered a private encryption key was accidentally exposed in our code repository. We have immediately invalidated this key and generated new ones. All your transfers are now protected with fresh encryption keys.',
  ['Encryption Keys', 'Session Information'],
  1 // Number of affected users
);

console.log(notification);
// {
//   id: 'breach-timestamp-random',
//   timestamp: '2024-02-06T15:30:00Z',
//   title: 'Security Incident - Key Compromise',
//   description: '...',
//   affectedDataTypes: ['Encryption Keys', 'Session Information'],
//   impactedUserCount: 1,
//   recommendedActions: [
//     'Change your password immediately',
//     'Enable two-factor authentication',
//     ...
//   ],
//   contactEmail: 'security@tallow.io',
//   moreInfoUrl: 'https://tallow.io/security-incident',
//   status: 'draft'
// }
```

### Preparing User Notifications

Format breach notifications for sending to users:

```typescript
import { prepareUserNotification } from '@/lib/security/breach-notification';

const userNotification = prepareUserNotification(notification);
// {
//   subject: 'Important Security Notice: Security Incident - Key Compromise',
//   body: 'SECURITY INCIDENT NOTIFICATION\n...',
//   actionUrl: 'https://tallow.io/security-incident'
// }

// Send via email
await sendEmail({
  to: userEmail,
  subject: userNotification.subject,
  body: userNotification.body,
  cta: userNotification.actionUrl
});
```

### Formatting for Display

```typescript
import { formatBreachNotification } from '@/lib/security/breach-notification';

const formatted = formatBreachNotification(notification);
// "SECURITY INCIDENT NOTIFICATION\n================================\n..."

// Display in security notice banner
showSecurityNotice(formatted);
```

## Breach Reports

### Generating Comprehensive Reports

Create a detailed breach report from multiple incidents:

```typescript
import { generateBreachReport } from '@/lib/security/breach-notification';

const incidents = [
  {
    id: 'incident-123',
    type: 'key_compromise',
    timestamp: '2024-02-06T15:00:00Z',
    description: 'Private key exposed in git history',
    affectedSystems: ['auth-service'],
    severity: 'critical'
  },
  {
    id: 'incident-124',
    type: 'unauthorized_access',
    timestamp: '2024-02-06T15:15:00Z',
    description: 'Suspicious connection from unknown IP',
    affectedSystems: ['relay-server'],
    severity: 'high'
  }
];

const report = generateBreachReport(incidents);
console.log(report);
// {
//   reportId: 'breach-timestamp-random',
//   generatedAt: '2024-02-06T16:00:00Z',
//   breachDate: '2024-02-06T15:00:00Z',
//   discoveryDate: '2024-02-06T16:00:00Z',
//   affectedUsers: 0,
//   dataCategories: ['Encryption Keys', 'Session Information'],
//   incidentCount: 2,
//   timeline: {...},
//   summary: 'A total of 2 security incident(s) were detected...',
//   detailedFindings: [...],
//   notificationsSent: false
// }
```

### Preparing Compliance Reports

Generate formal documentation for regulators:

```typescript
import { prepareComplianceReport } from '@/lib/security/breach-notification';

const complianceDoc = prepareComplianceReport(report);
// {
//   reportId: 'breach-timestamp',
//   timestamp: '2024-02-06T16:00:00Z',
//   summary: '...',
//   details: '...'
// }

// Submit to regulatory body
await submitToRegulator(complianceDoc);
```

### Formatting for Internal Use

```typescript
import { formatBreachReport } from '@/lib/security/breach-notification';

const formatted = formatBreachReport(report);
// "BREACH INCIDENT REPORT\n=====================\n..."

// Store in incident management system
archiveIncident(formatted);
```

## Emergency Data Wipe

### Overview

The `clearSensitiveData()` function implements emergency procedures to clear all sensitive data from browser storage when a compromise is detected.

**WARNING**: This is a destructive operation that cannot be undone. Only call when:
- A critical security breach is confirmed
- The device is known to be compromised
- You have informed the user and have their consent

### What Gets Wiped

#### Security & Authentication
- Active incident reports
- Incident history
- Authentication tokens
- Refresh tokens
- Session data
- Cryptographic session keys
- Device keys
- Ephemeral keys

#### Device & Session Information
- Device ID
- Device public/private keys
- Device credentials
- Session tokens
- Session data

#### User Data
- User preferences and settings
- User metadata
- Transfer history
- Transfer cache

#### Network & Connection Data
- Relay credentials
- Relay tokens
- Peer device list
- Connection data

#### Chat & Messaging
- Chat history
- Chat encryption keys
- Message cache

#### Cache Data
- File cache
- Thumbnail cache
- Metadata cache

### Usage

```typescript
import { clearSensitiveData } from '@/lib/security/breach-notification';

// Only call in confirmed compromise situation
if (breachConfirmed && userConsented) {
  clearSensitiveData();
  // Logs: "EMERGENCY: Sensitive data cleared. System requires restart."
}
```

### Integration with Incident Response

```typescript
import { escalate } from '@/lib/security/incident-response';
import { clearSensitiveData, shouldWipeEmergency } from '@/lib/security/breach-notification';

const report = createIncidentReport(
  'key_compromise',
  'critical',
  'Private key compromised'
);

escalate(report);

// Automatically wipe if critical key/malware/relay compromise
if (shouldWipeEmergency(report.severity, report.type)) {
  const userConsent = await getUserConsent(
    'This will clear all your local data. Proceed?'
  );

  if (userConsent) {
    clearSensitiveData();
    // Reload page or redirect to fresh setup
    window.location.href = '/setup';
  }
}
```

### Decision Logic

Use `shouldWipeEmergency()` to determine if emergency wipe should be triggered:

```typescript
import { shouldWipeEmergency } from '@/lib/security/breach-notification';

const needsWipe = shouldWipeEmergency('critical', 'key_compromise');
// true - critical + key compromise triggers wipe

const needsWipe = shouldWipeEmergency('critical', 'brute_force');
// false - critical but not key/malware/relay compromise

const needsWipe = shouldWipeEmergency('high', 'data_breach');
// true - any severity + data breach triggers wipe
```

### Storage Wiping Details

The emergency wipe performs multiple passes:

1. **Individual Key Wipe**: Securely wipes each sensitive localStorage key
2. **Session Storage Wipe**: Clears all sessionStorage data
3. **IndexedDB Deletion**: Removes cached IndexedDB databases
4. **Fallback Clear**: Uses `localStorage.clear()` if individual wipes fail
5. **Error Handling**: Logs failures but continues wiping other data

```typescript
// Example wipe process
localStorage.removeItem('security:incidents');
localStorage.removeItem('auth:token');
localStorage.removeItem('crypto:sessionKey');
// ... continues for all sensitive keys
sessionStorage.clear();
indexedDB.deleteDatabase('cache-db');
// Repeats with any failed keys
```

## Breach Notification Lifecycle

### 1. Detection
```typescript
const report = createIncidentReport(
  'data_breach',
  'critical',
  'Unauthorized access to encrypted file storage detected'
);
```

### 2. Escalation
```typescript
escalate(report);
```

### 3. Create Notification
```typescript
const notification = notifyBreach(
  'Security Incident Notification',
  'We discovered unauthorized access to our file storage servers...',
  ['User Files', 'Encryption Keys'],
  1000
);
```

### 4. Generate Report
```typescript
const breachReport = generateBreachReport([report]);
```

### 5. Prepare Communications
```typescript
const userMsg = prepareUserNotification(notification);
const complianceMsg = prepareComplianceReport(breachReport);
```

### 6. Send Notifications
```typescript
// Send to affected users
await sendBreachNotifications(userMsg);

// File regulatory report
await submitComplianceReport(complianceMsg);
```

### 7. Clear Compromised Data
```typescript
if (shouldWipeEmergency(report.severity, report.type)) {
  clearSensitiveData();
}
```

## Integration Examples

### With Monitoring Systems

```typescript
import {
  notifyBreach,
  shouldWipeEmergency,
  clearSensitiveData
} from '@/lib/security/breach-notification';

function onSecurityAlert(alert: SecurityAlert) {
  if (alert.type === 'data_breach' && alert.severity === 'critical') {
    // Create notification
    const notification = notifyBreach(
      alert.title,
      alert.description,
      alert.affectedDataTypes,
      alert.impactedUsers
    );

    // Check if emergency wipe needed
    if (shouldWipeEmergency(alert.severity, alert.type)) {
      // Ask user consent
      const consent = confirm('Emergency wipe needed. Clear all local data?');
      if (consent) {
        clearSensitiveData();
      }
    }

    // Send notifications
    sendUserNotifications(notification);
  }
}
```

### Breach Notification Email Template

```typescript
import { prepareUserNotification } from '@/lib/security/breach-notification';

const notification = notifyBreach(...);
const emailContent = prepareUserNotification(notification);

const emailTemplate = `
Subject: ${emailContent.subject}

${emailContent.body}

---

To learn more and take action: ${emailContent.actionUrl}

Support: security@tallow.io
`;
```

### Compliance Reporting Workflow

```typescript
import {
  generateBreachReport,
  prepareComplianceReport
} from '@/lib/security/breach-notification';

async function reportBreach(incidents: IncidentReport[]) {
  // Generate comprehensive report
  const report = generateBreachReport(incidents);

  // Prepare for regulators
  const compliance = prepareComplianceReport(report);

  // Archive internally
  await archiveReport(compliance);

  // File with regulators (varies by jurisdiction)
  if (requiresFilingInUs(report)) {
    await fileWithAttyGeneral(compliance);
  }

  if (requiresFilingInEu(report)) {
    await notifyDPA(compliance); // Data Protection Authority
  }
}
```

## Best Practices

### 1. User Consent Required
Always get explicit consent before emergency wipe:

```typescript
if (shouldWipeEmergency(severity, type)) {
  const consent = await showConfirmDialog(
    'Emergency Wipe',
    'This will clear all your local data. You will need to re-authenticate. Proceed?',
    ['Cancel', 'Clear Data']
  );

  if (consent) {
    clearSensitiveData();
  }
}
```

### 2. Timely Notifications
Notify users as soon as breach is confirmed:

```typescript
// Don't wait for investigation to complete
const notification = notifyBreach(
  'Security Incident - Immediate Notice',
  'We detected unauthorized access. Investigation ongoing.',
  [], // Data types TBD
  estimatedUsers
);

// Send immediately
await sendNotificationImmediately(notification);

// Update as you learn more
notification = updateNotification(notification, {
  description: 'Full details of incident...',
  affectedDataTypes: ['Encryption Keys']
});

// Send updated notification
await sendUpdatedNotification(notification);
```

### 3. Clear Documentation
Document what happened and actions taken:

```typescript
const breachReport = generateBreachReport(incidents);
console.log(formatBreachReport(breachReport));

// Results in clear timeline:
// BREACH INCIDENT REPORT
// Report ID: breach-123
// Breach Date: 2024-02-06
// Contained: 2024-02-06
// Impact: 2 incidents, 1000 users
```

### 4. Regulatory Compliance
Ensure compliance with relevant regulations:

- **GDPR**: 72-hour notification requirement
- **CCPA**: Prompt notification in plain language
- **HIPAA**: 60-day notification for health data
- **State Laws**: Varies by state (often 30-60 days)

```typescript
const complianceDeadline = calculateComplianceDeadline(
  breachDate,
  jurisdiction
);

if (currentDate > complianceDeadline) {
  console.error('COMPLIANCE VIOLATION: Notification deadline missed');
}
```

### 5. Preserve Evidence
Keep incident data for investigation:

```typescript
// Don't delete incidents immediately
const incidents = getAllIncidents();

// Archive to secure storage before wipe
await archiveIncidentsToSecureBackend(incidents);

// Then clear local data if needed
clearSensitiveData();
```

## Troubleshooting

### Emergency Wipe Not Completing

If `clearSensitiveData()` doesn't clear all data:

```typescript
// Check localStorage
const remaining = Object.keys(localStorage);
console.log('Remaining keys:', remaining);

// Force final clear if needed
try {
  localStorage.clear();
  sessionStorage.clear();
} catch (e) {
  console.error('Cannot clear storage:', e);
  // May need manual browser cache clear
}
```

### Notifications Not Sending

If breach notifications fail to send:

```typescript
try {
  await sendNotification(userMsg);
} catch (error) {
  console.error('Notification send failed:', error);

  // Retry with exponential backoff
  await retry(
    () => sendNotification(userMsg),
    { maxAttempts: 5, backoff: 'exponential' }
  );

  // Log for manual followup
  logFailedNotification(userMsg, error);
}
```

### Large Number of Affected Users

If breach affects thousands of users:

```typescript
// Batch notifications to avoid rate limiting
const batches = chunkArray(affectedUsers, 1000);

for (const batch of batches) {
  await sendBatchNotifications(batch, notification);
  // Wait between batches to avoid overwhelming servers
  await delay(60000); // 1 minute between batches
}
```

## API Reference

### Notification Functions

```typescript
notifyBreach(
  title: string,
  description: string,
  affectedDataTypes: string[],
  impactedUserCount: number
): BreachNotification

prepareUserNotification(
  notification: BreachNotification
): { subject: string; body: string; actionUrl: string }

formatBreachNotification(
  notification: BreachNotification
): string
```

### Report Functions

```typescript
generateBreachReport(
  incidents: IncidentInfo[]
): BreachReport

prepareComplianceReport(
  report: BreachReport
): { reportId: string; timestamp: string; summary: string; details: string }

formatBreachReport(
  report: BreachReport
): string
```

### Emergency Functions

```typescript
clearSensitiveData(): void

shouldWipeEmergency(
  severity: 'critical' | 'high' | 'medium' | 'low',
  type: string
): boolean
```

## See Also

- [Incident Response Procedures](./INCIDENT_RESPONSE.md)
- [Memory Protection](./memory-wiper.ts)
- [Credential Encryption](./credential-encryption.ts)
- [Security Index](./index.ts)
