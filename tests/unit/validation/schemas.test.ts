/**
 * Validation Schemas Tests
 * Tests for lib/validation/schemas.ts
 */

import { describe, it, expect } from 'vitest';
import {
  emailSchema,
  nameSchema,
  amountSchema,
  shareIdSchema,
  fileCountSchema,
  fileSizeSchema,
  welcomeEmailRequestSchema,
  shareEmailRequestSchema,
  stripeCheckoutRequestSchema,
  validateRequest,
  validateRequestBody,
} from '@/lib/validation/schemas';

describe('Validation Schemas', () => {
  describe('emailSchema', () => {
    it('should validate correct email', () => {
      expect(emailSchema.safeParse('test@example.com').success).toBe(true);
    });

    it('should reject invalid email format', () => {
      const result = emailSchema.safeParse('invalid-email');
      expect(result.success).toBe(false);
    });

    it('should reject email too short', () => {
      const result = emailSchema.safeParse('a@b');
      expect(result.success).toBe(false);
    });

    it('should reject email too long', () => {
      const longEmail = 'a'.repeat(250) + '@test.com';
      const result = emailSchema.safeParse(longEmail);
      expect(result.success).toBe(false);
    });
  });

  describe('nameSchema', () => {
    it('should validate correct name', () => {
      expect(nameSchema.safeParse('John Doe').success).toBe(true);
    });

    it('should reject empty name', () => {
      const result = nameSchema.safeParse('');
      expect(result.success).toBe(false);
    });

    it('should trim whitespace', () => {
      const result = nameSchema.safeParse('  John Doe  ');
      if (result.success) {
        expect(result.data).toBe('John Doe');
      }
    });

    it('should reject name too long', () => {
      const longName = 'a'.repeat(101);
      const result = nameSchema.safeParse(longName);
      expect(result.success).toBe(false);
    });
  });

  describe('amountSchema', () => {
    it('should validate correct amount', () => {
      expect(amountSchema.safeParse(100).success).toBe(true);
      expect(amountSchema.safeParse(1000).success).toBe(true);
    });

    it('should reject amount below minimum', () => {
      const result = amountSchema.safeParse(99);
      expect(result.success).toBe(false);
    });

    it('should reject amount above maximum', () => {
      const result = amountSchema.safeParse(100000000);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer amount', () => {
      const result = amountSchema.safeParse(10.5);
      expect(result.success).toBe(false);
    });
  });

  describe('shareIdSchema', () => {
    it('should validate correct share ID', () => {
      expect(shareIdSchema.safeParse('abc123_-xyz').success).toBe(true);
    });

    it('should reject share ID too short', () => {
      const result = shareIdSchema.safeParse('abc');
      expect(result.success).toBe(false);
    });

    it('should reject share ID too long', () => {
      const longId = 'a'.repeat(65);
      const result = shareIdSchema.safeParse(longId);
      expect(result.success).toBe(false);
    });

    it('should reject invalid characters', () => {
      const result = shareIdSchema.safeParse('abc@123');
      expect(result.success).toBe(false);
    });
  });

  describe('fileCountSchema', () => {
    it('should validate correct file count', () => {
      expect(fileCountSchema.safeParse(1).success).toBe(true);
      expect(fileCountSchema.safeParse(100).success).toBe(true);
    });

    it('should reject zero files', () => {
      const result = fileCountSchema.safeParse(0);
      expect(result.success).toBe(false);
    });

    it('should reject too many files', () => {
      const result = fileCountSchema.safeParse(1001);
      expect(result.success).toBe(false);
    });
  });

  describe('fileSizeSchema', () => {
    it('should validate correct file size', () => {
      expect(fileSizeSchema.safeParse(1024).success).toBe(true);
      expect(fileSizeSchema.safeParse(1024 * 1024).success).toBe(true);
    });

    it('should reject negative size', () => {
      const result = fileSizeSchema.safeParse(-1);
      expect(result.success).toBe(false);
    });

    it('should reject size too large (> 4GB)', () => {
      const result = fileSizeSchema.safeParse(5 * 1024 * 1024 * 1024);
      expect(result.success).toBe(false);
    });
  });

  describe('welcomeEmailRequestSchema', () => {
    it('should validate correct request', () => {
      const data = {
        email: 'test@example.com',
        name: 'Test User',
      };
      expect(welcomeEmailRequestSchema.safeParse(data).success).toBe(true);
    });

    it('should reject missing email', () => {
      const data = { name: 'Test User' };
      const result = welcomeEmailRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing name', () => {
      const data = { email: 'test@example.com' };
      const result = welcomeEmailRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('shareEmailRequestSchema', () => {
    it('should validate correct request', () => {
      const data = {
        email: 'test@example.com',
        shareId: 'abc123xyz',
        fileCount: 5,
        totalSize: 1024000,
      };
      expect(shareEmailRequestSchema.safeParse(data).success).toBe(true);
    });

    it('should allow optional senderName', () => {
      const data = {
        email: 'test@example.com',
        shareId: 'abc123xyz',
        senderName: 'John Doe',
        fileCount: 5,
        totalSize: 1024000,
      };
      expect(shareEmailRequestSchema.safeParse(data).success).toBe(true);
    });

    it('should reject invalid shareId', () => {
      const data = {
        email: 'test@example.com',
        shareId: 'abc',
        fileCount: 5,
        totalSize: 1024000,
      };
      const result = shareEmailRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('stripeCheckoutRequestSchema', () => {
    it('should validate correct request', () => {
      const data = { amount: 1000 };
      expect(stripeCheckoutRequestSchema.safeParse(data).success).toBe(true);
    });

    it('should reject invalid amount', () => {
      const data = { amount: 50 };
      const result = stripeCheckoutRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('validateRequest', () => {
    it('should return success for valid data', () => {
      const result = validateRequest(emailSchema, 'test@example.com');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test@example.com');
      }
    });

    it('should return errors for invalid data', () => {
      const result = validateRequest(emailSchema, 'invalid-email');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]?.message).toContain('email');
      }
    });

    it('should format multiple errors', () => {
      const result = validateRequest(welcomeEmailRequestSchema, {});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('validateRequestBody', () => {
    it('should validate valid JSON body', async () => {
      const mockRequest = new Request('http://localhost/api/test', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', name: 'Test' }),
      });

      const result = await validateRequestBody(
        mockRequest,
        welcomeEmailRequestSchema
      );

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        email: 'test@example.com',
        name: 'Test',
      });
    });

    it('should return error response for invalid data', async () => {
      const mockRequest = new Request('http://localhost/api/test', {
        method: 'POST',
        body: JSON.stringify({ email: 'invalid' }),
      });

      const result = await validateRequestBody(
        mockRequest,
        welcomeEmailRequestSchema
      );

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Response);

      if (result.error) {
        const errorData = await result.error.json();
        expect(errorData.error).toBe('Validation failed');
        expect(errorData.details).toBeDefined();
      }
    });

    it('should handle invalid JSON', async () => {
      const mockRequest = new Request('http://localhost/api/test', {
        method: 'POST',
        body: 'invalid json',
      });

      const result = await validateRequestBody(
        mockRequest,
        welcomeEmailRequestSchema
      );

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Response);

      if (result.error) {
        const errorData = await result.error.json();
        expect(errorData.error).toContain('Invalid JSON');
      }
    });
  });
});
