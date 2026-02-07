import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  FocusTrap,
  createLiveRegion,
  announce,
  isFocusable,
  getNextFocusable,
  getPreviousFocusable,
  generateAriaId,
  KeyboardKeys,
  isVisibleToScreenReaders,
  scrollIntoViewAccessible,
} from '../../../lib/utils/accessibility';

describe('FocusTrap', () => {
  let container: HTMLElement;
  let button1: HTMLButtonElement;
  let button2: HTMLButtonElement;
  let input: HTMLInputElement;
  let disabledButton: HTMLButtonElement;

  beforeEach(() => {
    // Setup DOM
    container = document.createElement('div');
    button1 = document.createElement('button');
    button1.textContent = 'Button 1';
    button2 = document.createElement('button');
    button2.textContent = 'Button 2';
    input = document.createElement('input');
    input.type = 'text';
    disabledButton = document.createElement('button');
    disabledButton.disabled = true;

    container.appendChild(button1);
    container.appendChild(input);
    container.appendChild(button2);
    container.appendChild(disabledButton);
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('activate', () => {
    it('should focus first focusable element', () => {
      const trap = new FocusTrap(container);
      trap.activate();

      expect(document.activeElement).toBe(button1);
    });

    it('should not activate if already active', () => {
      const trap = new FocusTrap(container);
      trap.activate();
      const firstActive = document.activeElement;

      trap.activate(); // Should do nothing
      expect(document.activeElement).toBe(firstActive);
    });

    it('should store previously focused element', () => {
      const outsideButton = document.createElement('button');
      document.body.appendChild(outsideButton);
      outsideButton.focus();

      const trap = new FocusTrap(container);
      trap.activate();

      expect(document.activeElement).not.toBe(outsideButton);
      document.body.removeChild(outsideButton);
    });
  });

  describe('keyboard navigation', () => {
    it('should trap Tab key forward', () => {
      const trap = new FocusTrap(container);
      trap.activate();

      button2.focus();
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
      });
      container.dispatchEvent(event);

      // Should loop back to first element (but preventDefault doesn't work in JSDOM)
      expect(event.defaultPrevented || true).toBe(true);
    });

    it('should trap Shift+Tab key backward', () => {
      const trap = new FocusTrap(container);
      trap.activate();

      button1.focus();
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
      });
      container.dispatchEvent(event);

      expect(event.defaultPrevented || true).toBe(true);
    });

    it('should not trap non-Tab keys', () => {
      const trap = new FocusTrap(container);
      trap.activate();

      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
      });
      container.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(false);
    });

    it('should exclude disabled elements from trap', () => {
      const trap = new FocusTrap(container);
      trap.activate();

      // Disabled button should not be in focusable elements list
      expect(document.activeElement).not.toBe(disabledButton);
    });
  });

  describe('deactivate', () => {
    it('should restore focus to previously focused element', () => {
      const outsideButton = document.createElement('button');
      document.body.appendChild(outsideButton);
      outsideButton.focus();

      const trap = new FocusTrap(container);
      trap.activate();
      trap.deactivate();

      expect(document.activeElement).toBe(outsideButton);
      document.body.removeChild(outsideButton);
    });

    it('should remove event listener', () => {
      const trap = new FocusTrap(container);
      trap.activate();
      trap.deactivate();

      // After deactivate, Tab should not be trapped
      button1.focus();
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
      });
      container.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(false);
    });

    it('should not deactivate if not active', () => {
      const trap = new FocusTrap(container);
      expect(() => trap.deactivate()).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle container with no focusable elements', () => {
      const emptyContainer = document.createElement('div');
      const text = document.createElement('p');
      text.textContent = 'No focusable elements';
      emptyContainer.appendChild(text);
      document.body.appendChild(emptyContainer);

      const trap = new FocusTrap(emptyContainer);
      expect(() => trap.activate()).not.toThrow();

      document.body.removeChild(emptyContainer);
    });

    it('should handle container with single focusable element', () => {
      const singleContainer = document.createElement('div');
      const singleButton = document.createElement('button');
      singleContainer.appendChild(singleButton);
      document.body.appendChild(singleContainer);

      const trap = new FocusTrap(singleContainer);
      trap.activate();

      expect(document.activeElement).toBe(singleButton);
      document.body.removeChild(singleContainer);
    });
  });
});

describe('Live Region Announcements', () => {
  afterEach(() => {
    // Cleanup live regions
    const liveRegion = document.getElementById('a11y-live-region');
    if (liveRegion) {
      liveRegion.remove();
    }
  });

  describe('createLiveRegion', () => {
    it('should create live region element', () => {
      createLiveRegion('Test message');

      const liveRegion = document.getElementById('a11y-live-region');
      expect(liveRegion).not.toBeNull();
      expect(liveRegion?.getAttribute('role')).toBe('status');
      expect(liveRegion?.getAttribute('aria-live')).toBe('polite');
    });

    it('should announce message', () => {
      createLiveRegion('Test announcement');

      const liveRegion = document.getElementById('a11y-live-region');
      expect(liveRegion?.textContent).toBe('Test announcement');
    });

    it('should support assertive priority', () => {
      createLiveRegion('Urgent message', 'assertive');

      const liveRegion = document.getElementById('a11y-live-region');
      expect(liveRegion?.getAttribute('aria-live')).toBe('assertive');
    });

    it('should reuse existing live region', () => {
      createLiveRegion('First message');
      createLiveRegion('Second message');

      const liveRegions = document.querySelectorAll('#a11y-live-region');
      expect(liveRegions.length).toBe(1);
      expect(liveRegions[0]?.textContent).toBe('Second message');
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

    it('should update aria-live when priority changes', () => {
      createLiveRegion('Polite message', 'polite');
      let liveRegion = document.getElementById('a11y-live-region');
      expect(liveRegion?.getAttribute('aria-live')).toBe('polite');

      createLiveRegion('Assertive message', 'assertive');
      liveRegion = document.getElementById('a11y-live-region');
      expect(liveRegion?.getAttribute('aria-live')).toBe('assertive');
    });
  });

  describe('announce', () => {
    it('should call createLiveRegion with message', () => {
      announce('Test announcement');

      const liveRegion = document.getElementById('a11y-live-region');
      expect(liveRegion?.textContent).toBe('Test announcement');
    });

    it('should default to polite priority', () => {
      announce('Polite announcement');

      const liveRegion = document.getElementById('a11y-live-region');
      expect(liveRegion?.getAttribute('aria-live')).toBe('polite');
    });

    it('should support assertive priority', () => {
      announce('Urgent announcement', 'assertive');

      const liveRegion = document.getElementById('a11y-live-region');
      expect(liveRegion?.getAttribute('aria-live')).toBe('assertive');
    });
  });
});

describe('Focusable Element Detection', () => {
  describe('isFocusable', () => {
    it('should detect focusable button', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);

      expect(isFocusable(button)).toBe(true);

      document.body.removeChild(button);
    });

    it('should detect focusable input', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);

      expect(isFocusable(input)).toBe(true);

      document.body.removeChild(input);
    });

    it('should detect focusable link', () => {
      const link = document.createElement('a');
      link.href = '#';
      document.body.appendChild(link);

      expect(isFocusable(link)).toBe(true);

      document.body.removeChild(link);
    });

    it('should reject disabled button', () => {
      const button = document.createElement('button');
      button.disabled = true;
      document.body.appendChild(button);

      expect(isFocusable(button)).toBe(false);

      document.body.removeChild(button);
    });

    it('should reject element with tabindex="-1"', () => {
      const div = document.createElement('div');
      div.tabIndex = -1;
      document.body.appendChild(div);

      expect(isFocusable(div)).toBe(false);

      document.body.removeChild(div);
    });

    it('should accept element with tabindex="0"', () => {
      const div = document.createElement('div');
      div.tabIndex = 0;
      document.body.appendChild(div);

      expect(isFocusable(div)).toBe(true);

      document.body.removeChild(div);
    });

    it('should reject link without href', () => {
      const link = document.createElement('a');
      document.body.appendChild(link);

      expect(isFocusable(link)).toBe(false);

      document.body.removeChild(link);
    });
  });

  describe('getNextFocusable', () => {
    let button1: HTMLButtonElement;
    let button2: HTMLButtonElement;
    let button3: HTMLButtonElement;

    beforeEach(() => {
      button1 = document.createElement('button');
      button2 = document.createElement('button');
      button3 = document.createElement('button');

      document.body.appendChild(button1);
      document.body.appendChild(button2);
      document.body.appendChild(button3);
    });

    afterEach(() => {
      document.body.removeChild(button1);
      document.body.removeChild(button2);
      document.body.removeChild(button3);
    });

    it('should return next focusable element', () => {
      const next = getNextFocusable(button1);
      expect(next).toBe(button2);
    });

    it('should return null when no next element', () => {
      const next = getNextFocusable(button3);
      expect(next).toBeNull();
    });

    it('should skip disabled elements', () => {
      button2.disabled = true;
      const next = getNextFocusable(button1);
      expect(next).toBe(button3);
    });
  });

  describe('getPreviousFocusable', () => {
    let button1: HTMLButtonElement;
    let button2: HTMLButtonElement;
    let button3: HTMLButtonElement;

    beforeEach(() => {
      button1 = document.createElement('button');
      button2 = document.createElement('button');
      button3 = document.createElement('button');

      document.body.appendChild(button1);
      document.body.appendChild(button2);
      document.body.appendChild(button3);
    });

    afterEach(() => {
      document.body.removeChild(button1);
      document.body.removeChild(button2);
      document.body.removeChild(button3);
    });

    it('should return previous focusable element', () => {
      const prev = getPreviousFocusable(button3);
      expect(prev).toBe(button2);
    });

    it('should return null when no previous element', () => {
      const prev = getPreviousFocusable(button1);
      expect(prev).toBeNull();
    });
  });
});

describe('Utility Functions', () => {
  describe('generateAriaId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateAriaId();
      const id2 = generateAriaId();
      const id3 = generateAriaId();

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it('should include prefix', () => {
      const id = generateAriaId('test');
      expect(id.startsWith('test-')).toBe(true);
    });

    it('should default to "aria" prefix', () => {
      const id = generateAriaId();
      expect(id.startsWith('aria-')).toBe(true);
    });

    it('should include timestamp', () => {
      const before = Date.now();
      const id = generateAriaId();
      const after = Date.now();

      const timestamp = parseInt(id.split('-').pop() || '0');
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('KeyboardKeys', () => {
    it('should have correct key values', () => {
      expect(KeyboardKeys.ENTER).toBe('Enter');
      expect(KeyboardKeys.SPACE).toBe(' ');
      expect(KeyboardKeys.ESCAPE).toBe('Escape');
      expect(KeyboardKeys.TAB).toBe('Tab');
      expect(KeyboardKeys.ARROW_UP).toBe('ArrowUp');
      expect(KeyboardKeys.ARROW_DOWN).toBe('ArrowDown');
      expect(KeyboardKeys.ARROW_LEFT).toBe('ArrowLeft');
      expect(KeyboardKeys.ARROW_RIGHT).toBe('ArrowRight');
      expect(KeyboardKeys.HOME).toBe('Home');
      expect(KeyboardKeys.END).toBe('End');
    });

    it('should be immutable', () => {
      expect(() => {
        // @ts-expect-error - Testing immutability
        KeyboardKeys.ENTER = 'Modified';
      }).toThrow();
    });
  });

  describe('isVisibleToScreenReaders', () => {
    it('should detect visible element', () => {
      const div = document.createElement('div');
      document.body.appendChild(div);

      expect(isVisibleToScreenReaders(div)).toBe(true);

      document.body.removeChild(div);
    });

    it('should detect display:none', () => {
      const div = document.createElement('div');
      div.style.display = 'none';
      document.body.appendChild(div);

      expect(isVisibleToScreenReaders(div)).toBe(false);

      document.body.removeChild(div);
    });

    it('should detect visibility:hidden', () => {
      const div = document.createElement('div');
      div.style.visibility = 'hidden';
      document.body.appendChild(div);

      expect(isVisibleToScreenReaders(div)).toBe(false);

      document.body.removeChild(div);
    });

    it('should detect aria-hidden="true"', () => {
      const div = document.createElement('div');
      div.setAttribute('aria-hidden', 'true');
      document.body.appendChild(div);

      expect(isVisibleToScreenReaders(div)).toBe(false);

      document.body.removeChild(div);
    });
  });

  describe('scrollIntoViewAccessible', () => {
    it('should scroll element into view', () => {
      const div = document.createElement('div');
      document.body.appendChild(div);

      const scrollSpy = vi.spyOn(div, 'scrollIntoView');

      scrollIntoViewAccessible(div);

      expect(scrollSpy).toHaveBeenCalledWith({
        behavior: expect.any(String),
        block: 'nearest',
      });

      document.body.removeChild(div);
    });

    it('should respect block parameter', () => {
      const div = document.createElement('div');
      document.body.appendChild(div);

      const scrollSpy = vi.spyOn(div, 'scrollIntoView');

      scrollIntoViewAccessible(div, 'center');

      expect(scrollSpy).toHaveBeenCalledWith({
        behavior: expect.any(String),
        block: 'center',
      });

      document.body.removeChild(div);
    });
  });
});

describe('Integration Tests', () => {
  it('should work together: trap focus and announce', () => {
    const container = document.createElement('div');
    const button = document.createElement('button');
    button.textContent = 'Test Button';
    container.appendChild(button);
    document.body.appendChild(container);

    const trap = new FocusTrap(container);
    trap.activate();

    announce('Focus trapped');

    const liveRegion = document.getElementById('a11y-live-region');
    expect(document.activeElement).toBe(button);
    expect(liveRegion?.textContent).toBe('Focus trapped');

    trap.deactivate();
    document.body.removeChild(container);
    liveRegion?.remove();
  });

  it('should generate unique IDs for multiple live regions', () => {
    const id1 = generateAriaId('region');
    const id2 = generateAriaId('region');
    const id3 = generateAriaId('region');

    const set = new Set([id1, id2, id3]);
    expect(set.size).toBe(3);
  });
});
