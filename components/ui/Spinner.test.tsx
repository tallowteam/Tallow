/**
 * Spinner Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@/tests/utils/render';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  describe('Rendering', () => {
    it('should render spinner', () => {
      const { container } = render(<Spinner />);
      const spinner = container.querySelector('svg');
      expect(spinner).toBeInTheDocument();
    });

    it('should apply default size', () => {
      const { container } = render(<Spinner />);
      const spinner = container.querySelector('svg');
      expect(spinner).toHaveAttribute('width', '24');
      expect(spinner).toHaveAttribute('height', '24');
    });

    it('should apply small size', () => {
      const { container } = render(<Spinner size="sm" />);
      const spinner = container.querySelector('svg');
      expect(spinner).toHaveAttribute('width', '16');
      expect(spinner).toHaveAttribute('height', '16');
    });

    it('should apply large size', () => {
      const { container } = render(<Spinner size="lg" />);
      const spinner = container.querySelector('svg');
      expect(spinner).toHaveAttribute('width', '32');
      expect(spinner).toHaveAttribute('height', '32');
    });

    it('should apply custom className', () => {
      const { container } = render(<Spinner className="custom-spinner" />);
      const spinner = container.querySelector('svg');
      expect(spinner).toHaveClass('custom-spinner');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label by default', () => {
      const { container } = render(<Spinner />);
      const spinner = container.querySelector('svg');
      expect(spinner).toHaveAttribute('aria-label', 'Loading');
    });

    it('should support custom aria-label', () => {
      const { container } = render(<Spinner aria-label="Processing" />);
      const spinner = container.querySelector('svg');
      expect(spinner).toHaveAttribute('aria-label', 'Processing');
    });

    it('should have role status', () => {
      const { container } = render(<Spinner />);
      const spinner = container.querySelector('svg');
      expect(spinner).toHaveAttribute('role', 'status');
    });
  });

  describe('Animation', () => {
    it('should have animation class', () => {
      const { container } = render(<Spinner />);
      const spinner = container.querySelector('svg');
      expect(spinner).toHaveClass('animate-spin');
    });
  });
});
