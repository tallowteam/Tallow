import { beforeEach, describe, expect, it } from 'vitest';

import {
  clearIncidentHistory,
  createIncidentReport,
  escalate,
  formatIncidentSummary,
  getAllIncidents,
  getIncidentsBySeverity,
  getIncidentsByType,
  getResponseTimeline,
  updateIncidentStatus,
} from '@/lib/security/incident-response';

describe('incident response drill', () => {
  beforeEach(() => {
    clearIncidentHistory();
  });

  it('simulates a critical key-compromise incident through full lifecycle', () => {
    const report = createIncidentReport(
      'key_compromise',
      'critical',
      'Drill: simulated private key exposure during transfer'
    );

    expect(report.status).toBe('detected');
    expect(report.responseSteps.length).toBeGreaterThan(0);

    escalate(report);
    const storedAfterEscalation = getAllIncidents();
    expect(storedAfterEscalation.length).toBe(1);
    expect(storedAfterEscalation[0]?.status).toBe('investigating');

    const contained = updateIncidentStatus(storedAfterEscalation[0]!, 'contained');
    const resolved = updateIncidentStatus(contained, 'resolved');
    const summary = formatIncidentSummary(resolved);

    expect(contained.containedAt).toBeDefined();
    expect(resolved.resolvedAt).toBeDefined();
    expect(summary).toContain('key_compromise');
    expect(summary).toContain('resolved');
  });

  it('enforces critical response timeline and supports filtered incident review', () => {
    const timeline = getResponseTimeline('critical');
    expect(timeline.responseTimeMinutes).toBeLessThanOrEqual(15);
    expect(timeline.escalationRequired).toBe(true);

    const bruteForce = createIncidentReport(
      'brute_force',
      'medium',
      'Drill: repeated auth attempts from a blocked subnet'
    );
    const dataBreach = createIncidentReport(
      'data_breach',
      'critical',
      'Drill: simulated encrypted metadata exposure alert'
    );

    escalate(bruteForce);
    escalate(dataBreach);

    expect(getIncidentsBySeverity('critical').length).toBe(1);
    expect(getIncidentsByType('brute_force').length).toBe(1);
    expect(getAllIncidents().length).toBe(2);
  });
});
