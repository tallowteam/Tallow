/**
 * Plausible Analytics Integration
 *
 * Privacy-friendly analytics without cookies or PII collection.
 * Respects Do Not Track header and user preferences.
 *
 * @module analytics/plausible
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PlausibleEventProps {
  [key: string]: string | number | boolean;
}

export interface TransferStartedProps {
  method: 'local' | 'internet' | 'friends';
  fileCount: number;
}

export interface TransferCompletedProps {
  method: 'local' | 'internet' | 'friends';
  totalSize: number;
  duration: number;
}

export interface ThemeChangedProps {
  theme: 'dark' | 'light' | 'system';
}

export interface LanguageChangedProps {
  locale: string;
}

// ============================================================================
// PLAUSIBLE SCRIPT INJECTION
// ============================================================================

declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: { props?: PlausibleEventProps; callback?: () => void }
    ) => void;
  }
}

// ============================================================================
// PLAUSIBLE ANALYTICS CLASS (SINGLETON)
// ============================================================================

class PlausibleAnalytics {
  private static instance: PlausibleAnalytics;
  private domain: string | null = null;
  private apiHost: string = 'https://plausible.io';
  private initialized: boolean = false;
  private enabled: boolean = false;
  private scriptLoaded: boolean = false;
  private eventQueue: Array<{ event: string; props?: PlausibleEventProps }> = [];

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): PlausibleAnalytics {
    if (!PlausibleAnalytics.instance) {
      PlausibleAnalytics.instance = new PlausibleAnalytics();
    }
    return PlausibleAnalytics.instance;
  }

  /**
   * Check if analytics is enabled based on user preferences and DNT
   */
  public isEnabled(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    // Check Do Not Track header
    const dnt = navigator.doNotTrack || (window as any).doNotTrack;
    if (dnt === '1' || dnt === 'yes') {
      return false;
    }

    // Check if initialized
    if (!this.initialized || !this.domain) {
      return false;
    }

    return this.enabled;
  }

  /**
   * Initialize Plausible analytics
   */
  public init(domain: string, apiHost?: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Already initialized
    if (this.initialized && this.domain === domain) {
      return;
    }

    this.domain = domain;
    if (apiHost) {
      this.apiHost = apiHost;
    }

    // Check if analytics should be enabled
    this.enabled = this.checkAnalyticsConsent();

    if (!this.enabled) {
      console.log('[Plausible] Analytics disabled by user preferences or DNT');
      return;
    }

    this.initialized = true;
    this.loadScript();
  }

  /**
   * Load Plausible script dynamically
   */
  private loadScript(): void {
    if (this.scriptLoaded || typeof window === 'undefined' || !this.domain) {
      return;
    }

    const script = document.createElement('script');
    script.defer = true;
    script.dataset.domain = this.domain;
    script.dataset.api = `${this.apiHost}/api/event`;
    script.src = `${this.apiHost}/js/script.js`;

    script.onload = () => {
      this.scriptLoaded = true;
      console.log('[Plausible] Script loaded successfully');

      // Process queued events
      this.processEventQueue();
    };

    script.onerror = () => {
      console.error('[Plausible] Failed to load script');
    };

    document.head.appendChild(script);
  }

  /**
   * Check analytics consent from localStorage
   */
  private checkAnalyticsConsent(): boolean {
    try {
      const consent = localStorage.getItem('tallow-analytics-consent');
      return consent === 'true' || consent === null; // Default to enabled
    } catch (error) {
      console.warn('[Plausible] Failed to read consent:', error);
      return true; // Default to enabled on error
    }
  }

  /**
   * Set analytics consent
   */
  public setConsent(enabled: boolean): void {
    try {
      localStorage.setItem('tallow-analytics-consent', String(enabled));
      this.enabled = enabled;

      if (enabled && !this.scriptLoaded && this.initialized) {
        this.loadScript();
      }
    } catch (error) {
      console.warn('[Plausible] Failed to save consent:', error);
    }
  }

  /**
   * Process queued events after script loads
   */
  private processEventQueue(): void {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (event) {
        this.trackEvent(event.event, event.props);
      }
    }
  }

  /**
   * Track a pageview
   */
  public trackPageview(url?: string): void {
    if (!this.isEnabled()) {
      return;
    }

    if (!this.scriptLoaded) {
      // Queue pageview if script not loaded yet
      return;
    }

    try {
      if (window.plausible) {
        const pageUrl = url || window.location.pathname;
        window.plausible('pageview', {
          props: { url: pageUrl }
        });
      }
    } catch (error) {
      console.warn('[Plausible] Failed to track pageview:', error);
    }
  }

  /**
   * Track a custom event
   */
  public trackEvent(name: string, props?: PlausibleEventProps): void {
    if (!this.isEnabled()) {
      return;
    }

    // Queue event if script not loaded yet
    if (!this.scriptLoaded) {
      this.eventQueue.push({ event: name, ...(props ? { props } : {}) });
      return;
    }

    try {
      if (window.plausible) {
        // Clean props: ensure all values are strings or numbers
        const cleanProps = props
          ? Object.entries(props).reduce((acc, [key, value]) => {
              if (typeof value === 'string' || typeof value === 'number') {
                acc[key] = value;
              } else if (typeof value === 'boolean') {
                acc[key] = value ? 'true' : 'false';
              }
              return acc;
            }, {} as Record<string, string | number>)
          : undefined;

        window.plausible(name, cleanProps ? { props: cleanProps } : undefined);
      }
    } catch (error) {
      console.warn(`[Plausible] Failed to track event "${name}":`, error);
    }
  }

  // ============================================================================
  // PRE-DEFINED EVENT HELPERS
  // ============================================================================

  /**
   * Track transfer started event
   */
  public trackTransferStarted(props: TransferStartedProps): void {
    this.trackEvent('transfer_started', props as unknown as PlausibleEventProps);
  }

  /**
   * Track transfer completed event
   */
  public trackTransferCompleted(props: TransferCompletedProps): void {
    this.trackEvent('transfer_completed', props as unknown as PlausibleEventProps);
  }

  /**
   * Track room created event
   */
  public trackRoomCreated(): void {
    this.trackEvent('room_created');
  }

  /**
   * Track room joined event
   */
  public trackRoomJoined(): void {
    this.trackEvent('room_joined');
  }

  /**
   * Track friend added event
   */
  public trackFriendAdded(): void {
    this.trackEvent('friend_added');
  }

  /**
   * Track theme changed event
   */
  public trackThemeChanged(props: ThemeChangedProps): void {
    this.trackEvent('theme_changed', props as unknown as PlausibleEventProps);
  }

  /**
   * Track language changed event
   */
  public trackLanguageChanged(props: LanguageChangedProps): void {
    this.trackEvent('language_changed', props as unknown as PlausibleEventProps);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Export singleton instance
export const analytics = PlausibleAnalytics.getInstance();

// Export class for testing
export { PlausibleAnalytics };
