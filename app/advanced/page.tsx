'use client';

/**
 * Advanced Features Hub
 * Central hub for all advanced Tallow features and demos
 */

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Network,
  Users,
  Monitor,
  RefreshCw,
  Lock,
  ArrowLeft,
  ExternalLink,
  Zap,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

interface AdvancedFeature {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  status: 'stable' | 'beta' | 'experimental';
}

const advancedFeatures: AdvancedFeature[] = [
  {
    id: 'pqc-encryption',
    title: 'PQC Encryption Demo',
    description: 'Post-quantum cryptography in action',
    longDescription:
      'Experience quantum-resistant encryption using ML-KEM-768 (Kyber) combined with X25519 for hybrid security. Generate keys, encrypt messages, and see how Tallow protects against future quantum computer attacks.',
    href: '/advanced/pqc-demo',
    icon: <Shield className="h-6 w-6" />,
    badge: 'NIST Approved',
    badgeVariant: 'default',
    status: 'stable',
  },
  {
    id: 'onion-routing',
    title: 'Onion Routing Demo',
    description: 'Multi-hop relay routing for privacy',
    longDescription:
      'Configure and test multi-hop routing that encrypts your data in multiple layers and routes it through relay nodes. No single node knows both source and destination.',
    href: '/advanced/onion-routing',
    icon: <Network className="h-6 w-6" />,
    badge: 'Privacy',
    badgeVariant: 'secondary',
    status: 'beta',
  },
  {
    id: 'group-transfer',
    title: 'Group Transfer Demo',
    description: 'Send to multiple devices simultaneously',
    longDescription:
      'Discover nearby devices, select multiple recipients, and send files to all of them at once with individual progress tracking. Perfect for team collaboration.',
    href: '/advanced/group-transfer',
    icon: <Users className="h-6 w-6" />,
    badge: 'Multi-Device',
    badgeVariant: 'default',
    status: 'stable',
  },
  {
    id: 'screen-sharing',
    title: 'Screen Sharing with PQC',
    description: 'Encrypted screen sharing',
    longDescription:
      'Share your screen with end-to-end encryption using post-quantum cryptography. Supports multiple quality presets, system audio, and adaptive bitrate.',
    href: '/advanced/screen-sharing',
    icon: <Monitor className="h-6 w-6" />,
    badge: 'E2E Encrypted',
    badgeVariant: 'default',
    status: 'stable',
  },
  {
    id: 'resumable-transfer',
    title: 'Resumable Transfers Demo',
    description: 'Pause and resume file transfers',
    longDescription:
      'Never lose transfer progress due to connection issues. This demo shows how Tallow can automatically resume interrupted transfers from where they left off.',
    href: '/advanced/resumable-transfer',
    icon: <RefreshCw className="h-6 w-6" />,
    badge: 'Auto-Resume',
    badgeVariant: 'secondary',
    status: 'stable',
  },
  {
    id: 'password-protection',
    title: 'Password Protection Demo',
    description: 'Add passwords to encrypted files',
    longDescription:
      'Add an extra layer of security by password-protecting files before transfer. Uses Argon2id for key derivation and AES-256-GCM for encryption.',
    href: '/advanced/password-protection',
    icon: <Lock className="h-6 w-6" />,
    badge: 'Argon2id',
    badgeVariant: 'secondary',
    status: 'stable',
  },
];

function getStatusBadge(status: AdvancedFeature['status']) {
  switch (status) {
    case 'stable':
      return (
        <Badge variant="default" className="bg-green-600">
          Stable
        </Badge>
      );
    case 'beta':
      return (
        <Badge variant="secondary" className="bg-yellow-600 text-white">
          Beta
        </Badge>
      );
    case 'experimental':
      return (
        <Badge variant="destructive">
          Experimental
        </Badge>
      );
  }
}

export default function AdvancedFeaturesHub() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" aria-label="Back to home">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                  Advanced Features
                </h1>
                <p className="text-sm text-muted-foreground">
                  Explore Tallow&apos;s cutting-edge capabilities
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/app">
                <Button variant="outline">
                  <Zap className="h-4 w-4 mr-2" />
                  Main App
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Warning Banner */}
        <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-900 dark:text-yellow-100">
            <strong>Advanced Features Area</strong>
            <p className="text-yellow-700 dark:text-yellow-300 mt-1">
              These are power-user features that demonstrate Tallow&apos;s advanced capabilities.
              Some features may be in beta or experimental stages. For regular file transfers,
              use the <Link href="/app" className="underline font-medium">main app</Link>.
            </p>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {advancedFeatures.map((feature) => (
            <Link key={feature.id} href={feature.href} className="group">
              <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-primary/50 group-focus-visible:ring-2 group-focus-visible:ring-ring">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      {feature.icon}
                    </div>
                    <div className="flex items-center gap-2">
                      {feature.badge && (
                        <Badge variant={feature.badgeVariant || 'default'}>
                          {feature.badge}
                        </Badge>
                      )}
                      {getStatusBadge(feature.status)}
                    </div>
                  </div>
                  <CardTitle className="mt-4 flex items-center gap-2">
                    {feature.title}
                    <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {feature.longDescription}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Technical Overview Section */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Security Architecture</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Cryptographic Stack
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Key Exchange</span>
                  <span className="font-mono">ML-KEM-768 + X25519</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Symmetric Encryption</span>
                  <span className="font-mono">AES-256-GCM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hashing</span>
                  <span className="font-mono">BLAKE3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Password KDF</span>
                  <span className="font-mono">Argon2id</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Signatures</span>
                  <span className="font-mono">Ed25519</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Network className="h-5 w-5 text-primary" />
                Transport Layer
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Primary</span>
                  <span className="font-mono">WebRTC DataChannel</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Signaling</span>
                  <span className="font-mono">WebSocket + DTLS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Relay</span>
                  <span className="font-mono">TURN/Onion Routing</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discovery</span>
                  <span className="font-mono">mDNS + Server</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chunking</span>
                  <span className="font-mono">64KB chunks</span>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Quick Links */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Quick Navigation</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/docs">
              <Button variant="outline">
                Documentation
              </Button>
            </Link>
            <Link href="/help">
              <Button variant="outline">
                Help Center
              </Button>
            </Link>
            <Link href="/security">
              <Button variant="outline">
                Security Details
              </Button>
            </Link>
            <Link href="/features">
              <Button variant="outline">
                All Features
              </Button>
            </Link>
            <Link href="/architecture-diagrams">
              <Button variant="outline">
                Architecture Diagrams
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>
            Advanced Features Hub - Tallow File Transfer
          </p>
          <p className="mt-1">
            All demos use simulated data. Connect devices for real transfers.
          </p>
        </div>
      </footer>
    </div>
  );
}
