'use client';

/**
 * Feature Error Boundary - EUVEKA Style
 * Granular error handling for specific features
 * React 19 optimized with recovery strategies
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
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react';
import { captureException } from '@/lib/monitoring/sentry';

export interface FeatureErrorBoundaryProps {
    children: ReactNode;
    featureName: string;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    onReset?: () => void;
    showErrorDetails?: boolean;
    recoveryStrategies?: RecoveryStrategy[];
}

export interface RecoveryStrategy {
    label: string;
    action: () => void | Promise<void>;
    icon?: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
    attemptedRecovery: boolean;
}

/**
 * Feature-specific error boundary with recovery options - EUVEKA Style
 */
export class FeatureErrorBoundary extends Component<FeatureErrorBoundaryProps, State> {
    constructor(props: FeatureErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            attemptedRecovery: false,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        const { featureName, onError } = this.props;

        console.error(`[${featureName}] Error caught:`, error, errorInfo);

        this.setState({ errorInfo });

        captureException(error, {
            componentStack: errorInfo.componentStack,
            errorBoundary: true,
            feature: featureName,
        });

        onError?.(error, errorInfo);
    }

    handleReset = () => {
        const { onReset } = this.props;

        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            attemptedRecovery: true,
        });

        onReset?.();
    };

    handleRecovery = async (strategy: RecoveryStrategy) => {
        try {
            await strategy.action();
            this.handleReset();
        } catch (err) {
            console.error('Recovery strategy failed:', err);
            captureException(err as Error, {
                context: 'recovery_strategy',
                strategyLabel: strategy.label,
            });
        }
    };

    render() {
        const { children, fallback, featureName, showErrorDetails, recoveryStrategies } =
            this.props;
        const { hasError, error, errorInfo } = this.state;

        if (hasError) {
            if (fallback) {
                return fallback;
            }

            // EUVEKA-styled error UI
            return (
                <Card className="w-full bg-[#1f1c16] border-[#544a36]/60 shadow-lg overflow-hidden rounded-2xl">
                    <CardHeader className="pb-4">
                        <div className="flex items-start gap-4">
                            {/* Error icon with EUVEKA glow */}
                            <div className="relative shrink-0">
                                <div className="absolute inset-0 bg-[#ff4f4f]/15 blur-xl rounded-full" />
                                <div className="relative w-11 h-11 rounded-full bg-[#242018] border border-[#ff4f4f]/30 flex items-center justify-center">
                                    <AlertCircle className="h-5 w-5 text-[#ff4f4f]" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-[#fefefc] font-light tracking-tight text-lg">
                                    {featureName} Error
                                </CardTitle>
                                <CardDescription className="text-[#a8a29e] mt-1">
                                    This feature encountered an issue and couldn&apos;t load
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {/* Error details in development */}
                        {showErrorDetails && error && process.env.NODE_ENV === 'development' && (
                            <div className="space-y-3">
                                <div className="rounded-xl bg-[#151310] border border-[#544a36]/40 p-4 text-sm font-mono text-[#a8a29e] overflow-auto max-h-28">
                                    <span className="text-[#ff4f4f] text-xs uppercase tracking-wider block mb-2">
                                        Error
                                    </span>
                                    {error.message}
                                </div>
                                {errorInfo?.componentStack && (
                                    <details className="rounded-xl bg-[#151310] border border-[#544a36]/40 p-4 text-xs font-mono">
                                        <summary className="cursor-pointer text-[#5a5550] uppercase tracking-wider text-[10px] font-semibold">
                                            Component Stack
                                        </summary>
                                        <pre className="mt-3 overflow-auto max-h-32 whitespace-pre-wrap text-[#6a6560]">
                                            {errorInfo.componentStack}
                                        </pre>
                                    </details>
                                )}
                            </div>
                        )}

                        {/* Recovery strategies */}
                        {recoveryStrategies && recoveryStrategies.length > 0 && (
                            <div className="space-y-3">
                                <p className="text-xs text-[#6a6560] uppercase tracking-wider font-medium">
                                    Try these actions
                                </p>
                                <div className="grid gap-2">
                                    {recoveryStrategies.map((strategy, index) => (
                                        <Button
                                            key={index}
                                            variant="outline"
                                            onClick={() => this.handleRecovery(strategy)}
                                            className="justify-start h-10 rounded-xl border-[#544a36]/40 text-[#a8a29e] hover:bg-[#242018] hover:text-[#fefefc] hover:border-[#544a36] font-medium transition-all duration-300"
                                        >
                                            {strategy.icon}
                                            <span className="ml-2">{strategy.label}</span>
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* EUVEKA pill-shaped action buttons */}
                        <div className="flex flex-wrap gap-3">
                            <Button
                                onClick={this.handleReset}
                                className="h-10 rounded-[60px] bg-[#fefefc] text-[#191610] hover:bg-[#e5dac7] font-medium transition-all duration-300 px-5"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Try Again
                            </Button>
                            <Button
                                onClick={() => window.location.reload()}
                                variant="outline"
                                className="h-10 rounded-[60px] border-[#544a36] text-[#a8a29e] hover:bg-[#242018] hover:text-[#fefefc] hover:border-[#e5dac7]/40 font-medium transition-all duration-300 px-5"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Reload Page
                            </Button>
                            <Button
                                onClick={() => (window.location.href = '/')}
                                variant="outline"
                                className="h-10 rounded-[60px] border-[#544a36] text-[#a8a29e] hover:bg-[#242018] hover:text-[#fefefc] hover:border-[#e5dac7]/40 font-medium transition-all duration-300 px-5"
                            >
                                <Home className="w-4 h-4 mr-2" />
                                Go Home
                            </Button>
                        </div>

                        {/* Support info */}
                        <p className="text-[11px] text-[#4a4540] flex items-center gap-2">
                            <Bug className="w-3 h-3" />
                            This error has been automatically reported. If the problem persists,
                            please contact support.
                        </p>
                    </CardContent>
                </Card>
            );
        }

        return children;
    }
}

/**
 * HOC for wrapping components with feature error boundary
 */
export function withFeatureErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    featureName: string,
    options?: Omit<FeatureErrorBoundaryProps, 'children' | 'featureName'>
) {
    const WrappedComponent = (props: P) => (
        <FeatureErrorBoundary featureName={featureName} {...options}>
            <Component {...props} />
        </FeatureErrorBoundary>
    );

    WrappedComponent.displayName = `withFeatureErrorBoundary(${Component.displayName ?? Component.name ?? 'Component'})`;

    return WrappedComponent;
}

export default FeatureErrorBoundary;
