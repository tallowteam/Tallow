'use client';

/**
 * File Transfer Demo Page
 *
 * Interactive demonstration of P2P WebRTC file transfer with:
 * - Real-time speed metrics
 * - Chunking visualization
 * - Network adaptation simulation
 */

import { TransferSpeedDemo } from '@/components/demos/transfer-speed-demo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Zap,
  Package,
  Wifi,
  Activity,
  HardDrive,
  RefreshCw,
  Shield,
  Info,
  HelpCircle,
  Play,
  Pause,
} from 'lucide-react';

export default function TransferDemoPage() {
  return (
    <div className="min-h-[calc(100vh-12rem)] bg-background">
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
        {/* Page Header with Instructions */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Zap className="h-7 w-7 text-amber-500" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                File Transfer Demo
              </h1>
              <p className="text-muted-foreground">
                Experience P2P WebRTC file transfer with real-time metrics
              </p>
            </div>
          </div>
        </div>

        {/* Quick Start Instructions */}
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Info className="h-5 w-5 text-amber-500" />
              Quick Start Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  1
                </div>
                <div>
                  <div className="font-medium flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Start Transfer
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Click the Start button to begin the simulated 50MB transfer
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  2
                </div>
                <div>
                  <div className="font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Watch Metrics
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Observe real-time speed, ETA, and chunk progress
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  3
                </div>
                <div>
                  <div className="font-medium flex items-center gap-2">
                    <Pause className="h-4 w-4" />
                    Try Controls
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Pause, resume, or reset the transfer at any time
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-amber-700 dark:text-amber-300 bg-amber-500/10 rounded-lg p-3">
              <strong>Note:</strong> This is a simulation. No actual files are transferred. The demo showcases
              Tallow's transfer UI, chunking strategy, and real-time metrics visualization.
            </p>
          </CardContent>
        </Card>

        {/* Main Demo Component */}
        <TransferSpeedDemo />

        {/* How It Works Section */}
        <div className="rounded-2xl bg-muted/30 border border-border p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            How It Works
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                These are the core technologies powering Tallow's file transfer system
              </TooltipContent>
            </Tooltip>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="cursor-help hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10">
                        <Package className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Chunking Strategy</h3>
                        <p className="text-sm text-muted-foreground">
                          64KB chunks for efficient WebRTC transfer
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                Files are split into 64KB chunks, enabling better flow control,
                parallel processing, and resumable transfers if interrupted.
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="cursor-help hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-white/20/10">
                        <Wifi className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Network Adaptation</h3>
                        <p className="text-sm text-muted-foreground">
                          Auto-adjusts to network conditions
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                Transfer speed dynamically adapts to network quality, handling
                varying bandwidth and packet loss gracefully.
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="cursor-help hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <Activity className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Real-time Metrics</h3>
                        <p className="text-sm text-muted-foreground">
                          Live speed graph and statistics
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                Monitor transfer speed, progress, ETA, and WebRTC DataChannel
                statistics in real-time with interactive visualizations.
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="cursor-help hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <Shield className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">P2P Direct Transfer</h3>
                        <p className="text-sm text-muted-foreground">
                          No server intermediaries
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                Data flows directly between peers using WebRTC, ensuring maximum
                privacy and speed without server bottlenecks.
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Technical Details */}
        <div className="rounded-2xl bg-muted/30 border border-border p-6">
          <h2 className="text-xl font-semibold mb-6">Technical Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <HardDrive className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-semibold">WebRTC DataChannels</h3>
                  <p className="text-sm text-muted-foreground">
                    Binary data via SCTP protocol
                  </p>
                </div>
              </div>
              <ul className="text-sm text-muted-foreground space-y-2 ml-12">
                <li className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">SCTP</Badge>
                  Reliable ordered delivery
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">ICE</Badge>
                  NAT traversal support
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20/10">
                  <RefreshCw className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Resumable Transfers</h3>
                  <p className="text-sm text-muted-foreground">
                    Continue interrupted transfers
                  </p>
                </div>
              </div>
              <ul className="text-sm text-muted-foreground space-y-2 ml-12">
                <li className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">State</Badge>
                  Chunk-level checkpointing
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">Verify</Badge>
                  Integrity verification
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Shield className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold">End-to-End Encryption</h3>
                  <p className="text-sm text-muted-foreground">
                    Post-quantum cryptography
                  </p>
                </div>
              </div>
              <ul className="text-sm text-muted-foreground space-y-2 ml-12">
                <li className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">ML-KEM</Badge>
                  Key encapsulation
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">AES-GCM</Badge>
                  256-bit encryption
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 p-4 text-center cursor-help hover:shadow-md transition-shadow">
                <div className="text-2xl md:text-3xl font-bold text-amber-600 dark:text-amber-400">15 MB/s</div>
                <div className="text-sm text-muted-foreground">Max Speed</div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              Theoretical maximum transfer speed in optimal conditions
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="rounded-xl bg-gradient-to-br from-white/20/10 to-white/50/5 border border-white/20 p-4 text-center cursor-help hover:shadow-md transition-shadow">
                <div className="text-2xl md:text-3xl font-bold text-white">64 KB</div>
                <div className="text-sm text-muted-foreground">Chunk Size</div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              Each file is split into 64KB chunks for efficient transfer
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 p-4 text-center cursor-help hover:shadow-md transition-shadow">
                <div className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">100ms</div>
                <div className="text-sm text-muted-foreground">Update Rate</div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              Metrics are updated every 100 milliseconds
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 p-4 text-center cursor-help hover:shadow-md transition-shadow">
                <div className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400">50 MB</div>
                <div className="text-sm text-muted-foreground">Demo Size</div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              This demo simulates transferring a 50MB file
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
