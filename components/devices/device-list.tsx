'use client';

import { useState, useEffect, useRef, useTransition, useDeferredValue, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    RefreshCw,
    Search,
    Wifi,
    Loader2,
    Copy,
    Check,
    Camera,
    Star,
    Clock,
    Zap,
    QrCode,
    Radio
} from 'lucide-react';
import { Device } from '@/lib/types';
import { DeviceCard } from './device-card';
import { QRScanner } from './qr-scanner';
import { getDeviceId } from '@/lib/auth/user-identity';
import { useLanguage } from '@/lib/i18n/language-context';
import { secureLog } from '@/lib/utils/secure-logger';
import { cn } from '@/lib/utils';

export interface DeviceListProps {
    devices: Device[];
    onDeviceSelect?: (device: Device) => void;
    onToggleFavorite?: (device: Device) => void;
    onRefresh?: () => void;
    onQRConnect?: (deviceId: string, name: string) => void;
    selectedDevice?: Device | null;
    isLoading?: boolean;
}

export function DeviceList({
    devices,
    onDeviceSelect,
    onToggleFavorite,
    onRefresh,
    onQRConnect,
    selectedDevice,
    isLoading
}: DeviceListProps) {
    const { t } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'qr' | 'discover'>('discover');
    const [copied, setCopied] = useState(false);
    const [qrConnected, setQrConnected] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // React 18 features for search optimization
    const [isPending, startTransition] = useTransition();
    const deferredSearchQuery = useDeferredValue(searchQuery);

    // Generate a local connection code
    const deviceId = typeof window !== 'undefined' ? getDeviceId() : 'device';
    const localCode = `Tallow://${deviceId}?name=Device`;

    // Generate QR code when discover tab is active
    useEffect(() => {
        if (activeTab !== 'discover') {return;}

        const generateQR = async () => {
            const canvas = canvasRef.current;
            if (!canvas) {return;}

            try {
                const QRCode = await import('qrcode');

                await QRCode.toCanvas(canvas, localCode, {
                    width: 88,
                    margin: 1,
                    color: {
                        dark: '#0066FF',
                        light: '#FFFFFF'
                    },
                    errorCorrectionLevel: 'M'
                });
            } catch {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, 88, 88);
                    ctx.fillStyle = '#0066FF';
                    ctx.font = 'bold 12px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('QR', 44, 48);
                }
            }
        };

        const timeoutId = setTimeout(generateQR, 50);
        return () => clearTimeout(timeoutId);
    }, [localCode, activeTab]);

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(deviceId.slice(0, 8).toUpperCase());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            secureLog.error('Failed to copy:', error);
        }
    };

    const handleQRScan = (data: string) => {
        // Parse Tallow://{deviceId}?name={name} format
        if (data.startsWith('Tallow://')) {
            const urlPart = data.slice('Tallow://'.length);
            const [scannedDeviceId, queryString] = urlPart.split('?');
            const params = new URLSearchParams(queryString || '');
            const name = params.get('name') || 'Device';

            if (scannedDeviceId && onQRConnect) {
                setQrConnected(name);
                onQRConnect(scannedDeviceId, name);
                setTimeout(() => setQrConnected(null), 3000);
            }
        }
    };

    // Use deferred value for filtering to keep UI responsive (React 18 optimization)
    const filteredDevices = useMemo(() =>
        devices.filter((device) =>
            device.name.toLowerCase().includes(deferredSearchQuery.toLowerCase()) ||
            device.ip?.includes(deferredSearchQuery)
        ),
        [devices, deferredSearchQuery]
    );

    // Memoize categorized device lists
    const { onlineDevices, offlineDevices, favoriteDevices } = useMemo(() => ({
        onlineDevices: filteredDevices.filter((d) => d.isOnline),
        offlineDevices: filteredDevices.filter((d) => !d.isOnline),
        favoriteDevices: filteredDevices.filter((d) => d.isFavorite && d.isOnline),
    }), [filteredDevices]);

    // Handle search input with transition for non-urgent updates
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Immediate update for input display
        setSearchQuery(value);
        // Deferred filtering happens automatically via useDeferredValue
    };

    return (
        <div className="space-y-4 sm:space-y-5 3xl:space-y-6">
            {/* Tabs for QR / Discover */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'qr' | 'discover')} className="w-full">
                <TabsList className={cn(
                    'grid w-full grid-cols-2 h-11 sm:h-12 3xl:h-14 p-1 rounded-lg sm:rounded-xl 3xl:rounded-2xl',
                    'bg-gray-100 dark:bg-[#0a0a0a]',
                    'border border-gray-200 dark:border-[#1f1f1f]'
                )}>
                    <TabsTrigger
                        value="discover"
                        className={cn(
                            'flex items-center justify-center gap-1.5 sm:gap-2 rounded-md sm:rounded-lg 3xl:rounded-xl h-9 sm:h-10 3xl:h-12',
                            'text-xs sm:text-sm 3xl:text-base font-medium transition-all duration-200',
                            'data-[state=active]:bg-white data-[state=active]:text-[#0066FF]',
                            'data-[state=active]:shadow-sm',
                            'dark:data-[state=active]:bg-[#111111] dark:data-[state=active]:text-[#3385FF]',
                            'text-gray-600 dark:text-gray-400'
                        )}
                    >
                        <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4 3xl:w-5 3xl:h-5" aria-hidden="true" />
                        <span>{t('app.refresh')}</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="qr"
                        className={cn(
                            'flex items-center justify-center gap-1.5 sm:gap-2 rounded-md sm:rounded-lg 3xl:rounded-xl h-9 sm:h-10 3xl:h-12',
                            'text-xs sm:text-sm 3xl:text-base font-medium transition-all duration-200',
                            'data-[state=active]:bg-white data-[state=active]:text-[#0066FF]',
                            'data-[state=active]:shadow-sm',
                            'dark:data-[state=active]:bg-[#111111] dark:data-[state=active]:text-[#3385FF]',
                            'text-gray-600 dark:text-gray-400'
                        )}
                    >
                        <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 3xl:w-5 3xl:h-5" aria-hidden="true" />
                        <span>{t('app.scanQR')}</span>
                    </TabsTrigger>
                </TabsList>

                {/* Discover Tab */}
                <TabsContent value="discover" className="mt-4 sm:mt-5 3xl:mt-6 space-y-4 sm:space-y-5 3xl:space-y-6">
                    {/* Search and Refresh */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="relative flex-1">
                            <Search
                                className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 3xl:w-6 3xl:h-6 text-gray-400 dark:text-gray-500 pointer-events-none"
                                aria-hidden="true"
                            />
                            <Input
                                placeholder="Search devices..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className={cn(
                                    'pl-10 sm:pl-12 3xl:pl-14 h-11 sm:h-12 3xl:h-14 rounded-lg sm:rounded-xl 3xl:rounded-2xl text-sm sm:text-base 3xl:text-lg',
                                    'bg-white dark:bg-[#0a0a0a]',
                                    'border-gray-200 dark:border-[#1f1f1f]',
                                    'focus:border-[#0066FF] focus:ring-[#0066FF]/20',
                                    'placeholder:text-gray-400 dark:placeholder:text-gray-600'
                                )}
                                aria-label="Search devices by name or IP address"
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={onRefresh}
                            disabled={isLoading}
                            className={cn(
                                'h-11 w-11 sm:h-12 sm:w-12 3xl:h-14 3xl:w-14 rounded-lg sm:rounded-xl 3xl:rounded-2xl shrink-0',
                                'border-gray-200 dark:border-[#1f1f1f]',
                                'bg-white dark:bg-[#0a0a0a]',
                                'hover:bg-[#0066FF]/5 hover:border-[#0066FF]/30',
                                'hover:text-[#0066FF]',
                                'transition-all duration-200'
                            )}
                            aria-label={isLoading ? "Refreshing devices..." : "Refresh device list"}
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 3xl:w-6 3xl:h-6 animate-spin text-[#0066FF]" aria-hidden="true" />
                            ) : (
                                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 3xl:w-6 3xl:h-6" aria-hidden="true" />
                            )}
                        </Button>
                    </div>

                    {/* Device Lists */}
                    {devices.length === 0 ? (
                        <Card variant="default" hoverLift={false} className="p-6 sm:p-10 3xl:p-12 text-center">
                            <div className={cn(
                                'w-16 h-16 sm:w-20 sm:h-20 3xl:w-24 3xl:h-24 mx-auto mb-4 sm:mb-5 3xl:mb-6 rounded-xl sm:rounded-2xl 3xl:rounded-3xl',
                                'bg-[#0066FF]/10 dark:bg-[#0066FF]/20',
                                'flex items-center justify-center'
                            )}>
                                <Wifi
                                    className="w-8 h-8 sm:w-10 sm:h-10 3xl:w-12 3xl:h-12 text-[#0066FF] animate-pulse"
                                    aria-hidden="true"
                                />
                            </div>
                            <h4 className="font-semibold text-base sm:text-lg 3xl:text-xl text-gray-900 dark:text-white mb-2">
                                {t('app.searchingDevices')}
                            </h4>
                            <p className="text-xs sm:text-sm 3xl:text-base text-gray-500 dark:text-gray-400 max-w-xs 3xl:max-w-sm mx-auto">
                                {t('app.noDevicesFound')}
                            </p>
                        </Card>
                    ) : filteredDevices.length === 0 ? (
                        <Card variant="default" hoverLift={false} className="p-10 text-center">
                            <div className={cn(
                                'w-20 h-20 mx-auto mb-5 rounded-2xl',
                                'bg-gray-100 dark:bg-[#1a1a1a]',
                                'flex items-center justify-center'
                            )}>
                                <Search className="w-10 h-10 text-gray-400" aria-hidden="true" />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400">
                                No devices found matching &quot;{searchQuery}&quot;
                            </p>
                        </Card>
                    ) : (
                        <ScrollArea className={cn("h-[350px] sm:h-[420px] 3xl:h-[500px] pr-1", isPending && "opacity-70 transition-opacity")}>
                            <div className="space-y-5 sm:space-y-6 3xl:space-y-8">
                                {/* Favorites Section */}
                                {favoriteDevices.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2 sm:mb-3 3xl:mb-4">
                                            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 3xl:w-5 3xl:h-5 text-amber-500 fill-amber-500" aria-hidden="true" />
                                            <h4 className="text-xs sm:text-sm 3xl:text-base font-semibold text-gray-900 dark:text-white">
                                                Favorites
                                            </h4>
                                            <span className={cn(
                                                'text-[10px] sm:text-xs 3xl:text-sm font-medium px-1.5 sm:px-2 py-0.5 rounded-full',
                                                'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                            )}>
                                                {favoriteDevices.length}
                                            </span>
                                        </div>
                                        <div className="space-y-2 sm:space-y-3 3xl:space-y-4">
                                            {favoriteDevices.map((device) => (
                                                <DeviceCard
                                                    key={device.id}
                                                    device={device}
                                                    {...(onDeviceSelect ? { onSelect: onDeviceSelect } : {})}
                                                    {...(onToggleFavorite ? { onToggleFavorite } : {})}
                                                    isSelected={selectedDevice?.id === device.id}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Online Devices Section */}
                                {onlineDevices.filter(d => !d.isFavorite).length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2 sm:mb-3 3xl:mb-4">
                                            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 3xl:w-5 3xl:h-5 text-green-500" aria-hidden="true" />
                                            <h4 className="text-xs sm:text-sm 3xl:text-base font-semibold text-gray-900 dark:text-white">
                                                Available
                                            </h4>
                                            <span className={cn(
                                                'text-[10px] sm:text-xs 3xl:text-sm font-medium px-1.5 sm:px-2 py-0.5 rounded-full',
                                                'bg-green-500/10 text-green-600 dark:text-green-400'
                                            )}>
                                                {onlineDevices.filter(d => !d.isFavorite).length}
                                            </span>
                                        </div>
                                        <div className="space-y-2 sm:space-y-3 3xl:space-y-4">
                                            {onlineDevices.filter(d => !d.isFavorite).map((device) => (
                                                <DeviceCard
                                                    key={device.id}
                                                    device={device}
                                                    {...(onDeviceSelect ? { onSelect: onDeviceSelect } : {})}
                                                    {...(onToggleFavorite ? { onToggleFavorite } : {})}
                                                    isSelected={selectedDevice?.id === device.id}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Offline Devices Section */}
                                {offlineDevices.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2 sm:mb-3 3xl:mb-4">
                                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 3xl:w-5 3xl:h-5 text-gray-400" aria-hidden="true" />
                                            <h4 className="text-xs sm:text-sm 3xl:text-base font-semibold text-gray-500 dark:text-gray-400">
                                                Recently Seen
                                            </h4>
                                            <span className={cn(
                                                'text-[10px] sm:text-xs 3xl:text-sm font-medium px-1.5 sm:px-2 py-0.5 rounded-full',
                                                'bg-gray-100 dark:bg-gray-800 text-gray-500'
                                            )}>
                                                {offlineDevices.length}
                                            </span>
                                        </div>
                                        <div className="space-y-2 sm:space-y-3 3xl:space-y-4">
                                            {offlineDevices.map((device) => (
                                                <DeviceCard
                                                    key={device.id}
                                                    device={device}
                                                    {...(onToggleFavorite ? { onToggleFavorite } : {})}
                                                    isSelected={selectedDevice?.id === device.id}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    )}

                    {/* My QR Code Card */}
                    <Card
                        variant="default"
                        hoverGlow
                        className={cn(
                            'p-4 sm:p-5',
                            'bg-gradient-to-br from-white to-gray-50',
                            'dark:from-[#111111] dark:to-[#0a0a0a]'
                        )}
                    >
                        <div className="flex items-center gap-4">
                            {/* QR Code */}
                            <div className={cn(
                                'p-2 rounded-xl shrink-0',
                                'bg-white border border-gray-200',
                                'dark:bg-white dark:border-gray-300',
                                'shadow-sm'
                            )}>
                                <canvas
                                    ref={canvasRef}
                                    width={88}
                                    height={88}
                                    className="rounded-lg"
                                    aria-label="My device QR code for pairing"
                                />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 space-y-2">
                                <div className="flex items-center gap-2">
                                    <QrCode className="w-4 h-4 text-[#0066FF]" aria-hidden="true" />
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        My Device Code
                                    </p>
                                </div>

                                {/* Copyable Code */}
                                <button
                                    onClick={handleCopyCode}
                                    className={cn(
                                        'flex items-center gap-2 px-3 py-2 rounded-lg w-full',
                                        'bg-[#0066FF]/5 dark:bg-[#0066FF]/10',
                                        'border border-[#0066FF]/20 dark:border-[#0066FF]/30',
                                        'hover:bg-[#0066FF]/10 dark:hover:bg-[#0066FF]/20',
                                        'transition-all duration-200 cursor-pointer',
                                        'focus-visible:outline-none focus-visible:ring-2',
                                        'focus-visible:ring-[#0066FF]/50'
                                    )}
                                    aria-label="Copy device code"
                                >
                                    <code className="font-mono text-sm font-semibold tracking-widest text-[#0066FF] dark:text-[#3385FF]">
                                        {deviceId.slice(0, 8).toUpperCase()}
                                    </code>
                                    <div className="ml-auto">
                                        {copied ? (
                                            <Check className="w-4 h-4 text-green-500" aria-hidden="true" />
                                        ) : (
                                            <Copy className="w-4 h-4 text-[#0066FF]/60" aria-hidden="true" />
                                        )}
                                    </div>
                                </button>

                                {/* Live region for copy feedback */}
                                <div role="status" aria-live="polite" className="sr-only">
                                    {copied ? 'Device code copied to clipboard' : ''}
                                </div>

                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                    Full ID: {deviceId.slice(0, 16).toUpperCase()}...
                                </p>
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                {/* QR Scanner Tab */}
                <TabsContent value="qr" className="mt-5">
                    <Card
                        variant="default"
                        hoverLift={false}
                        className="p-6 sm:p-8"
                    >
                        <div className="flex flex-col items-center text-center space-y-5">
                            {qrConnected ? (
                                <div className="flex flex-col items-center space-y-4 py-6">
                                    <div className={cn(
                                        'w-20 h-20 rounded-2xl',
                                        'bg-green-500/10 dark:bg-green-500/20',
                                        'flex items-center justify-center'
                                    )}>
                                        <Check
                                            className="w-10 h-10 text-green-500"
                                            aria-hidden="true"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-xl text-gray-900 dark:text-white">
                                            Connected!
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            Connecting to {qrConnected}...
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                            Establishing secure connection
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <QRScanner
                                    onScan={handleQRScan}
                                    active={activeTab === 'qr'}
                                />
                            )}
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default DeviceList;
