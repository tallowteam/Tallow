# Incident Response Procedures

Comprehensive incident response system for Tallow security events. Codifies response procedures, escalation paths, and response time SLAs for all major security incident types.

## Overview

The incident response module provides:

- **Structured Incident Reporting**: Create and track security incidents with detailed metadata
- **Response Procedures**: Step-by-step procedures for 8 incident types
- **Escalation Workflows**: Automated escalation with timeline tracking
- **SLA Management**: Response time targets by severity level
- **Incident History**: Persistent storage and querying of incidents
- **Compliance Logging**: Formatted reports for regulatory compliance

## Incident Types

### Critical Severity Incidents

#### 1. Key Compromise
- **Severity**: Critical
- **Response Time**: < 15 minutes
- **Triggers**: Private key exposure, unauthorized key access
- **Immediate Actions**:
  - Disconnect affected device from network
  - Invalidate compromised keys immediately
  - Notify user of key compromise
  - Preserve forensic evidence

**Recovery**: Generate new keys, rotate sessions, implement key rotation policy

---

#### 2. Data Breach
- **Severity**: Critical
- **Response Time**: < 15 minutes
- **Triggers**: Encrypted data potentially exposed, unauthorized file access
- **Immediate Actions**:
  - Assess scope of data exposure
  - Alert affected users immediately
  - Preserve all evidence and logs
  - Prevent further data exposure

**Recovery**: Restore from clean backups, reset all encryption keys, conduct audit

---

#### 3. Relay Compromise
- **Severity**: Critical
- **Response Time**: < 15 minutes
- **Triggers**: Relay server security breach, unauthorized relay access
- **Immediate Actions**:
  - Immediately disable compromised relay
  - Alert all users of relay compromise
  - Switch users to backup relay servers
  - Preserve forensic evidence

**Recovery**: Deploy new relay infrastructure, implement stronger access controls

---

#### 4. Malware Detected
- **Severity**: Critical
- **Response Time**: < 15 minutes
- **Triggers**: Malicious file detection, system compromise
- **Immediate Actions**:
  - Isolate detected malware
  - Notify user immediately
  - Save malware sample for analysis
  - Initiate full system scan

**Recovery**: Rebuild from clean source, reset all keys, implement monitoring

---

### High Severity Incidents

#### 5. Unauthorized Access
- **Severity**: High
- **Response Time**: < 1 hour
- **Triggers**: Unauthorized device connection, illegal session
- **Immediate Actions**:
  - Notify user of unauthorized connection attempt
  - Reject unauthorized device connection
  - Capture source IP and connection details
  - Quarantine affected session

**Recovery**: Verify legitimate devices, require re-authentication, monitor activity

---

#### 6. Crypto Failure
- **Severity**: High
- **Response Time**: < 1 hour
- **Triggers**: Cryptographic operation failure, algorithm failure
- **Immediate Actions**:
  - Halt all cryptographic operations
  - Record full error details and context
  - Stop affected transfers immediately
  - Notify user of operation failure

**Recovery**: Fix underlying issue, re-test, resume with working implementation

---

#### 7. MITM Detection
- **Severity**: High
- **Response Time**: < 1 hour
- **Triggers**: Man-in-the-middle attack detected
- **Immediate Actions**:
  - Warn user of MITM detection
  - Request user to verify peer identity
  - Reject current session until verified
  - Record MITM detection details

**Recovery**: Verify both peers out-of-band, establish new secure session

---

### Medium Severity Incidents

#### 8. Brute Force
- **Severity**: Medium
- **Response Time**: < 4 hours
- **Triggers**: Multiple failed authentication attempts
- **Immediate Actions**:
  - Apply rate limiting to affected endpoint
  - Record all brute force attempts
  - Notify user of brute force attempts
  - Temporarily block attacking IP address

**Recovery**: Monitor for pattern changes, implement CAPTCHA, enforce 2FA

---

## Response Time SLAs

| Severity | Initial Response | Response Window | Escalation Required |
|----------|-----------------|-----------------|-------------------|
| Critical | Immediate | < 15 minutes | Yes |
| High | Urgent | < 1 hour | Yes |
| Medium | Timely | < 4 hours | No |
| Low | Standard | < 24 hours | No |

## Usage

### Creating an Incident Report

```typescript
import { createIncidentReport } from '@/lib/security/incident-response';

// Create incident report
const report = createIncidentReport(
  'key_compromise',
  'critical',
  'Private key found in git history exposed to GitHub'
);

console.log(report);
// {
//   id: 'incident-abcd1234-xyz789',
//   type: 'key_compromise',
//   severity: 'critical',
//   timestamp: '2024-02-06T15:30:00Z',
//   description: '...',
//   affectedSystems: [],
//   responseSteps: [...],
//   status: 'detected'
// }
```

### Getting Response Procedures

```typescript
import { getResponseProcedure } from '@/lib/security/incident-response';

const procedure = getResponseProcedure('key_compromise');
console.log(procedure.immediateActions);
// [
//   'ISOLATE: Disconnect affected device from network',
//   'DISABLE: Invalidate compromised keys immediately',
//   ...
// ]
```

### Checking Response Timelines

```typescript
import { getResponseTimeline } from '@/lib/security/incident-response';

const timeline = getResponseTimeline('critical');
console.log(timeline);
// {
//   severity: 'critical',
//   initialResponseTime: 'Immediate (< 15 min)',
//   responseTimeMinutes: 15,
//   escalationRequired: true,
//   notificationDeadline: '1 hour'
// }
```

### Escalating an Incident

```typescript
import { createIncidentReport, escalate } from '@/lib/security/incident-response';

const report = createIncidentReport(
  'unauthorized_access',
  'high',
  'Multiple connection attempts from unknown device'
);

// Escalate the incident
escalate(report);
// Logs to console with styling
// Stores in localStorage for persistence
// Auto-generates next steps
```

### Tracking Incident Status

```typescript
import { updateIncidentStatus, getIncidentById } from '@/lib/security/incident-response';

// Update status through lifecycle
let report = updateIncidentStatus(report, 'investigating');
report = updateIncidentStatus(report, 'contained');
report = updateIncidentStatus(report, 'resolved');

// Retrieve incident later
const incident = getIncidentById(report.id);
console.log(incident?.status); // 'resolved'
```

### Querying Incident History

```typescript
import {
  getAllIncidents,
  getIncidentsBySeverity,
  getIncidentsByType,
} from '@/lib/security/incident-response';

// Get all incidents
const all = getAllIncidents();

// Get critical incidents
const critical = getIncidentsBySeverity('critical');

// Get all key compromise incidents
const keyCompromises = getIncidentsByType('key_compromise');
```

### Formatting for Logging

```typescript
import { formatIncidentSummary } from '@/lib/security/incident-response';

const summary = formatIncidentSummary(report);
console.log(summary);
// [CRITICAL] key_compromise
// ID: incident-abcd1234-xyz789
// Status: resolved
// Duration: 45 minutes
// Description: ...
```

## Storage

Incidents are persisted in browser localStorage at:
- `security:incidents` — Array of all incidents
- `security:activeIncident` — Current active incident

Each incident is timestamped and includes:
- Unique ID
- Type and severity
- Affected systems
- Response steps
- Status tracking with timestamps

### Accessing Incident Storage

```typescript
// Direct localStorage access
const incidents = JSON.parse(localStorage.getItem('security:incidents') || '[]');
const activeIncident = JSON.parse(localStorage.getItem('security:activeIncident') || 'null');
```

## Response Procedures in Detail

Each incident type includes comprehensive procedures:

1. **Immediate Actions** — First steps to take (0-15 minutes)
2. **Investigation Steps** — How to understand the incident
3. **Containment Actions** — How to stop the incident
4. **Recovery Steps** — How to restore normal operation

All steps are predefined and stored in the response procedures for each incident type.

## Best Practices

### 1. Fast Detection
Detect incidents as early as possible using monitoring systems.

```typescript
// Example: Detect crypto failures
try {
  const encrypted = await encryptData(file);
} catch (error) {
  const report = createIncidentReport(
    'crypto_failure',
    'high',
    `Encryption failed: ${error.message}`
  );
  escalate(report);
}
```

### 2. Immediate Escalation
For critical incidents, escalate immediately to warn users.

```typescript
if (report.severity === 'critical') {
  escalate(report);
  // Send notifications to affected users
  // Alert security team
  // Trigger automated response procedures
}
```

### 3. Track Status Changes
Update incident status as response progresses.

```typescript
// As investigation progresses
updateIncidentStatus(report, 'investigating');

// When threat contained
updateIncidentStatus(report, 'contained');

// When fully resolved
updateIncidentStatus(report, 'resolved');
```

### 4. Document Everything
Add detailed notes as response proceeds.

```typescript
const updatedReport = {
  ...report,
  notes: 'Key compromised in GitHub repo. Successfully revoked and regenerated new keys.'
};
```

### 5. Review and Learn
After resolution, review incidents to improve procedures.

```typescript
const resolved = getAllIncidents().filter(i => i.status === 'resolved');
const avgResolutionTime = resolved.reduce((sum, i) => {
  const duration = new Date(i.resolvedAt!).getTime() - new Date(i.timestamp).getTime();
  return sum + duration;
}, 0) / resolved.length;
```

## Integration Examples

### With Monitoring Systems

```typescript
import { createIncidentReport, escalate } from '@/lib/security/incident-response';

// In your monitoring/error tracking
function onSecurityEvent(event: SecurityEvent) {
  if (event.type === 'crypto_failure') {
    const report = createIncidentReport(
      'crypto_failure',
      'high',
      event.details
    );
    escalate(report);
  }
}
```

### With User Notifications

```typescript
import { escalate } from '@/lib/security/incident-response';

const report = createIncidentReport(
  'brute_force',
  'medium',
  'Multiple failed login attempts detected'
);

escalate(report);

// Then notify user
notifyUser({
  title: 'Unusual Activity Detected',
  message: 'We detected multiple failed login attempts on your account',
  actionUrl: '/security/verify'
});
```

### With Breach Procedures

```typescript
import { createIncidentReport, escalate } from '@/lib/security/incident-response';
import { notifyBreach, shouldWipeEmergency, clearSensitiveData } from '@/lib/security/breach-notification';

const report = createIncidentReport(
  'key_compromise',
  'critical',
  'Private key exposed in code repository'
);

escalate(report);

// Check if emergency wipe is needed
if (shouldWipeEmergency(report.severity, report.type)) {
  clearSensitiveData();
}

// Create breach notification
const notification = notifyBreach(
  'Security Incident - Key Compromise',
  'A private key was exposed. We have invalidated it immediately.',
  ['Encryption Keys'],
  1
);
```

## Console Output

Escalated incidents output to console with severity-based styling:

**Critical Incidents:**
```
[INCIDENT ESCALATION] KEY_COMPROMISE
Report: {...}
Response Timeline: {...}
Next Steps: [...]
```

**High Priority Incidents:**
```
[INCIDENT ESCALATION] UNAUTHORIZED_ACCESS
...
```

Console styling helps quickly identify incident severity at a glance.

## Compliance Considerations

The incident response system maintains:

- **Timestamp Accuracy**: All incidents use ISO 8601 timestamps
- **Immutable Audit Trail**: Incident history is append-only
- **Status Tracking**: Complete lifecycle documentation
- **Evidence Preservation**: Forensic details stored with incident
- **Response Documentation**: All procedures documented

This supports:
- Post-incident analysis and learning
- Regulatory compliance requirements
- Security audits and assessments
- Legal discovery and litigation support

## Troubleshooting

### Incidents Not Persisting

If incidents aren't storing in localStorage:

```typescript
try {
  localStorage.setItem('test', 'value');
  localStorage.removeItem('test');
} catch (e) {
  console.error('localStorage unavailable:', e);
  // Implement alternative storage
}
```

### High Number of Incidents

If incident history grows too large:

```typescript
import { clearIncidentHistory } from '@/lib/security/incident-response';

// Clear old history
clearIncidentHistory();

// Or manually trim
const incidents = getAllIncidents();
const recent = incidents.slice(-100);
localStorage.setItem('security:incidents', JSON.stringify(recent));
```

### Response Procedures Not Available

If response procedures can't be retrieved:

```typescript
import { getResponseProcedure } from '@/lib/security/incident-response';

try {
  const procedure = getResponseProcedure('key_compromise');
} catch (error) {
  console.error('Procedure not found:', error);
  // Fall back to manual procedures
}
```

## API Reference

See `/lib/security/incident-response.ts` for complete TypeScript interfaces and function signatures.

### Key Exports

- `createIncidentReport(type, severity, description): IncidentReport`
- `getResponseProcedure(type): ResponseProcedure`
- `getResponseTimeline(severity): ResponseTimeline`
- `escalate(report): void`
- `updateIncidentStatus(report, status): IncidentReport`
- `getAllIncidents(): IncidentReport[]`
- `getIncidentsBySeverity(severity): IncidentReport[]`
- `getIncidentsByType(type): IncidentReport[]`
- `clearIncidentHistory(): void`
- `formatIncidentSummary(report): string`

## Next Steps

1. **Integrate with Monitoring**: Connect to security event detection
2. **Setup Notifications**: Implement user/team alerting
3. **Document Playbooks**: Create runbooks for your team
4. **Test Procedures**: Run incident response drills regularly
5. **Review and Improve**: Use incident data to improve procedures
