/**
 * React hook for screen reader announcements
 * Provides a way to announce messages to assistive technologies
 */

import { useCallback } from 'react';
import { announce as announceUtil } from '@/lib/utils/accessibility';

export function useAnnounce() {
  const announce = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      announceUtil(message, priority);
    },
    []
  );

  return announce;
}
