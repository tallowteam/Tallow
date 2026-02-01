'use client';

/**
 * Unified Discovery Example Component
 *
 * Demonstrates how to use the unified mDNS + signaling discovery system.
 * This component can be used as a reference or integrated directly.
 */

import { useState, useCallback } from 'react';
import { useUnifiedDiscovery, useMdnsStatus } from '@/lib/hooks/use-unified-discovery';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Wifi,
  WifiOff,
  Server,
  Laptop,
  Smartphone,
  Monitor,
  RefreshCw,
  Play,
  Square,
  Radio,
} from 'lucide-react';

/**
 * Platform icon mapping
 */
function PlatformIcon({ platform }: { platform: string }) {
  switch (platform) {
    case 'macos':
    case 'windows':
    case 'linux':
      return <Laptop className="h-4 w-4" />;
    case 'ios':
    case 'android':
      return <Smartphone className="h-4 w-4" />;
    case 'web':
      return <Monitor className="h-4 w-4" />;
    default:
      return <Server className="h-4 w-4" />;
  }
}

/**
 * Source badge component
 */
function SourceBadge({ source }: { source: string }) {
  const colors = {
    mdns: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    signaling: 'bg-white/10 text-white dark:bg-white/20 dark:text-white/90',
    both: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  };

  const color = colors[source as keyof typeof colors] || colors.signaling;

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {source === 'mdns' && 'Local'}
      {source === 'signaling' && 'Internet'}
      {source === 'both' && 'Both'}
    </span>
  );
}

/**
 * Unified Discovery Example
 */
export function UnifiedDiscoveryExample() {
  const [isAdvertising, setIsAdvertising] = useState(false);
  const { isAvailable: mdnsAvailable, isChecking: mdnsChecking } = useMdnsStatus();

  const {
    devices,
    isDiscovering,
    isMdnsAvailable,
    isSignalingConnected,
    mdnsDeviceCount,
    signalingDeviceCount,
    startDiscovery,
    stopDiscovery,
    refresh,
    advertise,
    stopAdvertising,
    getBestConnectionMethod,
    error,
  } = useUnifiedDiscovery({
    autoStart: true,
    autoAdvertise: false,
  });

  const handleToggleAdvertise = useCallback(() => {
    if (isAdvertising) {
      stopAdvertising();
      setIsAdvertising(false);
    } else {
      advertise();
      setIsAdvertising(true);
    }
  }, [isAdvertising, advertise, stopAdvertising]);

  const handleConnect = useCallback((deviceId: string) => {
    const method = getBestConnectionMethod(deviceId);
    console.log(`Connecting to ${deviceId} via ${method}`);
    // Implement actual connection logic here
  }, [getBestConnectionMethod]);

  return (
    <div className="space-y-6 p-4">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* mDNS Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Radio className="h-4 w-4" />
              mDNS Daemon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {mdnsChecking ? (
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : mdnsAvailable ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">
                {mdnsChecking
                  ? 'Checking...'
                  : mdnsAvailable
                    ? 'Available'
                    : 'Not available'}
              </span>
            </div>
            {isMdnsAvailable && (
              <p className="text-xs text-muted-foreground mt-1">
                {mdnsDeviceCount} local device(s)
              </p>
            )}
          </CardContent>
        </Card>

        {/* Signaling Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Server className="h-4 w-4" />
              Signaling Server
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {isSignalingConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-yellow-500" />
              )}
              <span className="text-sm">
                {isSignalingConnected ? 'Connected' : 'Connecting...'}
              </span>
            </div>
            {isSignalingConnected && (
              <p className="text-xs text-muted-foreground mt-1">
                {signalingDeviceCount} online device(s)
              </p>
            )}
          </CardContent>
        </Card>

        {/* Discovery Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Discovery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {isDiscovering ? (
                <RefreshCw className="h-4 w-4 animate-spin text-white" />
              ) : (
                <Square className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm">
                {isDiscovering ? 'Discovering...' : 'Stopped'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {devices.length} total device(s)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Controls</CardTitle>
          <CardDescription>
            Manage device discovery and advertising
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={isDiscovering ? 'destructive' : 'default'}
              size="sm"
              onClick={isDiscovering ? stopDiscovery : startDiscovery}
            >
              {isDiscovering ? (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Stop Discovery
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Discovery
                </>
              )}
            </Button>

            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>

            <Button
              variant={isAdvertising ? 'destructive' : 'secondary'}
              size="sm"
              onClick={handleToggleAdvertise}
              disabled={!isMdnsAvailable}
              title={!isMdnsAvailable ? 'Requires mDNS daemon' : undefined}
            >
              <Radio className="h-4 w-4 mr-2" />
              {isAdvertising ? 'Stop Advertising' : 'Advertise'}
            </Button>
          </div>

          {error && (
            <p className="text-sm text-red-500 mt-2">Error: {error.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Device List */}
      <Card>
        <CardHeader>
          <CardTitle>Discovered Devices</CardTitle>
          <CardDescription>
            Devices found on the local network and via signaling server
          </CardDescription>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No devices discovered yet.
              {!isDiscovering && ' Start discovery to find devices.'}
            </p>
          ) : (
            <div className="space-y-2">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <PlatformIcon platform={device.platform} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{device.name}</span>
                        <SourceBadge source={device.source} />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {device.platform}
                        {device.ip && ` - ${device.ip}:${device.port}`}
                        {device.capabilities?.supportsPQC && ' - PQC'}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleConnect(device.id)}
                  >
                    Connect
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Installation Note */}
      {!mdnsAvailable && !mdnsChecking && (
        <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader>
            <CardTitle className="text-sm">mDNS Daemon Not Detected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              For local network discovery, install and run the TALLOW mDNS daemon:
            </p>
            <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
{`# Install daemon
npm install -g @tallow/mdns-daemon

# Run daemon
tallow-daemon --advertise`}
            </pre>
            <p className="text-xs text-muted-foreground mt-2">
              Without the daemon, only signaling server discovery is available.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default UnifiedDiscoveryExample;
