'use client';

/**
 * Onion Routing Configuration Interface
 * UI for configuring multi-hop relay routing settings
 *
 * WARNING: Onion routing is EXPERIMENTAL and NOT FUNCTIONAL.
 * The relay network infrastructure does not exist yet.
 * This UI is for demonstration and future use only.
 */

import { useState } from 'react';
import {
  Shield,
  Network,
  Settings,
  Activity,
  AlertCircle,
  Loader2,
  AlertTriangle,
  Construction,
} from 'lucide-react';
import { useOnionRouting, useOnionStats } from '@/lib/hooks/use-onion-routing';
import type { OnionRoutingMode } from '@/lib/transport/onion-routing-integration';

export function OnionRoutingConfig() {
  const { isLoading, error, config, relayNodes, updateConfig } =
    useOnionRouting();
  const { stats, successRate } = useOnionStats();
  const [selectedMode, setSelectedMode] = useState<OnionRoutingMode>(
    config?.mode || 'disabled'
  );
  const [numHops, setNumHops] = useState(config?.numHops || 3);

  const handleModeChange = (mode: OnionRoutingMode) => {
    setSelectedMode(mode);
    updateConfig({ mode });
  };

  const handleHopsChange = (hops: number) => {
    setNumHops(hops);
    updateConfig({ numHops: hops });
  };

  const modes: { value: OnionRoutingMode; label: string; description: string }[] = [
    {
      value: 'disabled',
      label: 'Disabled',
      description: 'Direct P2P connection (fastest, least private)',
    },
    {
      value: 'single-hop',
      label: 'Single Hop',
      description: 'One relay node (balanced speed and privacy)',
    },
    {
      value: 'multi-hop',
      label: 'Multi-Hop',
      description: '3+ relay nodes (slower, more private)',
    },
    {
      value: 'tor',
      label: 'Tor Integration',
      description: 'Route through Tor network (slowest, maximum privacy)',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3">Initializing onion routing...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 dark:text-red-100">
              Initialization Error
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {error.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* EXPERIMENTAL WARNING BANNER */}
      <div className="bg-amber-50 dark:bg-amber-950 border-2 border-amber-400 dark:border-amber-600 rounded-lg p-4 flex items-start gap-3">
        <Construction className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900 dark:text-amber-100">
          <div className="flex items-center gap-2">
            <strong className="text-base">Experimental Feature - Coming Soon</strong>
            <span className="px-2 py-0.5 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-xs font-bold rounded-full">
              NOT FUNCTIONAL
            </span>
          </div>
          <p className="text-amber-700 dark:text-amber-300 mt-2">
            <strong>Onion routing is under development and cannot be used yet.</strong> The relay network
            infrastructure required for this feature has not been implemented. The relay nodes shown
            below are for demonstration purposes only and do not represent actual working relays.
          </p>
          <p className="text-amber-600 dark:text-amber-400 mt-2 text-xs">
            Please use direct P2P connections for file transfers. We will announce when onion routing becomes available.
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Onion Routing Configuration</h2>
            <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 text-xs font-semibold rounded-md">
              EXPERIMENTAL
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            Configure multi-hop relay routing for enhanced privacy (Coming Soon)
          </p>
        </div>
      </div>

      {/* Status Banner - Show warning instead of ready */}
      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900 dark:text-amber-100">
          <strong>Relay Network Not Available</strong>
          <p className="text-amber-700 dark:text-amber-300 mt-1">
            {relayNodes.length > 0
              ? `${relayNodes.length} demonstration relay nodes shown (not functional)`
              : 'No relay network infrastructure available'}
          </p>
        </div>
      </div>

      {/* Mode Selection */}
      <div>
        <h3 className="font-semibold mb-3">Routing Mode</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modes.map((mode) => (
            <button
              key={mode.value}
              onClick={() => handleModeChange(mode.value)}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                selectedMode === mode.value
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-primary/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                    selectedMode === mode.value
                      ? 'border-primary bg-primary'
                      : 'border-muted'
                  }`}
                >
                  {selectedMode === mode.value && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{mode.label}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {mode.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Number of Hops (Multi-Hop mode only) */}
      {selectedMode === 'multi-hop' && (
        <div>
          <h3 className="font-semibold mb-3">Number of Hops</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="2"
                max="5"
                value={numHops}
                onChange={(e) => handleHopsChange(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-lg font-bold w-8 text-center">{numHops}</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
              <div>2 hops</div>
              <div>3 hops (recommended)</div>
              <div>4 hops</div>
              <div>5 hops</div>
            </div>
            <p className="text-sm text-muted-foreground">
              More hops = higher privacy, slower speed. 3 hops recommended for balanced
              security.
            </p>
          </div>
        </div>
      )}

      {/* Advanced Settings */}
      <details className="border rounded-lg">
        <summary className="p-4 cursor-pointer font-semibold flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Advanced Settings
        </summary>
        <div className="p-4 border-t space-y-4">
          <div>
            <label htmlFor="relay-selection-strategy" className="block text-sm font-medium mb-2">
              Relay Selection Strategy
            </label>
            <select
              id="relay-selection-strategy"
              value={config?.relaySelectionStrategy || 'optimal'}
              onChange={(e) =>
                updateConfig({
                  relaySelectionStrategy: e.target.value as
                    | 'random'
                    | 'optimal'
                    | 'regional',
                })
              }
              className="w-full p-2 border rounded-md bg-background"
            >
              <option value="optimal">Optimal (recommended)</option>
              <option value="random">Random</option>
              <option value="regional">Regional</option>
            </select>
          </div>

          <div>
            <label htmlFor="min-trust-score" className="block text-sm font-medium mb-2">
              Minimum Trust Score
            </label>
            <input
              id="min-trust-score"
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={config?.minTrustScore || 0.7}
              onChange={(e) =>
                updateConfig({ minTrustScore: parseFloat(e.target.value) })
              }
              className="w-full p-2 border rounded-md bg-background"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Only use relay nodes with trust score above this threshold (0-1)
            </p>
          </div>

          <div>
            <label htmlFor="max-latency" className="block text-sm font-medium mb-2">
              Maximum Latency (ms)
            </label>
            <input
              id="max-latency"
              type="number"
              min="100"
              max="2000"
              step="50"
              value={config?.maxLatency || 500}
              onChange={(e) =>
                updateConfig({ maxLatency: parseInt(e.target.value) })
              }
              className="w-full p-2 border rounded-md bg-background"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Exclude relay nodes with latency higher than this
            </p>
          </div>
        </div>
      </details>

      {/* Statistics */}
      {stats && stats.totalTransfers > 0 && (
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {stats.totalTransfers}
              </div>
              <div className="text-sm text-muted-foreground">Total Transfers</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {successRate.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {stats.averageLatency.toFixed(0)}ms
              </div>
              <div className="text-sm text-muted-foreground">Avg. Latency</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {stats.activeRelays}
              </div>
              <div className="text-sm text-muted-foreground">Active Relays</div>
            </div>
          </div>
        </div>
      )}

      {/* Relay Nodes */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Network className="h-4 w-4" />
          Available Relay Nodes
        </h3>
        <div className="space-y-2">
          {relayNodes.map((node) => (
            <div key={node.id} className="p-3 border rounded-lg flex items-center gap-4">
              <div className="flex-1">
                <div className="font-medium">{node.address}</div>
                <div className="text-xs text-muted-foreground">
                  {node.region} • {node.latency}ms latency
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">
                  Trust: {(node.trustScore * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {(node.bandwidth / 1024 / 1024).toFixed(0)} MB/s
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900 dark:text-blue-100">
          <strong>How Onion Routing Works</strong>
          <p className="text-blue-700 dark:text-blue-300 mt-2">
            Your data is encrypted in multiple layers and routed through several relay
            nodes. Each node only knows the previous and next hop, preventing any single
            node from knowing both the source and destination.
          </p>
        </div>
      </div>
    </div>
  );
}
