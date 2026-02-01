"use client"

import {
  Key,
  ArrowRight,
  RotateCw,
  Send,
  Download,
  Shield,
  Lock,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TripleRatchetDiagramProps {
  className?: string;
  showLabels?: boolean;
}

/**
 * Triple Ratchet Protocol Diagram
 *
 * Visual representation of the Triple Ratchet encryption system:
 * - Root Chain: Master key derivation
 * - Sending Chain: Outbound message keys
 * - Receiving Chain: Inbound message keys
 *
 * Provides forward secrecy and post-compromise security for long-lived sessions
 */
export function TripleRatchetDiagram({ className, showLabels = true }: TripleRatchetDiagramProps) {
  return (
    <div className={cn('w-full p-6 md:p-8', className)}>
      {/* Title */}
      <div className="mb-8 text-center">
        <h3 className="text-2xl font-semibold mb-2 text-foreground">
          Triple Ratchet Protocol
        </h3>
        <p className="text-sm text-muted-foreground">
          Forward secrecy and post-compromise security for continuous sessions
        </p>
      </div>

      {/* Main Diagram */}
      <div className="space-y-8">
        {/* Root Chain */}
        <div className="relative">
          <div className="flex items-start gap-4 p-6 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border-2 border-purple-200 dark:border-purple-800 animate-fade-in">
            <div className="p-3 rounded-full bg-purple-600 dark:bg-purple-500 text-white flex-shrink-0">
              <Key className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <h4 className="font-semibold text-purple-700 dark:text-purple-300">
                  Root Chain (Master Ratchet)
                </h4>
                <RotateCw className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              {showLabels && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Derives chain keys from root key using HKDF
                  </p>
                  <div className="p-3 rounded bg-background/50 border border-purple-300 dark:border-purple-700">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1">
                        <div className="text-xs font-mono text-purple-600 dark:text-purple-400 mb-1">
                          RootKey<sub>n</sub>
                        </div>
                        <div className="h-1 bg-purple-300 dark:bg-purple-700 rounded-full" />
                      </div>
                      <ArrowRight className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <div className="flex-1">
                        <div className="text-xs font-mono text-purple-600 dark:text-purple-400 mb-1">
                          RootKey<sub>n+1</sub>
                        </div>
                        <div className="h-1 bg-purple-300 dark:bg-purple-700 rounded-full" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Zap className="w-3 h-3" />
                      <span>Updates with each DH ratchet step</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-xs p-2 rounded bg-purple-100 dark:bg-purple-900/30">
                      <strong className="text-purple-700 dark:text-purple-300">Inputs:</strong>
                      <br />Previous root key + DH output
                    </div>
                    <div className="text-xs p-2 rounded bg-purple-100 dark:bg-purple-900/30">
                      <strong className="text-purple-700 dark:text-purple-300">Outputs:</strong>
                      <br />New root key + chain keys
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Branching arrows */}
          <div className="flex items-center justify-center gap-8 py-4">
            <div className="flex flex-col items-center">
              <ArrowRight className="w-5 h-5 text-green-600 dark:text-green-400 rotate-90" />
              <span className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                Send
              </span>
            </div>
            <div className="flex flex-col items-center">
              <ArrowRight className="w-5 h-5 text-white rotate-90" />
              <span className="text-xs text-white font-medium mt-1">
                Receive
              </span>
            </div>
          </div>
        </div>

        {/* Sending and Receiving Chains */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Sending Chain */}
          <div className="relative">
            <div className="flex items-start gap-3 p-5 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-2 border-green-200 dark:border-green-800 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="p-3 rounded-full bg-green-600 dark:bg-green-500 text-white flex-shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-green-700 dark:text-green-300 text-sm">
                    Sending Chain
                  </h4>
                  <RotateCw className="w-3 h-3 text-green-600 dark:text-green-400" />
                </div>
                {showLabels && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Generates keys for outbound messages
                    </p>
                    <div className="space-y-2">
                      {/* Chain progression */}
                      {[0, 1, 2].map((step) => (
                        <div key={step} className="flex items-center gap-2">
                          <div className="flex-1 p-2 rounded bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700">
                            <div className="text-xs font-mono text-green-700 dark:text-green-300">
                              ChainKey<sub>{step}</sub>
                            </div>
                          </div>
                          <ArrowRight className="w-3 h-3 text-green-600 dark:text-green-400" />
                          <div className="flex-1 p-2 rounded bg-green-200 dark:bg-green-800/50 border border-green-400 dark:border-green-600">
                            <div className="text-xs font-mono text-green-800 dark:text-green-200 flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              MsgKey<sub>{step}</sub>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="text-center text-xs text-muted-foreground">...</div>
                    </div>
                    <div className="p-2 rounded bg-green-100 dark:bg-green-900/30 text-xs">
                      <strong className="text-green-700 dark:text-green-300">KDF:</strong>
                      <span className="text-muted-foreground"> HMAC-SHA256</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Receiving Chain */}
          <div className="relative">
            <div className="flex items-start gap-3 p-5 rounded-xl bg-gradient-to-br from-white/5 to-white/5 dark:from-white/10 dark:to-cyan-950/30 border-2 border-white/20 dark:border-white/10 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="p-3 rounded-full bg-white/20 dark:bg-white/20 text-white flex-shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-white text-sm">
                    Receiving Chain
                  </h4>
                  <RotateCw className="w-3 h-3 text-white" />
                </div>
                {showLabels && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Generates keys for inbound messages
                    </p>
                    <div className="space-y-2">
                      {/* Chain progression */}
                      {[0, 1, 2].map((step) => (
                        <div key={step} className="flex items-center gap-2">
                          <div className="flex-1 p-2 rounded bg-white/10 dark:bg-white/10 border border-white/30 dark:border-white/20">
                            <div className="text-xs font-mono text-white">
                              ChainKey<sub>{step}</sub>
                            </div>
                          </div>
                          <ArrowRight className="w-3 h-3 text-white" />
                          <div className="flex-1 p-2 rounded bg-white/20 dark:bg-white/20 border border-white/40 dark:border-white/30">
                            <div className="text-xs font-mono text-white flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              MsgKey<sub>{step}</sub>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="text-center text-xs text-muted-foreground">...</div>
                    </div>
                    <div className="p-2 rounded bg-white/10 dark:bg-white/10 text-xs">
                      <strong className="text-white">KDF:</strong>
                      <span className="text-muted-foreground"> HMAC-SHA256</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Message Key Derivation */}
        <div className="p-5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-2 border-amber-200 dark:border-amber-800 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-full bg-amber-600 dark:bg-amber-500 text-white flex-shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-amber-700 dark:text-amber-300 mb-2">
                Message Key Derivation
              </h4>
              {showLabels && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Each message encrypted with unique ephemeral key
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="p-2 rounded bg-amber-100 dark:bg-amber-900/30 text-xs">
                      <strong className="text-amber-700 dark:text-amber-300">Input:</strong>
                      <br />Chain key + counter
                    </div>
                    <div className="p-2 rounded bg-amber-100 dark:bg-amber-900/30 text-xs">
                      <strong className="text-amber-700 dark:text-amber-300">Process:</strong>
                      <br />HKDF expansion
                    </div>
                    <div className="p-2 rounded bg-amber-100 dark:bg-amber-900/30 text-xs">
                      <strong className="text-amber-700 dark:text-amber-300">Output:</strong>
                      <br />256-bit message key
                    </div>
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
            Security Guarantees
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="text-foreground">Forward Secrecy:</strong>
                <span className="text-muted-foreground"> Past messages secure even if key compromised</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="text-foreground">Post-Compromise Security:</strong>
                <span className="text-muted-foreground"> Self-healing after key compromise</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="text-foreground">Break-in Recovery:</strong>
                <span className="text-muted-foreground"> New DH exchange restores security</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="text-foreground">Message Independence:</strong>
                <span className="text-muted-foreground"> Each message uses unique key</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ratchet Cycle Indicator */}
      <div className="mt-6 flex items-center justify-center gap-2 text-purple-600 dark:text-purple-400">
        <RotateCw className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
        <span className="text-xs font-medium">
          Continuous key rotation for ongoing sessions
        </span>
      </div>
    </div>
  );
}
