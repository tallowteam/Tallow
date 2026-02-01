'use client';

/**
 * PQC Encryption Demo Page
 * Standalone demonstration of post-quantum cryptography
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Shield, CheckCircle2, Info } from 'lucide-react';
import { PQCEncryptionDemo } from '@/components/demos/pqc-encryption-demo';

export default function PQCDemoPage() {
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
                  <Shield className="h-6 w-6 text-primary" />
                  PQC Encryption Demo
                </h1>
                <p className="text-sm text-muted-foreground">
                  Post-Quantum Cryptography in Action
                </p>
              </div>
            </div>
            <Badge variant="default" className="bg-green-600">
              NIST Approved
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Quantum-Resistant</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              ML-KEM-768 (Kyber) protects against quantum computer attacks
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold">Hybrid Security</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Combines post-quantum (Kyber) with classical (X25519) crypto
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5 text-white" />
              <h3 className="font-semibold">Zero-Knowledge</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Files encrypted end-to-end, server never sees plaintext
            </p>
          </Card>
        </div>

        {/* Main Demo Component */}
        <Card className="p-6 mb-8">
          <PQCEncryptionDemo />
        </Card>

        {/* Technical Details */}
        <Card className="p-6 mb-8">
          <CardHeader className="px-0 pt-0">
            <CardTitle>Technical Stack</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="font-medium mb-1">Key Exchange</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>ML-KEM-768</li>
                  <li>X25519 (Classical)</li>
                  <li>BLAKE3-based KDF</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-1">Encryption</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>AES-256-GCM</li>
                  <li>Web Crypto API</li>
                  <li>Authenticated encryption</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-1">Hashing</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>BLAKE3 (fastest)</li>
                  <li>Per-chunk verification</li>
                  <li>Full file integrity</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-1">Transport</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>WebRTC DataChannel</li>
                  <li>P2P direct transfer</li>
                  <li>No server intermediary</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="p-6 mb-8">
          <CardHeader className="px-0 pt-0">
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="space-y-4 text-sm">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium mb-1">Generate Keypairs</p>
                  <p className="text-muted-foreground">
                    Both parties generate hybrid keypairs (ML-KEM-768 + X25519)
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium mb-1">Exchange Public Keys</p>
                  <p className="text-muted-foreground">
                    Share public keys via QR code, manual copy, or WebRTC signaling
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium mb-1">Key Encapsulation</p>
                  <p className="text-muted-foreground">
                    Sender encapsulates shared secrets using both Kyber and X25519
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <p className="font-medium mb-1">Derive Session Keys</p>
                  <p className="text-muted-foreground">
                    Combine secrets with BLAKE3 to create encryption and auth keys
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  5
                </div>
                <div>
                  <p className="font-medium mb-1">Encrypt and Transfer</p>
                  <p className="text-muted-foreground">
                    File split into chunks, each encrypted with AES-256-GCM and verified with BLAKE3
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="p-4 bg-white/5 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-lg flex items-start gap-3">
          <Info className="h-5 w-5 text-white flex-shrink-0 mt-0.5" />
          <div className="text-sm text-white">
            <strong>Security Note</strong>
            <p className="text-white mt-1">
              This implementation uses hybrid post-quantum cryptography to protect against both
              classical and quantum computer attacks. Public key exchange should happen over an
              authenticated channel (e.g., in-person QR code scan) for maximum security.
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-center gap-4 mt-8">
          <Link href="/advanced">
            <Button variant="outline" size="lg">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Advanced Hub
            </Button>
          </Link>
          <Link href="/app">
            <Button size="lg">
              Try Real Transfer
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
