'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log critical error
    if (process.env.NODE_ENV === 'development') {
      console.error('Global error boundary caught:', error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <main
          style={{
            position: 'relative',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#030306',
            padding: '2rem',
            overflow: 'hidden',
          }}
        >
          {/* Ambient Gradient Blob */}
          <div
            style={{
              position: 'fixed',
              top: '30%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background:
                'radial-gradient(circle at center, rgba(99, 102, 241, 0.08) 0%, rgba(99, 102, 241, 0.04) 50%, transparent 100%)',
              filter: 'blur(100px)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />

          {/* Glass Card */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              maxWidth: '480px',
              width: '100%',
              padding: '48px',
              background: 'rgba(12, 12, 22, 0.55)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(99, 102, 241, 0.08)',
              borderRadius: '20px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: '6rem',
                fontWeight: 300,
                lineHeight: 1,
                color: '#f2f2f8',
                marginBottom: 0,
                letterSpacing: '-0.02em',
              }}
            >
              Error
            </div>

            <h1
              style={{
                fontSize: '1.3rem',
                fontWeight: 600,
                color: '#f2f2f8',
                marginTop: '16px',
                marginBottom: '8px',
                letterSpacing: '-0.01em',
              }}
            >
              Something went wrong
            </h1>

            <p
              style={{
                fontSize: '0.9rem',
                lineHeight: 1.6,
                color: '#9494a8',
                margin: '8px 0 32px',
                maxWidth: '100%',
              }}
            >
              A critical error occurred. Please try reloading the page.
            </p>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                marginTop: '32px',
                flexWrap: 'wrap',
              }}
            >
              <a
                href="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px 28px',
                  background: '#fff',
                  color: '#000',
                  borderRadius: '60px',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Go Home
              </a>
              <button
                onClick={reset}
                type="button"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px 28px',
                  background: 'rgba(12, 12, 22, 0.55)',
                  color: '#f2f2f8',
                  border: '1px solid rgba(99, 102, 241, 0.08)',
                  borderRadius: '60px',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  cursor: 'pointer',
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
