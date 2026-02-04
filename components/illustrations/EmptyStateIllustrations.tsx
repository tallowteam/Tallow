'use client';

import React from 'react';

interface EmptyStateProps {
  className?: string;
}

export const NoFilesIllustration: React.FC<EmptyStateProps> = ({ className = '' }) => {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      role="img"
      aria-label="No files selected"
    >
      <defs>
        <linearGradient id="empty-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>

      <g transform="translate(100, 100)">
        <rect
          x="-40"
          y="-50"
          width="80"
          height="90"
          rx="4"
          fill="none"
          stroke="#333"
          strokeWidth="2"
          strokeDasharray="5 5"
        />

        <path d="M 40 -50 L 40 -35 L 25 -50 Z" stroke="#333" strokeWidth="2" fill="none" />

        <text
          x="0"
          y="5"
          textAnchor="middle"
          fill="#666"
          fontSize="48"
          fontWeight="300"
        >
          ?
        </text>

        <text
          x="0"
          y="70"
          textAnchor="middle"
          fill="#666"
          fontSize="12"
          fontWeight="500"
        >
          No files selected
        </text>
      </g>
    </svg>
  );
};

export const NoConnectionIllustration: React.FC<EmptyStateProps> = ({ className = '' }) => {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      role="img"
      aria-label="No connection"
    >
      <g transform="translate(100, 100)">
        <circle cx="-50" cy="0" r="20" fill="none" stroke="#333" strokeWidth="2" />
        <circle cx="50" cy="0" r="20" fill="none" stroke="#333" strokeWidth="2" />

        <line x1="-30" y1="0" x2="30" y2="0" stroke="#333" strokeWidth="2" strokeDasharray="5 5" />

        <line
          x1="-60"
          y1="-40"
          x2="60"
          y2="40"
          stroke="#ef4444"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <text
          x="0"
          y="70"
          textAnchor="middle"
          fill="#666"
          fontSize="12"
          fontWeight="500"
        >
          No connection
        </text>
      </g>
    </svg>
  );
};

export const NoHistoryIllustration: React.FC<EmptyStateProps> = ({ className = '' }) => {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      role="img"
      aria-label="No history"
    >
      <g transform="translate(100, 100)">
        <circle cx="0" cy="0" r="40" fill="none" stroke="#333" strokeWidth="2" />

        <line x1="0" y1="0" x2="0" y2="-25" stroke="#333" strokeWidth="2" strokeLinecap="round" />
        <line x1="0" y1="0" x2="18" y2="18" stroke="#333" strokeWidth="2" strokeLinecap="round" />

        <path
          d="M -10 -50 L -10 -35 L -20 -42 Z"
          fill="#333"
        />
        <path
          d="M -40 -30 A 45 45 0 0 1 -10 -45"
          stroke="#333"
          strokeWidth="2"
          fill="none"
        />

        <text
          x="0"
          y="70"
          textAnchor="middle"
          fill="#666"
          fontSize="12"
          fontWeight="500"
        >
          No history yet
        </text>
      </g>
    </svg>
  );
};

export const NoDevicesIllustration: React.FC<EmptyStateProps> = ({ className = '' }) => {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      role="img"
      aria-label="No devices found"
    >
      <g transform="translate(100, 100)">
        <rect
          x="-35"
          y="-40"
          width="70"
          height="50"
          rx="4"
          fill="none"
          stroke="#333"
          strokeWidth="2"
        />

        <rect x="-30" y="-35" width="60" height="35" rx="2" fill="none" stroke="#333" strokeWidth="1.5" />

        <rect x="-20" y="10" width="40" height="3" rx="1.5" fill="#333" />
        <rect x="-15" y="13" width="30" height="5" rx="2" fill="#333" />

        <g transform="translate(0, -15)">
          <circle cx="0" cy="0" r="8" fill="none" stroke="#666" strokeWidth="2" />
          <circle cx="0" cy="0" r="3" fill="none" stroke="#666" strokeWidth="2" />
        </g>

        <text
          x="0"
          y="70"
          textAnchor="middle"
          fill="#666"
          fontSize="12"
          fontWeight="500"
        >
          No devices found
        </text>
      </g>
    </svg>
  );
};

export const SearchEmptyIllustration: React.FC<EmptyStateProps> = ({ className = '' }) => {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      role="img"
      aria-label="No results found"
    >
      <g transform="translate(100, 100)">
        <circle cx="-10" cy="-10" r="30" fill="none" stroke="#333" strokeWidth="2" />
        <line
          x1="12"
          y1="12"
          x2="35"
          y2="35"
          stroke="#333"
          strokeWidth="2"
          strokeLinecap="round"
        />

        <line
          x1="-25"
          y1="-25"
          x2="5"
          y2="5"
          stroke="#ef4444"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="-25"
          y1="5"
          x2="5"
          y2="-25"
          stroke="#ef4444"
          strokeWidth="2"
          strokeLinecap="round"
        />

        <text
          x="0"
          y="70"
          textAnchor="middle"
          fill="#666"
          fontSize="12"
          fontWeight="500"
        >
          No results found
        </text>
      </g>
    </svg>
  );
};

export const ErrorIllustration: React.FC<EmptyStateProps> = ({ className = '' }) => {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      role="img"
      aria-label="Error occurred"
    >
      <defs>
        <linearGradient id="error-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
      </defs>

      <g transform="translate(100, 100)">
        <path
          d="M 0 -50 L 45 35 L -45 35 Z"
          fill="none"
          stroke="url(#error-gradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <line x1="0" y1="-25" x2="0" y2="5" stroke="url(#error-gradient)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="0" cy="18" r="3" fill="url(#error-gradient)" />

        <text
          x="0"
          y="70"
          textAnchor="middle"
          fill="#ef4444"
          fontSize="12"
          fontWeight="500"
        >
          Something went wrong
        </text>
      </g>
    </svg>
  );
};

export default {
  NoFilesIllustration,
  NoConnectionIllustration,
  NoHistoryIllustration,
  NoDevicesIllustration,
  SearchEmptyIllustration,
  ErrorIllustration,
};
