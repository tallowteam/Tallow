# Security Incident Response - Quick Reference Card

Printed quick reference for security team. Keep visible during incident response.

## Incident Types and Response Times

| Incident Type | Severity | Response Time | Escalate | Notify User |
|---------------|----------|---------------|----------|------------|
| Key Compromise | Critical | < 15 min | YES | YES (1hr) |
| Data Breach | Critical | < 15 min | YES | YES (1hr) |
| Relay Compromise | Critical | < 15 min | YES | YES (1hr) |
| Malware Detected | Critical | < 15 min | YES | YES (1hr) |
| Unauthorized Access | High | < 1 hour | YES | YES |
| Crypto Failure | High | < 1 hour | YES | No |
| MITM Detected | High | < 1 hour | YES | YES |
| Brute Force | Medium | < 4 hours | No | Recommend |

## Code Cheat Sheet

### Create & Escalate Incident
```typescript
import { createIncidentReport, escalate } from '@/lib/security';

const report = createIncidentReport(
  'key_compromise', // incident type
  'critical',       // severity
  'Description...'
);
escalate(report);
```

### Get Response Procedure
```typescript
import { getResponseProcedure } from '@/lib/security';

const proc = getResponseProcedure('key_compromise');
console.log(proc.immediateActions);
console.log(proc.investigationSteps);
console.log(proc.containmentActions);
console.log(proc.recoverySteps);
```

### Track Incident Status
```typescript
import { updateIncidentStatus } from '@/lib/security';

report = updateIncidentStatus(report, 'investigating');
report = updateIncidentStatus(report, 'contained');
report = updateIncidentStatus(report, 'resolved');
```

### Create Breach Notification
```typescript
import { notifyBreach, prepareUserNotification } from '@/lib/security';

const notif = notifyBreach(
  'Title',
  'Description...',
  ['Data Type 1', 'Data Type 2'],
  affectedUserCount
);

const msg = prepareUserNotification(notif);
// msg.subject, msg.body, msg.actionUrl
```

### Emergency Wipe
```typescript
import { shouldWipeEmergency, clearSensitiveData } from '@/lib/security';

if (shouldWipeEmergency('critical', 'key_compromise')) {
  // Get consent first!
  const ok = await getUserConsent('Clear all local data?');
  if (ok) clearSensitiveData();
}
```

### Query Incidents
```typescript
import {
  getAllIncidents,
  getIncidentsBySeverity,
  getIncidentsByType
} from '@/lib/security';

getAllIncidents();              // All incidents
getIncidentsBySeverity('critical'); // Critical only
getIncidentsByType('data_breach');  // Type filter
```

## Response Decision Tree

```
SECURITY EVENT DETECTED
│
├─ Is it a critical incident?
│  ├─ YES → 15 min response required
│  │       Immediate escalation
│  │       Notify users within 1 hour
│  │       Check if emergency wipe needed
│  │
│  └─ NO → Continue to next question
│
├─ Is it a high severity incident?
│  ├─ YES → 1 hour response required
│  │       Escalation needed
│  │       User notification recommended
│  │
│  └─ NO → Continue to next question
│
├─ Is it a medium/low severity?
│  └─ YES → Standard response procedures
│          No emergency escalation
│          Notification optional
│
└─ All cases → Track incident through lifecycle
              Update status as it progresses
              Archive for post-incident review
```

## Critical Incident Immediate Actions

### Key Compromise
1. ISOLATE: Disconnect affected device
2. DISABLE: Invalidate compromised keys
3. NOTIFY: Alert user immediately
4. PRESERVE: Save evidence

### Data Breach
1. ASSESS: What data was exposed?
2. ALERT: Notify affected users NOW
3. PRESERVE: Save all evidence
4. CONTAIN: Stop further exposure

### Relay Compromise
1. DEACTIVATE: Disable relay immediately
2. NOTIFY: Alert all users
3. REROUTE: Use backup relay servers
4. PRESERVE: Save forensic evidence

### Malware Detected
1. QUARANTINE: Isolate malware sample
2. ALERT: Notify user immediately
3. PRESERVE: Save for analysis
4. SCAN: Initiate full system scan

## Emergency Wipe Decision

**TRIGGER WIPE IF:**
- Critical + Key Compromise = YES
- Critical + Malware = YES
- Critical + Relay Compromise = YES
- ANY Severity + Data Breach = YES

**DO NOT WIPE IF:**
- Medium/Low severity + non-critical incident type
- You can't get user consent
- Investigating (need to preserve evidence)

**BEFORE YOU WIPE:**
1. Get explicit user consent
2. Preserve incident evidence
3. Document what's being wiped
4. Prepare system restart plan
5. Have backup access ready

## Notification Checklist

For breach notifications:
- [ ] Gather incident details
- [ ] Determine affected data types
- [ ] Count affected users
- [ ] Draft user message
- [ ] Draft compliance report
- [ ] Get legal review
- [ ] Get executive approval
- [ ] Send user notifications
- [ ] File regulatory reports
- [ ] Archive documentation

**Regulatory Deadlines:**
- GDPR: 72 hours
- CCPA: Prompt + without unreasonable delay
- HIPAA: 60 days
- State Laws: Often 30-60 days

## Storage Locations

**Incident Data:**
- localStorage key: `security:incidents`
- Stores: Array of all IncidentReport objects

**Active Incident:**
- localStorage key: `security:activeIncident`
- Stores: Current incident for quick access

**Data Being Wiped:**
- `security:*` — All security keys
- `auth:*` — Authentication tokens
- `crypto:*` — Cryptographic keys
- `device:*` — Device information
- `session:*` — Session data
- `user:*` — User preferences
- `transfer:*` — Transfer history
- `relay:*` — Relay credentials
- `chat:*` — Chat history
- `cache:*` — Cached data

## Common Scenarios

### Scenario 1: Unauthorized Device Connection Attempt
```
Status: High severity
Response: < 1 hour

Immediate:
1. Alert user of unauthorized connection
2. Reject the connection
3. Log source IP and details
4. Quarantine session

Investigation:
- Identify attacker location
- Check for other unauthorized attempts
- Review authentication logs

Containment:
- Terminate unauthorized sessions
- Reset auth tokens
- Enable enhanced security checks
- Require re-authentication

Recovery:
- Verify legitimate devices
- Update trust list
- Resume normal access
```

### Scenario 2: Brute Force Detected
```
Status: Medium severity
Response: < 4 hours

Immediate:
1. Apply rate limiting
2. Log all attempts
3. Notify user
4. Block attacking IP

Investigation:
- Source IP analysis
- Attack pattern analysis
- Check for compromised credentials
- Determine if coordinated

Containment:
- Enable CAPTCHA
- Add IP to blocklist
- Force password reset if needed
- Enable 2FA

Recovery:
- Monitor for pattern changes
- Gradually relax rate limiting
- Keep blocklist active
```

### Scenario 3: Crypto Operation Failed
```
Status: High severity
Response: < 1 hour

Immediate:
1. Stop all crypto operations
2. Log full error details
3. Stop affected transfers
4. Notify user of failure

Investigation:
- Analyze failed operation
- Check system resources
- Review recent code changes
- Test with known-good vectors

Containment:
- Disable failing operation
- Invalidate data from failure window
- Force re-authentication
- Clear operation queues

Recovery:
- Fix the issue
- Re-test thoroughly
- Resume with working version
- Audit affected data
```

## Escalation Matrix

| Severity | To | Method | Delay |
|----------|-------|---------|--------|
| Critical | CTO/Security | Phone | Immediate |
| Critical | CEO | Email | 15 min |
| Critical | Legal | Email | 1 hour |
| High | Security Lead | Slack | 15 min |
| High | Incident Commander | Email | 30 min |
| Medium | Security Team | Slack | 1 hour |
| Low | Ticket System | Auto | None |

## Incident Types at a Glance

### CRITICAL (Red) - Immediate Response
1. **Key Compromise** → Invalidate keys, rotate sessions
2. **Data Breach** → Assess scope, alert users
3. **Relay Compromise** → Switch to backup, disable relay
4. **Malware Detected** → Quarantine, rebuild system

### HIGH (Orange) - Urgent Response
5. **Unauthorized Access** → Block device, verify legitimate users
6. **Crypto Failure** → Stop operations, fix issue
7. **MITM Detected** → Verify peer identity, new session

### MEDIUM (Yellow) - Standard Response
8. **Brute Force** → Rate limit, block IP, protect account

## Contact Information

**Security Team:**
- Lead: [Name] [Contact]
- On-Call: [Process]

**External Contacts:**
- Legal: [Email/Phone]
- PR: [Email/Phone]
- Regulators: [Email/Phone]

**Resources:**
- Incident Response Plan: [URL]
- Playbooks: [URL]
- Evidence Storage: [Location]
- Escalation Process: [Document]

## Key Reminders

✓ Act fast - SLAs matter
✓ Document everything - for legal discovery
✓ Get consent before emergency wipe
✓ Notify users within SLA window
✓ Preserve evidence before cleanup
✓ Update status through lifecycle
✓ Archive incident for post-analysis
✓ Review procedures after incident
✓ Maintain incident history
✓ Test procedures regularly

## Console Verification

After escalating incident, verify in browser console:

```javascript
// Check stored incident
JSON.parse(localStorage.getItem('security:activeIncident'))

// Check all incidents
JSON.parse(localStorage.getItem('security:incidents'))

// Count by severity
const all = JSON.parse(localStorage.getItem('security:incidents') || '[]');
const critical = all.filter(i => i.severity === 'critical').length;
console.log(`Critical incidents: ${critical}`);
```

## Regulatory Notification Requirements

| Regulation | Timeline | Method | Scope |
|-----------|----------|--------|--------|
| GDPR | 72 hours | Notify authority + users | Any data processing issue |
| CCPA | Prompt | Notify users | California residents |
| HIPAA | 60 days | Notify individuals + HHS | Protected health info |
| NY State | 30 days | Notify individuals + AG | NY residents |
| Other States | 30-60 days | Varies | State residents |

## Emergency Contact Tree

```
CRITICAL INCIDENT DETECTED
│
├─ Notify: [Security Lead]
│  └─ Notify: [CTO]
│     └─ Notify: [CEO]
│        └─ Notify: [Legal]
│           └─ Notify: [PR]
│
├─ Escalate: [Incident Commander]
│
├─ Activate: [Incident Response Team]
│
└─ Execute: [Response Procedures]
```

---

**Last Updated**: February 6, 2024
**Version**: 1.0
**Next Review**: May 6, 2024 (quarterly)

Print this card and keep it visible during incident response operations.
