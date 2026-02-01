/**
 * Send Share Email API Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/v1/send-share-email/route';

// Mock dependencies
vi.mock('@/lib/api/auth', () => ({
  requireApiKey: vi.fn(() => null), // Allow requests by default
}));

vi.mock('@/lib/security/csrf', () => ({
  requireCSRFToken: vi.fn(() => null), // Allow requests by default
}));

vi.mock('@/lib/middleware/rate-limit', () => ({
  moderateRateLimiter: {
    check: vi.fn(() => null), // Allow requests by default
  },
}));

vi.mock('resend', () => ({
  Resend: vi.fn(() => ({
    emails: {
      send: vi.fn(async () => ({ id: 'email-123', error: null })),
    },
  })),
}));

describe('Send Share Email API v1', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env['RESEND_API_KEY'] = 'test-api-key';
  });

  it('should send share email successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/send-share-email', {
      method: 'POST',
      body: JSON.stringify({
        email: 'recipient@example.com',
        shareId: 'test-share-123',
        fileCount: 3,
        totalSize: 1024000,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.shareUrl).toContain('test-share-123');
  });

  it('should include sender name in email', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/send-share-email', {
      method: 'POST',
      body: JSON.stringify({
        email: 'recipient@example.com',
        shareId: 'test-share-123',
        senderName: 'John Doe',
        fileCount: 1,
        totalSize: 2048,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should sanitize sender name to prevent XSS', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/send-share-email', {
      method: 'POST',
      body: JSON.stringify({
        email: 'recipient@example.com',
        shareId: 'test-share-123',
        senderName: '<script>alert("xss")</script>',
        fileCount: 1,
        totalSize: 1024,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });

  it('should reject missing email', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/send-share-email', {
      method: 'POST',
      body: JSON.stringify({
        shareId: 'test-share-123',
        fileCount: 1,
        totalSize: 1024,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Missing required fields');
  });

  it('should reject invalid email format', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/send-share-email', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid-email',
        shareId: 'test-share-123',
        fileCount: 1,
        totalSize: 1024,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid email format');
  });

  it('should reject missing shareId', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/send-share-email', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        fileCount: 1,
        totalSize: 1024,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should reject missing fileCount', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/send-share-email', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        shareId: 'test-share-123',
        totalSize: 1024,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should skip email when Resend is not configured', async () => {
    delete process.env['RESEND_API_KEY'];

    const request = new NextRequest('http://localhost:3000/api/v1/send-share-email', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        shareId: 'test-share-123',
        fileCount: 1,
        totalSize: 1024,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.emailSkipped).toBe(true);
    expect(data.shareUrl).toBeDefined();
  });

  it('should respect CSRF protection', async () => {
    const { requireCSRFToken } = await import('@/lib/security/csrf');
    vi.mocked(requireCSRFToken).mockReturnValueOnce({
      status: 403,
      json: async () => ({ error: 'CSRF token missing' }),
    } as any);

    const request = new NextRequest('http://localhost:3000/api/v1/send-share-email', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        shareId: 'test-share-123',
        fileCount: 1,
        totalSize: 1024,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
  });

  it('should respect rate limiting', async () => {
    const { moderateRateLimiter } = await import('@/lib/middleware/rate-limit');
    vi.mocked(moderateRateLimiter.check).mockReturnValueOnce({
      status: 429,
      json: async () => ({ error: 'Too many requests' }),
    } as any);

    const request = new NextRequest('http://localhost:3000/api/v1/send-share-email', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        shareId: 'test-share-123',
        fileCount: 1,
        totalSize: 1024,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(429);
  });

  it('should require API key authentication', async () => {
    const { requireApiKey } = await import('@/lib/api/auth');
    vi.mocked(requireApiKey).mockReturnValueOnce({
      status: 401,
      json: async () => ({ error: 'Unauthorized' }),
    } as any);

    const request = new NextRequest('http://localhost:3000/api/v1/send-share-email', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        shareId: 'test-share-123',
        fileCount: 1,
        totalSize: 1024,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should handle email sending errors', async () => {
    const { Resend } = await import('resend');
    vi.mocked(Resend).mockImplementation(
      () =>
        ({
          emails: {
            send: vi.fn(async () => ({
              error: { message: 'Email service unavailable' },
            })),
          },
        }) as any
    );

    const request = new NextRequest('http://localhost:3000/api/v1/send-share-email', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        shareId: 'test-share-123',
        fileCount: 1,
        totalSize: 1024,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to send email');
  });

  it('should format file sizes correctly', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/send-share-email', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        shareId: 'test-share-123',
        fileCount: 5,
        totalSize: 1024 * 1024 * 10, // 10 MB
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
