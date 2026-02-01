'use client';

/**
 * Group Transfer Demo Page
 * Demonstrate multi-device file transfers
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Users,
  Shield,
  Wifi,
  Send,
  Info,
  CheckCircle2,
  Smartphone,
  Laptop,
  Monitor,
  Tablet,
} from 'lucide-react';
import { GroupTransferExample } from '@/components/examples/group-transfer-example';

export default function GroupTransferDemoPage() {
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
                  <Users className="h-6 w-6 text-primary" />
                  Group Transfer Demo
                </h1>
                <p className="text-sm text-muted-foreground">
                  Send Files to Multiple Devices Simultaneously
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
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Wifi className="h-5 w-5 text-primary mt-1" />
              <div>
                <h3 className="font-semibold">Auto Discovery</h3>
                <p className="text-sm text-muted-foreground">
                  Find nearby devices automatically
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-green-500 mt-1" />
              <div>
                <h3 className="font-semibold">Multi-Select</h3>
                <p className="text-sm text-muted-foreground">
                  Send to 10+ devices at once
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Send className="h-5 w-5 text-white mt-1" />
              <div>
                <h3 className="font-semibold">Parallel Transfer</h3>
                <p className="text-sm text-muted-foreground">
                  Independent progress per device
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-purple-500 mt-1" />
              <div>
                <h3 className="font-semibold">PQC Protected</h3>
                <p className="text-sm text-muted-foreground">
                  Each connection encrypted
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Info Alert */}
        <Alert className="mb-8">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Group transfer discovers nearby devices and allows you to send the same file to multiple
            recipients simultaneously. Each transfer runs independently with its own progress tracking.
          </AlertDescription>
        </Alert>

        {/* Visual Diagram */}
        <Card className="p-6 mb-8">
          <CardHeader className="px-0 pt-0">
            <CardTitle>How Group Transfer Works</CardTitle>
            <CardDescription>
              One file, multiple recipients, parallel transfers
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="flex flex-col items-center py-8">
              {/* Your Device */}
              <div className="flex flex-col items-center mb-8">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Laptop className="h-10 w-10 text-primary" />
                </div>
                <span className="text-sm font-medium mt-2">Your Device</span>
                <span className="text-xs text-muted-foreground">Sender</span>
              </div>

              {/* Connection Lines */}
              <div className="w-full max-w-md h-16 relative">
                <div className="absolute left-1/2 top-0 w-px h-4 bg-primary" />
                <div className="absolute left-0 right-0 top-4 h-px bg-primary" />
                <div className="absolute left-[12.5%] top-4 w-px h-12 bg-primary" />
                <div className="absolute left-[37.5%] top-4 w-px h-12 bg-primary" />
                <div className="absolute left-[62.5%] top-4 w-px h-12 bg-primary" />
                <div className="absolute left-[87.5%] top-4 w-px h-12 bg-primary" />
              </div>

              {/* Recipients */}
              <div className="grid grid-cols-4 gap-8 w-full max-w-md">
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <Smartphone className="h-7 w-7 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-xs font-medium mt-2 text-center">Phone</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-white/10 dark:bg-white/20 flex items-center justify-center">
                    <Tablet className="h-7 w-7 text-white" />
                  </div>
                  <span className="text-xs font-medium mt-2 text-center">Tablet</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <Laptop className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-xs font-medium mt-2 text-center">Laptop</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                    <Monitor className="h-7 w-7 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-xs font-medium mt-2 text-center">Desktop</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Demo Component */}
        <Card className="p-6 mb-8">
          <GroupTransferExample />
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
                  <p className="font-medium">Automatic Device Discovery</p>
                  <p className="text-sm text-muted-foreground">
                    Finds devices on your local network using mDNS and server discovery
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Individual Progress Tracking</p>
                  <p className="text-sm text-muted-foreground">
                    Monitor speed and progress for each recipient independently
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Bandwidth Management</p>
                  <p className="text-sm text-muted-foreground">
                    Configurable bandwidth limits per recipient to avoid network saturation
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Recent Partners</p>
                  <p className="text-sm text-muted-foreground">
                    Prioritize devices you frequently transfer with
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Connection Quality Indicators</p>
                  <p className="text-sm text-muted-foreground">
                    See signal strength and connection quality before sending
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Partial Failure Handling</p>
                  <p className="text-sm text-muted-foreground">
                    Some transfers can fail while others succeed without affecting the group
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Use Cases */}
        <Card className="p-6 mb-8">
          <CardHeader className="px-0 pt-0">
            <CardTitle>Common Use Cases</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium mb-2">Team Meetings</h4>
                <p className="text-sm text-muted-foreground">
                  Share presentation slides or documents with all meeting participants at once
                </p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium mb-2">Family Photos</h4>
                <p className="text-sm text-muted-foreground">
                  Send vacation photos to all family members devices simultaneously
                </p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium mb-2">Software Distribution</h4>
                <p className="text-sm text-muted-foreground">
                  Distribute software updates or installers to multiple workstations
                </p>
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
              <Users className="w-4 h-4 mr-2" />
              Try Group Transfer
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
