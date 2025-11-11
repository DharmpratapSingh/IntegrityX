/**
 * Data Sanitization Tests
 * Tests for data sanitization utilities
 */

import { sanitizeInput, sanitizeFilename, validateEmail } from '@/utils/dataSanitization';

describe('Data Sanitization', () => {
  describe('sanitizeInput', () => {
    it('should remove script tags', () => {
      const malicious = '<script>alert("xss")</script>Hello';
      const result = sanitizeInput(malicious);
      expect(result).not.toContain('<script>');
      expect(result).toContain('Hello');
    });

    it('should remove event handlers', () => {
      const malicious = '<div onclick="alert()">Click me</div>';
      const result = sanitizeInput(malicious);
      expect(result).not.toContain('onclick');
    });

    it('should handle empty string', () => {
      expect(sanitizeInput('')).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
    });
  });

  describe('sanitizeFilename', () => {
    it('should remove dangerous characters', () => {
      const dangerous = '../../../etc/passwd';
      const result = sanitizeFilename(dangerous);
      expect(result).not.toContain('..');
      expect(result).not.toContain('/');
    });

    it('should preserve safe filenames', () => {
      const safe = 'document_2024-01-15.pdf';
      const result = sanitizeFilename(safe);
      expect(result).toBe(safe);
    });

    it('should handle special characters', () => {
      const special = 'file@#$%^&*().pdf';
      const result = sanitizeFilename(special);
      expect(result).toMatch(/^[a-zA-Z0-9._-]+$/);
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.user+tag@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(validateEmail('not-an-email')).toBe(false);
      expect(validateEmail('missing@domain')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail(null)).toBe(false);
      expect(validateEmail(undefined)).toBe(false);
    });
  });
});
















