/**
 * ARIA Live Region Hook
 * Manages dynamic announcements with queueing and debouncing
 * WCAG 2.1: 4.1.3 Status Messages (Level A)
 */

import React from 'react';

export type AriaLivePriority = 'polite' | 'assertive';

interface LiveRegionMessage {
  id: string;
  text: string;
  priority: AriaLivePriority;
  timestamp: number;
}

interface UseAriaLiveOptions {
  priority?: AriaLivePriority;
  debounceMs?: number;
  maxQueue?: number;
}

/**
 * Hook for managing ARIA live regions
 */
export function useAriaLive(id: string, options: UseAriaLiveOptions = {}) {
  const {
    priority = 'polite',
    debounceMs = 100,
    maxQueue = 10,
  } = options;

  const regionRef = React.useRef<HTMLDivElement>(null);
  const [messages, setMessages] = React.useState<LiveRegionMessage[]>([]);
  const [currentMessage, setCurrentMessage] = React.useState<string>('');
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const queueRef = React.useRef<LiveRegionMessage[]>([]);

  // Setup ARIA live region
  React.useEffect(() => {
    if (!regionRef.current) return;

    regionRef.current.setAttribute('id', `aria-live-${id}`);
    regionRef.current.setAttribute('aria-live', priority);
    regionRef.current.setAttribute('aria-atomic', 'true');
    regionRef.current.role = 'status';

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [id, priority]);

  const announce = React.useCallback(
    (text: string, options?: Partial<UseAriaLiveOptions>) => {
      const message: LiveRegionMessage = {
        id: Math.random().toString(36),
        text,
        priority: options?.priority ?? priority,
        timestamp: Date.now(),
      };

      // Add to queue
      queueRef.current.push(message);

      // Limit queue size
      if (queueRef.current.length > (options?.maxQueue ?? maxQueue)) {
        queueRef.current.shift();
      }

      // Update messages state
      setMessages([...queueRef.current]);

      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Debounce the announcement
      debounceTimerRef.current = setTimeout(() => {
        setCurrentMessage(text);

        // Clear after announcement
        setTimeout(() => {
          setCurrentMessage('');
        }, 1000);
      }, options?.debounceMs ?? debounceMs);
    },
    [priority, maxQueue, debounceMs]
  );

  const announcePoli: any = React.useCallback(
    (text: string) => announce(text, { priority: 'polite' }),
    [announce]
  );

  const announceAssertive = React.useCallback(
    (text: string) => announce(text, { priority: 'assertive' }),
    [announce]
  );

  const clear = React.useCallback(() => {
    setCurrentMessage('');
    setMessages([]);
    queueRef.current = [];
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  return {
    regionRef,
    announce,
    announcePolite: announcePoli,
    announceAssertive,
    clear,
    messages,
    currentMessage,
  };
}

/**
 * Standalone ARIA live region component
 */
export interface AriaLiveProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string;
  priority?: AriaLivePriority;
  children?: React.ReactNode;
}

export const AriaLive = React.forwardRef<HTMLDivElement, AriaLiveProps>(
  (
    {
      id,
      priority = 'polite',
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        id={`aria-live-${id}`}
        aria-live={priority}
        aria-atomic="true"
        role="status"
        style={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
        className={className}
        {...props}
      >
        {children}
      </div>
    );
  }
);

AriaLive.displayName = 'AriaLive';
