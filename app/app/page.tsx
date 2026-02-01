'use client';

import * as React from 'react';
import { PageLayout } from '@/components/layout';
import { DropZone } from '@/components/transfer/DropZone';
import { FileList, type FileItem } from '@/components/transfer/FileList';
import { TransferProgress } from '@/components/transfer/TransferProgress';
import { TransferComplete } from '@/components/transfer/TransferComplete';
import { DeviceList, type Device } from '@/components/connection/DeviceCard';
import { ConnectionStatus } from '@/components/connection/ConnectionStatus';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Send } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════

const mockDevices: Device[] = [
  { id: '1', name: 'MacBook Pro', type: 'laptop', status: 'available', platform: 'macOS' },
  { id: '2', name: 'iPhone 15', type: 'phone', status: 'connected', platform: 'iOS' },
  { id: '3', name: 'Desktop PC', type: 'desktop', status: 'disconnected', platform: 'Windows' },
];

// ═══════════════════════════════════════════════════════════════════════════
// PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function TransferPage() {
  const [files, setFiles] = React.useState<FileItem[]>([]);
  const [selectedDevice, setSelectedDevice] = React.useState<Device | null>(null);
  const [transferState, setTransferState] = React.useState<'idle' | 'transferring' | 'complete'>('idle');
  const [transferProgress, setTransferProgress] = React.useState(0);

  // Handle file selection
  const handleFilesSelected = React.useCallback((selectedFiles: File[]) => {
    const newFiles: FileItem[] = selectedFiles.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      type: file.type,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  // Handle file removal
  const handleRemoveFile = React.useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // Handle device selection
  const handleSelectDevice = React.useCallback((device: Device) => {
    setSelectedDevice(device);
  }, []);

  // Handle transfer start
  const handleStartTransfer = React.useCallback(() => {
    if (files.length === 0 || !selectedDevice) {return;}

    setTransferState('transferring');
    setTransferProgress(0);

    // Simulate transfer progress
    const interval = setInterval(() => {
      setTransferProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTransferState('complete');
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  }, [files, selectedDevice]);

  // Handle transfer more
  const handleTransferMore = React.useCallback(() => {
    setFiles([]);
    setTransferState('idle');
    setTransferProgress(0);
  }, []);

  // Calculate total size
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  // Render based on transfer state
  if (transferState === 'complete') {
    return (
      <PageLayout maxWidth="lg" centered>
        <TransferComplete
          fileCount={files.length}
          totalSize={totalSize}
          transferRole="sender"
          onTransferMore={handleTransferMore}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Transfer Files"
      description="Securely send files to nearby devices"
      maxWidth="xl"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column: File selection */}
        <div className="space-y-6">
          {/* Drop zone */}
          <Card padding="none" className="overflow-hidden">
            <DropZone
              onFilesSelected={handleFilesSelected}
              multiple
              className="min-h-[240px] rounded-xl border-0"
            />
          </Card>

          {/* Selected files */}
          {files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle as="h2">Selected Files</CardTitle>
                <CardDescription>
                  {files.length} {files.length === 1 ? 'file' : 'files'} ready to send
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileList
                  files={files}
                  onRemove={handleRemoveFile}
                  maxHeight="200px"
                />
              </CardContent>
            </Card>
          )}

          {/* Transfer progress */}
          {transferState === 'transferring' && files.length > 0 && (
            <TransferProgress
              fileName={files[0]?.name ?? 'Unknown'}
              fileSize={totalSize}
              progress={transferProgress}
              status="transferring"
              speed={1024 * 1024 * 2.5}
              timeRemaining={Math.ceil((100 - transferProgress) / 10 * 0.5)}
            />
          )}
        </div>

        {/* Right column: Device selection */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle as="h2">Nearby Devices</CardTitle>
              <CardDescription>
                Select a device to send files to
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeviceList
                devices={mockDevices}
                selectedId={selectedDevice?.id}
                onSelect={handleSelectDevice}
                scanning
              />
            </CardContent>
          </Card>

          {/* Connection status */}
          {selectedDevice && (
            <ConnectionStatus
              state={selectedDevice.status === 'connected' ? 'connected' : 'connecting'}
              peerName={selectedDevice.name}
            />
          )}

          {/* Send button */}
          {files.length > 0 && selectedDevice && transferState === 'idle' && (
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              leftIcon={<Send className="h-5 w-5" />}
              onClick={handleStartTransfer}
            >
              Send {files.length} {files.length === 1 ? 'File' : 'Files'}
            </Button>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
