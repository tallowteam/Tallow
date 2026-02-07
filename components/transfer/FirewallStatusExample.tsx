'use client';

/**
 * Firewall Status Example
 *
 * Demonstrates how to use the FirewallStatus component in your transfer page.
 * This example shows:
 * - Basic usage with auto-detection
 * - Manual detection trigger
 * - Handling detection results
 * - Integration in a transfer page header
 */

import { useState } from 'react';
import FirewallStatus from './FirewallStatus';
import type { FirewallDetectionResult } from '@/lib/network/firewall-detection';

export default function FirewallStatusExample() {
  const [detectionResult, setDetectionResult] = useState<FirewallDetectionResult | null>(null);

  const handleDetectionComplete = (result: FirewallDetectionResult) => {
    console.log('Firewall detection completed:', result);
    setDetectionResult(result);

    // You can use this callback to:
    // - Update connection strategy
    // - Show notifications to users
    // - Log analytics
    // - Adjust transfer settings
  };

  return (
    <div style={{ padding: '2rem', background: '#0a0a0b', minHeight: '100vh' }}>
      {/* Example 1: Basic Usage in Transfer Page Header */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: '#f3f4f6', marginBottom: '1rem' }}>
          Example 1: Transfer Page Header
        </h2>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.5rem',
            background: 'rgba(17, 17, 19, 0.6)',
            borderRadius: '16px',
            border: '1px solid rgba(139, 92, 246, 0.2)',
          }}
        >
          <div>
            <h1 style={{ color: '#f3f4f6', margin: 0, fontSize: '1.5rem' }}>
              Transfer Files
            </h1>
            <p style={{ color: '#9ca3af', margin: '0.5rem 0 0', fontSize: '0.875rem' }}>
              Share files securely with end-to-end encryption
            </p>
          </div>
          <FirewallStatus
            autoDetect={true}
            onDetectionComplete={handleDetectionComplete}
          />
        </div>
      </section>

      {/* Example 2: Standalone Status */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: '#f3f4f6', marginBottom: '1rem' }}>
          Example 2: Standalone Status
        </h2>
        <FirewallStatus
          autoDetect={true}
          onDetectionComplete={handleDetectionComplete}
        />
      </section>

      {/* Example 3: Detection Result Display */}
      {detectionResult && (
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ color: '#f3f4f6', marginBottom: '1rem' }}>
            Example 3: Using Detection Results
          </h2>
          <div
            style={{
              padding: '1.5rem',
              background: 'rgba(17, 17, 19, 0.6)',
              borderRadius: '16px',
              border: '1px solid rgba(139, 92, 246, 0.2)',
            }}
          >
            <h3 style={{ color: '#a78bfa', margin: '0 0 1rem', fontSize: '1rem' }}>
              Current Network Status
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <StatusCard
                label="STUN Connectivity"
                value={detectionResult.stun ? 'Available' : 'Blocked'}
                success={detectionResult.stun}
              />
              <StatusCard
                label="WebSocket"
                value={detectionResult.websocket ? 'Available' : 'Blocked'}
                success={detectionResult.websocket}
              />
              <StatusCard
                label="TURN Relay"
                value={detectionResult.turn ? 'Available' : 'Unavailable'}
                success={detectionResult.turn}
              />
              <StatusCard
                label="Direct P2P"
                value={detectionResult.directP2P ? 'Possible' : 'Not Available'}
                success={detectionResult.directP2P}
              />
            </div>
            <div
              style={{
                marginTop: '1rem',
                padding: '1rem',
                background: 'rgba(139, 92, 246, 0.1)',
                borderRadius: '8px',
                borderLeft: '3px solid #8b5cf6',
              }}
            >
              <div style={{ color: '#a78bfa', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Firewall Type
              </div>
              <div style={{ color: '#f3f4f6', fontSize: '1rem' }}>
                {detectionResult.firewallType.charAt(0).toUpperCase() + detectionResult.firewallType.slice(1)}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Example 4: Integration Tips */}
      <section>
        <h2 style={{ color: '#f3f4f6', marginBottom: '1rem' }}>
          Integration Tips
        </h2>
        <div
          style={{
            padding: '1.5rem',
            background: 'rgba(17, 17, 19, 0.6)',
            borderRadius: '16px',
            border: '1px solid rgba(139, 92, 246, 0.2)',
          }}
        >
          <CodeBlock
            code={`// In your transfer page (app/transfer/page.tsx)
import FirewallStatus from '@/components/transfer/FirewallStatus';

export default function TransferPage() {
  const handleDetection = (result) => {
    // Adapt your connection strategy based on firewall type
    if (result.firewallType === 'strict' || result.firewallType === 'corporate') {
      // Use TURN relay servers
      setUseTURN(true);
    }

    // Show user-friendly messages
    if (!result.directP2P) {
      toast.info('Using relay servers for optimal connectivity');
    }
  };

  return (
    <div>
      <header>
        <h1>Transfer Files</h1>
        <FirewallStatus
          autoDetect={true}
          onDetectionComplete={handleDetection}
        />
      </header>
      {/* Rest of your transfer UI */}
    </div>
  );
}`}
          />
        </div>
      </section>
    </div>
  );
}

// Helper component for status cards
function StatusCard({
  label,
  value,
  success,
}: {
  label: string;
  value: string;
  success: boolean;
}) {
  return (
    <div
      style={{
        padding: '1rem',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '8px',
        border: `1px solid ${success ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
      }}
    >
      <div style={{ color: '#9ca3af', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
        {label}
      </div>
      <div
        style={{
          color: success ? '#22c55e' : '#ef4444',
          fontSize: '0.875rem',
          fontWeight: 600,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// Helper component for code display
function CodeBlock({ code }: { code: string }) {
  return (
    <pre
      style={{
        padding: '1rem',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '8px',
        overflow: 'auto',
        fontSize: '0.875rem',
        lineHeight: '1.6',
        color: '#d1d5db',
        margin: 0,
      }}
    >
      <code>{code}</code>
    </pre>
  );
}
