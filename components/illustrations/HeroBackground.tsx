'use client';

import React from 'react';

interface HeroBackgroundProps {
  className?: string;
  animate?: boolean;
}

export const HeroBackground: React.FC<HeroBackgroundProps> = ({
  className = '',
  animate = true,
}) => {
  return (
    <svg
      viewBox="0 0 1920 1080"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="hero-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#6366f1" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
        </linearGradient>

        <linearGradient id="hero-gradient-2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#6366f1" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.1" />
        </linearGradient>

        <radialGradient id="hero-radial-1">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="hero-radial-2">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </radialGradient>

        <filter id="hero-blur">
          <feGaussianBlur stdDeviation="100" />
        </filter>
      </defs>

      {/* Base gradient background */}
      <rect width="1920" height="1080" fill="#0a0a0a" />

      {/* Large gradient blobs */}
      <ellipse
        cx="300"
        cy="200"
        rx="600"
        ry="400"
        fill="url(#hero-radial-1)"
        filter="url(#hero-blur)"
        opacity="0.6"
      >
        {animate && (
          <>
            <animate attributeName="cx" values="300;400;300" dur="20s" repeatCount="indefinite" />
            <animate attributeName="cy" values="200;300;200" dur="15s" repeatCount="indefinite" />
          </>
        )}
      </ellipse>

      <ellipse
        cx="1620"
        cy="880"
        rx="700"
        ry="500"
        fill="url(#hero-radial-2)"
        filter="url(#hero-blur)"
        opacity="0.5"
      >
        {animate && (
          <>
            <animate attributeName="cx" values="1620;1520;1620" dur="25s" repeatCount="indefinite" />
            <animate attributeName="cy" values="880;780;880" dur="18s" repeatCount="indefinite" />
          </>
        )}
      </ellipse>

      <ellipse
        cx="960"
        cy="540"
        rx="500"
        ry="350"
        fill="url(#hero-radial-1)"
        filter="url(#hero-blur)"
        opacity="0.3"
      >
        {animate && (
          <>
            <animate attributeName="rx" values="500;600;500" dur="22s" repeatCount="indefinite" />
            <animate attributeName="ry" values="350;450;350" dur="22s" repeatCount="indefinite" />
          </>
        )}
      </ellipse>

      {/* Abstract geometric shapes */}
      <g opacity="0.1">
        <circle cx="200" cy="800" r="150" fill="url(#hero-gradient-1)">
          {animate && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 200 800"
              to="360 200 800"
              dur="60s"
              repeatCount="indefinite"
            />
          )}
        </circle>

        <rect
          x="1600"
          y="100"
          width="200"
          height="200"
          rx="20"
          fill="url(#hero-gradient-2)"
        >
          {animate && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 1700 200"
              to="360 1700 200"
              dur="80s"
              repeatCount="indefinite"
            />
          )}
        </rect>

        <polygon
          points="960,100 1100,250 960,400 820,250"
          fill="url(#hero-gradient-1)"
        >
          {animate && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 960 250"
              to="360 960 250"
              dur="70s"
              repeatCount="indefinite"
            />
          )}
        </polygon>
      </g>

      {/* Floating particles */}
      {animate && (
        <g opacity="0.4">
          <circle r="3" fill="#7c3aed">
            <animateMotion
              dur="30s"
              repeatCount="indefinite"
              path="M 100 100 Q 500 300 900 500 T 1700 900"
            />
            <animate attributeName="opacity" values="0.2;0.6;0.2" dur="5s" repeatCount="indefinite" />
          </circle>

          <circle r="2" fill="#6366f1">
            <animateMotion
              dur="35s"
              repeatCount="indefinite"
              path="M 1800 200 Q 1400 400 1000 600 T 200 1000"
            />
            <animate attributeName="opacity" values="0.2;0.6;0.2" dur="6s" repeatCount="indefinite" />
          </circle>

          <circle r="4" fill="#3b82f6">
            <animateMotion
              dur="40s"
              repeatCount="indefinite"
              path="M 960 50 Q 600 400 300 700 T 960 1030"
            />
            <animate attributeName="opacity" values="0.2;0.6;0.2" dur="7s" repeatCount="indefinite" />
          </circle>

          <circle r="2.5" fill="#7c3aed">
            <animateMotion
              dur="32s"
              repeatCount="indefinite"
              begin="5s"
              path="M 1500 800 Q 1100 500 700 300 T 100 200"
            />
            <animate attributeName="opacity" values="0.2;0.6;0.2" dur="5.5s" repeatCount="indefinite" />
          </circle>

          <circle r="3.5" fill="#3b82f6">
            <animateMotion
              dur="38s"
              repeatCount="indefinite"
              begin="3s"
              path="M 300 1000 Q 700 700 1100 400 T 1600 100"
            />
            <animate attributeName="opacity" values="0.2;0.6;0.2" dur="6.5s" repeatCount="indefinite" />
          </circle>
        </g>
      )}

      {/* Mesh grid overlay */}
      <g opacity="0.05">
        {Array.from({ length: 20 }).map((_, i) => (
          <line
            key={`h-${i}`}
            x1="0"
            y1={i * 60}
            x2="1920"
            y2={i * 60}
            stroke="url(#hero-gradient-1)"
            strokeWidth="1"
          />
        ))}
        {Array.from({ length: 32 }).map((_, i) => (
          <line
            key={`v-${i}`}
            x1={i * 60}
            y1="0"
            x2={i * 60}
            y2="1080"
            stroke="url(#hero-gradient-2)"
            strokeWidth="1"
          />
        ))}
      </g>

      {/* Gradient curves */}
      <g opacity="0.15">
        <path
          d="M 0 540 Q 480 200 960 540 T 1920 540"
          stroke="url(#hero-gradient-1)"
          strokeWidth="2"
          fill="none"
        >
          {animate && (
            <animate
              attributeName="d"
              values="M 0 540 Q 480 200 960 540 T 1920 540;
                      M 0 540 Q 480 880 960 540 T 1920 540;
                      M 0 540 Q 480 200 960 540 T 1920 540"
              dur="15s"
              repeatCount="indefinite"
            />
          )}
        </path>

        <path
          d="M 0 600 Q 480 300 960 600 T 1920 600"
          stroke="url(#hero-gradient-2)"
          strokeWidth="2"
          fill="none"
        >
          {animate && (
            <animate
              attributeName="d"
              values="M 0 600 Q 480 300 960 600 T 1920 600;
                      M 0 600 Q 480 900 960 600 T 1920 600;
                      M 0 600 Q 480 300 960 600 T 1920 600"
              dur="18s"
              repeatCount="indefinite"
            />
          )}
        </path>
      </g>

      {/* Vignette effect */}
      <radialGradient id="vignette">
        <stop offset="50%" stopColor="#0a0a0a" stopOpacity="0" />
        <stop offset="100%" stopColor="#0a0a0a" stopOpacity="0.8" />
      </radialGradient>
      <rect width="1920" height="1080" fill="url(#vignette)" />
    </svg>
  );
};

export default HeroBackground;
