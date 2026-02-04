'use client';

import React from 'react';

interface CrossPlatformIllustrationProps {
  className?: string;
  animate?: boolean;
}

export const CrossPlatformIllustration: React.FC<CrossPlatformIllustrationProps> = ({
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
      aria-label="Cross-platform support illustration"
    >
      <defs>
        <linearGradient id="platform-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>

        <filter id="platform-glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Desktop Monitor */}
      <g transform="translate(50, 60)">
        <rect
          x="0"
          y="0"
          width="120"
          height="75"
          rx="4"
          fill="#171717"
          stroke="url(#platform-gradient)"
          strokeWidth="2"
        />
        <rect x="5" y="5" width="110" height="55" rx="2" fill="#0a0a0a" />
        <rect x="45" y="75" width="30" height="3" rx="1.5" fill="#333" />
        <rect x="30" y="78" width="60" height="5" rx="2" fill="#333" />

        {/* Screen Content */}
        <circle cx="60" cy="32.5" r="15" fill="url(#platform-gradient)" opacity="0.3" />
        <path
          d="M 60 22.5 L 65 27.5 L 60 32.5 L 55 27.5 Z"
          fill="url(#platform-gradient)"
          opacity="0.8"
        >
          {animate && (
            <animateTransform
              attributeName="transform"
              type="scale"
              values="1;1.1;1"
              dur="2s"
              repeatCount="indefinite"
              additive="sum"
            />
          )}
        </path>
      </g>

      {/* Laptop */}
      <g transform="translate(230, 75)">
        <path
          d="M 10 0 L 100 0 L 110 50 L 0 50 Z"
          fill="#171717"
          stroke="url(#platform-gradient)"
          strokeWidth="2"
        />
        <rect x="15" y="5" width="80" height="40" rx="2" fill="#0a0a0a" />
        <ellipse cx="55" cy="50" rx="60" ry="3" fill="#333" />

        {/* Screen Content */}
        <circle cx="55" cy="25" r="12" fill="url(#platform-gradient)" opacity="0.3" />
        <path
          d="M 55 17 L 59 21 L 55 25 L 51 21 Z"
          fill="url(#platform-gradient)"
          opacity="0.8"
        >
          {animate && (
            <animateTransform
              attributeName="transform"
              type="scale"
              values="1;1.1;1"
              dur="2s"
              begin="0.3s"
              repeatCount="indefinite"
              additive="sum"
            />
          )}
        </path>
      </g>

      {/* Tablet */}
      <g transform="translate(70, 160)">
        <rect
          x="0"
          y="0"
          width="70"
          height="95"
          rx="8"
          fill="#171717"
          stroke="url(#platform-gradient)"
          strokeWidth="2"
        />
        <rect x="5" y="10" width="60" height="70" rx="3" fill="#0a0a0a" />
        <circle cx="35" cy="87.5" r="4" fill="#333" />

        {/* Screen Content */}
        <circle cx="35" cy="45" r="15" fill="url(#platform-gradient)" opacity="0.3" />
        <path
          d="M 35 35 L 40 40 L 35 45 L 30 40 Z"
          fill="url(#platform-gradient)"
          opacity="0.8"
        >
          {animate && (
            <animateTransform
              attributeName="transform"
              type="scale"
              values="1;1.1;1"
              dur="2s"
              begin="0.6s"
              repeatCount="indefinite"
              additive="sum"
            />
          )}
        </path>
      </g>

      {/* Mobile Phone */}
      <g transform="translate(270, 170)">
        <rect
          x="0"
          y="0"
          width="50"
          height="90"
          rx="8"
          fill="#171717"
          stroke="url(#platform-gradient)"
          strokeWidth="2"
        />
        <rect x="5" y="10" width="40" height="65" rx="2" fill="#0a0a0a" />
        <circle cx="25" cy="82" r="4" fill="#333" />
        <rect x="18" y="5" width="14" height="3" rx="1.5" fill="#333" />

        {/* Screen Content */}
        <circle cx="25" cy="42.5" r="12" fill="url(#platform-gradient)" opacity="0.3" />
        <path
          d="M 25 35.5 L 29 39.5 L 25 43.5 L 21 39.5 Z"
          fill="url(#platform-gradient)"
          opacity="0.8"
        >
          {animate && (
            <animateTransform
              attributeName="transform"
              type="scale"
              values="1;1.1;1"
              dur="2s"
              begin="0.9s"
              repeatCount="indefinite"
              additive="sum"
            />
          )}
        </path>
      </g>

      {/* Connection Lines */}
      <g opacity="0.4">
        <path
          d="M 110 97.5 Q 150 150 105 197.5"
          stroke="url(#platform-gradient)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="4 4"
        />
        <path
          d="M 230 100 Q 200 150 140 197.5"
          stroke="url(#platform-gradient)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="4 4"
        />
        <path
          d="M 285 125 Q 250 150 270 215"
          stroke="url(#platform-gradient)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="4 4"
        />
        <path
          d="M 170 97.5 Q 200 120 230 100"
          stroke="url(#platform-gradient)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="4 4"
        />
      </g>

      {/* Central Hub */}
      <g transform="translate(200, 150)">
        <circle
          cx="0"
          cy="0"
          r="25"
          fill="url(#platform-gradient)"
          opacity="0.2"
          filter="url(#platform-glow)"
        />
        <circle
          cx="0"
          cy="0"
          r="15"
          fill="url(#platform-gradient)"
          opacity="0.6"
        >
          {animate && (
            <animate attributeName="r" values="15;18;15" dur="2s" repeatCount="indefinite" />
          )}
        </circle>

        {/* Sync Icon */}
        <path
          d="M -5 -8 L 0 -3 L -5 2 M 5 8 L 0 3 L 5 -2"
          stroke="#fff"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        >
          {animate && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 0 0"
              to="360 0 0"
              dur="4s"
              repeatCount="indefinite"
            />
          )}
        </path>
      </g>

      {/* Sync Particles */}
      {animate && (
        <>
          <circle r="3" fill="#7c3aed" opacity="0.7">
            <animateMotion
              dur="3s"
              repeatCount="indefinite"
              path="M 110 97.5 Q 150 150 200 150"
            />
          </circle>
          <circle r="3" fill="#6366f1" opacity="0.7">
            <animateMotion
              dur="3s"
              repeatCount="indefinite"
              begin="0.5s"
              path="M 230 100 Q 200 120 200 150"
            />
          </circle>
          <circle r="3" fill="#3b82f6" opacity="0.7">
            <animateMotion
              dur="3s"
              repeatCount="indefinite"
              begin="1s"
              path="M 200 150 Q 200 180 140 197.5"
            />
          </circle>
        </>
      )}
    </svg>
  );
};

export default CrossPlatformIllustration;
