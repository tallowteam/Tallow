/**
 * Screen Reader Announcement Utility
 * Manages ARIA live regions for screen reader announcements
 * WCAG 2.1: 4.1.3 Status Messages (Level A)
 */

type AnnouncementPriority = 'polite' | 'assertive';

interface AnnouncementOptions {
  priority?: AnnouncementPriority;
  clearPrevious?: boolean;
  debounceMs?: number;
}

interface AnnouncementRegion {
  element: HTMLElement;
  priority: AnnouncementPriority;
  debounceTimeout: NodeJS.Timeout | null;
}

class AnnouncementManager {
  private regions: Map<string, AnnouncementRegion> = new Map();
  private container: HTMLElement | null = null;

  /**
   * Initialize the announcement system
   */
  initialize(): void {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.id = 'a11y-announcements';
    this.container.style.position = 'absolute';
    this.container.style.left = '-10000px';
    this.container.style.width = '1px';
    this.container.style.height = '1px';
    this.container.style.overflow = 'hidden';
    document.body.appendChild(this.container);
  }

  /**
   * Get or create a live region
   */
  private getRegion(
    id: string,
    priority: AnnouncementPriority
  ): HTMLElement {
    let region = this.regions.get(id);

    if (!region) {
      this.initialize();

      const element = document.createElement('div');
      element.id = `a11y-announcement-${id}`;
      element.setAttribute('aria-live', priority);
      element.setAttribute('aria-atomic', 'true');
      element.role = 'status';

      this.container?.appendChild(element);

      region = {
        element,
        priority,
        debounceTimeout: null,
      };

      this.regions.set(id, region);
    }

    return region.element;
  }

  /**
   * Announce a message
   */
  announce(
    message: string,
    id: string = 'default',
    options: AnnouncementOptions = {}
  ): void {
    const {
      priority = 'polite',
      clearPrevious = true,
      debounceMs = 100,
    } = options;

    const region = this.getRegion(id, priority);

    // Clear previous debounce timeout
    const existingRegion = this.regions.get(id);
    if (existingRegion?.debounceTimeout) {
      clearTimeout(existingRegion.debounceTimeout);
    }

    // Debounce announcements to avoid overwhelming screen readers
    const timeout = setTimeout(() => {
      if (clearPrevious) {
        region.textContent = '';
      }

      // Force a reflow to ensure screen readers detect the change
      void region.offsetHeight;

      region.textContent = message;

      if (existingRegion) {
        existingRegion.debounceTimeout = null;
      }
    }, debounceMs);

    if (existingRegion) {
      existingRegion.debounceTimeout = timeout;
    }
  }

  /**
   * Announce with polite priority
   */
  announcePolite(message: string, id?: string): void {
    this.announce(message, id, { priority: 'polite' });
  }

  /**
   * Announce with assertive priority (interrupts)
   */
  announceAssertive(message: string, id?: string): void {
    this.announce(message, id, { priority: 'assertive' });
  }

  /**
   * Clear a specific announcement region
   */
  clear(id: string = 'default'): void {
    const region = this.regions.get(id);
    if (region) {
      if (region.debounceTimeout) {
        clearTimeout(region.debounceTimeout);
        region.debounceTimeout = null;
      }
      region.element.textContent = '';
    }
  }

  /**
   * Clear all announcement regions
   */
  clearAll(): void {
    this.regions.forEach((region) => {
      if (region.debounceTimeout) {
        clearTimeout(region.debounceTimeout);
      }
      region.element.textContent = '';
    });
  }

  /**
   * Destroy the announcement system
   */
  destroy(): void {
    this.clearAll();
    this.container?.remove();
    this.container = null;
    this.regions.clear();
  }
}

// Singleton instance
let manager: AnnouncementManager | null = null;

function getManager(): AnnouncementManager {
  if (!manager) {
    manager = new AnnouncementManager();
  }
  return manager;
}

/**
 * Announce a message to screen readers
 */
export function announce(
  message: string,
  id?: string,
  options?: AnnouncementOptions
): void {
  getManager().announce(message, id, options);
}

/**
 * Announce with polite priority
 */
export function announcePolite(message: string, id?: string): void {
  getManager().announcePolite(message, id);
}

/**
 * Announce with assertive priority
 */
export function announceAssertive(message: string, id?: string): void {
  getManager().announceAssertive(message, id);
}

/**
 * Clear announcements
 */
export function clearAnnouncements(id?: string): void {
  if (id) {
    getManager().clear(id);
  } else {
    getManager().clearAll();
  }
}

/**
 * Hook for using announcements in React components
 */
import React from 'react';

export function useAnnounce(id?: string) {
  React.useEffect(() => {
    return () => {
      if (id) {
        clearAnnouncements(id);
      }
    };
  }, [id]);

  return {
    announce: (message: string, options?: AnnouncementOptions) =>
      announce(message, id, options),
    announcePolite: (message: string) => announcePolite(message, id),
    announceAssertive: (message: string) => announceAssertive(message, id),
    clear: () => clearAnnouncements(id),
  };
}
