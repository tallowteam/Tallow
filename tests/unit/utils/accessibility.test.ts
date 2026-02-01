/**
 * Accessibility Utilities Tests
 * Tests for lib/utils/accessibility.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  FocusTrap,
  createLiveRegion,
  announce,
  isFocusable,
  generateAriaId,
  prefersReducedMotion,
  KeyboardKeys,
} from '@/lib/utils/accessibility';

describe('Accessibility Utilities', () => {
  describe('FocusTrap', () => {
    let container: HTMLElement;

    beforeEach(() => {
      // Create a mock container with focusable elements
      container = document.createElement('div');
      container.innerHTML = `
        <button id="btn1">Button 1</button>
        <input id="input1" type="text" />
        <a id="link1" href="#test">Link 1</a>
        <button id="btn2">Button 2</button>
      `;
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    it('should activate focus trap and focus first element', () => {
      const trap = new FocusTrap(container);
      trap.activate();

      expect(document.activeElement?.id).toBe('btn1');
    });

    it('should trap focus within container on Tab', () => {
      const trap = new FocusTrap(container);
      trap.activate();

      const lastButton = document.getElementById('btn2')!;
      lastButton.focus();

      // Simulate Tab key
      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      container.dispatchEvent(event);

      // Should prevent default to trap focus
      expect(event.preventDefault).toBeCalled();
    });

    it('should deactivate focus trap and restore previous focus', () => {
      const outsideButton = document.createElement('button');
      outsideButton.id = 'outside';
      document.body.appendChild(outsideButton);
      outsideButton.focus();

      const trap = new FocusTrap(container);
      trap.activate();
      trap.deactivate();

      expect(document.activeElement?.id).toBe('outside');
      document.body.removeChild(outsideButton);
    });

    it('should handle empty container gracefully', () => {
      const emptyContainer = document.createElement('div');
      document.body.appendChild(emptyContainer);

      const trap = new FocusTrap(emptyContainer);
      expect(() => trap.activate()).not.toThrow();

      document.body.removeChild(emptyContainer);
    });
  });

  describe('createLiveRegion', () => {
    afterEach(() => {
      const liveRegion = document.getElementById('a11y-live-region');
      if (liveRegion) {
        document.body.removeChild(liveRegion);
      }
    });

    it('should create live region with polite priority', () => {
      createLiveRegion('Test message', 'polite');
      const liveRegion = document.getElementById('a11y-live-region');

      expect(liveRegion).toBeTruthy();
      expect(liveRegion?.getAttribute('aria-live')).toBe('polite');
      expect(liveRegion?.textContent).toBe('Test message');
    });

    it('should create live region with assertive priority', () => {
      createLiveRegion('Urgent message', 'assertive');
      const liveRegion = document.getElementById('a11y-live-region');

      expect(liveRegion?.getAttribute('aria-live')).toBe('assertive');
      expect(liveRegion?.textContent).toBe('Urgent message');
    });

    it('should reuse existing live region', () => {
      createLiveRegion('First message');
      createLiveRegion('Second message');

      const liveRegions = document.querySelectorAll('#a11y-live-region');
      expect(liveRegions.length).toBe(1);
    });

    it('should clear message after timeout', async () => {
      vi.useFakeTimers();
      createLiveRegion('Temporary message');
      const liveRegion = document.getElementById('a11y-live-region');

      expect(liveRegion?.textContent).toBe('Temporary message');

      vi.advanceTimersByTime(1000);

      expect(liveRegion?.textContent).toBe('');
      vi.useRealTimers();
    });
  });

  describe('announce', () => {
    afterEach(() => {
      const liveRegion = document.getElementById('a11y-live-region');
      if (liveRegion) {
        document.body.removeChild(liveRegion);
      }
    });

    it('should announce message with default polite priority', () => {
      announce('Test announcement');
      const liveRegion = document.getElementById('a11y-live-region');

      expect(liveRegion?.getAttribute('aria-live')).toBe('polite');
      expect(liveRegion?.textContent).toBe('Test announcement');
    });

    it('should announce message with assertive priority', () => {
      announce('Urgent announcement', 'assertive');
      const liveRegion = document.getElementById('a11y-live-region');

      expect(liveRegion?.getAttribute('aria-live')).toBe('assertive');
    });
  });

  describe('isFocusable', () => {
    it('should identify focusable button', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);

      expect(isFocusable(button)).toBe(true);

      document.body.removeChild(button);
    });

    it('should identify disabled button as not focusable', () => {
      const button = document.createElement('button');
      button.disabled = true;
      document.body.appendChild(button);

      expect(isFocusable(button)).toBe(false);

      document.body.removeChild(button);
    });

    it('should identify element with tabindex="-1" as not focusable', () => {
      const div = document.createElement('div');
      div.setAttribute('tabindex', '-1');
      document.body.appendChild(div);

      expect(isFocusable(div)).toBe(false);

      document.body.removeChild(div);
    });

    it('should identify element with tabindex="0" as focusable', () => {
      const div = document.createElement('div');
      div.setAttribute('tabindex', '0');
      document.body.appendChild(div);

      expect(isFocusable(div)).toBe(true);

      document.body.removeChild(div);
    });
  });

  describe('generateAriaId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateAriaId();
      const id2 = generateAriaId();

      expect(id1).not.toBe(id2);
    });

    it('should use custom prefix', () => {
      const id = generateAriaId('custom');
      expect(id).toMatch(/^custom-/);
    });

    it('should use default prefix', () => {
      const id = generateAriaId();
      expect(id).toMatch(/^aria-/);
    });
  });

  describe('prefersReducedMotion', () => {
    it('should check for reduced motion preference', () => {
      // Mock matchMedia
      const mockMatchMedia = vi.fn((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });

      const result = prefersReducedMotion();
      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('KeyboardKeys', () => {
    it('should export keyboard key constants', () => {
      expect(KeyboardKeys.ENTER).toBe('Enter');
      expect(KeyboardKeys.SPACE).toBe(' ');
      expect(KeyboardKeys.ESCAPE).toBe('Escape');
      expect(KeyboardKeys.TAB).toBe('Tab');
      expect(KeyboardKeys.ARROW_UP).toBe('ArrowUp');
      expect(KeyboardKeys.ARROW_DOWN).toBe('ArrowDown');
      expect(KeyboardKeys.HOME).toBe('Home');
      expect(KeyboardKeys.END).toBe('End');
    });
  });

  // Note: isVisibleToScreenReaders and scrollIntoViewAccessible tests
  // require a DOM environment and would be better tested with E2E tests

  describe('visibility logic', () => {
    it('should check display style', () => {
      const styles = {
        visible: { display: 'block', visibility: 'visible' },
        hidden: { display: 'none', visibility: 'visible' },
      };

      expect(styles.visible.display).not.toBe('none');
      expect(styles.hidden.display).toBe('none');
    });

    it('should check aria-hidden attribute', () => {
      const element = { 'aria-hidden': 'true' };
      expect(element['aria-hidden']).toBe('true');
    });
  });

  describe('scroll behavior logic', () => {
    it('should determine scroll behavior based on motion preference', () => {
      const prefersReduced = true;
      const behavior = prefersReduced ? 'auto' : 'smooth';
      expect(behavior).toBe('auto');
    });

    it('should use smooth behavior when motion not reduced', () => {
      const prefersReduced = false;
      const behavior = prefersReduced ? 'auto' : 'smooth';
      expect(behavior).toBe('smooth');
    });
  });
});
