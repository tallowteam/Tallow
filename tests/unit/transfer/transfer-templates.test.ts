import { beforeEach, describe, expect, it, vi } from 'vitest';

const templateMocks = vi.hoisted(() => ({
  nextId: 1,
}));

vi.mock('@/lib/utils/uuid', () => ({
  generateUUID: () => `template-${templateMocks.nextId++}`,
}));

vi.mock('@/lib/utils/secure-logger', () => ({
  default: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

async function loadTemplatesModule() {
  vi.resetModules();
  return import('@/lib/transfer/transfer-templates');
}

describe('transfer-templates', () => {
  beforeEach(() => {
    localStorage.clear();
    templateMocks.nextId = 1;
  });

  it('creates templates and persists them to localStorage', async () => {
    const templates = await loadTemplatesModule();

    const id = templates.createTemplate(
      'Nightly Secure',
      { encryption: 'pqc', compression: true },
      'Scheduled secure transfer preset'
    );

    expect(id).toBe('template-1');
    expect(templates.getTemplate(id as string)?.name).toBe('Nightly Secure');

    const stored = localStorage.getItem('tallow-transfer-templates');
    expect(stored).toContain('Nightly Secure');
  });

  it('applies templates and updates usage stats', async () => {
    const templates = await loadTemplatesModule();

    const id = templates.createTemplate('Quick LAN', {
      encryption: 'standard',
      compression: false,
    });

    expect(id).toBeTruthy();

    const result = templates.applyTemplate(id as string, [
      new File(['hello'], 'hello.txt', { type: 'text/plain' }),
    ]);

    expect(result).toEqual({
      encryption: 'standard',
      compression: false,
    });

    const appliedTemplate = templates.getTemplate(id as string);
    expect(appliedTemplate?.useCount).toBe(1);
    expect(appliedTemplate?.lastUsed).not.toBeNull();
  });

  it('duplicates templates with unique names', async () => {
    const templates = await loadTemplatesModule();

    const id = templates.createTemplate('Project Default', {
      encryption: 'pqc',
      compression: true,
      stripMetadata: true,
    });

    expect(id).toBe('template-1');

    const duplicateId = templates.duplicateTemplate(id as string);
    expect(duplicateId).toBe('template-2');
    expect(templates.getTemplate(duplicateId as string)?.name).toBe('Project Default (Copy)');

    const duplicateId2 = templates.duplicateTemplate(id as string);
    expect(duplicateId2).toBe('template-3');
    expect(templates.getTemplate(duplicateId2 as string)?.name).toBe('Project Default (Copy) 1');
  });

  it('restores persisted templates after module reload', async () => {
    let templates = await loadTemplatesModule();

    const createdId = templates.createTemplate('Persistent Template', {
      encryption: 'pqc',
      autoAccept: false,
    });
    expect(createdId).toBe('template-1');

    templates = await loadTemplatesModule();

    const restored = templates.getTemplateByName('Persistent Template');
    expect(restored).not.toBeNull();
    expect(restored?.name).toBe('Persistent Template');
  });
});
