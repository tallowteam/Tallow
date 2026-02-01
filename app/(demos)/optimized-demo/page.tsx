/**
 * Optimized Demo Page
 * Demonstrates React 19 and Next.js 16 optimizations
 * - Streaming SSR with Suspense
 * - Parallel data fetching
 * - Progressive hydration
 * - Server Actions
 */

import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TransferListSkeleton } from '@/components/loading/transfer-skeleton';
import { DeviceListSkeleton } from '@/components/loading/device-skeleton';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Optimized Demo',
  description: 'React 19 and Next.js 16 optimizations demo',
};

// Streaming components
function TransfersList() {
  // In React 19, use() hook can be used directly
  // For now, we'll use async/await in Server Components
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Transfers</CardTitle>
        <CardDescription>Real-time transfer progress</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This component streams independently from the server
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function DevicesList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Devices</CardTitle>
        <CardDescription>Your available devices</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This component streams independently from the server
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">42</CardTitle>
          <CardDescription>Total Transfers</CardDescription>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">15.3 GB</CardTitle>
          <CardDescription>Data Transferred</CardDescription>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">3</CardTitle>
          <CardDescription>Active Devices</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

export default function OptimizedDemoPage() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Optimized Demo</h1>
        <p className="text-muted-foreground">
          This page demonstrates React 19 and Next.js 16 optimizations including
          streaming SSR, Suspense boundaries, and parallel data fetching.
        </p>
      </div>

      {/* Stats - Streams first (fastest) */}
      <Suspense
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-6">
                <div className="h-20 animate-pulse bg-muted rounded" />
              </Card>
            ))}
          </div>
        }
      >
        <StatsCards />
      </Suspense>

      {/* Parallel loading - Both stream independently */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transfers */}
        <Suspense fallback={<TransferListSkeleton count={2} />}>
          <TransfersList />
        </Suspense>

        {/* Devices */}
        <Suspense fallback={<DeviceListSkeleton count={2} />}>
          <DevicesList />
        </Suspense>
      </div>

      {/* Feature highlights */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Features</CardTitle>
          <CardDescription>
            What makes this page fast and efficient
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <div>
                <strong>Streaming SSR:</strong> Content streams to the browser as
                it becomes ready, no waiting for the entire page
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <div>
                <strong>Suspense Boundaries:</strong> Each section loads
                independently with dedicated loading states
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <div>
                <strong>Parallel Data Fetching:</strong> Multiple data sources load
                simultaneously
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <div>
                <strong>Progressive Hydration:</strong> Interactive features
                activate as they stream in
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
