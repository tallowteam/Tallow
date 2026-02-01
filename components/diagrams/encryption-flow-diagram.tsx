"use client"

import {
  Key,
  ArrowRight,
  FileText,
  Scissors,
  Lock,
  Shield,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EncryptionFlowDiagramProps {
  className?: string;
  showLabels?: boolean;
}

/**
 * Encryption Flow Diagram
 *
 * Visual representation of Tallow's post-quantum encryption process:
 * 1. ML-KEM-768 + X25519 hybrid key generation
 * 2. Secure key exchange between peers
 * 3. File chunking into 64KB segments
 * 4. Per-chunk ChaCha20-Poly1305 encryption
 * 5. Encrypted data stream transmission
 *
 * Educational diagram showing the complete encryption pipeline
 */
export function EncryptionFlowDiagram({ className, showLabels = true }: EncryptionFlowDiagramProps) {
  return (
    <div className={cn('w-full p-6 md:p-8', className)}>
      {/* Title */}
      <div className="mb-8 text-center">
        <h3 className="text-2xl font-semibold mb-2 text-foreground">
          Post-Quantum Encryption Flow
        </h3>
        <p className="text-sm text-muted-foreground">
          Hybrid ML-KEM-768 + X25519 with ChaCha20-Poly1305
        </p>
      </div>

      {/* Main Flow */}
      <div className="space-y-6">
        {/* Step 1: Key Generation */}
        <div className="relative">
          <div className="flex items-start gap-4 p-5 rounded-xl bg-gradient-to-r from-white/5 to-purple-50 dark:from-white/10 dark:to-purple-950/30 border-2 border-white/20 dark:border-white/10 animate-fade-in">
            <div className="p-3 rounded-full bg-white/20 dark:bg-white/20 text-white flex-shrink-0">
              <Key className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-white mb-2">
                1. Hybrid Key Generation
              </h4>
              {showLabels && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-white" />
                    <p className="text-xs text-muted-foreground">
                      <strong>ML-KEM-768:</strong> Post-quantum key encapsulation (NIST standard)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <p className="text-xs text-muted-foreground">
                      <strong>X25519:</strong> Classical elliptic curve for backward compatibility
                    </p>
                  </div>
                  <p className="text-xs text-white font-medium mt-2">
                    Generates: Public key + Private key pairs for both algorithms
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-center py-2">
            <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />
          </div>
        </div>

        {/* Step 2: Key Exchange */}
        <div className="relative">
          <div className="flex items-start gap-4 p-5 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-2 border-purple-200 dark:border-purple-800 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="p-3 rounded-full bg-purple-600 dark:bg-purple-500 text-white flex-shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">
                2. Secure Key Exchange
              </h4>
              {showLabels && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Exchange public keys over WebRTC DataChannel
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    <div className="p-2 rounded bg-background/50 text-xs">
                      <strong className="text-purple-600 dark:text-purple-400">Peer A</strong>
                      <br />Sends: PubKey<sub>ML-KEM</sub> + PubKey<sub>X25519</sub>
                    </div>
                    <div className="p-2 rounded bg-background/50 text-xs">
                      <strong className="text-pink-600 dark:text-pink-400">Peer B</strong>
                      <br />Sends: PubKey<sub>ML-KEM</sub> + PubKey<sub>X25519</sub>
                    </div>
                  </div>
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-2">
                    Result: Shared secret derived from both algorithms (256-bit)
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-center py-2">
            <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />
          </div>
        </div>

        {/* Step 3: File Chunking */}
        <div className="relative">
          <div className="flex items-start gap-4 p-5 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-2 border-orange-200 dark:border-orange-800 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="p-3 rounded-full bg-orange-600 dark:bg-orange-500 text-white flex-shrink-0">
              <Scissors className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-orange-700 dark:text-orange-300 mb-2">
                3. File Chunking
              </h4>
              {showLabels && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <p className="text-xs text-muted-foreground">
                      Split file into <strong>64KB chunks</strong> for efficient streaming
                    </p>
                  </div>
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((chunk) => (
                      <div
                        key={chunk}
                        className="flex-1 h-6 rounded bg-orange-200 dark:bg-orange-800 flex items-center justify-center text-xs font-mono text-orange-900 dark:text-orange-100"
                      >
                        {chunk}
                      </div>
                    ))}
                    <div className="flex items-center justify-center text-xs text-muted-foreground">
                      ...
                    </div>
                  </div>
                  <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mt-2">
                    Each chunk processed independently for parallel encryption
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-center py-2">
            <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />
          </div>
        </div>

        {/* Step 4: Per-Chunk Encryption */}
        <div className="relative">
          <div className="flex items-start gap-4 p-5 rounded-xl bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-950/30 dark:to-teal-950/30 border-2 border-green-200 dark:border-green-800 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="p-3 rounded-full bg-green-600 dark:bg-green-500 text-white flex-shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">
                4. ChaCha20-Poly1305 Encryption
              </h4>
              {showLabels && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Each chunk encrypted with authenticated encryption
                  </p>
                  <div className="p-3 rounded bg-background/50 border border-green-300 dark:border-green-700 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Algorithm:</span>
                      <span className="font-mono text-green-600 dark:text-green-400">
                        ChaCha20-Poly1305
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Key Size:</span>
                      <span className="font-mono text-green-600 dark:text-green-400">
                        256 bits
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Nonce:</span>
                      <span className="font-mono text-green-600 dark:text-green-400">
                        96 bits (unique per chunk)
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Auth Tag:</span>
                      <span className="font-mono text-green-600 dark:text-green-400">
                        128 bits (Poly1305)
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-2">
                    Provides confidentiality + integrity + authenticity
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-center py-2">
            <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />
          </div>
        </div>

        {/* Step 5: Encrypted Transfer */}
        <div className="relative">
          <div className="flex items-start gap-4 p-5 rounded-xl bg-gradient-to-r from-indigo-50 to-white/5 dark:from-indigo-950/30 dark:to-white/10 border-2 border-indigo-200 dark:border-indigo-800 animate-fade-in" style={{ animationDelay: '400ms' }}>
            <div className="p-3 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-indigo-700 dark:text-indigo-300 mb-2">
                5. Secure Data Stream
              </h4>
              {showLabels && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Encrypted chunks transmitted over P2P connection
                  </p>
                  <div className="flex items-center gap-2 p-2 rounded bg-indigo-100 dark:bg-indigo-900/30">
                    <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                      End-to-End Encrypted + Post-Quantum Secure
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Security Properties */}
      {showLabels && (
        <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border">
          <h4 className="text-sm font-semibold mb-3 text-foreground">
            Security Properties
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="text-foreground">Post-Quantum Secure:</strong>
                <span className="text-muted-foreground"> Resistant to quantum attacks via ML-KEM-768</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="text-foreground">Forward Secrecy:</strong>
                <span className="text-muted-foreground"> Unique keys per session</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="text-foreground">Authenticated Encryption:</strong>
                <span className="text-muted-foreground"> Poly1305 MAC prevents tampering</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="text-foreground">Streaming Performance:</strong>
                <span className="text-muted-foreground"> 64KB chunks optimize throughput</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
