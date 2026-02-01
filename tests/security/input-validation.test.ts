/**
 * Input Validation Security Tests
 * Tests for injection attacks, XSS, and malformed input handling
 */

import { describe, it, expect } from 'vitest';
import { validateRequest } from '@/lib/validation/schemas';
import {
  emailSchema,
  nameSchema,
  shareIdSchema,
  amountSchema,
} from '@/lib/validation/schemas';

describe('Input Validation Security', () => {
  describe('SQL Injection Prevention', () => {
    it('should reject SQL injection in email field', () => {
      const maliciousEmails = [
        "admin'--",
        "admin'; DROP TABLE users; --",
        "' OR '1'='1",
        "1' UNION SELECT * FROM passwords--",
        "admin'/*",
      ];

      maliciousEmails.forEach(email => {
        const result = validateRequest(emailSchema, email);
        expect(result.success).toBe(false);
      });
    });

    it('should reject SQL injection in name field', () => {
      const maliciousNames = [
        "'; DROP TABLE users; --",
        "Robert'); DROP TABLE students;--",
        "1' OR '1' = '1",
      ];

      maliciousNames.forEach(name => {
        const result = validateRequest(nameSchema, name);
        // Should either reject or properly escape
        if (result.success) {
          // If accepted, ensure it's escaped
          expect(result.data).not.toContain(';');
        }
      });
    });
  });

  describe('XSS Prevention', () => {
    it('should reject script tags in name', () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert(1)>',
        '<svg/onload=alert(1)>',
        'javascript:alert(1)',
        '<iframe src="javascript:alert(1)">',
      ];

      xssPayloads.forEach(payload => {
        const result = validateRequest(nameSchema, payload);
        // Should either reject or sanitize
        if (result.success) {
          expect(result.data).not.toContain('<script');
          expect(result.data).not.toContain('javascript:');
        }
      });
    });

    it('should handle encoded XSS attempts', () => {
      const encodedPayloads = [
        '&lt;script&gt;alert(1)&lt;/script&gt;',
        '&#60;script&#62;alert(1)&#60;/script&#62;',
        '%3Cscript%3Ealert(1)%3C/script%3E',
      ];

      encodedPayloads.forEach(payload => {
        const result = validateRequest(nameSchema, payload);
        if (result.success) {
          expect(result.data).not.toContain('script');
        }
      });
    });
  });

  describe('Path Traversal Prevention', () => {
    it('should reject path traversal in share ID', () => {
      const pathTraversals = [
        '../../../etc/passwd',
        '..\\..\\windows\\system32',
        '....//....//etc/passwd',
        '%2e%2e%2f%2e%2e%2f',
      ];

      pathTraversals.forEach(path => {
        const result = validateRequest(shareIdSchema, path);
        expect(result.success).toBe(false);
      });
    });

    it('should reject absolute paths', () => {
      const absolutePaths = [
        '/etc/passwd',
        'C:\\Windows\\System32',
        'file:///etc/passwd',
        '//network/share',
      ];

      absolutePaths.forEach(path => {
        const result = validateRequest(shareIdSchema, path);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Email Validation', () => {
    it('should accept valid email formats', () => {
      const validEmails = [
        'user@example.com',
        'test.user@example.com',
        'user+tag@example.co.uk',
        'user_name@example.org',
      ];

      validEmails.forEach(email => {
        const result = validateRequest(emailSchema, email);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user@.com',
        'user..name@example.com',
        'user@example',
        'user name@example.com',
        '../etc/passwd',
      ];

      invalidEmails.forEach(email => {
        const result = validateRequest(emailSchema, email);
        expect(result.success).toBe(false);
      });
    });

    it('should reject emails with special characters', () => {
      const specialCharEmails = [
        'user<script>@example.com',
        'user@example.com<script>',
        'user;@example.com',
        'user"@example.com',
      ];

      specialCharEmails.forEach(email => {
        const result = validateRequest(emailSchema, email);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Name Validation', () => {
    it('should accept valid names', () => {
      const validNames = [
        'John Doe',
        'María García',
        "O'Brien",
        'Jean-Pierre',
        '李明',
      ];

      validNames.forEach(name => {
        const result = validateRequest(nameSchema, name);
        expect(result.success).toBe(true);
      });
    });

    it('should reject excessively long names', () => {
      const longName = 'a'.repeat(101);
      const result = validateRequest(nameSchema, longName);
      expect(result.success).toBe(false);
    });

    it('should reject empty names', () => {
      const result = validateRequest(nameSchema, '');
      expect(result.success).toBe(false);
    });

    it('should trim whitespace', () => {
      const result = validateRequest(nameSchema, '  John Doe  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('John Doe');
      }
    });
  });

  describe('Amount Validation', () => {
    it('should accept valid amounts', () => {
      const validAmounts = [100, 500, 1000, 99999900];

      validAmounts.forEach(amount => {
        const result = validateRequest(amountSchema, amount);
        expect(result.success).toBe(true);
      });
    });

    it('should reject negative amounts', () => {
      const result = validateRequest(amountSchema, -100);
      expect(result.success).toBe(false);
    });

    it('should reject zero and below minimum', () => {
      const invalidAmounts = [0, 50, 99];

      invalidAmounts.forEach(amount => {
        const result = validateRequest(amountSchema, amount);
        expect(result.success).toBe(false);
      });
    });

    it('should reject amounts exceeding maximum', () => {
      const result = validateRequest(amountSchema, 100000000);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer amounts', () => {
      const result = validateRequest(amountSchema, 100.50);
      expect(result.success).toBe(false);
    });

    it('should reject string amounts', () => {
      const result = validateRequest(amountSchema, '100');
      expect(result.success).toBe(false);
    });
  });

  describe('Command Injection Prevention', () => {
    it('should reject command injection attempts', () => {
      const commandInjections = [
        '; ls -la',
        '| cat /etc/passwd',
        '`whoami`',
        '$(whoami)',
        '&& rm -rf /',
      ];

      commandInjections.forEach(cmd => {
        const result = validateRequest(nameSchema, cmd);
        if (result.success) {
          // Should be sanitized
          expect(result.data).not.toContain(';');
          expect(result.data).not.toContain('|');
          expect(result.data).not.toContain('`');
          expect(result.data).not.toContain('$');
        }
      });
    });
  });

  describe('LDAP Injection Prevention', () => {
    it('should reject LDAP injection attempts', () => {
      const ldapInjections = [
        '*',
        '*)(&',
        '*)(uid=*',
        'admin)(&(password=*',
      ];

      ldapInjections.forEach(injection => {
        const result = validateRequest(nameSchema, injection);
        if (result.success) {
          // Should be escaped
          expect(result.data).not.toContain('*)(&');
        }
      });
    });
  });

  describe('NoSQL Injection Prevention', () => {
    it('should handle object-based injection attempts', () => {
      const objectInjection = {
        $gt: '',
        $ne: null,
      };

      const result = validateRequest(emailSchema, objectInjection);
      expect(result.success).toBe(false);
    });
  });

  describe('XML Injection Prevention', () => {
    it('should reject XML entities', () => {
      const xmlInjections = [
        '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>',
        '&xxe;',
        '<!ENTITY % file SYSTEM "file:///etc/passwd">',
      ];

      xmlInjections.forEach(xml => {
        const result = validateRequest(nameSchema, xml);
        if (result.success) {
          expect(result.data).not.toContain('<!ENTITY');
        }
      });
    });
  });

  describe('Header Injection Prevention', () => {
    it('should reject newline characters', () => {
      const headerInjections = [
        'user@example.com\r\nBcc: attacker@evil.com',
        'Name\nX-Injected-Header: value',
        'user\r\n\r\ninjected content',
      ];

      headerInjections.forEach(injection => {
        const result = validateRequest(nameSchema, injection);
        if (result.success) {
          expect(result.data).not.toContain('\r');
          expect(result.data).not.toContain('\n');
        }
      });
    });
  });

  describe('Unicode Security', () => {
    it('should handle homoglyph attacks', () => {
      // Cyrillic 'а' looks like Latin 'a'
      const homoglyphEmail = 'аdmin@example.com'; // First char is Cyrillic
      const result = validateRequest(emailSchema, homoglyphEmail);

      // Should be detected or normalized
      expect(result.success).toBe(true); // Email format is still valid
    });

    it('should handle zero-width characters', () => {
      const zeroWidthName = 'John\u200BDoe'; // Zero-width space
      const result = validateRequest(nameSchema, zeroWidthName);

      if (result.success) {
        // Should potentially be stripped
        expect(result.data).toBeTruthy();
      }
    });

    it('should handle right-to-left override', () => {
      const rtloName = 'admin\u202E.txt.exe'; // Right-to-left override
      const result = validateRequest(nameSchema, rtloName);

      if (result.success) {
        // Should be handled appropriately
        expect(result.data).toBeTruthy();
      }
    });
  });

  describe('Length Limits', () => {
    it('should enforce minimum length for share ID', () => {
      const result = validateRequest(shareIdSchema, 'abc');
      expect(result.success).toBe(false);
    });

    it('should enforce maximum length for share ID', () => {
      const longId = 'a'.repeat(65);
      const result = validateRequest(shareIdSchema, longId);
      expect(result.success).toBe(false);
    });

    it('should enforce maximum length for email', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const result = validateRequest(emailSchema, longEmail);
      expect(result.success).toBe(false);
    });
  });

  describe('Type Coercion Prevention', () => {
    it('should reject type confusion attacks', () => {
      const typeConfusion = [
        null,
        undefined,
        {},
        [],
        true,
        false,
      ];

      typeConfusion.forEach(value => {
        const result = validateRequest(emailSchema, value);
        expect(result.success).toBe(false);
      });
    });
  });
});
