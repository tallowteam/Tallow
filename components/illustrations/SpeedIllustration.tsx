'use client';

import React from 'react';

interface SpeedIllustrationProps {
  className?: string;
  animate?: boolean;
}

export const SpeedIllustration: React.FC<SpeedIllustrationProps> = ({
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
      aria-label="Fast transfer speed illustration"
    >
      <defs>
        <linearGradient id="speed-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>

        <linearGradient id="speed-fade" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0" />
          <stop offset="50%" stopColor="#6366f1" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="1" />
        </linearGradient>

        <filter id="speed-glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Lightning Bolt */}
      <g transform="translate(200, 150)">
        <path
          d="M 0 -60 L -25 -10 L 5 -10 L -10 40 L 30 -20 L 10 -20 L 20 -60 Z"
          fill="url(#speed-gradient)"
          filter="url(#speed-glow)"
        >
          {animate && (
            <>
              <animate attributeName="opacity" values="0.8;1;0.8" dur="1.5s" repeatCount="indefinite" />
              <animateTransform
                attributeName="transform"
                type="scale"
                values="1;1.05;1"
                dur="1.5s"
                repeatCount="indefinite"
                additive="sum"
              />
            </>
          )}
        </path>

        {/* Inner Lightning Glow */}
        <path
          d="M 0 -60 L -25 -10 L 5 -10 L -10 40 L 30 -20 L 10 -20 L 20 -60 Z"
          fill="#fff"
          opacity="0.3"
        />
      </g>

      {/* Speed Lines */}
      <g opacity="0.6">
        {/* Top Speed Lines */}
        <line x1="50" y1="80" x2="150" y2="80" stroke="url(#speed-fade)" strokeWidth="3" strokeLinecap="round">
          {animate && (
            <animate attributeName="x1" values="50;200" dur="1s" repeatCount="indefinite" />
          )}
          {animate && (
            <animate attributeName="x2" values="150;300" dur="1s" repeatCount="indefinite" />
          )}
        </line>

        <line x1="30" y1="100" x2="130" y2="100" stroke="url(#speed-fade)" strokeWidth="2.5" strokeLinecap="round">
          {animate && (
            <animate attributeName="x1" values="30;200" dur="1.2s" repeatCount="indefinite" />
          )}
          {animate && (
            <animate attributeName="x2" values="130;320" dur="1.2s" repeatCount="indefinite" />
          )}
        </line>

        <line x1="60" y1="120" x2="160" y2="120" stroke="url(#speed-fade)" strokeWidth="2" strokeLinecap="round">
          {animate && (
            <animate attributeName="x1" values="60;210" dur="0.9s" repeatCount="indefinite" />
          )}
          {animate && (
            <animate attributeName="x2" values="160;340" dur="0.9s" repeatCount="indefinite" />
          )}
        </line>

        {/* Bottom Speed Lines */}
        <line x1="50" y1="180" x2="150" y2="180" stroke="url(#speed-fade)" strokeWidth="2.5" strokeLinecap="round">
          {animate && (
            <animate attributeName="x1" values="50;200" dur="1.1s" repeatCount="indefinite" />
          )}
          {animate && (
            <animate attributeName="x2" values="150;310" dur="1.1s" repeatCount="indefinite" />
          )}
        </line>

        <line x1="70" y1="200" x2="170" y2="200" stroke="url(#speed-fade)" strokeWidth="2" strokeLinecap="round">
          {animate && (
            <animate attributeName="x1" values="70;220" dur="0.95s" repeatCount="indefinite" />
          )}
          {animate && (
            <animate attributeName="x2" values="170;330" dur="0.95s" repeatCount="indefinite" />
          )}
        </line>

        <line x1="40" y1="220" x2="140" y2="220" stroke="url(#speed-fade)" strokeWidth="1.5" strokeLinecap="round">
          {animate && (
            <animate attributeName="x1" values="40;200" dur="1.3s" repeatCount="indefinite" />
          )}
          {animate && (
            <animate attributeName="x2" values="140;300" dur="1.3s" repeatCount="indefinite" />
          )}
        </line>
      </g>

      {/* Fast Data Particles */}
      {animate && (
        <g opacity="0.8">
          <circle r="5" fill="#7c3aed" filter="url(#speed-glow)">
            <animate attributeName="cx" values="0;400" dur="0.8s" repeatCount="indefinite" />
            <animate attributeName="cy" values="150;150" dur="0.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;1;0" dur="0.8s" repeatCount="indefinite" />
          </circle>

          <circle r="4" fill="#6366f1" filter="url(#speed-glow)">
            <animate attributeName="cx" values="0;400" dur="0.9s" repeatCount="indefinite" begin="0.2s" />
            <animate attributeName="cy" values="130;130" dur="0.9s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;1;0" dur="0.9s" repeatCount="indefinite" />
          </circle>

          <circle r="6" fill="#3b82f6" filter="url(#speed-glow)">
            <animate attributeName="cx" values="0;400" dur="0.7s" repeatCount="indefinite" begin="0.4s" />
            <animate attributeName="cy" values="170;170" dur="0.7s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;1;0" dur="0.7s" repeatCount="indefinite" />
          </circle>

          <circle r="3" fill="#7c3aed">
            <animate attributeName="cx" values="0;400" dur="1s" repeatCount="indefinite" begin="0.1s" />
            <animate attributeName="cy" values="110;110" dur="1s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;0.8;0" dur="1s" repeatCount="indefinite" />
          </circle>

          <circle r="4" fill="#3b82f6">
            <animate attributeName="cx" values="0;400" dur="0.85s" repeatCount="indefinite" begin="0.3s" />
            <animate attributeName="cy" values="190;190" dur="0.85s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;0.8;0" dur="0.85s" repeatCount="indefinite" />
          </circle>
        </g>
      )}

      {/* Circular Speed Rings */}
      <g transform="translate(200, 150)">
        {animate && (
          <>
            <circle cx="0" cy="0" r="50" fill="none" stroke="url(#speed-gradient)" strokeWidth="2" opacity="0">
              <animate attributeName="r" values="30;80;30" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
            </circle>

            <circle cx="0" cy="0" r="50" fill="none" stroke="url(#speed-gradient)" strokeWidth="2" opacity="0">
              <animate attributeName="r" values="30;80;30" dur="2s" begin="0.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" begin="0.5s" repeatCount="indefinite" />
            </circle>

            <circle cx="0" cy="0" r="50" fill="none" stroke="url(#speed-gradient)" strokeWidth="2" opacity="0">
              <animate attributeName="r" values="30;80;30" dur="2s" begin="1s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" begin="1s" repeatCount="indefinite" />
            </circle>

            <circle cx="0" cy="0" r="50" fill="none" stroke="url(#speed-gradient)" strokeWidth="2" opacity="0">
              <animate attributeName="r" values="30;80;30" dur="2s" begin="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" begin="1.5s" repeatCount="indefinite" />
            </circle>
          </>
        )}
      </g>

      {/* Speed Meter Arc */}
      <g transform="translate(200, 240)">
        <path
          d="M -60 0 A 60 60 0 0 1 60 0"
          fill="none"
          stroke="#333"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M -60 0 A 60 60 0 0 1 60 0"
          fill="none"
          stroke="url(#speed-gradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="188.5"
          strokeDashoffset="47"
        >
          {animate && (
            <animate
              attributeName="stroke-dashoffset"
              values="188.5;47;188.5"
              dur="3s"
              repeatCount="indefinite"
            />
          )}
        </path>

        {/* Speedometer Needle */}
        <line
          x1="0"
          y1="0"
          x2="0"
          y2="-50"
          stroke="url(#speed-gradient)"
          strokeWidth="3"
          strokeLinecap="round"
        >
          {animate && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="-90 0 0;90 0 0;-90 0 0"
              dur="3s"
              repeatCount="indefinite"
            />
          )}
        </line>

        <circle cx="0" cy="0" r="5" fill="url(#speed-gradient)" filter="url(#speed-glow)" />
      </g>

      {/* Speed Label */}
      <text
        x="200"
        y="280"
        textAnchor="middle"
        fill="url(#speed-gradient)"
        fontSize="14"
        fontWeight="600"
        opacity="0.8"
      >
        Lightning Fast
      </text>
    </svg>
  );
};

export default SpeedIllustration;
