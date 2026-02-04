'use client';

import React from 'react';

interface P2PConnectionIllustrationProps {
  className?: string;
  animate?: boolean;
}

export const P2PConnectionIllustration: React.FC<P2PConnectionIllustrationProps> = ({
  className = '',
  animate = true,
}) => {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      role="img"
      aria-label="Peer-to-peer connection illustration"
    >
      <defs>
        <linearGradient id="p2p-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>

        <filter id="p2p-glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <radialGradient id="signal-gradient">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Left Peer */}
      <g transform="translate(50, 120)">
        <circle
          cx="0"
          cy="0"
          r="40"
          fill="#171717"
          stroke="url(#p2p-gradient)"
          strokeWidth="3"
          filter="url(#p2p-glow)"
        />
        <circle cx="0" cy="0" r="25" fill="url(#p2p-gradient)" opacity="0.3" />

        {/* User Icon */}
        <circle cx="0" cy="-5" r="8" fill="#fff" />
        <path
          d="M -12 12 C -12 8 -8 5 0 5 C 8 5 12 8 12 12"
          stroke="#fff"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />

        {/* Signal Waves (Left) */}
        {animate && (
          <>
            <circle cx="0" cy="0" r="50" stroke="#7c3aed" strokeWidth="2" fill="none" opacity="0">
              <animate attributeName="r" values="40;70;40" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0;0.6" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="0" cy="0" r="50" stroke="#6366f1" strokeWidth="2" fill="none" opacity="0">
              <animate
                attributeName="r"
                values="40;70;40"
                dur="3s"
                begin="1s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.6;0;0.6"
                dur="3s"
                begin="1s"
                repeatCount="indefinite"
              />
            </circle>
          </>
        )}
      </g>

      {/* Right Peer */}
      <g transform="translate(350, 120)">
        <circle
          cx="0"
          cy="0"
          r="40"
          fill="#171717"
          stroke="url(#p2p-gradient)"
          strokeWidth="3"
          filter="url(#p2p-glow)"
        />
        <circle cx="0" cy="0" r="25" fill="url(#p2p-gradient)" opacity="0.3" />

        {/* User Icon */}
        <circle cx="0" cy="-5" r="8" fill="#fff" />
        <path
          d="M -12 12 C -12 8 -8 5 0 5 C 8 5 12 8 12 12"
          stroke="#fff"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />

        {/* Signal Waves (Right) */}
        {animate && (
          <>
            <circle cx="0" cy="0" r="50" stroke="#7c3aed" strokeWidth="2" fill="none" opacity="0">
              <animate attributeName="r" values="40;70;40" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0;0.6" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="0" cy="0" r="50" stroke="#3b82f6" strokeWidth="2" fill="none" opacity="0">
              <animate
                attributeName="r"
                values="40;70;40"
                dur="3s"
                begin="1s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.6;0;0.6"
                dur="3s"
                begin="1s"
                repeatCount="indefinite"
              />
            </circle>
          </>
        )}
      </g>

      {/* Direct Connection Line */}
      <g>
        <path
          d="M 90 120 L 310 120"
          stroke="url(#p2p-gradient)"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Connection Particles */}
        {animate && (
          <>
            <circle r="5" fill="#7c3aed" opacity="0.8">
              <animateMotion dur="2s" repeatCount="indefinite" path="M 90 120 L 310 120" />
            </circle>
            <circle r="4" fill="#6366f1" opacity="0.6">
              <animateMotion dur="2.5s" repeatCount="indefinite" begin="0.3s" path="M 310 120 L 90 120" />
            </circle>
            <circle r="3" fill="#3b82f6" opacity="0.5">
              <animateMotion dur="3s" repeatCount="indefinite" begin="0.6s" path="M 90 120 L 310 120" />
            </circle>
          </>
        )}
      </g>

      {/* NO SERVER Ghost (Crossed Out) */}
      <g transform="translate(200, 50)" opacity="0.3">
        <rect
          x="-30"
          y="0"
          width="60"
          height="40"
          rx="4"
          fill="#333"
          stroke="#666"
          strokeWidth="2"
        />
        <circle cx="-15" cy="15" r="3" fill="#666" />
        <circle cx="0" cy="15" r="3" fill="#666" />
        <circle cx="15" cy="15" r="3" fill="#666" />

        {/* Cross-out line */}
        <line
          x1="-40"
          y1="-10"
          x2="40"
          y2="50"
          stroke="#ef4444"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.8"
        />
        <line
          x1="40"
          y1="-10"
          x2="-40"
          y2="50"
          stroke="#ef4444"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.8"
        />
      </g>

      {/* "Direct P2P" Label */}
      <text
        x="200"
        y="180"
        textAnchor="middle"
        fill="url(#p2p-gradient)"
        fontSize="14"
        fontWeight="600"
        opacity="0.8"
      >
        Direct P2P
      </text>

      {/* Data Flow Indicators */}
      <g transform="translate(200, 110)">
        <path d="M -5 0 L 5 -5 L 5 5 Z" fill="url(#p2p-gradient)" opacity="0.6">
          {animate && (
            <animateTransform
              attributeName="transform"
              type="translate"
              values="-50,0; 50,0; -50,0"
              dur="3s"
              repeatCount="indefinite"
            />
          )}
        </path>
      </g>
    </svg>
  );
};

export default P2PConnectionIllustration;
