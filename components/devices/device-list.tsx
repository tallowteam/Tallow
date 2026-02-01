'use client';

/**
 * Device List Component
 * Discovers and displays nearby devices with EUVEKA styling
 * Includes Suspense boundaries, loading states, and optimistic updates
 */

import {
  useState,
  useEffect,
  useRef,
  useTransition,
  useDeferredValue,
  useMemo,
  useCallback,
  Suspense,
  useOptimistic,
  memo,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NoDevicesEmpty, NoSearchResultsEmpty } from '@/components/ui/empty-state-presets';
import { DeviceDiscoverySkeleton, DeviceListSkeleton } from '@/components/loading';
import {
  RefreshCw,
  Search,
  Loader2,
  Copy,
  Check,
  Camera,
  Star,
  Clock,
  Zap,
  QrCode,
  Radio,
} from 'lucide-react';
import { Device } from '@/lib/types';
import { DeviceCard } from './device-card';
import { QRScanner } from './qr-scanner';
import { getDeviceId } from '@/lib/auth/user-identity';
import { useLanguage } from '@/lib/i18n/language-context';
import { secureLog } from '@/lib/utils/secure-logger';
import { cn } from '@/lib/utils';
import { listItemVariants, staggerContainerVariants } from '@/lib/animations/motion-config';

// ============================================================================
// TYPES
// ============================================================================

export interface DeviceListProps {
  devices: Device[];
  onDeviceSelect?: (device: Device) => void;
  onToggleFavorite?: (device: Device) => void;
  onRefresh?: () => void;
  onQRConnect?: (deviceId: string, name: string) => void;
  selectedDevice?: Device | null;
  isLoading?: boolean;
}

// ============================================================================
// DEVICE SECTION COMPONENT
// ============================================================================

interface DeviceSectionProps {
  devices: Device[];
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  badgeColor: string;
  onDeviceSelect?: (device: Device) => void;
  onToggleFavorite?: (device: Device) => void;
  selectedDevice: Device | null;
  delay?: number;
}

const DeviceSection = memo(function DeviceSection({
  devices,
  title,
  icon,
  iconColor,
  badgeColor,
  onDeviceSelect,
  onToggleFavorite,
  selectedDevice,
  delay = 0,
}: DeviceSectionProps) {
  if (devices.length === 0) {return null;}

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000 }}
    >
      <div className="flex items-center gap-2 mb-2 sm:mb-3 3xl:mb-4">
        <span className={iconColor}>{icon}</span>
        <h4 className="text-xs sm:text-sm 3xl:text-base font-semibold text-[#191610] dark:text-[#fefefc]">
          {title}
        </h4>
        <span
          className={cn(
            'text-[10px] sm:text-xs 3xl:text-sm font-medium px-1.5 sm:px-2 py-0.5 rounded-full',
            badgeColor
          )}
        >
          {devices.length}
        </span>
      </div>
      <motion.div
        className="space-y-2 sm:space-y-3 3xl:space-y-4"
        variants={staggerContainerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="popLayout">
          {devices.map((device) => (
            <motion.div
              key={device.id}
              variants={listItemVariants}
              layout
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            >
              <DeviceCard
                device={device}
                {...(onDeviceSelect ? { onSelect: onDeviceSelect } : {})}
                {...(onToggleFavorite ? { onToggleFavorite } : {})}
                isSelected={selectedDevice?.id === device.id}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
});

// ============================================================================
// QR CODE CARD COMPONENT
// ============================================================================

interface QRCodeCardProps {
  deviceId: string;
  localCode: string;
}

const QRCodeCard = memo(function QRCodeCard({ deviceId, localCode }: QRCodeCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  // Generate QR code
  useEffect(() => {
    const generateQR = async () => {
      const canvas = canvasRef.current;
      if (!canvas) {return;}

      try {
        const QRCode = await import('qrcode');
        await QRCode.toCanvas(canvas, localCode, {
          width: 88,
          margin: 1,
          color: {
            dark: '#191610',
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'M',
        });
      } catch {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, 88, 88);
          ctx.fillStyle = '#191610';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('QR', 44, 48);
        }
      }
    };

    const timeoutId = setTimeout(generateQR, 50);
    return () => clearTimeout(timeoutId);
  }, [localCode]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(deviceId.slice(0, 8).toUpperCase());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      secureLog.error('Failed to copy:', error);
    }
  };

  return (
    <Card
      className={cn(
        'p-4 sm:p-5',
        'rounded-2xl sm:rounded-3xl',
        'bg-gradient-to-br from-[#fefefc] to-[#f3ede2]',
        'dark:from-[#191610] dark:to-[#0a0a0a]',
        'border border-[#e5dac7] dark:border-[#544a36]'
      )}
    >
      <div className="flex items-center gap-4">
        {/* QR Code */}
        <div
          className={cn(
            'p-2 rounded-xl shrink-0',
            'bg-white border border-[#e5dac7]',
            'dark:bg-white dark:border-[#d6cec2]',
            'shadow-sm'
          )}
        >
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
            <QrCode className="w-4 h-4 text-[#191610] dark:text-[#fefefc]" aria-hidden="true" />
            <p className="text-sm font-semibold text-[#191610] dark:text-[#fefefc]">
              My Device Code
            </p>
          </div>

          {/* Copyable Code */}
          <button
            onClick={handleCopyCode}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl w-full',
              'bg-[#f3ede2] dark:bg-[#242018]',
              'border border-[#e5dac7] dark:border-[#544a36]',
              'hover:bg-[#e5dac7] dark:hover:bg-[#2c261c]',
              'transition-all duration-200 cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-[#191610]/50 dark:focus-visible:ring-[#fefefc]/50'
            )}
            aria-label="Copy device code"
          >
            <code className="font-mono text-sm font-semibold tracking-widest text-[#191610] dark:text-[#fefefc]">
              {deviceId.slice(0, 8).toUpperCase()}
            </code>
            <div className="ml-auto">
              {copied ? (
                <Check className="w-4 h-4 text-green-500" aria-hidden="true" />
              ) : (
                <Copy className="w-4 h-4 text-[#b2987d]" aria-hidden="true" />
              )}
            </div>
          </button>

          {/* Live region for copy feedback */}
          <div role="status" aria-live="polite" className="sr-only">
            {copied ? 'Device code copied to clipboard' : ''}
          </div>

          <p className="text-xs text-[#b2987d]">
            Full ID: {deviceId.slice(0, 16).toUpperCase()}...
          </p>
        </div>
      </div>
    </Card>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DeviceList({
  devices,
  onDeviceSelect,
  onToggleFavorite,
  onRefresh,
  onQRConnect,
  selectedDevice,
  isLoading = false,
}: DeviceListProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'qr' | 'discover'>('discover');
  const [qrConnected, setQrConnected] = useState<string | null>(null);

  // React 19 features for search optimization
  const [isPending, startTransition] = useTransition();
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Optimistic updates for favorites
  const [optimisticDevices, updateOptimisticDevices] = useOptimistic(
    devices,
    (state, action: { type: 'toggleFavorite'; id: string }) => {
      if (action.type === 'toggleFavorite') {
        return state.map((d) =>
          d.id === action.id ? { ...d, isFavorite: !d.isFavorite } : d
        );
      }
      return state;
    }
  );

  // Generate a local connection code
  const deviceId = typeof window !== 'undefined' ? getDeviceId() : 'device';
  const localCode = `Tallow://${deviceId}?name=Device`;

  const handleQRScan = useCallback(
    (data: string) => {
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
    },
    [onQRConnect]
  );

  // Handle favorite toggle with optimistic update
  const handleToggleFavorite = useCallback(
    (device: Device) => {
      updateOptimisticDevices({ type: 'toggleFavorite', id: device.id });
      onToggleFavorite?.(device);
    },
    [onToggleFavorite, updateOptimisticDevices]
  );

  // Use deferred value for filtering to keep UI responsive (React 18/19 optimization)
  const filteredDevices = useMemo(
    () =>
      optimisticDevices.filter(
        (device) =>
          device.name.toLowerCase().includes(deferredSearchQuery.toLowerCase()) ||
          device.ip?.includes(deferredSearchQuery)
      ),
    [optimisticDevices, deferredSearchQuery]
  );

  // Memoize categorized device lists
  const { onlineDevices, offlineDevices, favoriteDevices } = useMemo(
    () => ({
      onlineDevices: filteredDevices.filter((d) => d.isOnline),
      offlineDevices: filteredDevices.filter((d) => !d.isOnline),
      favoriteDevices: filteredDevices.filter((d) => d.isFavorite && d.isOnline),
    }),
    [filteredDevices]
  );

  // Handle search input with transition for non-urgent updates
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      startTransition(() => {
        setSearchQuery(value);
      });
    },
    []
  );

  // Loading state - show skeleton
  if (isLoading && devices.length === 0) {
    return (
      <Suspense fallback={<DeviceDiscoverySkeleton />}>
        <DeviceDiscoverySkeleton deviceCount={4} showQRCode />
      </Suspense>
    );
  }

  return (
    <section
      className="space-y-4 sm:space-y-5 3xl:space-y-6"
      aria-labelledby="device-list-heading"
    >
      <h2 id="device-list-heading" className="sr-only">
        Discover and connect to devices
      </h2>

      {/* Live region for device discovery updates */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {isLoading
          ? 'Searching for devices...'
          : `Found ${devices.length} device${devices.length !== 1 ? 's' : ''}`}
      </div>

      {/* Tabs for QR / Discover */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'qr' | 'discover')}
        className="w-full"
      >
        <TabsList
          className={cn(
            'grid w-full grid-cols-2 h-11 sm:h-12 3xl:h-14 p-1 rounded-xl sm:rounded-2xl 3xl:rounded-3xl',
            'bg-[#f3ede2] dark:bg-[#0a0a0a]',
            'border border-[#e5dac7] dark:border-[#1f1f1f]'
          )}
        >
          <TabsTrigger
            value="discover"
            className={cn(
              'flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl 3xl:rounded-2xl h-9 sm:h-10 3xl:h-12',
              'text-xs sm:text-sm 3xl:text-base font-medium transition-all duration-200',
              'data-[state=active]:bg-[#fefefc] data-[state=active]:text-[#191610]',
              'data-[state=active]:shadow-sm',
              'dark:data-[state=active]:bg-[#191610] dark:data-[state=active]:text-[#fefefc]',
              'text-[#b2987d] dark:text-[#b2987d]'
            )}
          >
            <Radio
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 3xl:w-5 3xl:h-5"
              aria-hidden="true"
            />
            <span>{t('app.refresh')}</span>
          </TabsTrigger>
          <TabsTrigger
            value="qr"
            className={cn(
              'flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl 3xl:rounded-2xl h-9 sm:h-10 3xl:h-12',
              'text-xs sm:text-sm 3xl:text-base font-medium transition-all duration-200',
              'data-[state=active]:bg-[#fefefc] data-[state=active]:text-[#191610]',
              'data-[state=active]:shadow-sm',
              'dark:data-[state=active]:bg-[#191610] dark:data-[state=active]:text-[#fefefc]',
              'text-[#b2987d] dark:text-[#b2987d]'
            )}
          >
            <Camera
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 3xl:w-5 3xl:h-5"
              aria-hidden="true"
            />
            <span>{t('app.scanQR')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Discover Tab */}
        <TabsContent
          value="discover"
          className="mt-4 sm:mt-5 3xl:mt-6 space-y-4 sm:space-y-5 3xl:space-y-6"
        >
          {/* Search and Refresh */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 3xl:w-6 3xl:h-6 text-[#b2987d] pointer-events-none"
                aria-hidden="true"
              />
              <Input
                placeholder="Search devices..."
                value={searchQuery}
                onChange={handleSearchChange}
                className={cn(
                  'pl-10 sm:pl-12 3xl:pl-14 h-11 sm:h-12 3xl:h-14 rounded-xl sm:rounded-2xl 3xl:rounded-3xl text-sm sm:text-base 3xl:text-lg',
                  'bg-[#fefefc] dark:bg-[#0a0a0a]',
                  'border-[#e5dac7] dark:border-[#1f1f1f]',
                  'focus:border-[#191610] focus:ring-[#191610]/20',
                  'dark:focus:border-[#fefefc] dark:focus:ring-[#fefefc]/20',
                  'placeholder:text-[#b2987d]'
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
                'h-11 w-11 sm:h-12 sm:w-12 3xl:h-14 3xl:w-14 rounded-xl sm:rounded-2xl 3xl:rounded-3xl shrink-0',
                'border-[#e5dac7] dark:border-[#1f1f1f]',
                'bg-[#fefefc] dark:bg-[#0a0a0a]',
                'hover:bg-[#f3ede2] hover:border-[#b2987d]',
                'dark:hover:bg-[#191610] dark:hover:border-[#544a36]',
                'transition-all duration-200'
              )}
              aria-label={isLoading ? 'Refreshing devices...' : 'Refresh device list'}
            >
              {isLoading ? (
                <Loader2
                  className="w-4 h-4 sm:w-5 sm:h-5 3xl:w-6 3xl:h-6 animate-spin text-[#191610] dark:text-[#fefefc]"
                  aria-hidden="true"
                />
              ) : (
                <RefreshCw
                  className="w-4 h-4 sm:w-5 sm:h-5 3xl:w-6 3xl:h-6"
                  aria-hidden="true"
                />
              )}
            </Button>
          </div>

          {/* Device Lists */}
          <Suspense fallback={<DeviceListSkeleton count={4} showSections />}>
            {devices.length === 0 ? (
              <Card
                className={cn(
                  'overflow-hidden',
                  'rounded-2xl sm:rounded-3xl',
                  'bg-[#fefefc] dark:bg-[#191610]',
                  'border border-[#e5dac7] dark:border-[#544a36]'
                )}
              >
                <NoDevicesEmpty
                  isSearching={isLoading}
                  {...(onRefresh && { onRefresh })}
                  onScanQR={() => setActiveTab('qr')}
                />
              </Card>
            ) : filteredDevices.length === 0 ? (
              <Card
                className={cn(
                  'overflow-hidden',
                  'rounded-2xl sm:rounded-3xl',
                  'bg-[#fefefc] dark:bg-[#191610]',
                  'border border-[#e5dac7] dark:border-[#544a36]'
                )}
              >
                <NoSearchResultsEmpty
                  query={searchQuery}
                  onClearSearch={() => setSearchQuery('')}
                />
              </Card>
            ) : (
              <ScrollArea
                className={cn(
                  'h-[350px] sm:h-[420px] 3xl:h-[500px] pr-1',
                  isPending && 'opacity-70 transition-opacity'
                )}
              >
                <div className="space-y-5 sm:space-y-6 3xl:space-y-8">
                  {/* Favorites Section */}
                  <DeviceSection
                    devices={favoriteDevices}
                    title="Favorites"
                    icon={
                      <Star
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 3xl:w-5 3xl:h-5 fill-amber-500"
                        aria-hidden="true"
                      />
                    }
                    iconColor="text-amber-500"
                    badgeColor="bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    {...(onDeviceSelect && { onDeviceSelect })}
                    onToggleFavorite={handleToggleFavorite}
                    selectedDevice={selectedDevice ?? null}
                    delay={0}
                  />

                  {/* Online Devices Section (non-favorites) */}
                  <DeviceSection
                    devices={onlineDevices.filter((d) => !d.isFavorite)}
                    title="Available"
                    icon={
                      <Zap
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 3xl:w-5 3xl:h-5"
                        aria-hidden="true"
                      />
                    }
                    iconColor="text-green-500"
                    badgeColor="bg-green-500/10 text-green-600 dark:text-green-400"
                    {...(onDeviceSelect && { onDeviceSelect })}
                    onToggleFavorite={handleToggleFavorite}
                    selectedDevice={selectedDevice ?? null}
                    delay={100}
                  />

                  {/* Offline Devices Section */}
                  <DeviceSection
                    devices={offlineDevices}
                    title="Recently Seen"
                    icon={
                      <Clock
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 3xl:w-5 3xl:h-5"
                        aria-hidden="true"
                      />
                    }
                    iconColor="text-[#b2987d]"
                    badgeColor="bg-[#f3ede2] dark:bg-[#242018] text-[#b2987d]"
                    onToggleFavorite={handleToggleFavorite}
                    selectedDevice={selectedDevice ?? null}
                    delay={200}
                  />
                </div>
              </ScrollArea>
            )}
          </Suspense>

          {/* My QR Code Card */}
          <QRCodeCard deviceId={deviceId} localCode={localCode} />
        </TabsContent>

        {/* QR Scanner Tab */}
        <TabsContent value="qr" className="mt-5">
          <Card
            className={cn(
              'p-6 sm:p-8',
              'rounded-2xl sm:rounded-3xl',
              'bg-[#fefefc] dark:bg-[#191610]',
              'border border-[#e5dac7] dark:border-[#544a36]'
            )}
          >
            <div className="flex flex-col items-center text-center space-y-5">
              {qrConnected ? (
                <div className="flex flex-col items-center space-y-4 py-6">
                  <div
                    className={cn(
                      'w-20 h-20 rounded-3xl',
                      'bg-green-500/10 dark:bg-green-500/20',
                      'flex items-center justify-center'
                    )}
                  >
                    <Check className="w-10 h-10 text-green-500" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl text-[#191610] dark:text-[#fefefc]">
                      Connected!
                    </h3>
                    <p className="text-sm text-[#b2987d] mt-1">
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
                <QRScanner onScan={handleQRScan} active={activeTab === 'qr'} />
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}

export default DeviceList;
