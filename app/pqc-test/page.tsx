'use client';

/**
 * PQC Test Page
 * Test post-quantum cryptography integration
 */

import { PQCTransferDemo } from '@/components/transfer/pqc-transfer-demo';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, Shield, CheckCircle2 } from 'lucide-react';

export default function PQCTestPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/app">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Post-Quantum Crypto Test</h1>
            <p className="text-muted-foreground">
              Test quantum-resistant file transfers
            </p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Shield className="w-5 h-5 text-accent" />
              <h3 className="font-semibold">Zero-Knowledge</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Files encrypted end-to-end, server never sees plaintext
            </p>
          </Card>
        </div>

        {/* Main Demo */}
        <PQCTransferDemo />

        {/* Technical Details */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Technical Stack</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium mb-1">Key Exchange</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• ML-KEM-768 (Post-Quantum)</li>
                <li>• X25519 (Classical ECDH)</li>
                <li>• BLAKE3-based KDF</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">Encryption</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• AES-256-GCM</li>
                <li>• Web Crypto API</li>
                <li>• Authenticated encryption</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">Hashing</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• BLAKE3 (fastest)</li>
                <li>• Per-chunk verification</li>
                <li>• Full file integrity check</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">Transport</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• WebRTC Data Channels</li>
                <li>• P2P direct transfer</li>
                <li>• No server intermediary</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* How It Works */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">How It Works</h3>
          <div className="space-y-4 text-sm">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <p className="font-medium mb-1">Generate Keypairs</p>
                <p className="text-muted-foreground">
                  Both parties generate hybrid keypairs (Kyber + X25519)
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
                <p className="font-medium mb-1">Encrypt & Transfer</p>
                <p className="text-muted-foreground">
                  File split into chunks, each encrypted with AES-256-GCM and verified with BLAKE3
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Security Notice */}
        <Card className="p-4 bg-primary/5 border-primary/20">
          <p className="text-sm">
            <strong>Security Note:</strong> This implementation uses hybrid post-quantum
            cryptography to protect against both classical and quantum computer attacks.
            Public key exchange should happen over an authenticated channel (e.g., in-person
            QR code scan) for maximum security.
          </p>
        </Card>

        {/* Back Button */}
        <div className="flex justify-center pt-4">
          <Link href="/app">
            <Button variant="outline" size="lg">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Main App
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
