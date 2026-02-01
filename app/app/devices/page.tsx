'use client';

import * as React from 'react';
import { PageLayout, PageSection } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { DeviceCard, type Device } from '@/components/connection/DeviceCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RefreshCw, QrCode, Wifi } from 'lucide-react';
import { motion } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════

const mockDevices: Device[] = [
  { id: '1', name: 'MacBook Pro', type: 'laptop', status: 'connected', platform: 'macOS' },
  { id: '2', name: 'iPhone 15', type: 'phone', status: 'available', platform: 'iOS' },
  { id: '3', name: 'iPad Pro', type: 'tablet', status: 'available', platform: 'iPadOS' },
  { id: '4', name: 'Desktop PC', type: 'desktop', status: 'disconnected', platform: 'Windows' },
  { id: '5', name: 'Android Phone', type: 'phone', status: 'disconnected', platform: 'Android' },
];

// ═══════════════════════════════════════════════════════════════════════════
// PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function DevicesPage() {
  const [devices, setDevices] = React.useState<Device[]>(mockDevices);
  const [scanning, setScanning] = React.useState(false);
  const [selectedDevice, setSelectedDevice] = React.useState<Device | null>(null);

  // Filter devices by status
  const connectedDevices = devices.filter((d) => d.status === 'connected');
  const availableDevices = devices.filter((d) => d.status === 'available');
  const offlineDevices = devices.filter((d) => d.status === 'disconnected');

  // Handle scan
  const handleScan = React.useCallback(() => {
    setScanning(true);
    // Simulate scanning
    setTimeout(() => {
      setScanning(false);
    }, 3000);
  }, []);

  // Handle device selection
  const handleSelectDevice = React.useCallback((device: Device) => {
    setSelectedDevice(device);
  }, []);

  // Handle connect/disconnect
  const handleToggleConnection = React.useCallback((device: Device) => {
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id === device.id) {
          const newStatus = d.status === 'connected' ? 'available' : 'connected';
          return { ...d, status: newStatus };
        }
        return d;
      })
    );
  }, []);

  return (
    <PageLayout
      title="Devices"
      description="Manage connected and nearby devices"
      maxWidth="xl"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<QrCode className="h-4 w-4" />}
          >
            Pair with Code
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={
              scanning ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <RefreshCw className="h-4 w-4" />
                </motion.div>
              ) : (
                <RefreshCw className="h-4 w-4" />
              )
            }
            onClick={handleScan}
            disabled={scanning}
          >
            {scanning ? 'Scanning...' : 'Scan'}
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Device lists */}
        <div className="space-y-6 lg:col-span-2">
          {/* Connected devices */}
          {connectedDevices.length > 0 && (
            <PageSection title="Connected" description="Devices currently connected">
              <div className="space-y-3">
                {connectedDevices.map((device) => (
                  <DeviceCard
                    key={device.id}
                    device={device}
                    selected={selectedDevice?.id === device.id}
                    onClick={() => handleSelectDevice(device)}
                  />
                ))}
              </div>
            </PageSection>
          )}

          {/* Available devices */}
          <PageSection
            title="Nearby"
            description={scanning ? 'Scanning for devices...' : 'Devices available to connect'}
          >
            {availableDevices.length > 0 ? (
              <div className="space-y-3">
                {availableDevices.map((device) => (
                  <DeviceCard
                    key={device.id}
                    device={device}
                    selected={selectedDevice?.id === device.id}
                    onClick={() => handleSelectDevice(device)}
                  />
                ))}
              </div>
            ) : (
              <Card className="py-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-elevated)]">
                    <Wifi className="h-6 w-6 text-[var(--text-tertiary)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      No devices found
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Make sure other devices have Tallow open
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleScan}
                    disabled={scanning}
                  >
                    Scan Again
                  </Button>
                </div>
              </Card>
            )}
          </PageSection>

          {/* Previously connected */}
          {offlineDevices.length > 0 && (
            <PageSection title="Previously Connected" description="Devices that were connected before">
              <div className="space-y-3">
                {offlineDevices.map((device) => (
                  <DeviceCard key={device.id} device={device} disabled />
                ))}
              </div>
            </PageSection>
          )}
        </div>

        {/* Device details sidebar */}
        <div className="space-y-6">
          {selectedDevice ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle as="h2">{selectedDevice.name}</CardTitle>
                  <Badge
                    variant={
                      selectedDevice.status === 'connected'
                        ? 'success'
                        : selectedDevice.status === 'available'
                          ? 'primary'
                          : 'default'
                    }
                  >
                    {selectedDevice.status === 'connected'
                      ? 'Connected'
                      : selectedDevice.status === 'available'
                        ? 'Available'
                        : 'Offline'}
                  </Badge>
                </div>
                <CardDescription>{selectedDevice.platform}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[var(--text-tertiary)]">Type</p>
                    <p className="font-medium text-[var(--text-primary)] capitalize">
                      {selectedDevice.type}
                    </p>
                  </div>
                  <div>
                    <p className="text-[var(--text-tertiary)]">Status</p>
                    <p className="font-medium text-[var(--text-primary)] capitalize">
                      {selectedDevice.status}
                    </p>
                  </div>
                </div>

                {selectedDevice.status !== 'disconnected' && (
                  <Button
                    variant={selectedDevice.status === 'connected' ? 'outline' : 'primary'}
                    className="w-full"
                    onClick={() => handleToggleConnection(selectedDevice)}
                  >
                    {selectedDevice.status === 'connected' ? 'Disconnect' : 'Connect'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="py-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm text-[var(--text-secondary)]">
                  Select a device to view details
                </p>
              </div>
            </Card>
          )}

          {/* Connection tips */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle as="h3" className="text-base">
                Connection Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-primary-500)]">•</span>
                  <span>Devices must be on the same network</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-primary-500)]">•</span>
                  <span>Tallow must be open on both devices</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-primary-500)]">•</span>
                  <span>Use QR code for instant pairing</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
