'use client';

import { useState } from 'react';

interface SecurityBadgeProps {
  isActive?: boolean;
  isPQC?: boolean;
  algorithm?: string;
  showDetails?: boolean;
  className?: string;
}

export function SecurityBadge({
  isActive = false,
  isPQC = false,
  algorithm,
  showDetails = true,
  className = ''
}: SecurityBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        className={`
          group relative flex items-center gap-2 px-3 py-2 rounded-lg
          border transition-all duration-300
          ${isActive
            ? 'border-green-500/40 bg-green-500/10 hover:bg-green-500/20'
            : 'border-white/20 bg-white/5 hover:bg-white/10'
          }
        `}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        type="button"
        aria-label="Security details"
      >
        {/* Lock icon */}
        <div className="relative">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`
              transition-all duration-300
              ${isActive ? 'text-green-400' : 'text-white/60'}
            `}
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>

          {/* Animated lock pulse when active */}
          {isActive && (
            <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
          )}
        </div>

        {/* Badge text */}
        <span className={`
          text-xs font-medium transition-colors duration-300
          ${isActive ? 'text-green-400' : 'text-white/60'}
        `}>
          {isPQC ? 'PQC' : 'Encrypted'}
        </span>

        {/* Active indicator */}
        {isActive && (
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        )}

        {/* Tooltip */}
        {showTooltip && showDetails && (
          <div className="
            absolute left-0 top-full mt-2 z-50
            min-w-[280px] p-4 rounded-lg
            bg-black/95 border border-white/20
            backdrop-blur-sm shadow-2xl
            animate-in fade-in slide-in-from-top-1 duration-200
          ">
            {/* Arrow */}
            <div className="absolute -top-1 left-4 w-2 h-2 rotate-45 bg-black border-l border-t border-white/20" />

            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start gap-3 pb-3 border-b border-white/10">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-green-400"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-white mb-1">
                    {isPQC ? 'Post-Quantum Encryption' : 'End-to-End Encryption'}
                  </h4>
                  <p className="text-xs text-white/50">
                    {isActive ? 'Active and securing your transfer' : 'Ready to protect your data'}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2">
                {/* Algorithm */}
                {algorithm && (
                  <div className="flex items-start gap-2">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white/40 mt-0.5 flex-shrink-0"
                    >
                      <polyline points="16 18 22 12 16 6" />
                      <polyline points="8 6 2 12 8 18" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-xs text-white/40">Algorithm</p>
                      <p className="text-xs text-white font-mono">{algorithm}</p>
                    </div>
                  </div>
                )}

                {/* PQC info */}
                {isPQC && (
                  <div className="flex items-start gap-2">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white/40 mt-0.5 flex-shrink-0"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-xs text-white/40">Protection</p>
                      <p className="text-xs text-white">Quantum-resistant encryption</p>
                    </div>
                  </div>
                )}

                {/* Key exchange */}
                <div className="flex items-start gap-2">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white/40 mt-0.5 flex-shrink-0"
                  >
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-xs text-white/40">Key Exchange</p>
                    <p className="text-xs text-white">Perfect forward secrecy</p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-start gap-2">
                  <div className={`
                    w-3.5 h-3.5 rounded-full mt-0.5 flex-shrink-0
                    ${isActive ? 'bg-green-400 animate-pulse' : 'bg-white/20'}
                  `} />
                  <div className="flex-1">
                    <p className="text-xs text-white/40">Status</p>
                    <p className={`text-xs ${isActive ? 'text-green-400' : 'text-white/60'}`}>
                      {isActive ? 'Encryption active' : 'Encryption ready'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-white/10">
                <p className="text-xs text-white/30 leading-relaxed">
                  Your files are protected with industry-leading encryption.
                  {isPQC && ' Future-proof against quantum computers.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </button>
    </div>
  );
}
