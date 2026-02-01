'use client';

/**
 * Onion Routing Demo Page
 * Demonstrate multi-hop relay routing for enhanced privacy
 *
 * WARNING: This feature is EXPERIMENTAL and NOT FUNCTIONAL.
 * The relay network infrastructure does not exist yet.
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  ArrowLeft,
  Network,
  Shield,
  Eye,
  EyeOff,
  Server,
  ArrowRight,
  Info,
  CheckCircle2,
  Globe,
  Lock,
  AlertTriangle,
  Construction,
} from 'lucide-react';
import { OnionRoutingConfig } from '@/components/privacy/onion-routing-config';

export default function OnionRoutingDemoPage() {
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
                  <Network className="h-6 w-6 text-primary" />
                  Onion Routing Demo
                </h1>
                <p className="text-sm text-muted-foreground">
                  Multi-Hop Relay Routing for Privacy
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="bg-amber-600 text-white">
                <Construction className="h-3 w-3 mr-1" />
                Experimental
              </Badge>
              <Badge variant="outline" className="border-red-500 text-red-500">
                Not Functional
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* CRITICAL WARNING BANNER */}
        <Alert variant="destructive" className="mb-8 border-2 border-red-500 bg-red-50 dark:bg-red-950">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-lg font-bold">Feature Not Available</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="font-semibold">
              Onion routing is an experimental feature that is NOT YET FUNCTIONAL.
            </p>
            <p className="mt-2">
              The relay network infrastructure required for onion routing has not been implemented.
              The information and configuration options shown on this page are for demonstration
              and educational purposes only. Any relay nodes displayed are mock data and do not
              represent actual working relays.
            </p>
            <p className="mt-2 text-sm">
              <strong>For secure file transfers, please use direct P2P connections.</strong> We will
              announce when onion routing becomes available for production use.
            </p>
          </AlertDescription>
        </Alert>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Eye className="h-5 w-5 text-primary mt-1" />
              <div>
                <h3 className="font-semibold">IP Masking</h3>
                <p className="text-sm text-muted-foreground">
                  Hide your IP address from recipients
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Server className="h-5 w-5 text-green-500 mt-1" />
              <div>
                <h3 className="font-semibold">Multi-Hop</h3>
                <p className="text-sm text-muted-foreground">
                  Route through multiple relay nodes
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-white mt-1" />
              <div>
                <h3 className="font-semibold">Layered Encryption</h3>
                <p className="text-sm text-muted-foreground">
                  Each hop only sees one layer
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 text-purple-500 mt-1" />
              <div>
                <h3 className="font-semibold">Tor Compatible</h3>
                <p className="text-sm text-muted-foreground">
                  Optional Tor network integration
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Info Alert */}
        <Alert className="mb-8">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Onion routing adds latency but significantly increases privacy. Your data is encrypted
            in multiple layers, like an onion, and each relay node only peels off one layer.
          </AlertDescription>
        </Alert>

        {/* Visual Diagram */}
        <Card className="p-6 mb-8">
          <CardHeader className="px-0 pt-0">
            <CardTitle>How Onion Routing Works</CardTitle>
            <CardDescription>
              Data flows through multiple encrypted layers
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="flex items-center justify-center gap-2 py-8 overflow-x-auto">
              {/* Your Device */}
              <div className="flex flex-col items-center min-w-[100px]">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm font-medium mt-2">You</span>
                <span className="text-xs text-muted-foreground">Origin</span>
              </div>

              <ArrowRight className="h-6 w-6 text-muted-foreground flex-shrink-0" />

              {/* Relay 1 */}
              <div className="flex flex-col items-center min-w-[100px]">
                <div className="w-16 h-16 rounded-full bg-white/10 dark:bg-white/20 flex items-center justify-center relative">
                  <Server className="h-8 w-8 text-white" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                    1
                  </div>
                </div>
                <span className="text-sm font-medium mt-2">Relay 1</span>
                <span className="text-xs text-muted-foreground">Entry Node</span>
              </div>

              <ArrowRight className="h-6 w-6 text-muted-foreground flex-shrink-0" />

              {/* Relay 2 */}
              <div className="flex flex-col items-center min-w-[100px]">
                <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center relative">
                  <Server className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                    2
                  </div>
                </div>
                <span className="text-sm font-medium mt-2">Relay 2</span>
                <span className="text-xs text-muted-foreground">Middle Node</span>
              </div>

              <ArrowRight className="h-6 w-6 text-muted-foreground flex-shrink-0" />

              {/* Relay 3 */}
              <div className="flex flex-col items-center min-w-[100px]">
                <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center relative">
                  <Server className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                    3
                  </div>
                </div>
                <span className="text-sm font-medium mt-2">Relay 3</span>
                <span className="text-xs text-muted-foreground">Exit Node</span>
              </div>

              <ArrowRight className="h-6 w-6 text-muted-foreground flex-shrink-0" />

              {/* Recipient */}
              <div className="flex flex-col items-center min-w-[100px]">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm font-medium mt-2">Recipient</span>
                <span className="text-xs text-muted-foreground">Destination</span>
              </div>
            </div>

            {/* Encryption Layers */}
            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-3">Encryption Layers</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500" />
                  <span>Layer 3: Only you and Relay 1 can decrypt</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-white/20" />
                  <span>Layer 2: Only Relay 1 and Relay 2 can decrypt</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-purple-500" />
                  <span>Layer 1: Only Relay 2 and Relay 3 can decrypt</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-orange-500" />
                  <span>Payload: Only Relay 3 and Recipient can decrypt</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Component */}
        <Card className="p-6 mb-8">
          <OnionRoutingConfig />
        </Card>

        {/* Privacy Benefits */}
        <Card className="p-6 mb-8">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="flex items-center gap-2">
              <EyeOff className="h-5 w-5" />
              Privacy Benefits
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">No Single Point of Trust</p>
                  <p className="text-sm text-muted-foreground">
                    No single relay knows both source and destination
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Traffic Analysis Resistance</p>
                  <p className="text-sm text-muted-foreground">
                    Difficult to correlate incoming and outgoing traffic
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Geographic Distribution</p>
                  <p className="text-sm text-muted-foreground">
                    Route through relays in different jurisdictions
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Forward Secrecy</p>
                  <p className="text-sm text-muted-foreground">
                    Compromised keys do not reveal past traffic
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trade-offs */}
        <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-3 mb-8">
          <Info className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-900 dark:text-yellow-100">
            <strong>Trade-offs</strong>
            <p className="text-yellow-700 dark:text-yellow-300 mt-1">
              Onion routing increases latency (typically 100-500ms per hop) and reduces throughput.
              For large file transfers, consider using direct P2P with just the end-to-end encryption.
              Onion routing is best for metadata-sensitive transfers where privacy is paramount.
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-center gap-4">
          <Link href="/advanced">
            <Button variant="outline" size="lg">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Advanced Hub
            </Button>
          </Link>
          <Link href="/app/settings">
            <Button size="lg">
              Configure in Settings
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
