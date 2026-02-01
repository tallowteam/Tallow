'use client';

import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-muted p-6">
            <WifiOff className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>

        <h1 className="mb-4 text-3xl font-bold tracking-tight">
          You&apos;re Offline
        </h1>

        <p className="mb-6 text-lg text-muted-foreground">
          It looks like you&apos;ve lost your internet connection. Don&apos;t worry, some
          features may still work with cached data.
        </p>

        <div className="space-y-4 rounded-lg border bg-card p-6 text-left">
          <h2 className="font-semibold">What you can still do:</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary">✓</span>
              <span>View previously loaded content</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary">✓</span>
              <span>Access cached files and transfers</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary">✓</span>
              <span>Prepare files for sharing</span>
            </li>
          </ul>
        </div>

        <div className="mt-8 space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try Again
          </button>

          <button
            onClick={() => window.history.back()}
            className="w-full rounded-lg border bg-background px-4 py-3 font-medium transition-colors hover:bg-muted"
          >
            Go Back
          </button>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Please check your internet connection and try again
        </p>
      </div>
    </div>
  );
}
