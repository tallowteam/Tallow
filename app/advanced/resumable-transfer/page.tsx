'use client';

/**
 * Resumable Transfers Demo Page
 * Demonstrate pause/resume file transfer functionality
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  RefreshCw,
  Shield,
  Wifi,
  WifiOff,
  Info,
  CheckCircle2,
  Pause,
  Play,
  Database,
  Clock,
} from 'lucide-react';
import { ResumableTransferExample } from '@/components/app/ResumableTransferExample';

export default function ResumableTransferDemoPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/advanced">
                <Button variant="ghost" size="icon" aria-label="Back to Advanced Features">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <RefreshCw className="h-6 w-6 text-primary" />
                  Resumable Transfers Demo
                </h1>
                <p className="text-sm text-muted-foreground">
                  Pause, Resume, and Never Lose Progress
                </p>
              </div>
            </div>
            <Badge variant="default" className="bg-green-600">
              Stable
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Pause className="h-5 w-5 text-primary mt-1" />
              <div>
                <h3 className="font-semibold">Manual Pause</h3>
                <p className="text-sm text-muted-foreground">
                  Pause transfers anytime
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start gap-3">
              <WifiOff className="h-5 w-5 text-yellow-500 mt-1" />
              <div>
                <h3 className="font-semibold">Auto-Recovery</h3>
                <p className="text-sm text-muted-foreground">
                  Handles disconnections
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Database className="h-5 w-5 text-white mt-1" />
              <div>
                <h3 className="font-semibold">State Persistence</h3>
                <p className="text-sm text-muted-foreground">
                  IndexedDB storage
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-500 mt-1" />
              <div>
                <h3 className="font-semibold">Integrity Check</h3>
                <p className="text-sm text-muted-foreground">
                  BLAKE3 verification
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Info Alert */}
        <Alert className="mb-8">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Resumable transfers save progress locally so you can continue where you left off,
            even after browser restarts, network issues, or manual pauses. Large files are
            especially suited for this feature.
          </AlertDescription>
        </Alert>

        {/* How It Works Diagram */}
        <Card className="p-6 mb-8">
          <CardHeader className="px-0 pt-0">
            <CardTitle>How Resumable Transfers Work</CardTitle>
            <CardDescription>
              Chunk-based transfer with persistent state tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left: Transfer Process */}
              <div className="space-y-4">
                <h4 className="font-medium">Transfer Process</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-medium">File Chunking</p>
                      <p className="text-sm text-muted-foreground">
                        File split into 64KB chunks for transfer
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-medium">State Tracking</p>
                      <p className="text-sm text-muted-foreground">
                        Each chunk receipt is logged to IndexedDB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Integrity Verification</p>
                      <p className="text-sm text-muted-foreground">
                        BLAKE3 hash verifies each chunk integrity
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                      4
                    </div>
                    <div>
                      <p className="font-medium">Resume Detection</p>
                      <p className="text-sm text-muted-foreground">
                        On reconnect, negotiate starting chunk
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Visual Diagram */}
              <div className="space-y-4">
                <h4 className="font-medium">Chunk Progress</h4>
                <div className="p-4 bg-muted/30 rounded-lg">
                  {/* Chunk visualization */}
                  <div className="grid grid-cols-10 gap-1 mb-4">
                    {Array.from({ length: 100 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-full aspect-square rounded-sm ${
                          i < 35
                            ? 'bg-green-500'
                            : i === 35
                              ? 'bg-yellow-500 animate-pulse'
                              : 'bg-muted'
                        }`}
                        title={`Chunk ${i + 1}`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-sm bg-green-500" />
                      <span>Completed (35%)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-sm bg-yellow-500" />
                      <span>In Progress</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-sm bg-muted" />
                      <span>Pending</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  If connection is lost at 35%, resume will start from chunk 36
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Demo Component */}
        <Card className="p-6 mb-8">
          <ResumableTransferExample />
        </Card>

        {/* Features */}
        <Card className="p-6 mb-8">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Key Features
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Auto-Resume on Reconnect</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically continues transfer when connection is restored
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Manual Pause/Resume</p>
                  <p className="text-sm text-muted-foreground">
                    Pause transfers to free up bandwidth, resume later
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Cross-Session Persistence</p>
                  <p className="text-sm text-muted-foreground">
                    State saved to IndexedDB, survives browser restarts
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Progress Recovery</p>
                  <p className="text-sm text-muted-foreground">
                    Resume from exact chunk where transfer was interrupted
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Chunk Verification</p>
                  <p className="text-sm text-muted-foreground">
                    BLAKE3 ensures integrity of each transferred chunk
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Bandwidth Management</p>
                  <p className="text-sm text-muted-foreground">
                    Configurable chunk size and retry limits
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scenarios */}
        <Card className="p-6 mb-8">
          <CardHeader className="px-0 pt-0">
            <CardTitle>When Resumable Transfers Help</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <WifiOff className="h-5 w-5 text-yellow-500" />
                  <h4 className="font-medium">Network Issues</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Unstable WiFi, mobile network switching, or temporary outages
                </p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-white" />
                  <h4 className="font-medium">Long Transfers</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Large files that take hours - pause overnight, continue tomorrow
                </p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Wifi className="h-5 w-5 text-green-500" />
                  <h4 className="font-medium">Bandwidth Control</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Pause transfer during video calls or gaming, resume later
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Details */}
        <Card className="p-6 mb-8">
          <CardHeader className="px-0 pt-0">
            <CardTitle>Technical Implementation</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="font-medium mb-1">Chunk Size</p>
                <p className="text-muted-foreground font-mono">64 KB</p>
              </div>
              <div>
                <p className="font-medium mb-1">State Storage</p>
                <p className="text-muted-foreground font-mono">IndexedDB</p>
              </div>
              <div>
                <p className="font-medium mb-1">Hash Algorithm</p>
                <p className="text-muted-foreground font-mono">BLAKE3</p>
              </div>
              <div>
                <p className="font-medium mb-1">Resume Timeout</p>
                <p className="text-muted-foreground font-mono">30 seconds</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-center gap-4">
          <Link href="/advanced">
            <Button variant="outline" size="lg">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Advanced Hub
            </Button>
          </Link>
          <Link href="/app">
            <Button size="lg">
              <Play className="w-4 h-4 mr-2" />
              Start Transfer
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
