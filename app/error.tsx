'use client';

/**
 * Route Error Page - EUVEKA Style
 * Handles errors at the route level
 *
 * EUVEKA Design System:
 * - Error: #ff4f4f
 * - Background dark: #191610
 * - Background light: #fefefc
 * - Border: #e5dac7 / #544a36
 * - Pill buttons: 60px border-radius
 */

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[Route Error]:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#191610]">
            <div className="w-full max-w-md p-8 rounded-3xl border border-[#544a36]/60 bg-[#1f1c16] shadow-2xl">
                <div className="flex flex-col items-center text-center mb-8">
                    {/* Error icon with EUVEKA glow */}
                    <div className="relative mb-6">
                        <div className="absolute inset-[-8px] bg-[#ff4f4f]/15 blur-2xl rounded-full" />
                        <div className="relative w-16 h-16 rounded-full bg-[#242018] border border-[#ff4f4f]/30 flex items-center justify-center">
                            <svg
                                className="w-8 h-8 text-[#ff4f4f]"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1.5}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                                />
                            </svg>
                        </div>
                    </div>
                    <h2 className="text-[#fefefc] font-light tracking-tight text-2xl mb-2">
                        Something went wrong
                    </h2>
                    <p className="text-[#a8a29e] text-sm leading-relaxed">
                        We encountered an unexpected error while loading this page.
                    </p>
                </div>

                {/* Error digest reference */}
                {error.digest && (
                    <div className="mb-6 px-4 py-3 rounded-xl bg-[#151310] border border-[#544a36]/40">
                        <span className="text-[#6a6560] text-[10px] uppercase tracking-widest block mb-1">
                            Error Reference
                        </span>
                        <code className="text-[#a8a29e] text-xs font-mono">{error.digest}</code>
                    </div>
                )}

                {/* EUVEKA pill-shaped buttons */}
                <div className="space-y-3">
                    <button
                        onClick={reset}
                        className="w-full h-12 rounded-[60px] bg-[#fefefc] text-[#191610] font-medium hover:bg-[#e5dac7] transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                            />
                        </svg>
                        Try again
                    </button>
                    <button
                        onClick={() => (window.location.href = '/')}
                        className="w-full h-12 rounded-[60px] border border-[#544a36] text-[#a8a29e] font-medium hover:bg-[#242018] hover:text-[#fefefc] hover:border-[#e5dac7]/40 transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                            />
                        </svg>
                        Return home
                    </button>
                </div>

                {/* Support message */}
                <p className="text-[11px] text-[#5a5550] text-center mt-6 leading-relaxed">
                    This error has been automatically reported.
                    <br />
                    If the problem persists, please contact support.
                </p>
            </div>
        </div>
    );
}
