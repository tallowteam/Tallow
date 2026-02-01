'use client';

/**
 * Async Error Boundary - EUVEKA Style
 * Handles errors in async operations with retry logic
 * React 19 optimized
 *
 * EUVEKA Design System:
 * - Error: #ff4f4f
 * - Background dark: #191610
 * - Background light: #fefefc
 * - Border: #e5dac7 / #544a36
 * - Pill buttons: 60px border-radius
 */

import React, { Component, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Clock } from 'lucide-react';
import { captureException } from '@/lib/monitoring/sentry';

export interface AsyncErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    maxRetries?: number;
    retryDelay?: number;
    onError?: (error: Error, retryCount: number) => void;
    onMaxRetriesReached?: (error: Error) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    retryCount: number;
    isRetrying: boolean;
}

/**
 * Error boundary for async operations with automatic retry - EUVEKA Style
 */
export class AsyncErrorBoundary extends Component<AsyncErrorBoundaryProps, State> {
    private retryTimeout?: NodeJS.Timeout;

    constructor(props: AsyncErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            retryCount: 0,
            isRetrying: false,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        const { onError } = this.props;
        const { retryCount } = this.state;

        console.error('[AsyncErrorBoundary] Error caught:', error, errorInfo);

        captureException(error, {
            componentStack: errorInfo.componentStack,
            errorBoundary: true,
            retryCount,
            asyncError: true,
        });

        onError?.(error, retryCount);
        this.scheduleRetry();
    }

    componentWillUnmount() {
        if (this.retryTimeout) {
            clearTimeout(this.retryTimeout);
        }
    }

    scheduleRetry = () => {
        const { maxRetries = 3, retryDelay = 2000, onMaxRetriesReached } = this.props;
        const { retryCount, error } = this.state;

        if (retryCount < maxRetries) {
            this.setState({ isRetrying: true });

            this.retryTimeout = setTimeout(() => {
                this.handleRetry();
            }, retryDelay * Math.pow(2, retryCount)); // Exponential backoff
        } else {
            console.error('[AsyncErrorBoundary] Max retries reached');
            onMaxRetriesReached?.(error!);
        }
    };

    handleRetry = () => {
        this.setState((prevState) => ({
            hasError: false,
            error: null,
            retryCount: prevState.retryCount + 1,
            isRetrying: false,
        }));
    };

    handleManualRetry = () => {
        if (this.retryTimeout) {
            clearTimeout(this.retryTimeout);
        }
        this.handleRetry();
    };

    handleReset = () => {
        if (this.retryTimeout) {
            clearTimeout(this.retryTimeout);
        }
        this.setState({
            hasError: false,
            error: null,
            retryCount: 0,
            isRetrying: false,
        });
    };

    render() {
        const { children, fallback, maxRetries = 3 } = this.props;
        const { hasError, error, retryCount, isRetrying } = this.state;

        if (hasError) {
            if (fallback) {
                return fallback;
            }

            const canRetry = retryCount < maxRetries;

            // EUVEKA-styled error UI
            return (
                <Card className="w-full bg-[#1f1c16] border-[#544a36]/60 shadow-lg rounded-2xl">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            {/* Error icon with EUVEKA glow */}
                            <div className="relative shrink-0">
                                <div className="absolute inset-0 bg-[#ff4f4f]/15 blur-xl rounded-full" />
                                <div className="relative w-12 h-12 rounded-full bg-[#242018] border border-[#ff4f4f]/30 flex items-center justify-center">
                                    <AlertCircle className="h-6 w-6 text-[#ff4f4f]" />
                                </div>
                            </div>
                            <div className="flex-1 space-y-4">
                                <div>
                                    <h3 className="font-medium text-[#ff4f4f] text-lg">
                                        Connection Error
                                    </h3>
                                    <p className="text-sm text-[#a8a29e] mt-1">
                                        {error?.message || 'An unexpected error occurred'}
                                    </p>
                                </div>

                                {/* Retry status */}
                                {isRetrying && (
                                    <div className="flex items-center gap-2 text-sm text-[#a8a29e]">
                                        <Clock className="w-4 h-4 animate-spin text-[#ff4f4f]" />
                                        Retrying... (Attempt {retryCount + 1} of {maxRetries})
                                    </div>
                                )}

                                {!isRetrying && (
                                    <div className="text-sm text-[#a8a29e]">
                                        {canRetry ? (
                                            <span>
                                                Retry attempt {retryCount} of {maxRetries}
                                            </span>
                                        ) : (
                                            <span className="text-[#ff4f4f]">
                                                Maximum retry attempts reached
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* EUVEKA pill-shaped action buttons */}
                                <div className="flex gap-3">
                                    <Button
                                        onClick={this.handleManualRetry}
                                        disabled={isRetrying || !canRetry}
                                        size="sm"
                                        className="h-10 rounded-[60px] bg-[#fefefc] text-[#191610] hover:bg-[#e5dac7] font-medium transition-all duration-300 px-5 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        {isRetrying ? 'Retrying...' : 'Retry Now'}
                                    </Button>
                                    <Button
                                        onClick={this.handleReset}
                                        variant="outline"
                                        size="sm"
                                        className="h-10 rounded-[60px] border-[#544a36] text-[#a8a29e] hover:bg-[#242018] hover:text-[#fefefc] hover:border-[#e5dac7]/40 font-medium transition-all duration-300 px-5"
                                    >
                                        Reset
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        return children;
    }
}

export default AsyncErrorBoundary;
