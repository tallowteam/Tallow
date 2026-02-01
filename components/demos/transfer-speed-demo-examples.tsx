'use client';

/**
 * Integration examples for TransferSpeedDemo component
 *
 * This file demonstrates various ways to use the TransferSpeedDemo
 * component in different contexts within your application.
 */

import { useState } from 'react';
import { TransferSpeedDemo } from './transfer-speed-demo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Example 1: Simple standalone usage
 */
export function StandaloneDemo() {
  return (
    <div className="container mx-auto p-8">
      <TransferSpeedDemo />
    </div>
  );
}

/**
 * Example 2: In a tabbed interface
 */
export function TabbedDemo() {
  return (
    <Tabs defaultValue="demo" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="demo">Live Demo</TabsTrigger>
        <TabsTrigger value="docs">Documentation</TabsTrigger>
        <TabsTrigger value="stats">Statistics</TabsTrigger>
      </TabsList>

      <TabsContent value="demo" className="mt-6">
        <TransferSpeedDemo />
      </TabsContent>

      <TabsContent value="docs" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>How P2P Transfer Works</CardTitle>
            <CardDescription>
              Learn about WebRTC DataChannels and chunked file transfer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Documentation content here...
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="stats" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Transfer Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Historical transfer data...
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

/**
 * Example 3: Collapsible demo section
 */
export function CollapsibleDemo() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Interactive Transfer Demo</h3>
          <p className="text-sm text-muted-foreground">
            See how fast P2P transfer can be
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls="transfer-demo-content"
          aria-label={isExpanded ? 'Hide transfer demo' : 'Show transfer demo'}
        >
          {isExpanded ? 'Hide Demo' : 'Show Demo'}
        </Button>
      </div>

      {isExpanded && (
        <div id="transfer-demo-content" className="mt-4" role="region" aria-label="Transfer demo content">
          <TransferSpeedDemo />
        </div>
      )}
    </div>
  );
}

/**
 * Example 4: Side-by-side comparison
 */
export function ComparisonDemo() {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Traditional Upload</CardTitle>
          <CardDescription>
            Files uploaded to server, then downloaded by recipient
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground">
                Average speed: 2-5 MB/s
              </p>
              <p className="text-sm text-muted-foreground">
                Privacy: Files stored on server
              </p>
              <p className="text-sm text-muted-foreground">
                Cost: Server storage and bandwidth
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>P2P Transfer (Tallow)</CardTitle>
          <CardDescription>
            Direct peer-to-peer transfer with encryption
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransferSpeedDemo />
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Example 5: Educational walkthrough
 */
export function EducationalWalkthrough() {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: 'Introduction to P2P Transfer',
      content: 'Peer-to-peer file transfer allows direct data exchange between devices without intermediary servers.',
    },
    {
      title: 'See It In Action',
      content: <TransferSpeedDemo />,
    },
    {
      title: 'Benefits',
      content: 'P2P transfer offers faster speeds, better privacy, and lower costs compared to traditional methods.',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full ${
                idx === step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <h2 className="text-2xl font-bold">{steps[step]?.title || ''}</h2>
      </div>

      <div className="min-h-[400px]">
        {steps[step] && typeof steps[step].content === 'string' ? (
          <Card>
            <CardContent className="p-8">
              <p className="text-lg text-muted-foreground text-center">
                {steps[step].content as string}
              </p>
            </CardContent>
          </Card>
        ) : (
          steps[step]?.content
        )}
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
        >
          Previous
        </Button>
        <Button
          onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
          disabled={step === steps.length - 1}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

/**
 * Example 6: Minimal embedded version
 */
export function MinimalDemo() {
  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
      <p className="text-sm text-muted-foreground mb-4">
        Try our interactive file transfer demo:
      </p>
      <TransferSpeedDemo />
    </div>
  );
}

/**
 * Example 7: Feature showcase
 */
export function FeatureShowcase() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Experience Lightning-Fast Transfers</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          See how Tallow's P2P technology delivers unmatched speed and privacy
        </p>
      </div>

      <TransferSpeedDemo />

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fast</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Direct peer-to-peer connections achieve maximum speed without server bottlenecks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Private</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              End-to-end encryption ensures your files remain completely private
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reliable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Chunked transfer with automatic retry ensures successful delivery
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
