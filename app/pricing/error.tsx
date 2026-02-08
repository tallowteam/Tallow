'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function PricingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Pricing error:', error);
    }
  }, [error]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        padding: '2rem',
        textAlign: 'center',
        background: 'var(--bg, #030306)',
        color: 'var(--text, #f2f2f8)',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ef4444"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <h2
        style={{
          fontFamily: 'var(--font-playfair, serif)',
          fontSize: '1.75rem',
          fontWeight: 400,
          fontStyle: 'italic',
          marginBottom: '0.75rem',
          letterSpacing: '-0.02em',
        }}
      >
        Page couldn&apos;t load
      </h2>

      <p
        style={{
          color: 'var(--text-2, #9494a8)',
          maxWidth: '400px',
          marginBottom: '2rem',
          lineHeight: 1.6,
          fontSize: '0.95rem',
        }}
      >
        Something went wrong loading this page. Please try again or return to
        the home page.
      </p>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={reset}
          type="button"
          style={{
            padding: '0.75rem 1.75rem',
            background: 'var(--accent, #6366f1)',
            color: '#fff',
            border: 'none',
            borderRadius: '60px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
            letterSpacing: '0.02em',
          }}
        >
          Try Again
        </button>
        <Link
          href="/"
          style={{
            padding: '0.75rem 1.75rem',
            background: 'rgba(12, 12, 22, 0.55)',
            color: 'var(--text, #f2f2f8)',
            border: '1px solid var(--border, #18182a)',
            borderRadius: '60px',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
