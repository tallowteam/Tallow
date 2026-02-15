import { describe, expect, it } from 'vitest';
import { classifyTransferError } from '@/lib/transfer/error-diplomat';

describe('classifyTransferError', () => {
  it('normalizes crypto failures to secure reconnect guidance', () => {
    const result = classifyTransferError('crypto handshake failed: stack trace and internals');

    expect(result.kind).toBe('crypto');
    expect(result.retryable).toBe(false);
    expect(result.message).toBe('Connection not secure. Reconnect and verify the security code before retrying.');
    expect(result.message).not.toContain('stack trace');
  });

  it('marks network failures as retryable and offers retry language', () => {
    const result = classifyTransferError('Network timeout while connecting to peer');

    expect(result.kind).toBe('network');
    expect(result.retryable).toBe(true);
    expect(result.message).toBe('Network connection problem. Check your connection and retry.');
  });

  it('marks file failures as retryable with clear file guidance', () => {
    const result = classifyTransferError('file read permission denied');

    expect(result.kind).toBe('file');
    expect(result.retryable).toBe(true);
    expect(result.message).toBe('File processing error. Check file access, size, and format, then retry.');
  });

  it('falls back to first-line generic message for unknown errors', () => {
    const result = classifyTransferError('Unexpected failure happened\nat app/transfer/page.tsx:12:4');

    expect(result.kind).toBe('generic');
    expect(result.retryable).toBe(true);
    expect(result.message).toBe('Unexpected failure happened');
  });

  it('returns a default generic retry message when input is empty', () => {
    const result = classifyTransferError('   ');

    expect(result.kind).toBe('generic');
    expect(result.retryable).toBe(true);
    expect(result.message).toBe('Something went wrong during transfer. Please retry.');
  });
});
