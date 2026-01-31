'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Search, Wifi, Copy, Check, Camera } from 'lucide-react';
import { Device } from '@/lib/types';
import { DeviceCard } from './device-card';
import { QRScanner } from './qr-scanner';
import { getDeviceId } from '@/lib/auth/user-identity';
import { useLanguage } from '@/lib/i18n/language-context';
import { secureLog } from '@/lib/utils/secure-logger';
import { DeviceListSkeleton } from '@/components/ui/skeleton';
import { AnimatedList, AnimatedListItem } from '@/lib/animations/animated-components';
import { fadeUpVariants } from '@/lib/animations/motion-config';

export interface DeviceListProps {
    devices: Device[];
    onDeviceSelect?: (device: Device) => void;
    onToggleFavorite?: (device: Device) => void;
    onRefresh?: () => void;
    onQRConnect?: (deviceId: string, name: string) => void;
    selectedDevice?: Device | null;
    isLoading?: boolean;
}

export function DeviceListAnimated({
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

    const deviceId = typeof window !== 'undefined' ? getDeviceId() : 'device';
    const localCode = `Tallow://${deviceId}?name=Device`;

    useEffect(() => {
        if (activeTab !== 'discover') {return;}

        const generateQR = async () => {
            const canvas = canvasRef.current;
            if (!canvas) {return;}

            try {
                const QRCode = await import('qrcode');
                await QRCode.toCanvas(canvas, localCode, {
                    width: 80,
                    margin: 1,
                    color: {
                        dark: '#0A0A0A',
                        light: '#FFFFFF'
                    },
                    errorCorrectionLevel: 'M'
                });
            } catch {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, 80, 80);
                    ctx.fillStyle = '#0A0A0A';
                    ctx.font = '10px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('QR', 40, 44);
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
        if (data.startsWith('Tallow://')) {
            const urlPart = data.slice('Tallow://'.length);
            const [deviceId, queryString] = urlPart.split('?');
            const params = new URLSearchParams(queryString || '');
            const name = params.get('name') || 'Device';

            if (deviceId && onQRConnect) {
                setQrConnected(name);
                onQRConnect(deviceId, name);
                setTimeout(() => setQrConnected(null), 3000);
            }
        }
    };

    const filteredDevices = devices.filter((device) =>
        device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.ip?.includes(searchQuery)
    );

    const onlineDevices = filteredDevices.filter((d) => d.isOnline);
    const offlineDevices = filteredDevices.filter((d) => !d.isOnline);
    const favoriteDevices = filteredDevices.filter((d) => d.isFavorite && d.isOnline);

    return (
        <motion.div
            className="space-y-4"
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
        >
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'qr' | 'discover')} className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-xl border border-border bg-card h-11">
                    <TabsTrigger value="discover" className="flex items-center gap-2 text-sm sm:text-base">
                        <Wifi className="w-4 h-4" />
                        <span>{t('app.refresh')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="qr" className="flex items-center gap-2 text-sm sm:text-base">
                        <Camera className="w-4 h-4" />
                        <span>{t('app.scanQR')}</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="discover" className="mt-4 space-y-4">
                    {/* Search and Refresh */}
                    <motion.div
                        className="flex items-center gap-2"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            <Input
                                placeholder="Search devices..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 rounded-xl border border-border bg-card h-11 text-base"
                            />
                        </div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={onRefresh}
                                disabled={isLoading}
                                className="h-11 w-11"
                                aria-label={isLoading ? "Refreshing devices..." : "Refresh device list"}
                            >
                                <motion.div
                                    animate={isLoading ? { rotate: 360 } : {}}
                                    transition={{ duration: 1, repeat: isLoading ? Infinity : 0, ease: 'linear' }}
                                >
                                    <RefreshCw className="w-5 h-5" aria-hidden="true" />
                                </motion.div>
                            </Button>
                        </motion.div>
                    </motion.div>

                    {/* Device Lists with Loading State */}
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <DeviceListSkeleton count={3} />
                            </motion.div>
                        ) : devices.length === 0 ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                            >
                                <Card className="p-8 rounded-xl border border-border bg-card text-center">
                                    <motion.div
                                        className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center"
                                        animate={{ scale: [1, 1.05, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <Wifi className="w-8 h-8 text-primary" />
                                    </motion.div>
                                    <h4 className="font-semibold mb-2">{t('app.searchingDevices')}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {t('app.noDevicesFound')}
                                    </p>
                                </Card>
                            </motion.div>
                        ) : filteredDevices.length === 0 ? (
                            <motion.div
                                key="no-results"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <Card className="p-8 rounded-xl border border-border bg-card text-center">
                                    <p className="text-muted-foreground">
                                        No devices found matching &quot;{searchQuery}&quot;
                                    </p>
                                </Card>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="devices"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <ScrollArea className="h-[400px]">
                                    <div className="space-y-4" data-testid="device-list" role="list">
                                        {favoriteDevices.length > 0 && (
                                            <AnimatedList>
                                                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                                                    Favorites
                                                </h4>
                                                <div className="space-y-2">
                                                    {favoriteDevices.map((device) => (
                                                        <AnimatedListItem key={device.id}>
                                                            <DeviceCard
                                                                device={device}
                                                                {...(onDeviceSelect ? { onSelect: onDeviceSelect } : {})}
                                                                {...(onToggleFavorite ? { onToggleFavorite } : {})}
                                                                isSelected={selectedDevice?.id === device.id}
                                                            />
                                                        </AnimatedListItem>
                                                    ))}
                                                </div>
                                            </AnimatedList>
                                        )}

                                        {onlineDevices.filter(d => !d.isFavorite).length > 0 && (
                                            <AnimatedList>
                                                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                                                    Available ({onlineDevices.filter(d => !d.isFavorite).length})
                                                </h4>
                                                <div className="space-y-2">
                                                    {onlineDevices.filter(d => !d.isFavorite).map((device) => (
                                                        <AnimatedListItem key={device.id}>
                                                            <DeviceCard
                                                                device={device}
                                                                {...(onDeviceSelect ? { onSelect: onDeviceSelect } : {})}
                                                                {...(onToggleFavorite ? { onToggleFavorite } : {})}
                                                                isSelected={selectedDevice?.id === device.id}
                                                            />
                                                        </AnimatedListItem>
                                                    ))}
                                                </div>
                                            </AnimatedList>
                                        )}

                                        {offlineDevices.length > 0 && (
                                            <AnimatedList>
                                                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                                                    Recently Seen ({offlineDevices.length})
                                                </h4>
                                                <div className="space-y-2 opacity-60">
                                                    {offlineDevices.map((device) => (
                                                        <AnimatedListItem key={device.id}>
                                                            <DeviceCard
                                                                device={device}
                                                                {...(onToggleFavorite ? { onToggleFavorite } : {})}
                                                                isSelected={selectedDevice?.id === device.id}
                                                            />
                                                        </AnimatedListItem>
                                                    ))}
                                                </div>
                                            </AnimatedList>
                                        )}
                                    </div>
                                </ScrollArea>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* My QR Code */}
                    <motion.div
                        className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-border bg-card"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="p-2 rounded-lg bg-white border border-border shrink-0">
                            <canvas ref={canvasRef} width={80} height={80} className="rounded" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm sm:text-base font-medium">My Device Code</p>
                            <motion.div
                                className="flex items-center gap-1.5 cursor-pointer py-1"
                                onClick={handleCopyCode}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <code className="font-mono text-xs sm:text-sm tracking-wider text-primary">
                                    {deviceId.slice(0, 8).toUpperCase()}
                                </code>
                                <AnimatePresence mode="wait">
                                    {copied ? (
                                        <motion.div
                                            key="check"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                        >
                                            <Check className="w-4 h-4 sm:w-3 sm:h-3 text-green-500" />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="copy"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                        >
                                            <Copy className="w-4 h-4 sm:w-3 sm:h-3 text-muted-foreground" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                Device ID: {deviceId.slice(0, 12).toUpperCase()}
                            </p>
                        </div>
                    </motion.div>
                </TabsContent>

                <TabsContent value="qr" className="mt-4">
                    <Card className="p-6 rounded-xl border border-border bg-card">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <AnimatePresence mode="wait">
                                {qrConnected ? (
                                    <motion.div
                                        key="success"
                                        className="flex flex-col items-center space-y-3 py-4"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                    >
                                        <motion.div
                                            className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                        >
                                            <Check className="w-8 h-8 text-green-500" />
                                        </motion.div>
                                        <h3 className="font-semibold text-lg">Connected!</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Connecting to {qrConnected}...
                                        </p>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="scanner"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <QRScanner
                                            onScan={handleQRScan}
                                            active={activeTab === 'qr'}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </motion.div>
    );
}

export default DeviceListAnimated;
