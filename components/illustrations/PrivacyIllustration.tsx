'use client';

import React from 'react';

interface PrivacyIllustrationProps {
  className?: string;
  animate?: boolean;
}

export const PrivacyIllustration: React.FC<PrivacyIllustrationProps> = ({
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
      aria-label="Privacy and anonymity illustration"
    >
      <defs>
        <linearGradient id="privacy-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>

        <filter id="privacy-glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <mask id="shield-mask">
          <path
            d="M 200 80 L 260 105 L 260 160 C 260 185 240 200 200 215 C 160 200 140 185 140 160 L 140 105 Z"
            fill="white"
          />
        </mask>
      </defs>

      {/* Background Privacy Layers */}
      <g opacity="0.2">
        <circle cx="200" cy="150" r="120" fill="none" stroke="url(#privacy-gradient)" strokeWidth="1" />
        <circle cx="200" cy="150" r="140" fill="none" stroke="url(#privacy-gradient)" strokeWidth="1" />
        <circle cx="200" cy="150" r="160" fill="none" stroke="url(#privacy-gradient)" strokeWidth="1" />
      </g>

      {/* Main Shield */}
      <g>
        <path
          d="M 200 80 L 260 105 L 260 160 C 260 185 240 200 200 215 C 160 200 140 185 140 160 L 140 105 Z"
          fill="#171717"
          stroke="url(#privacy-gradient)"
          strokeWidth="3"
          filter="url(#privacy-glow)"
        />

        {/* Shield Gradient Fill */}
        <path
          d="M 200 80 L 260 105 L 260 160 C 260 185 240 200 200 215 C 160 200 140 185 140 160 L 140 105 Z"
          fill="url(#privacy-gradient)"
          opacity="0.15"
        />

        {/* Eye Symbol */}
        <g transform="translate(200, 145)">
          {/* Eye Outline */}
          <ellipse cx="0" cy="0" rx="35" ry="20" fill="none" stroke="#fff" strokeWidth="2.5" />

          {/* Iris */}
          <circle cx="0" cy="0" r="12" fill="url(#privacy-gradient)" opacity="0.8" />

          {/* Pupil */}
          <circle cx="0" cy="0" r="6" fill="#0a0a0a" />

          {/* Highlight */}
          <circle cx="-2" cy="-2" r="2" fill="#fff" opacity="0.8" />

          {/* Slash Through Eye */}
          <line
            x1="-40"
            y1="-25"
            x2="40"
            y2="25"
            stroke="#fff"
            strokeWidth="3"
            strokeLinecap="round"
          >
            {animate && (
              <animate attributeName="opacity" values="0.8;1;0.8" dur="3s" repeatCount="indefinite" />
            )}
          </line>
        </g>
      </g>

      {/* Privacy Particles */}
      {animate && (
        <>
          <g opacity="0.6">
            <circle r="4" fill="#7c3aed">
              <animateMotion
                dur="8s"
                repeatCount="indefinite"
                path="M 200 150 m -100 0 a 100 100 0 1 0 200 0 a 100 100 0 1 0 -200 0"
              />
            </circle>
            <circle r="3" fill="#6366f1">
              <animateMotion
                dur="10s"
                repeatCount="indefinite"
                begin="2s"
                path="M 200 150 m -120 0 a 120 120 0 1 1 240 0 a 120 120 0 1 1 -240 0"
              />
            </circle>
            <circle r="3.5" fill="#3b82f6">
              <animateMotion
                dur="12s"
                repeatCount="indefinite"
                begin="4s"
                path="M 200 150 m -140 0 a 140 140 0 1 0 280 0 a 140 140 0 1 0 -280 0"
              />
            </circle>
          </g>
        </>
      )}

      {/* Privacy Features Icons */}
      <g opacity="0.7">
        {/* No Tracking */}
        <g transform="translate(100, 100)">
          <circle cx="0" cy="0" r="15" fill="none" stroke="url(#privacy-gradient)" strokeWidth="2" />
          <line x1="-10" y1="-10" x2="10" y2="10" stroke="url(#privacy-gradient)" strokeWidth="2" />
          <circle cx="0" cy="0" r="5" fill="url(#privacy-gradient)" opacity="0.5" />
        </g>

        {/* No Logs */}
        <g transform="translate(300, 100)">
          <rect x="-8" y="-10" width="16" height="20" rx="2" fill="none" stroke="url(#privacy-gradient)" strokeWidth="2" />
          <line x1="-12" y1="-12" x2="12" y2="12" stroke="url(#privacy-gradient)" strokeWidth="2.5" />
        </g>

        {/* Encrypted */}
        <g transform="translate(100, 200)">
          <rect x="-8" y="0" width="16" height="12" rx="2" fill="none" stroke="url(#privacy-gradient)" strokeWidth="2" />
          <path
            d="M -5 0 L -5 -4 C -5 -7 -3 -9 0 -9 C 3 -9 5 -7 5 -4 L 5 0"
            stroke="url(#privacy-gradient)"
            strokeWidth="2"
            fill="none"
          />
        </g>

        {/* Anonymous */}
        <g transform="translate(300, 200)">
          <circle cx="0" cy="-5" r="6" fill="none" stroke="url(#privacy-gradient)" strokeWidth="2" />
          <path
            d="M -8 8 C -8 4 -5 2 0 2 C 5 2 8 4 8 8"
            stroke="url(#privacy-gradient)"
            strokeWidth="2"
            fill="none"
          />
          <line x1="-10" y1="-10" x2="10" y2="10" stroke="url(#privacy-gradient)" strokeWidth="2" />
        </g>
      </g>

      {/* Rotating Privacy Ring */}
      {animate && (
        <g opacity="0.3">
          <circle
            cx="200"
            cy="150"
            r="100"
            fill="none"
            stroke="url(#privacy-gradient)"
            strokeWidth="2"
            strokeDasharray="10 10"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 200 150"
              to="360 200 150"
              dur="30s"
              repeatCount="indefinite"
            />
          </circle>
        </g>
      )}

      {/* Protection Text */}
      <text
        x="200"
        y="270"
        textAnchor="middle"
        fill="url(#privacy-gradient)"
        fontSize="14"
        fontWeight="600"
        opacity="0.8"
      >
        Your Privacy Protected
      </text>

      {/* Pulsing Shield Effect */}
      {animate && (
        <path
          d="M 200 80 L 260 105 L 260 160 C 260 185 240 200 200 215 C 160 200 140 185 140 160 L 140 105 Z"
          fill="none"
          stroke="url(#privacy-gradient)"
          strokeWidth="2"
          opacity="0"
        >
          <animate attributeName="opacity" values="0;0.5;0" dur="3s" repeatCount="indefinite" />
          <animateTransform
            attributeName="transform"
            type="scale"
            values="1;1.1;1"
            dur="3s"
            repeatCount="indefinite"
            additive="sum"
          />
        </path>
      )}
    </svg>
  );
};

export default PrivacyIllustration;
