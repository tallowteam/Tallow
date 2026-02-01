"use client"

import React from 'react';
import {
  Radio,
  ArrowRight,
  Shield,
  Database,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WebRTCFlowDiagramProps {
  className?: string;
  showLabels?: boolean;
}

/**
 * WebRTC Connection Flow Diagram
 *
 * Visual representation of the WebRTC connection establishment process:
 * 1. Signaling - Exchange connection metadata
 * 2. ICE Candidates - Discover network paths
 * 3. DTLS Handshake - Establish secure connection
 * 4. DataChannel - Create data transmission channel
 * 5. P2P Transfer - Direct peer-to-peer file transfer
 *
 * Theme-aware with smooth animations and educational labels
 */
export function WebRTCFlowDiagram({ className, showLabels = true }: WebRTCFlowDiagramProps) {
  const steps = [
    {
      icon: Radio,
      title: 'Signaling',
      description: 'Exchange SDP offers/answers via signaling server',
      color: 'text-white',
      bgColor: 'bg-white/5 dark:bg-white/5',
      borderColor: 'border-white/20 dark:border-white/10',
    },
    {
      icon: ArrowRight,
      title: 'ICE Candidates',
      description: 'Discover network paths (STUN/TURN)',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
      borderColor: 'border-purple-200 dark:border-purple-800',
    },
    {
      icon: Shield,
      title: 'DTLS Handshake',
      description: 'Establish encrypted connection',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950/30',
      borderColor: 'border-green-200 dark:border-green-800',
    },
    {
      icon: Database,
      title: 'DataChannel',
      description: 'Create bidirectional data stream',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-950/30',
      borderColor: 'border-orange-200 dark:border-orange-800',
    },
    {
      icon: Send,
      title: 'P2P Transfer',
      description: 'Direct file transfer between peers',
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-50 dark:bg-pink-950/30',
      borderColor: 'border-pink-200 dark:border-pink-800',
    },
  ];

  return (
    <div className={cn('w-full p-6 md:p-8', className)}>
      {/* Title */}
      <div className="mb-8 text-center">
        <h3 className="text-2xl font-semibold mb-2 text-foreground">
          WebRTC Connection Flow
        </h3>
        <p className="text-sm text-muted-foreground">
          Step-by-step process of establishing a peer-to-peer connection
        </p>
      </div>

      {/* Flow Diagram */}
      <div className="relative">
        {/* Desktop: Horizontal Flow */}
        <div className="hidden md:flex items-center justify-between gap-2">
          {steps.map((step, index) => (
            <React.Fragment key={step.title}>
              {/* Step Card */}
              <div
                className={cn(
                  'flex-1 rounded-xl border-2 p-4 transition-all duration-300',
                  'hover:scale-105 hover:shadow-lg',
                  step.bgColor,
                  step.borderColor,
                  'animate-fade-in'
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div
                    className={cn(
                      'p-3 rounded-full bg-background/50 backdrop-blur-sm',
                      step.color
                    )}
                  >
                    <step.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className={cn('font-semibold mb-1', step.color)}>
                      {index + 1}. {step.title}
                    </h4>
                    {showLabels && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Arrow between steps */}
              {index < steps.length - 1 && (
                <div className="flex items-center justify-center px-2">
                  <ArrowRight className="w-6 h-6 text-muted-foreground animate-pulse" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Mobile: Vertical Flow */}
        <div className="md:hidden space-y-4">
          {steps.map((step, index) => (
            <React.Fragment key={step.title}>
              {/* Step Card */}
              <div
                className={cn(
                  'rounded-xl border-2 p-4 transition-all duration-300',
                  step.bgColor,
                  step.borderColor,
                  'animate-fade-in'
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'p-3 rounded-full bg-background/50 backdrop-blur-sm flex-shrink-0',
                      step.color
                    )}
                  >
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className={cn('font-semibold mb-1', step.color)}>
                      {index + 1}. {step.title}
                    </h4>
                    {showLabels && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Arrow between steps */}
              {index < steps.length - 1 && (
                <div className="flex items-center justify-center py-1">
                  <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Success Indicator */}
        <div className="mt-8 flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-medium">
            Secure P2P Connection Established
          </span>
        </div>
      </div>

      {/* Legend */}
      {showLabels && (
        <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border">
          <h4 className="text-sm font-semibold mb-2 text-foreground">
            Key Benefits
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• No server intermediary for file transfer</li>
            <li>• End-to-end encrypted connection</li>
            <li>• NAT traversal with STUN/TURN</li>
            <li>• Low latency direct transfer</li>
          </ul>
        </div>
      )}
    </div>
  );
}
