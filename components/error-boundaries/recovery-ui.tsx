'use client';

/**
 * Recovery UI Components - EUVEKA Style
 * Reusable components for error recovery
 *
 * EUVEKA Design System:
 * - Error: #ff4f4f
 * - Background dark: #191610
 * - Background light: #fefefc
 * - Border: #e5dac7 / #544a36
 * - Pill buttons: 60px border-radius
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    AlertCircle,
    RefreshCw,
    Home,
    HelpCircle,
    WifiOff,
    Search,
    Lock,
    Clock,
} from 'lucide-react';

export interface ErrorRecoveryProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
    onGoHome?: () => void;
    onGetHelp?: () => void;
    showStackTrace?: boolean;
    stackTrace?: string;
    icon?: React.ReactNode;
}

/**
 * EUVEKA-styled error icon with glow
 */
function ErrorIcon({ icon: IconComponent = AlertCircle }: { icon?: React.ElementType }) {
    return (
        <div className="relative shrink-0">
            <div className="absolute inset-0 bg-[#ff4f4f]/15 blur-xl rounded-full" />
            <div className="relative w-14 h-14 rounded-full bg-[#242018] border border-[#ff4f4f]/30 flex items-center justify-center">
                <IconComponent className="h-7 w-7 text-[#ff4f4f]" />
            </div>
        </div>
    );
}

/**
 * Generic error recovery UI - EUVEKA Style
 */
export function ErrorRecoveryUI({
    title = 'Something went wrong',
    message = 'An unexpected error occurred. Please try again.',
    onRetry,
    onGoHome,
    onGetHelp,
    showStackTrace = false,
    stackTrace,
    icon,
}: ErrorRecoveryProps) {
    return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
            <Card className="w-full max-w-lg bg-[#1f1c16] border-[#544a36]/60 shadow-2xl rounded-3xl">
                <CardHeader className="pb-4">
                    <div className="flex items-start gap-4">
                        {icon || <ErrorIcon />}
                        <div className="flex-1 pt-1">
                            <CardTitle className="text-[#fefefc] font-light tracking-tight text-lg">
                                {title}
                            </CardTitle>
                            <CardDescription className="text-[#a8a29e] mt-1">
                                {message}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-5">
                    {/* Stack trace in development */}
                    {showStackTrace && stackTrace && process.env.NODE_ENV === 'development' && (
                        <details className="rounded-xl bg-[#151310] border border-[#544a36]/40 p-4 text-xs font-mono">
                            <summary className="cursor-pointer text-[#ff4f4f] uppercase tracking-wider text-[10px] font-semibold">
                                Error Details
                            </summary>
                            <pre className="mt-3 overflow-auto max-h-40 whitespace-pre-wrap text-[#a8a29e]">
                                {stackTrace}
                            </pre>
                        </details>
                    )}

                    {/* EUVEKA pill-shaped action buttons */}
                    <div className="flex flex-wrap gap-3">
                        {onRetry && (
                            <Button
                                onClick={onRetry}
                                className="h-11 rounded-[60px] bg-[#fefefc] text-[#191610] hover:bg-[#e5dac7] font-medium transition-all duration-300 px-6"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Try Again
                            </Button>
                        )}
                        {onGoHome && (
                            <Button
                                onClick={onGoHome}
                                variant="outline"
                                className="h-11 rounded-[60px] border-[#544a36] text-[#a8a29e] hover:bg-[#242018] hover:text-[#fefefc] hover:border-[#e5dac7]/40 font-medium transition-all duration-300 px-6"
                            >
                                <Home className="w-4 h-4 mr-2" />
                                Go Home
                            </Button>
                        )}
                        {onGetHelp && (
                            <Button
                                onClick={onGetHelp}
                                variant="outline"
                                className="h-11 rounded-[60px] border-[#544a36] text-[#a8a29e] hover:bg-[#242018] hover:text-[#fefefc] hover:border-[#e5dac7]/40 font-medium transition-all duration-300 px-6"
                            >
                                <HelpCircle className="w-4 h-4 mr-2" />
                                Get Help
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Network error recovery UI - EUVEKA Style
 */
export function NetworkErrorRecovery({ onRetry }: { onRetry?: () => void }) {
    return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
            <Card className="w-full max-w-lg bg-[#1f1c16] border-[#544a36]/60 shadow-2xl rounded-3xl">
                <CardHeader className="pb-4">
                    <div className="flex items-start gap-4">
                        <div className="relative shrink-0">
                            <div className="absolute inset-0 bg-[#ff4f4f]/15 blur-xl rounded-full" />
                            <div className="relative w-14 h-14 rounded-full bg-[#242018] border border-[#ff4f4f]/30 flex items-center justify-center">
                                <WifiOff className="h-7 w-7 text-[#ff4f4f]" />
                            </div>
                        </div>
                        <div className="flex-1 pt-1">
                            <CardTitle className="text-[#fefefc] font-light tracking-tight text-lg">
                                Connection Lost
                            </CardTitle>
                            <CardDescription className="text-[#a8a29e] mt-1">
                                Unable to connect to the server. Please check your internet
                                connection and try again.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Button
                        onClick={onRetry ?? (() => window.location.reload())}
                        className="h-11 rounded-[60px] bg-[#fefefc] text-[#191610] hover:bg-[#e5dac7] font-medium transition-all duration-300 px-6"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry Connection
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Not found error recovery UI - EUVEKA Style
 */
export function NotFoundRecovery({
    resource = 'page',
    onGoHome,
}: {
    resource?: string;
    onGoHome?: () => void;
}) {
    return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
            <Card className="w-full max-w-lg bg-[#1f1c16] border-[#544a36]/60 shadow-2xl rounded-3xl">
                <CardHeader className="pb-4">
                    <div className="flex items-start gap-4">
                        <div className="relative shrink-0">
                            <div className="absolute inset-0 bg-[#ff4f4f]/15 blur-xl rounded-full" />
                            <div className="relative w-14 h-14 rounded-full bg-[#242018] border border-[#ff4f4f]/30 flex items-center justify-center">
                                <Search className="h-7 w-7 text-[#ff4f4f]" />
                            </div>
                        </div>
                        <div className="flex-1 pt-1">
                            <CardTitle className="text-[#fefefc] font-light tracking-tight text-lg">
                                Not Found
                            </CardTitle>
                            <CardDescription className="text-[#a8a29e] mt-1">
                                The {resource} you&apos;re looking for doesn&apos;t exist or has
                                been moved.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Button
                        onClick={onGoHome || (() => (window.location.href = '/'))}
                        className="h-11 rounded-[60px] bg-[#fefefc] text-[#191610] hover:bg-[#e5dac7] font-medium transition-all duration-300 px-6"
                    >
                        <Home className="w-4 h-4 mr-2" />
                        Return Home
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Permission error recovery UI - EUVEKA Style
 */
export function PermissionErrorRecovery({ onGoHome }: { onGoHome?: () => void }) {
    return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
            <Card className="w-full max-w-lg bg-[#1f1c16] border-[#544a36]/60 shadow-2xl rounded-3xl">
                <CardHeader className="pb-4">
                    <div className="flex items-start gap-4">
                        <div className="relative shrink-0">
                            <div className="absolute inset-0 bg-[#ff4f4f]/15 blur-xl rounded-full" />
                            <div className="relative w-14 h-14 rounded-full bg-[#242018] border border-[#ff4f4f]/30 flex items-center justify-center">
                                <Lock className="h-7 w-7 text-[#ff4f4f]" />
                            </div>
                        </div>
                        <div className="flex-1 pt-1">
                            <CardTitle className="text-[#fefefc] font-light tracking-tight text-lg">
                                Access Denied
                            </CardTitle>
                            <CardDescription className="text-[#a8a29e] mt-1">
                                You don&apos;t have permission to access this resource.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Button
                        onClick={onGoHome || (() => (window.location.href = '/'))}
                        className="h-11 rounded-[60px] bg-[#fefefc] text-[#191610] hover:bg-[#e5dac7] font-medium transition-all duration-300 px-6"
                    >
                        <Home className="w-4 h-4 mr-2" />
                        Return Home
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Timeout error recovery UI - EUVEKA Style
 */
export function TimeoutErrorRecovery({ onRetry }: { onRetry?: () => void }) {
    return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
            <Card className="w-full max-w-lg bg-[#1f1c16] border-[#544a36]/60 shadow-2xl rounded-3xl">
                <CardHeader className="pb-4">
                    <div className="flex items-start gap-4">
                        <div className="relative shrink-0">
                            <div className="absolute inset-0 bg-[#ff4f4f]/15 blur-xl rounded-full" />
                            <div className="relative w-14 h-14 rounded-full bg-[#242018] border border-[#ff4f4f]/30 flex items-center justify-center">
                                <Clock className="h-7 w-7 text-[#ff4f4f]" />
                            </div>
                        </div>
                        <div className="flex-1 pt-1">
                            <CardTitle className="text-[#fefefc] font-light tracking-tight text-lg">
                                Request Timeout
                            </CardTitle>
                            <CardDescription className="text-[#a8a29e] mt-1">
                                The request took too long to complete. Please try again.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Button
                        onClick={onRetry ?? (() => window.location.reload())}
                        className="h-11 rounded-[60px] bg-[#fefefc] text-[#191610] hover:bg-[#e5dac7] font-medium transition-all duration-300 px-6"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

export default ErrorRecoveryUI;
