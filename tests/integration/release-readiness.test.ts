import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

type SignoffEntry = {
  approver: string;
  status: string;
  evidence: string;
};

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('Release readiness integration', () => {
  it('includes the required release signoff chain entries', () => {
    const payload = JSON.parse(readText('release-signoffs/v0.1.0.json')) as {
      signoffs: SignoffEntry[];
    };

    const requiredApprovers = ['002', '019', '078', '075', '086', '001'];
    const byApprover = new Map(payload.signoffs.map((entry) => [entry.approver, entry]));

    for (const approver of requiredApprovers) {
      const entry = byApprover.get(approver);
      expect(entry, `Missing signoff for ${approver}`).toBeDefined();
      expect(entry?.status).toBe('approved');
      expect(entry?.evidence).toBeTruthy();
      expect(fs.existsSync(path.join(process.cwd(), String(entry?.evidence)))).toBe(true);
    }
  });

  it('maintains platform parity/readiness documentation and release evidence index', () => {
    const parityPath = 'docs/platform/PARITY_MATRIX.md';
    const readinessPath = 'docs/platform/RELEASE_READINESS_LEVELS.md';
    const releaseTemplatePath = 'docs/release/RELEASE_NOTES_TEMPLATE.md';
    const evidenceIndexPath = 'docs/release/DIRECTORATE_EVIDENCE_INDEX_v0.1.0.md';

    expect(fs.existsSync(path.join(process.cwd(), parityPath))).toBe(true);
    expect(fs.existsSync(path.join(process.cwd(), readinessPath))).toBe(true);
    expect(fs.existsSync(path.join(process.cwd(), releaseTemplatePath))).toBe(true);
    expect(fs.existsSync(path.join(process.cwd(), evidenceIndexPath))).toBe(true);

    const parity = readText(parityPath);
    const readiness = readText(readinessPath);
    const template = readText(releaseTemplatePath);
    const evidence = readText(evidenceIndexPath);

    expect(parity).toContain('Feature-Flag Staging');
    expect(readiness).toContain('Minimum Pass Profile');
    expect(template).toContain('Platform Readiness');
    expect(evidence).toContain('release-signoffs/v0.1.0.json');
  });
});
