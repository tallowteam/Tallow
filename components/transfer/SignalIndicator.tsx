'use client';

/**
 * SignalIndicator Component
 *
 * Displays signal strength with animated WiFi-style bars.
 * Color-coded: green (excellent/good), yellow (fair), red (poor), gray (disconnected).
 * Suitable for device cards and connection status displays.
 *
 * @module components/transfer/SignalIndicator
 */

import { useMemo } from 'react';
import { getSignalBars, type SignalLevel } from '@/lib/network/signal-strength';
import styles from './SignalIndicator.module.css';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SignalIndicatorProps {
  /** Signal strength level */
  level: SignalLevel;
  /** Show text label next to bars (default: false) */
  showLabel?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Additional CSS class */
  className?: string;
  /** Show tooltip on hover (default: false) */
  showTooltip?: boolean;
  /** Custom tooltip content */
  tooltipContent?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Signal strength indicator with animated bars
 *
 * @example
 * ```tsx
 * <SignalIndicator level="good" showLabel />
 * <SignalIndicator level="excellent" size="sm" />
 * ```
 */
export function SignalIndicator({
  level,
  showLabel = false,
  size = 'md',
  className = '',
  showTooltip = false,
  tooltipContent,
}: SignalIndicatorProps) {
  // Calculate number of active bars based on signal level
  const activeBars = useMemo(() => getSignalBars(level), [level]);

  // Generate label text
  const labelText = useMemo(() => {
    switch (level) {
      case 'excellent':
        return 'Excellent';
      case 'good':
        return 'Good';
      case 'fair':
        return 'Fair';
      case 'poor':
        return 'Poor';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  }, [level]);

  // Generate tooltip content
  const tooltip = useMemo(() => {
    if (tooltipContent) {
      return tooltipContent;
    }

    return `Signal: ${labelText}`;
  }, [tooltipContent, labelText]);

  return (
    <div
      className={`${styles.container} ${className}`}
      data-level={level}
      data-size={size}
      role="status"
      aria-label={`Signal strength: ${labelText}`}
    >
      {/* Screen reader only text */}
      <span className={styles.srOnly}>
        Signal strength: {labelText} ({activeBars} out of 5 bars)
      </span>

      {/* Signal bars */}
      <div className={styles.bars} aria-hidden="true">
        {[1, 2, 3, 4, 5].map((barIndex) => (
          <div
            key={barIndex}
            className={`${styles.bar} ${barIndex <= activeBars ? styles.active : ''}`}
          />
        ))}
      </div>

      {/* Label */}
      {showLabel && (
        <span className={styles.label} aria-hidden="true">
          {labelText}
        </span>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div className={styles.tooltip} role="tooltip">
          {tooltip}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMPACT VARIANT
// ============================================================================

/**
 * Compact signal indicator for use in device cards
 *
 * @example
 * ```tsx
 * <CompactSignalIndicator level="good" />
 * ```
 */
export function CompactSignalIndicator({ level }: { level: SignalLevel }) {
  const activeBars = useMemo(() => getSignalBars(level), [level]);

  const labelText = useMemo(() => {
    switch (level) {
      case 'excellent':
        return 'Excellent';
      case 'good':
        return 'Good';
      case 'fair':
        return 'Fair';
      case 'poor':
        return 'Poor';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  }, [level]);

  return (
    <div
      className={`${styles.container} ${styles.compact}`}
      data-level={level}
      role="status"
      aria-label={`Signal: ${labelText}`}
    >
      <span className={styles.srOnly}>Signal: {labelText}</span>
      <div className={styles.bars} aria-hidden="true">
        {[1, 2, 3, 4, 5].map((barIndex) => (
          <div
            key={barIndex}
            className={`${styles.bar} ${barIndex <= activeBars ? styles.active : ''}`}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// WITH RTT DISPLAY
// ============================================================================

/**
 * Signal indicator with RTT measurement display
 *
 * @example
 * ```tsx
 * <SignalIndicatorWithRTT level="good" rttMs={25} />
 * ```
 */
export function SignalIndicatorWithRTT({
  level,
  rttMs,
  showLabel = false,
  size = 'md',
}: {
  level: SignalLevel;
  rttMs: number | null;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}) {
  const tooltipContent = useMemo(() => {
    if (rttMs === null) {
      return 'RTT: Unknown';
    }
    return `RTT: ${rttMs.toFixed(1)}ms`;
  }, [rttMs]);

  return (
    <SignalIndicator
      level={level}
      showLabel={showLabel}
      size={size}
      showTooltip
      tooltipContent={tooltipContent}
    />
  );
}

// ============================================================================
// DEMO COMPONENT (for testing)
// ============================================================================

/**
 * Demo component showing all signal levels
 */
export function SignalIndicatorDemo() {
  const levels: SignalLevel[] = ['excellent', 'good', 'fair', 'poor', 'disconnected'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px' }}>
      <h3 style={{ margin: 0, color: '#ededed' }}>Signal Indicators</h3>

      {/* With labels */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h4 style={{ margin: 0, color: '#a1a1a1', fontSize: '14px' }}>With Labels</h4>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          {levels.map((level) => (
            <SignalIndicator key={level} level={level} showLabel />
          ))}
        </div>
      </div>

      {/* Without labels */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h4 style={{ margin: 0, color: '#a1a1a1', fontSize: '14px' }}>Without Labels</h4>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          {levels.map((level) => (
            <SignalIndicator key={level} level={level} />
          ))}
        </div>
      </div>

      {/* Small size */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h4 style={{ margin: 0, color: '#a1a1a1', fontSize: '14px' }}>Small Size</h4>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          {levels.map((level) => (
            <SignalIndicator key={level} level={level} size="sm" />
          ))}
        </div>
      </div>

      {/* Compact variant */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h4 style={{ margin: 0, color: '#a1a1a1', fontSize: '14px' }}>Compact (for cards)</h4>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          {levels.map((level) => (
            <CompactSignalIndicator key={level} level={level} />
          ))}
        </div>
      </div>

      {/* With RTT */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h4 style={{ margin: 0, color: '#a1a1a1', fontSize: '14px' }}>With RTT Display</h4>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <SignalIndicatorWithRTT level="excellent" rttMs={8} showLabel />
          <SignalIndicatorWithRTT level="good" rttMs={35} showLabel />
          <SignalIndicatorWithRTT level="fair" rttMs={85} showLabel />
          <SignalIndicatorWithRTT level="poor" rttMs={150} showLabel />
          <SignalIndicatorWithRTT level="disconnected" rttMs={null} showLabel />
        </div>
      </div>
    </div>
  );
}
