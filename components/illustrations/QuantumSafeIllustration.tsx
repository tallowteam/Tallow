'use client';

import React from 'react';

interface QuantumSafeIllustrationProps {
  className?: string;
  animate?: boolean;
}

export const QuantumSafeIllustration: React.FC<QuantumSafeIllustrationProps> = ({
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
      aria-label="Quantum-safe encryption illustration"
    >
      <defs>
        <linearGradient id="quantum-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>

        <filter id="quantum-glow">
          <feGaussianBlur stdDeviation="5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <pattern id="lattice-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="0" cy="0" r="2" fill="#7c3aed" opacity="0.3" />
          <circle cx="40" cy="0" r="2" fill="#7c3aed" opacity="0.3" />
          <circle cx="0" cy="40" r="2" fill="#7c3aed" opacity="0.3" />
          <circle cx="40" cy="40" r="2" fill="#7c3aed" opacity="0.3" />
          <line x1="0" y1="0" x2="40" y2="0" stroke="#6366f1" strokeWidth="0.5" opacity="0.2" />
          <line x1="0" y1="0" x2="0" y2="40" stroke="#6366f1" strokeWidth="0.5" opacity="0.2" />
        </pattern>
      </defs>

      {/* Background Lattice Grid */}
      <rect x="50" y="30" width="300" height="240" fill="url(#lattice-pattern)" opacity="0.4" />

      {/* Central Quantum Shield */}
      <g transform="translate(200, 150)">
        {/* Outer Ring */}
        <circle
          cx="0"
          cy="0"
          r="80"
          fill="none"
          stroke="url(#quantum-gradient)"
          strokeWidth="2"
          opacity="0.4"
        />

        {/* Middle Ring */}
        <circle
          cx="0"
          cy="0"
          r="60"
          fill="none"
          stroke="url(#quantum-gradient)"
          strokeWidth="2"
          opacity="0.6"
        >
          {animate && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 0 0"
              to="360 0 0"
              dur="20s"
              repeatCount="indefinite"
            />
          )}
        </circle>

        {/* Inner Ring */}
        <circle
          cx="0"
          cy="0"
          r="40"
          fill="none"
          stroke="url(#quantum-gradient)"
          strokeWidth="2"
          opacity="0.8"
        >
          {animate && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 0 0"
              to="-360 0 0"
              dur="15s"
              repeatCount="indefinite"
            />
          )}
        </circle>

        {/* Core Shield */}
        <circle
          cx="0"
          cy="0"
          r="25"
          fill="url(#quantum-gradient)"
          opacity="0.2"
          filter="url(#quantum-glow)"
        />

        {/* Lock Symbol */}
        <g>
          <rect x="-8" y="-2" width="16" height="12" rx="2" fill="#fff" opacity="0.9" />
          <path
            d="M -5 -2 L -5 -6 C -5 -9 -3 -11 0 -11 C 3 -11 5 -9 5 -6 L 5 -2"
            stroke="#fff"
            strokeWidth="2"
            fill="none"
            opacity="0.9"
          />
          <circle cx="0" cy="4" r="2" fill="url(#quantum-gradient)" />
        </g>

        {/* Orbiting Particles */}
        {animate && (
          <>
            {/* Outer orbit */}
            <circle r="4" fill="#7c3aed" opacity="0.8">
              <animateMotion
                dur="8s"
                repeatCount="indefinite"
                path="M 0,-70 A 70,70 0 1,1 0,70 A 70,70 0 1,1 0,-70"
              />
            </circle>
            <circle r="4" fill="#6366f1" opacity="0.8">
              <animateMotion
                dur="8s"
                repeatCount="indefinite"
                begin="2s"
                path="M 0,-70 A 70,70 0 1,1 0,70 A 70,70 0 1,1 0,-70"
              />
            </circle>
            <circle r="4" fill="#3b82f6" opacity="0.8">
              <animateMotion
                dur="8s"
                repeatCount="indefinite"
                begin="4s"
                path="M 0,-70 A 70,70 0 1,1 0,70 A 70,70 0 1,1 0,-70"
              />
            </circle>

            {/* Inner orbit */}
            <circle r="3" fill="#7c3aed" opacity="0.6">
              <animateMotion
                dur="5s"
                repeatCount="indefinite"
                path="M 0,-50 A 50,50 0 1,0 0,50 A 50,50 0 1,0 0,-50"
              />
            </circle>
            <circle r="3" fill="#3b82f6" opacity="0.6">
              <animateMotion
                dur="5s"
                repeatCount="indefinite"
                begin="2.5s"
                path="M 0,-50 A 50,50 0 1,0 0,50 A 50,50 0 1,0 0,-50"
              />
            </circle>
          </>
        )}

        {/* Connection Lines to Lattice Points */}
        <g opacity="0.2">
          <line x1="0" y1="0" x2="70" y2="-70" stroke="url(#quantum-gradient)" strokeWidth="1" />
          <line x1="0" y1="0" x2="70" y2="70" stroke="url(#quantum-gradient)" strokeWidth="1" />
          <line x1="0" y1="0" x2="-70" y2="-70" stroke="url(#quantum-gradient)" strokeWidth="1" />
          <line x1="0" y1="0" x2="-70" y2="70" stroke="url(#quantum-gradient)" strokeWidth="1" />
        </g>

        {/* Lattice Key Points */}
        <circle cx="70" cy="-70" r="3" fill="#7c3aed" opacity="0.6" />
        <circle cx="70" cy="70" r="3" fill="#6366f1" opacity="0.6" />
        <circle cx="-70" cy="-70" r="3" fill="#3b82f6" opacity="0.6" />
        <circle cx="-70" cy="70" r="3" fill="#7c3aed" opacity="0.6" />
      </g>

      {/* Corner Quantum Nodes */}
      <g opacity="0.5">
        <circle cx="80" cy="60" r="5" fill="url(#quantum-gradient)">
          {animate && <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite" />}
        </circle>
        <circle cx="320" cy="60" r="5" fill="url(#quantum-gradient)">
          {animate && (
            <animate
              attributeName="opacity"
              values="0.3;0.7;0.3"
              dur="2s"
              begin="0.5s"
              repeatCount="indefinite"
            />
          )}
        </circle>
        <circle cx="80" cy="240" r="5" fill="url(#quantum-gradient)">
          {animate && (
            <animate
              attributeName="opacity"
              values="0.3;0.7;0.3"
              dur="2s"
              begin="1s"
              repeatCount="indefinite"
            />
          )}
        </circle>
        <circle cx="320" cy="240" r="5" fill="url(#quantum-gradient)">
          {animate && (
            <animate
              attributeName="opacity"
              values="0.3;0.7;0.3"
              dur="2s"
              begin="1.5s"
              repeatCount="indefinite"
            />
          )}
        </circle>
      </g>

      {/* Quantum Label */}
      <text
        x="200"
        y="260"
        textAnchor="middle"
        fill="url(#quantum-gradient)"
        fontSize="12"
        fontWeight="600"
        opacity="0.8"
      >
        Post-Quantum Cryptography
      </text>
    </svg>
  );
};

export default QuantumSafeIllustration;
