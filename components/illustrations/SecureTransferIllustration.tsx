'use client';

import React from 'react';

interface SecureTransferIllustrationProps {
  className?: string;
  animate?: boolean;
}

export const SecureTransferIllustration: React.FC<SecureTransferIllustrationProps> = ({
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
      aria-label="Secure file transfer illustration"
    >
      <defs>
        <linearGradient id="accent-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>

        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Left Device */}
      <g transform="translate(40, 80)">
        <rect
          x="0"
          y="0"
          width="100"
          height="120"
          rx="8"
          fill="#171717"
          stroke="url(#accent-gradient)"
          strokeWidth="2"
          opacity="0.9"
        />
        <rect x="10" y="10" width="80" height="60" rx="4" fill="#0a0a0a" />
        <circle cx="50" cy="95" r="8" fill="url(#accent-gradient)" filter="url(#glow)" />

        {/* File Icon */}
        <g transform="translate(30, 25)">
          <rect x="0" y="0" width="40" height="45" rx="2" fill="#333" />
          <path d="M30 0 L40 10 L30 10 Z" fill="#1a1a1a" />
          <line x1="10" y1="20" x2="30" y2="20" stroke="#7c3aed" strokeWidth="2" />
          <line x1="10" y1="28" x2="30" y2="28" stroke="#6366f1" strokeWidth="2" />
          <line x1="10" y1="36" x2="25" y2="36" stroke="#3b82f6" strokeWidth="2" />
        </g>
      </g>

      {/* Right Device */}
      <g transform="translate(260, 80)">
        <rect
          x="0"
          y="0"
          width="100"
          height="120"
          rx="8"
          fill="#171717"
          stroke="url(#accent-gradient)"
          strokeWidth="2"
          opacity="0.9"
        />
        <rect x="10" y="10" width="80" height="60" rx="4" fill="#0a0a0a" />
        <circle cx="50" cy="95" r="8" fill="url(#accent-gradient)" filter="url(#glow)" />

        {/* File Icon */}
        <g transform="translate(30, 25)">
          <rect x="0" y="0" width="40" height="45" rx="2" fill="#333" />
          <path d="M30 0 L40 10 L30 10 Z" fill="#1a1a1a" />
          <line x1="10" y1="20" x2="30" y2="20" stroke="#7c3aed" strokeWidth="2" />
          <line x1="10" y1="28" x2="30" y2="28" stroke="#6366f1" strokeWidth="2" />
          <line x1="10" y1="36" x2="25" y2="36" stroke="#3b82f6" strokeWidth="2" />
        </g>
      </g>

      {/* Transfer Arrow */}
      <g transform="translate(140, 135)">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="url(#accent-gradient)" />
          </marker>
        </defs>
        <path
          d="M 0 0 L 120 0"
          stroke="url(#accent-gradient)"
          strokeWidth="3"
          markerEnd="url(#arrowhead)"
          strokeDasharray={animate ? "8 4" : undefined}
          opacity="0.8"
        >
          {animate && (
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="24"
              dur="1s"
              repeatCount="indefinite"
            />
          )}
        </path>
      </g>

      {/* Lock Shield (Top Center) */}
      <g transform="translate(175, 50)">
        <path
          d="M 25 0 L 50 15 L 50 40 C 50 50 40 55 25 60 C 10 55 0 50 0 40 L 0 15 Z"
          fill="url(#accent-gradient)"
          opacity="0.9"
          filter="url(#glow)"
        />

        {/* Lock Icon */}
        <g transform="translate(15, 20)">
          <rect x="0" y="8" width="20" height="15" rx="2" fill="#0a0a0a" />
          <path
            d="M 5 8 L 5 5 C 5 2.2 7.2 0 10 0 C 12.8 0 15 2.2 15 5 L 15 8"
            stroke="#fff"
            strokeWidth="2"
            fill="none"
          />
          <circle cx="10" cy="15" r="2" fill="#fff" />
        </g>
      </g>

      {/* Encryption Lines */}
      {animate && (
        <>
          <g opacity="0.4">
            <line x1="90" y1="140" x2="310" y2="140" stroke="#7c3aed" strokeWidth="1">
              <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2s" repeatCount="indefinite" />
            </line>
            <line x1="90" y1="150" x2="310" y2="150" stroke="#6366f1" strokeWidth="1">
              <animate
                attributeName="opacity"
                values="0.2;0.6;0.2"
                dur="2s"
                begin="0.3s"
                repeatCount="indefinite"
              />
            </line>
            <line x1="90" y1="160" x2="310" y2="160" stroke="#3b82f6" strokeWidth="1">
              <animate
                attributeName="opacity"
                values="0.2;0.6;0.2"
                dur="2s"
                begin="0.6s"
                repeatCount="indefinite"
              />
            </line>
          </g>
        </>
      )}

      {/* Data Packets */}
      {animate && (
        <>
          <circle r="4" fill="url(#accent-gradient)" opacity="0.8">
            <animateMotion dur="3s" repeatCount="indefinite" path="M 140 135 L 260 135" />
          </circle>
          <circle r="3" fill="#6366f1" opacity="0.6">
            <animateMotion dur="2.5s" repeatCount="indefinite" begin="0.5s" path="M 140 135 L 260 135" />
          </circle>
        </>
      )}
    </svg>
  );
};

export default SecureTransferIllustration;
