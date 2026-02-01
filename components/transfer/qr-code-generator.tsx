'use client';

import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Download, Share2, Check } from 'lucide-react';
import { useState } from 'react';

export interface QRCodeGeneratorProps {
    value: string;
    title?: string;
    subtitle?: string;
    showCopyButton?: boolean;
    showDownloadButton?: boolean;
    showShareButton?: boolean;
    size?: number;
}

export function QRCodeGenerator({
    value,
    title,
    subtitle,
    showCopyButton = true,
    showDownloadButton = false,
    showShareButton = true,
    size = 200
}: QRCodeGeneratorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const generateQR = async () => {
            const canvas = canvasRef.current;
            if (!canvas) {return;}

            try {
                // Dynamically import QRCode library
                const QRCode = await import('qrcode');

                await QRCode.toCanvas(canvas, value, {
                    width: size,
                    margin: 2,
                    color: {
                        dark: '#0A0A0A',
                        light: '#00000000'
                    },
                    errorCorrectionLevel: 'M'
                });
            } catch {
                // Fallback: draw a placeholder
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.fillStyle = '#F3F3F1';
                    ctx.fillRect(0, 0, size, size);
                    ctx.fillStyle = '#0A0A0A';
                    ctx.font = '14px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('QR Code', size / 2, size / 2);
                }
            }
        };

        generateQR();
    }, [value, size]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Silently fail - user feedback via UI
        }
    };

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) {return;}

        const link = document.createElement('a');
        link.download = 'Tallow-qr.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                const url = value.startsWith('http') ? value : undefined;
                await navigator.share({
                    title: 'Tallow Connection',
                    text: value,
                    ...(url ? { url } : {})
                });
            } catch {
                // User cancelled or share failed - silently ignore
            }
        } else {
            // Fallback to copy
            handleCopy();
        }
    };

    return (
        <Card className="p-6 rounded-xl border border-border bg-card">
            <div className="flex flex-col items-center text-center space-y-4">
                {/* Title */}
                {title && <h3 className="font-semibold text-lg">{title}</h3>}

                {/* QR Code */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
                    <canvas ref={canvasRef} width={size} height={size} className="rounded-lg" aria-label="QR code for connection" />
                </div>

                {/* Connection Code Display */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30">
                    <code className="font-mono text-xl tracking-widest font-bold text-primary">
                        {value.length <= 10 ? value : value.slice(0, 10) + '...'}
                    </code>
                </div>

                {/* Subtitle */}
                {subtitle && (
                    <p className="text-sm text-muted-foreground max-w-xs">{subtitle}</p>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    {showCopyButton && (
                        <Button variant="outline" size="sm" onClick={handleCopy} aria-label={copied ? "Code copied to clipboard" : "Copy connection code"}>
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4 mr-2 text-green-500" aria-hidden="true" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4 mr-2" aria-hidden="true" />
                                    Copy
                                </>
                            )}
                        </Button>
                    )}
                    {showDownloadButton && (
                        <Button variant="outline" size="sm" onClick={handleDownload} aria-label="Download QR code as image">
                            <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                            Download
                        </Button>
                    )}
                    {showShareButton && (
                        <Button variant="outline" size="sm" onClick={handleShare} aria-label="Share connection code">
                            <Share2 className="w-4 h-4 mr-2" aria-hidden="true" />
                            Share
                        </Button>
                    )}
                
                    {/* Live region for copy feedback */}
                    <div role="status" aria-live="polite" className="sr-only">
                        {copied ? 'Connection code copied to clipboard' : ''}
                    </div>
                </div>
            </div>
        </Card>
    );
}

export default QRCodeGenerator;
