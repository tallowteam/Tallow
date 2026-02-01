'use client';

/**
 * Error Boundary Component - EUVEKA Style
 * Catches React errors and reports to Sentry
 *
 * EUVEKA Design System:
 * - Error: #ff4f4f
 * - Background dark: #191610
 * - Background light: #fefefc
 * - Border: #e5dac7 / #544a36
 * - Pill buttons: 60px border-radius
 */

import React, { Component, ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, RotateCcw } from 'lucide-react';
import { captureException } from '@/lib/monitoring/sentry';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);

        captureException(error, {
            componentStack: errorInfo.componentStack,
            errorBoundary: true,
        });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
        });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // EUVEKA-styled error UI
            return (
                <div className="min-h-screen flex items-center justify-center p-6 bg-[#191610]">
                    <Card className="w-full max-w-md bg-[#1f1c16] border-[#544a36]/60 shadow-2xl rounded-3xl">
                        <CardHeader className="pb-4">
                            {/* Error icon with EUVEKA glow */}
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-[#ff4f4f]/15 blur-xl rounded-full" />
                                    <div className="relative w-12 h-12 rounded-full bg-[#242018] border border-[#ff4f4f]/30 flex items-center justify-center">
                                        <AlertCircle className="h-6 w-6 text-[#ff4f4f]" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-[#fefefc] font-light tracking-tight text-xl">
                                        Something went wrong
                                    </CardTitle>
                                    <CardDescription className="text-[#a8a29e] mt-1">
                                        We encountered an unexpected issue
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {/* Error details in development */}
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <div className="rounded-xl bg-[#151310] border border-[#544a36]/40 p-4 text-sm font-mono text-[#a8a29e] overflow-auto max-h-32">
                                    <span className="text-[#ff4f4f] text-xs uppercase tracking-wider block mb-2">
                                        Error Details
                                    </span>
                                    {this.state.error.message}
                                </div>
                            )}

                            {/* EUVEKA pill-shaped action buttons */}
                            <div className="flex gap-3">
                                <Button
                                    onClick={this.handleReset}
                                    className="flex-1 h-12 rounded-[60px] bg-[#fefefc] text-[#191610] hover:bg-[#e5dac7] font-medium transition-all duration-300"
                                >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Try again
                                </Button>
                                <Button
                                    onClick={() => window.location.reload()}
                                    variant="outline"
                                    className="flex-1 h-12 rounded-[60px] border-[#544a36] text-[#a8a29e] hover:bg-[#242018] hover:text-[#fefefc] hover:border-[#e5dac7]/40 font-medium transition-all duration-300"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Reload
                                </Button>
                            </div>

                            {/* Support message */}
                            <p className="text-xs text-[#5a5550] text-center leading-relaxed">
                                This error has been automatically reported.
                                <br />
                                If the problem persists, please contact support.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * HOC for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    fallback?: ReactNode
) {
    const WrappedComponent = (props: P) => (
        <ErrorBoundary fallback={fallback}>
            <Component {...props} />
        </ErrorBoundary>
    );
    WrappedComponent.displayName = `withErrorBoundary(${Component.displayName ?? Component.name ?? 'Component'})`;
    return WrappedComponent;
}
