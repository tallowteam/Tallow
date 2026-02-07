/**
 * Tests for Visual Code Generator
 */

import { describe, it, expect } from 'vitest';
import {
  generateVisualCodeData,
  generateVisualCodeSVG,
  generateVisualCodeDataURL,
  generateEnhancedVisualCode,
  generateEnhancedVisualCodeDataURL,
} from './qr-code-generator';

describe('Visual Code Generator', () => {
  const testData = 'ABC123';
  const testUrl = 'https://tallow.app/transfer?room=ABC123';

  describe('generateVisualCodeData', () => {
    it('should generate a grid of colors', () => {
      const grid = generateVisualCodeData(testData, 8, 'monochrome');
      expect(grid).toHaveLength(8);
      expect(grid[0]).toHaveLength(8);
    });

    it('should generate deterministic colors for same input', () => {
      const grid1 = generateVisualCodeData(testData, 8, 'accent');
      const grid2 = generateVisualCodeData(testData, 8, 'accent');
      expect(grid1).toEqual(grid2);
    });

    it('should generate different colors for different inputs', () => {
      const grid1 = generateVisualCodeData('ABC123', 8, 'accent');
      const grid2 = generateVisualCodeData('XYZ789', 8, 'accent');
      expect(grid1).not.toEqual(grid2);
    });
  });

  describe('generateVisualCodeSVG', () => {
    it('should generate valid SVG markup', () => {
      const svg = generateVisualCodeSVG(testData);
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    it('should include circles for grid cells', () => {
      const svg = generateVisualCodeSVG(testData, { gridSize: 4 });
      // Should have background rect + cells
      expect(svg).toContain('<circle');
    });

    it('should respect size option', () => {
      const svg = generateVisualCodeSVG(testData, { size: 512 });
      expect(svg).toContain('width="512"');
      expect(svg).toContain('height="512"');
    });
  });

  describe('generateVisualCodeDataURL', () => {
    it('should generate valid data URL', () => {
      const dataUrl = generateVisualCodeDataURL(testData);
      expect(dataUrl).toMatch(/^data:image\/svg\+xml;base64,/);
    });

    it('should be decodable', () => {
      const dataUrl = generateVisualCodeDataURL(testData);
      const base64 = dataUrl.replace('data:image/svg+xml;base64,', '');
      const decoded = atob(base64);
      expect(decoded).toContain('<svg');
    });
  });

  describe('generateEnhancedVisualCode', () => {
    it('should generate SVG with corner markers', () => {
      const svg = generateEnhancedVisualCode(testUrl);
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      // Should have corner markers (positioning squares)
      expect(svg).toContain('<rect');
    });

    it('should include data grid', () => {
      const svg = generateEnhancedVisualCode(testUrl, { gridSize: 12 });
      expect(svg).toContain('<circle');
    });

    it('should have background', () => {
      const svg = generateEnhancedVisualCode(testUrl);
      expect(svg).toContain('fill="#ffffff"');
    });
  });

  describe('generateEnhancedVisualCodeDataURL', () => {
    it('should generate valid data URL for enhanced code', () => {
      const dataUrl = generateEnhancedVisualCodeDataURL(testUrl);
      expect(dataUrl).toMatch(/^data:image\/svg\+xml;base64,/);
    });

    it('should generate same output for same URL', () => {
      const url1 = generateEnhancedVisualCodeDataURL(testUrl);
      const url2 = generateEnhancedVisualCodeDataURL(testUrl);
      expect(url1).toBe(url2);
    });

    it('should generate different output for different URLs', () => {
      const url1 = generateEnhancedVisualCodeDataURL('https://tallow.app/transfer?room=ABC123');
      const url2 = generateEnhancedVisualCodeDataURL('https://tallow.app/transfer?room=XYZ789');
      expect(url1).not.toBe(url2);
    });
  });
});
