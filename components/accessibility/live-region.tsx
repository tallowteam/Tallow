'use client';

/**
 * Live Region Component
 * WCAG 2.1 AA: Announces dynamic content changes to screen readers
 * Use for status messages, notifications, and dynamic updates
 */

import { useEffect, useState } from 'react';

export interface LiveRegionProps {
  message: string;
  politeness?: 'polite' | 'assertive' | 'off';
  clearAfter?: number; // milliseconds
  className?: string;
}

export function LiveRegion({
  message,
  politeness = 'polite',
  clearAfter = 5000,
  className = '',
}: LiveRegionProps) {
  const [displayMessage, setDisplayMessage] = useState(message);

  useEffect(() => {
    setDisplayMessage(message);

    if (clearAfter && message) {
      const timer = setTimeout(() => {
        setDisplayMessage('');
      }, clearAfter);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [message, clearAfter]);

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className={`sr-only ${className}`}
    >
      {displayMessage}
    </div>
  );
}

/**
 * Global Live Region Hook
 * Manages a single live region for the entire app
 */

let announceFunction: ((message: string, politeness?: 'polite' | 'assertive') => void) | null = null;

export function useAnnounce() {
  return {
    announce: (message: string, politeness: 'polite' | 'assertive' = 'polite') => {
      if (announceFunction) {
        announceFunction(message, politeness);
      }
    },
  };
}

/**
 * Global Live Region Provider
 * Add this to your root layout
 */

export function LiveRegionProvider() {
  const [message, setMessage] = useState('');
  const [politeness, setPoliteness] = useState<'polite' | 'assertive'>('polite');

  useEffect(() => {
    announceFunction = (msg: string, level: 'polite' | 'assertive' = 'polite') => {
      setPoliteness(level);
      setMessage(msg);
    };

    return () => {
      announceFunction = null;
    };
  }, []);

  return (
    <LiveRegion
      message={message}
      politeness={politeness}
      clearAfter={5000}
    />
  );
}
