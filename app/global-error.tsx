'use client';

/**
 * Global Error Page - EUVEKA Style
 * Root-level error boundary for critical app failures
 *
 * EUVEKA Design System:
 * - Error: #ff4f4f
 * - Background dark: #191610
 * - Background light: #fefefc
 * - Border: #e5dac7 / #544a36
 * - Pill buttons: 60px border-radius
 *
 * Uses inline styles since CSS may not be available in global error state
 */

import { useEffect } from 'react';

// EUVEKA color palette
const colors = {
    bgPrimary: '#191610',
    cardBg: '#1f1c16',
    cardBorder: '#544a36',
    iconBg: '#242018',
    error: '#ff4f4f',
    textPrimary: '#fefefc',
    textSecondary: '#a8a29e',
    textMuted: '#5a5550',
    buttonBg: '#fefefc',
    buttonText: '#191610',
    buttonHover: '#e5dac7',
    outlineBorder: '#544a36',
    outlineHover: '#e5dac7',
};

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[Global Error]:', error);
    }, [error]);

    return (
        <html lang="en">
            <body>
                <div
                    style={{
                        minHeight: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '24px',
                        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                        backgroundColor: colors.bgPrimary,
                        color: colors.textPrimary,
                    }}
                >
                    <div
                        style={{
                            maxWidth: '400px',
                            width: '100%',
                            padding: '40px',
                            borderRadius: '24px',
                            backgroundColor: colors.cardBg,
                            border: `1px solid ${colors.cardBorder}99`,
                            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)',
                            textAlign: 'center',
                        }}
                    >
                        {/* Error icon with EUVEKA glow */}
                        <div
                            style={{
                                position: 'relative',
                                width: '72px',
                                height: '72px',
                                margin: '0 auto 24px',
                            }}
                        >
                            {/* Glow effect */}
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: '-8px',
                                    background: `${colors.error}15`,
                                    borderRadius: '50%',
                                    filter: 'blur(20px)',
                                }}
                            />
                            {/* Icon container */}
                            <div
                                style={{
                                    position: 'relative',
                                    width: '72px',
                                    height: '72px',
                                    borderRadius: '50%',
                                    backgroundColor: colors.iconBg,
                                    border: `1px solid ${colors.error}30`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <svg
                                    width="32"
                                    height="32"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke={colors.error}
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                            </div>
                        </div>

                        {/* Title and description */}
                        <h2
                            style={{
                                fontSize: '24px',
                                fontWeight: '300',
                                letterSpacing: '-0.02em',
                                marginBottom: '8px',
                                color: colors.textPrimary,
                            }}
                        >
                            Critical Error
                        </h2>
                        <p
                            style={{
                                fontSize: '14px',
                                color: colors.textSecondary,
                                marginBottom: '32px',
                                lineHeight: '1.6',
                            }}
                        >
                            A critical error occurred that prevented the application from loading.
                            Please try refreshing the page.
                        </p>

                        {/* Error digest */}
                        {error.digest && (
                            <div
                                style={{
                                    padding: '12px 16px',
                                    marginBottom: '24px',
                                    borderRadius: '12px',
                                    backgroundColor: '#151310',
                                    border: `1px solid ${colors.cardBorder}66`,
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: '10px',
                                        color: colors.textMuted,
                                        letterSpacing: '0.1em',
                                        textTransform: 'uppercase',
                                        display: 'block',
                                        marginBottom: '4px',
                                    }}
                                >
                                    Error Reference
                                </span>
                                <code
                                    style={{
                                        fontSize: '12px',
                                        color: colors.textSecondary,
                                        fontFamily: 'monospace',
                                    }}
                                >
                                    {error.digest}
                                </code>
                            </div>
                        )}

                        {/* EUVEKA pill-shaped action buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {/* Primary retry button */}
                            <button
                                onClick={reset}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    width: '100%',
                                    height: '48px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: colors.buttonText,
                                    backgroundColor: colors.buttonBg,
                                    border: 'none',
                                    borderRadius: '60px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                }}
                                onMouseOver={(e) =>
                                    (e.currentTarget.style.backgroundColor = colors.buttonHover)
                                }
                                onMouseOut={(e) =>
                                    (e.currentTarget.style.backgroundColor = colors.buttonBg)
                                }
                                onFocus={(e) =>
                                    (e.currentTarget.style.backgroundColor = colors.buttonHover)
                                }
                                onBlur={(e) =>
                                    (e.currentTarget.style.backgroundColor = colors.buttonBg)
                                }
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                </svg>
                                Try again
                            </button>

                            {/* Secondary home button */}
                            <button
                                onClick={() => (window.location.href = '/')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    width: '100%',
                                    height: '48px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: colors.textSecondary,
                                    backgroundColor: 'transparent',
                                    border: `1px solid ${colors.outlineBorder}`,
                                    borderRadius: '60px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.backgroundColor = colors.iconBg;
                                    e.currentTarget.style.color = colors.textPrimary;
                                    e.currentTarget.style.borderColor = `${colors.outlineHover}66`;
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = colors.textSecondary;
                                    e.currentTarget.style.borderColor = colors.outlineBorder;
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.backgroundColor = colors.iconBg;
                                    e.currentTarget.style.color = colors.textPrimary;
                                    e.currentTarget.style.borderColor = `${colors.outlineHover}66`;
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = colors.textSecondary;
                                    e.currentTarget.style.borderColor = colors.outlineBorder;
                                }}
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                                </svg>
                                Return home
                            </button>
                        </div>

                        {/* Support message */}
                        <p
                            style={{
                                fontSize: '11px',
                                color: colors.textMuted,
                                marginTop: '24px',
                                lineHeight: '1.5',
                            }}
                        >
                            This error has been automatically reported.
                            <br />
                            If the problem persists, please contact support.
                        </p>
                    </div>
                </div>
            </body>
        </html>
    );
}
