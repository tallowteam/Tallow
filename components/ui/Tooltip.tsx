'use client';

/**
 * Tooltip Primitive -- WAI-ARIA Tooltip Pattern
 * Agent 035 (RADIX-SURGEON)
 *
 * Implements WAI-ARIA Authoring Practices 1.2 Tooltip pattern:
 * - role="tooltip" on the tooltip element
 * - aria-describedby on the trigger linking to the tooltip
 * - Shows on hover (with 300ms open delay) and on focus
 * - Hides on mouse leave (with 150ms close delay), blur, and Escape key
 * - Positioned above/below/left/right of trigger with collision detection
 * - Supports reduced motion preference
 * - Portal rendering to avoid overflow clipping
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
 */

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useId,
  type ReactNode,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';
import styles from './Tooltip.module.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  /** The element that triggers the tooltip */
  children: ReactNode;
  /** Tooltip content */
  content: ReactNode;
  /** Preferred placement (will flip if clipped) */
  placement?: TooltipPlacement;
  /** Delay before showing tooltip in ms (default 300ms per WCAG) */
  openDelay?: number;
  /** Delay before hiding tooltip in ms (default 150ms for grace period) */
  closeDelay?: number;
  /** Whether the tooltip is disabled */
  disabled?: boolean;
  /** Additional CSS class for the tooltip */
  className?: string;
  /** Additional CSS class for the trigger wrapper */
  triggerClassName?: string;
  /** Whether to render as inline or inline-flex wrapper */
  asChild?: boolean;
}

// ---------------------------------------------------------------------------
// Positioning utility
// ---------------------------------------------------------------------------

interface Position {
  top: number;
  left: number;
  actualPlacement: TooltipPlacement;
}

const TOOLTIP_OFFSET = 8; // pixels gap between trigger and tooltip
const VIEWPORT_PADDING = 8; // minimum distance from viewport edge

function calculatePosition(
  triggerRect: DOMRect,
  tooltipRect: DOMRect,
  preferred: TooltipPlacement
): Position {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Calculate position for each placement
  const positions: Record<TooltipPlacement, { top: number; left: number }> = {
    top: {
      top: triggerRect.top - tooltipRect.height - TOOLTIP_OFFSET,
      left: triggerRect.left + (triggerRect.width - tooltipRect.width) / 2,
    },
    bottom: {
      top: triggerRect.bottom + TOOLTIP_OFFSET,
      left: triggerRect.left + (triggerRect.width - tooltipRect.width) / 2,
    },
    left: {
      top: triggerRect.top + (triggerRect.height - tooltipRect.height) / 2,
      left: triggerRect.left - tooltipRect.width - TOOLTIP_OFFSET,
    },
    right: {
      top: triggerRect.top + (triggerRect.height - tooltipRect.height) / 2,
      left: triggerRect.right + TOOLTIP_OFFSET,
    },
  };

  // Check if a placement fits within the viewport
  function fits(placement: TooltipPlacement): boolean {
    const pos = positions[placement];
    if (!pos) return false;
    return (
      pos.top >= VIEWPORT_PADDING &&
      pos.left >= VIEWPORT_PADDING &&
      pos.top + tooltipRect.height <= viewportHeight - VIEWPORT_PADDING &&
      pos.left + tooltipRect.width <= viewportWidth - VIEWPORT_PADDING
    );
  }

  // Try preferred placement first, then fallbacks
  const fallbackOrder: Record<TooltipPlacement, TooltipPlacement[]> = {
    top: ['top', 'bottom', 'right', 'left'],
    bottom: ['bottom', 'top', 'right', 'left'],
    left: ['left', 'right', 'top', 'bottom'],
    right: ['right', 'left', 'top', 'bottom'],
  };

  const order = fallbackOrder[preferred];
  let actualPlacement = preferred;

  for (const candidate of order) {
    if (fits(candidate)) {
      actualPlacement = candidate;
      break;
    }
  }

  const pos = positions[actualPlacement];

  // Clamp to viewport bounds
  const clampedLeft = Math.max(
    VIEWPORT_PADDING,
    Math.min(pos.left, viewportWidth - tooltipRect.width - VIEWPORT_PADDING)
  );
  const clampedTop = Math.max(
    VIEWPORT_PADDING,
    Math.min(pos.top, viewportHeight - tooltipRect.height - VIEWPORT_PADDING)
  );

  return {
    top: clampedTop,
    left: clampedLeft,
    actualPlacement,
  };
}

// ---------------------------------------------------------------------------
// Tooltip Component
// ---------------------------------------------------------------------------

export function Tooltip({
  children,
  content,
  placement = 'top',
  openDelay = 300,
  closeDelay = 150,
  disabled = false,
  className = '',
  triggerClassName = '',
  asChild = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reactId = useId();
  const tooltipId = `tooltip${reactId.replace(/:/g, '')}`;

  // Track mount for portal rendering
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (openTimerRef.current) clearTimeout(openTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  // Reposition tooltip whenever it becomes visible
  useEffect(() => {
    if (!isVisible || !triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const pos = calculatePosition(triggerRect, tooltipRect, placement);
    setPosition(pos);
  }, [isVisible, placement]);

  const show = useCallback(() => {
    if (disabled) return;
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    openTimerRef.current = setTimeout(() => {
      setIsVisible(true);
    }, openDelay);
  }, [disabled, openDelay]);

  const hide = useCallback(() => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    closeTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      setPosition(null);
    }, closeDelay);
  }, [closeDelay]);

  const hideImmediate = useCallback(() => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsVisible(false);
    setPosition(null);
  }, []);

  // Escape key dismisses tooltip
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        hideImmediate();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, hideImmediate]);

  // Tooltip styles
  const tooltipStyle: CSSProperties = position
    ? {
        top: `${position.top}px`,
        left: `${position.left}px`,
      }
    : {
        // Position off-screen initially so we can measure it
        top: '-9999px',
        left: '-9999px',
      };

  const wrapperTag = asChild ? styles.triggerInline : styles.trigger;

  return (
    <>
      {/* Trigger wrapper */}
      <div
        ref={triggerRef}
        className={`${wrapperTag} ${triggerClassName}`}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        aria-describedby={isVisible ? tooltipId : undefined}
      >
        {children}
      </div>

      {/* Tooltip rendered in portal */}
      {isMounted &&
        isVisible &&
        createPortal(
          <div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            className={`${styles.tooltip} ${styles[position?.actualPlacement ?? placement]} ${className}`}
            style={tooltipStyle}
            // Tooltip content should not be interactive -- pointer-events are
            // enabled only so the user can hover over the tooltip itself
            // (grace period pattern per WCAG best practice)
            onMouseEnter={() => {
              if (closeTimerRef.current) {
                clearTimeout(closeTimerRef.current);
                closeTimerRef.current = null;
              }
            }}
            onMouseLeave={hide}
          >
            <div className={styles.content}>{content}</div>
            <div
              className={styles.arrow}
              data-placement={position?.actualPlacement ?? placement}
              aria-hidden="true"
            />
          </div>,
          document.body
        )}
    </>
  );
}
