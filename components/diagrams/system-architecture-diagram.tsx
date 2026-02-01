"use client"

import {
  Monitor,
  Smartphone,
  Server,
  Wifi,
  Cloud,
  Database,
  Lock,
  ArrowLeftRight,
  Shield,
  Globe,
  Zap,
  HardDrive,
  Key,
  Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SystemArchitectureDiagramProps {
  className?: string;
  showLabels?: boolean;
}

/**
 * System Architecture Diagram
 *
 * High-level overview of Tallow's complete system architecture:
 * - Client applications (Web/Mobile)
 * - Signaling server infrastructure
 * - STUN/TURN servers for NAT traversal
 * - P2P connections between peers
 * - Storage and encryption layers
 *
 * Educational diagram showing component relationships and data flow
 */
export function SystemArchitectureDiagram({ className, showLabels = true }: SystemArchitectureDiagramProps) {
  return (
    <div className={cn('w-full p-6 md:p-8', className)}>
      {/* Title */}
      <div className="mb-8 text-center">
        <h3 className="text-2xl font-semibold mb-2 text-foreground">
          Tallow System Architecture
        </h3>
        <p className="text-sm text-muted-foreground">
          End-to-end encrypted peer-to-peer file transfer system
        </p>
      </div>

      {/* Main Architecture */}
      <div className="space-y-6">
        {/* Top Layer: Clients */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Peer A */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-white/5 to-indigo-50 dark:from-white/10 dark:to-indigo-950/30 border-2 border-white/20 dark:border-white/10 animate-fade-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-full bg-white/20 dark:bg-white/20 text-white">
                <Monitor className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-white">
                Peer A (Sender)
              </h4>
            </div>
            {showLabels && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded bg-white/10 dark:bg-white/10 text-xs">
                    <div className="flex items-center gap-1 mb-1">
                      <Smartphone className="w-3 h-3 text-white" />
                      <strong className="text-white">Platform</strong>
                    </div>
                    <span className="text-muted-foreground">Web/Mobile</span>
                  </div>
                  <div className="p-2 rounded bg-white/10 dark:bg-white/10 text-xs">
                    <div className="flex items-center gap-1 mb-1">
                      <Lock className="w-3 h-3 text-white" />
                      <strong className="text-white">Storage</strong>
                    </div>
                    <span className="text-muted-foreground">IndexedDB</span>
                  </div>
                </div>
                <div className="p-2 rounded bg-white/10 dark:bg-white/10 text-xs">
                  <strong className="text-white">Components:</strong>
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center gap-1">
                      <Key className="w-3 h-3" />
                      <span className="text-muted-foreground">PQC Crypto Engine</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Database className="w-3 h-3" />
                      <span className="text-muted-foreground">File Chunker</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Wifi className="w-3 h-3" />
                      <span className="text-muted-foreground">WebRTC Handler</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Peer B */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-2 border-purple-200 dark:border-purple-800 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-full bg-purple-600 dark:bg-purple-500 text-white">
                <Smartphone className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-purple-700 dark:text-purple-300">
                Peer B (Receiver)
              </h4>
            </div>
            {showLabels && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded bg-purple-100 dark:bg-purple-900/30 text-xs">
                    <div className="flex items-center gap-1 mb-1">
                      <Monitor className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      <strong className="text-purple-700 dark:text-purple-300">Platform</strong>
                    </div>
                    <span className="text-muted-foreground">Web/Mobile</span>
                  </div>
                  <div className="p-2 rounded bg-purple-100 dark:bg-purple-900/30 text-xs">
                    <div className="flex items-center gap-1 mb-1">
                      <HardDrive className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      <strong className="text-purple-700 dark:text-purple-300">Storage</strong>
                    </div>
                    <span className="text-muted-foreground">IndexedDB</span>
                  </div>
                </div>
                <div className="p-2 rounded bg-purple-100 dark:bg-purple-900/30 text-xs">
                  <strong className="text-purple-700 dark:text-purple-300">Components:</strong>
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      <span className="text-muted-foreground">Decryption Engine</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Database className="w-3 h-3" />
                      <span className="text-muted-foreground">Chunk Reassembly</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Wifi className="w-3 h-3" />
                      <span className="text-muted-foreground">WebRTC Handler</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Connection Indicator */}
        <div className="flex items-center justify-center py-2">
          <div className="flex items-center gap-4 px-6 py-3 rounded-full bg-green-100 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-700">
            <ArrowLeftRight className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-semibold text-green-700 dark:text-green-300">
              P2P Encrypted Connection
            </span>
            <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
        </div>

        {/* Middle Layer: Infrastructure */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Signaling Server */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-2 border-amber-200 dark:border-amber-800 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-full bg-amber-600 dark:bg-amber-500 text-white">
                <Server className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-amber-700 dark:text-amber-300 text-sm">
                Signaling Server
              </h4>
            </div>
            {showLabels && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  WebSocket-based connection coordination
                </p>
                <div className="space-y-1">
                  <div className="p-2 rounded bg-amber-100 dark:bg-amber-900/30 text-xs">
                    <strong className="text-amber-700 dark:text-amber-300">Purpose:</strong>
                    <br />Exchange SDP & ICE
                  </div>
                  <div className="p-2 rounded bg-amber-100 dark:bg-amber-900/30 text-xs">
                    <strong className="text-amber-700 dark:text-amber-300">Protocol:</strong>
                    <br />WebSocket (WSS)
                  </div>
                  <div className="p-2 rounded bg-amber-100 dark:bg-amber-900/30 text-xs flex items-center gap-1">
                    <Radio className="w-3 h-3" />
                    <span className="text-muted-foreground">Room-based routing</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STUN Server */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-teal-50 to-white/5 dark:from-teal-950/30 dark:to-cyan-950/30 border-2 border-teal-200 dark:border-teal-800 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-full bg-teal-600 dark:bg-teal-500 text-white">
                <Globe className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-teal-700 dark:text-teal-300 text-sm">
                STUN Server
              </h4>
            </div>
            {showLabels && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  NAT traversal for public IP discovery
                </p>
                <div className="space-y-1">
                  <div className="p-2 rounded bg-teal-100 dark:bg-teal-900/30 text-xs">
                    <strong className="text-teal-700 dark:text-teal-300">Purpose:</strong>
                    <br />Discover public IP
                  </div>
                  <div className="p-2 rounded bg-teal-100 dark:bg-teal-900/30 text-xs">
                    <strong className="text-teal-700 dark:text-teal-300">Provider:</strong>
                    <br />Google STUN
                  </div>
                  <div className="p-2 rounded bg-teal-100 dark:bg-teal-900/30 text-xs flex items-center gap-1">
                    <Wifi className="w-3 h-3" />
                    <span className="text-muted-foreground">UDP/TCP support</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* TURN Server */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30 border-2 border-rose-200 dark:border-rose-800 animate-fade-in" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-full bg-rose-600 dark:bg-rose-500 text-white">
                <Cloud className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-rose-700 dark:text-rose-300 text-sm">
                TURN Server
              </h4>
            </div>
            {showLabels && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Relay fallback for restrictive networks
                </p>
                <div className="space-y-1">
                  <div className="p-2 rounded bg-rose-100 dark:bg-rose-900/30 text-xs">
                    <strong className="text-rose-700 dark:text-rose-300">Purpose:</strong>
                    <br />Relay when P2P fails
                  </div>
                  <div className="p-2 rounded bg-rose-100 dark:bg-rose-900/30 text-xs">
                    <strong className="text-rose-700 dark:text-rose-300">Usage:</strong>
                    <br />Fallback only (~5%)
                  </div>
                  <div className="p-2 rounded bg-rose-100 dark:bg-rose-900/30 text-xs flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    <span className="text-muted-foreground">Still encrypted</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Layer: Storage & Security */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Storage Layer */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-2 border-violet-200 dark:border-violet-800 animate-fade-in" style={{ animationDelay: '500ms' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-full bg-violet-600 dark:bg-violet-500 text-white">
                <Database className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-violet-700 dark:text-violet-300">
                Storage Layer
              </h4>
            </div>
            {showLabels && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Client-side encrypted storage
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded bg-violet-100 dark:bg-violet-900/30 text-xs">
                    <div className="flex items-center gap-1 mb-1">
                      <HardDrive className="w-3 h-3" />
                      <strong className="text-violet-700 dark:text-violet-300">IndexedDB</strong>
                    </div>
                    <span className="text-muted-foreground">Encrypted keys</span>
                  </div>
                  <div className="p-2 rounded bg-violet-100 dark:bg-violet-900/30 text-xs">
                    <div className="flex items-center gap-1 mb-1">
                      <Database className="w-3 h-3" />
                      <strong className="text-violet-700 dark:text-violet-300">SessionDB</strong>
                    </div>
                    <span className="text-muted-foreground">Temp chunks</span>
                  </div>
                </div>
                <div className="p-2 rounded bg-violet-100 dark:bg-violet-900/30 text-xs">
                  <strong className="text-violet-700 dark:text-violet-300">Features:</strong>
                  <ul className="mt-1 space-y-0.5 text-muted-foreground">
                    <li>• Resumable transfers</li>
                    <li>• Encrypted metadata</li>
                    <li>• Auto-cleanup</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Security Layer */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-2 border-emerald-200 dark:border-emerald-800 animate-fade-in" style={{ animationDelay: '600ms' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-emerald-700 dark:text-emerald-300">
                Security Layer
              </h4>
            </div>
            {showLabels && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Multi-layered encryption system
                </p>
                <div className="space-y-1">
                  <div className="p-2 rounded bg-emerald-100 dark:bg-emerald-900/30 text-xs">
                    <div className="flex items-center gap-1 mb-1">
                      <Key className="w-3 h-3" />
                      <strong className="text-emerald-700 dark:text-emerald-300">Key Exchange</strong>
                    </div>
                    <span className="text-muted-foreground">ML-KEM-768 + X25519</span>
                  </div>
                  <div className="p-2 rounded bg-emerald-100 dark:bg-emerald-900/30 text-xs">
                    <div className="flex items-center gap-1 mb-1">
                      <Lock className="w-3 h-3" />
                      <strong className="text-emerald-700 dark:text-emerald-300">Encryption</strong>
                    </div>
                    <span className="text-muted-foreground">ChaCha20-Poly1305</span>
                  </div>
                  <div className="p-2 rounded bg-emerald-100 dark:bg-emerald-900/30 text-xs">
                    <div className="flex items-center gap-1 mb-1">
                      <Zap className="w-3 h-3" />
                      <strong className="text-emerald-700 dark:text-emerald-300">Ratcheting</strong>
                    </div>
                    <span className="text-muted-foreground">Triple Ratchet</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Data Flow Legend */}
      {showLabels && (
        <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border">
          <h4 className="text-sm font-semibold mb-3 text-foreground">
            System Characteristics
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h5 className="text-xs font-semibold text-foreground mb-2">
                Connection Flow
              </h5>
              <ol className="text-xs text-muted-foreground space-y-1">
                <li>1. Peers connect to signaling</li>
                <li>2. Exchange SDP via signaling</li>
                <li>3. Discover routes via STUN</li>
                <li>4. Establish P2P connection</li>
                <li>5. Transfer encrypted data</li>
              </ol>
            </div>
            <div>
              <h5 className="text-xs font-semibold text-foreground mb-2">
                Security Model
              </h5>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Zero-knowledge architecture</li>
                <li>• End-to-end encryption</li>
                <li>• Post-quantum secure</li>
                <li>• Forward secrecy</li>
                <li>• Client-side encryption</li>
              </ul>
            </div>
            <div>
              <h5 className="text-xs font-semibold text-foreground mb-2">
                Performance
              </h5>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Direct P2P transfer</li>
                <li>• 64KB chunked streaming</li>
                <li>• Parallel encryption</li>
                <li>• Resumable transfers</li>
                <li>• Low latency</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Network Status */}
      <div className="mt-6 flex items-center justify-center gap-2 text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs">Decentralized</span>
        </div>
        <span className="text-xs">•</span>
        <div className="flex items-center gap-1">
          <Shield className="w-3 h-3" />
          <span className="text-xs">End-to-End Encrypted</span>
        </div>
        <span className="text-xs">•</span>
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3" />
          <span className="text-xs">Real-time P2P</span>
        </div>
      </div>
    </div>
  );
}
