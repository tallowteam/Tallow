/**
 * Send Welcome Email API Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/v1/send-welcome/route';

// Mock dependencies
vi.mock('@/lib/api/auth', () => ({
  requireApiKey: vi.fn(() => null), // Allow requests by default
}));

vi.mock('@/lib/security/csrf', () => ({
  requireCSRFToken: vi.fn(() => null), // Allow requests by default
}));

vi.mock('@/lib/middleware/rate-limit', () => ({
  strictRateLimiter: {
    check: vi.fn(() => null), // Allow requests by default
  },
}));

vi.mock('resend', () => ({
  Resend: vi.fn(() => ({
    emails: {
      send: vi.fn(async () => ({ id: 'email-123' })),
    },
  })),
}));

describe('Send Welcome Email API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env['RESEND_API_KEY'] = 'test-api-key';
  });

  it('should send welcome email successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/send-welcome', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        name: 'Test User',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should reject request with missing email', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/send-welcome', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test User',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('email');
  });

  it('should reject request with invalid email format', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/send-welcome', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid-email',
        name: 'Test User',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid email');
  });

  it('should reject request with missing name', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/send-welcome', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('name');
  });

  it('should reject request when Resend is not configured', async () => {
    delete process.env['RESEND_API_KEY'];

    const request = new NextRequest('http://localhost:3000/api/v1/send-welcome', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        name: 'Test User',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Email service not configured');
  });

  it('should respect CSRF protection', async () => {
    const { requireCSRFToken } = await import('@/lib/security/csrf');
    vi.mocked(requireCSRFToken).mockReturnValueOnce({
      status: 403,
      json: async () => ({ error: 'CSRF token missing' }),
    } as any);

    const request = new NextRequest('http://localhost:3000/api/v1/send-welcome', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        name: 'Test User',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(403);
  });

  it('should respect rate limiting', async () => {
    const { strictRateLimiter } = await import('@/lib/middleware/rate-limit');
    vi.mocked(strictRateLimiter.check).mockReturnValueOnce({
      status: 429,
      json: async () => ({ error: 'Too many requests' }),
    } as any);

    const request = new NextRequest('http://localhost:3000/api/v1/send-welcome', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        name: 'Test User',
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

    const request = new NextRequest('http://localhost:3000/api/v1/send-welcome', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        name: 'Test User',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });
});
