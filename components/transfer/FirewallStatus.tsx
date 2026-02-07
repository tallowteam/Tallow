'use client';

/**
 * Firewall Status Component
 *
 * Displays firewall detection status with an expandable panel showing:
 * - Current firewall type (none/moderate/strict/corporate)
 * - Individual test results (STUN, WebSocket, TURN, P2P)
 * - User-friendly recommendations
 * - Re-test functionality
 *
 * Design:
 * - Dark theme with purple accent
 * - CSS Modules for scoped styling
 * - Expandable panel for detailed information
 * - Smooth animations and transitions
 * - Responsive layout
 */

import { useState, useEffect, useRef } from 'react';
import {
  detectFirewall,
  getGuidance,
  getFirewallStatusIcon,
  clearFirewallCache,
  getCachedResult,
  type FirewallDetectionResult,
} from '@/lib/network/firewall-detection';
import styles from './FirewallStatus.module.css';

// ============================================================================
// Component Props
// ============================================================================

interface FirewallStatusProps {
  /** Auto-detect on mount */
  autoDetect?: boolean;
  /** Callback when detection completes */
  onDetectionComplete?: (result: FirewallDetectionResult) => void;
  /** Custom class name */
  className?: string;
}

// ============================================================================
// Main Component
// ============================================================================

export default function FirewallStatus({
  autoDetect = true,
  onDetectionComplete,
  className,
}: FirewallStatusProps) {
  const [result, setResult] = useState<FirewallDetectionResult | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // Effects
  // ============================================================================

  // Auto-detect on mount
  useEffect(() => {
    if (autoDetect) {
      // Check for cached result first
      const cached = getCachedResult();
      if (cached) {
        setResult(cached);
        onDetectionComplete?.(cached);
      } else {
        runDetection();
      }
    }
  }, [autoDetect]);

  // Close panel when clicking outside
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        panelRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const runDetection = async () => {
    setIsTesting(true);
    try {
      const detectionResult = await detectFirewall({ skipCache: true });
      setResult(detectionResult);
      onDetectionComplete?.(detectionResult);
    } catch (error) {
      console.error('Firewall detection failed:', error);
    } finally {
      setIsTesting(false);
    }
  };

  const handleRetest = async () => {
    clearFirewallCache();
    setIsExpanded(true);
    await runDetection();
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // ============================================================================
  // Render Helpers
  // ============================================================================

  const renderStatusIcon = () => {
    if (isTesting) {
      return (
        <div className={`${styles.statusIcon} ${styles.testing}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
          </svg>
        </div>
      );
    }

    if (!result) {
      return (
        <div className={`${styles.statusIcon} ${styles.testing}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
          </svg>
        </div>
      );
    }

    const { icon, color } = getFirewallStatusIcon(result.firewallType);

    const iconSvg = {
      check: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
      warning: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 9v4m0 4h.01M5.07 19H19c.93 0 1.39-1.12.73-1.78l-7-7c-.39-.39-1.02-.39-1.41 0l-7 7c-.66.66-.2 1.78.73 1.78z" />
        </svg>
      ),
      shield: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    };

    return (
      <div className={`${styles.statusIcon} ${styles[color]}`}>
        {iconSvg[icon as keyof typeof iconSvg]}
      </div>
    );
  };

  const renderTestItem = (
    name: string,
    success: boolean,
    time: number,
    icon: 'stun' | 'websocket' | 'turn' | 'p2p'
  ) => {
    const iconSvg = {
      stun: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6m0 6v6M23 12h-6m-6 0H1" />
        </svg>
      ),
      websocket: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 12h20M2 6h20M2 18h20" />
        </svg>
      ),
      turn: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      ),
      p2p: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="6" cy="12" r="4" />
          <circle cx="18" cy="12" r="4" />
          <line x1="10" y1="12" x2="14" y2="12" />
        </svg>
      ),
    };

    return (
      <div key={name} className={styles.testItem}>
        <div className={styles.testInfo}>
          <div className={`${styles.testIconContainer} ${success ? styles.success : styles.failure}`}>
            {iconSvg[icon]}
          </div>
          <div className={styles.testDetails}>
            <div className={styles.testName}>{name}</div>
            <div className={styles.testTime}>{time}ms</div>
          </div>
        </div>
        <div className={`${styles.testStatus} ${success ? styles.success : styles.failure}`}>
          {success ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Connected
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Blocked
            </>
          )}
        </div>
      </div>
    );
  };

  const renderExpandedPanel = () => {
    if (!isExpanded) return null;

    if (isTesting) {
      return (
        <div ref={panelRef} className={styles.expandedPanel}>
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner} />
            <div className={styles.loadingText}>
              Testing firewall configuration...
              <br />
              This may take up to 20 seconds
            </div>
          </div>
        </div>
      );
    }

    if (!result) {
      return (
        <div ref={panelRef} className={styles.expandedPanel}>
          <div className={styles.loadingState}>
            <div className={styles.loadingText}>
              No detection results available.
              <br />
              Click "Re-test" to run firewall detection.
            </div>
          </div>
        </div>
      );
    }

    return (
      <div ref={panelRef} className={styles.expandedPanel}>
        <div className={styles.panelHeader}>
          <h3 className={styles.panelTitle}>Firewall Detection Results</h3>
          <button
            className={styles.retestButton}
            onClick={handleRetest}
            disabled={isTesting}
            aria-label="Re-test firewall"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={isTesting ? styles.retestIcon : ''}
            >
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
            Re-test
          </button>
        </div>

        <div className={styles.testResults}>
          {renderTestItem('STUN Connectivity', result.stun, Math.round(result.detectionTime / 4), 'stun')}
          {renderTestItem('WebSocket', result.websocket, Math.round(result.detectionTime / 4), 'websocket')}
          {renderTestItem('TURN Relay', result.turn, Math.round(result.detectionTime / 4), 'turn')}
          {renderTestItem('Direct P2P', result.directP2P, Math.round(result.detectionTime / 4), 'p2p')}
        </div>

        {result.recommendations.length > 0 && (
          <div className={styles.recommendations}>
            <div className={styles.recommendationsTitle}>Recommendations</div>
            <div className={styles.recommendationsList}>
              {result.recommendations.map((rec, index) => (
                <div key={index} className={styles.recommendationItem}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={styles.recommendationIcon}
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.detectionTime}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          Detected in {result.detectionTime}ms
        </div>
      </div>
    );
  };

  // ============================================================================
  // Render
  // ============================================================================

  const statusText = isTesting
    ? 'Testing...'
    : result
    ? getFirewallTypeLabel(result.firewallType)
    : 'Unknown';

  const statusDescription = isTesting
    ? 'Checking network configuration'
    : result
    ? getGuidance(result)
    : 'Click to test firewall';

  return (
    <div ref={containerRef} className={`${styles.container} ${className || ''}`}>
      <div onClick={toggleExpanded} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
        {renderStatusIcon()}
        <div className={styles.statusText}>
          <div className={styles.statusLabel}>{statusText}</div>
          <div className={styles.statusDescription}>{statusDescription}</div>
        </div>
      </div>
      <button
        className={`${styles.expandButton} ${isExpanded ? styles.expanded : ''}`}
        onClick={toggleExpanded}
        aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
        aria-expanded={isExpanded}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {renderExpandedPanel()}
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getFirewallTypeLabel(type: string): string {
  switch (type) {
    case 'none':
      return 'No Firewall Restrictions';
    case 'moderate':
      return 'Moderate Firewall';
    case 'strict':
      return 'Strict Firewall';
    case 'corporate':
      return 'Corporate Firewall';
    default:
      return 'Unknown';
  }
}
