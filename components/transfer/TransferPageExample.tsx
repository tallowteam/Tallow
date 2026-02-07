'use client';

/**
 * Example Transfer Page with Complete Loading States
 * This demonstrates how to integrate all loading states in a real transfer workflow
 */

import { useState, Suspense } from 'react';
import { Button, Card, SpinnerOverlay } from '@/components/ui';
import { FileDropZone } from './FileDropZone';
import { DeviceDiscovery } from './DeviceDiscovery';
import {
  DeviceDiscoveryLoading,
  FileProcessingLoading,
  RoomConnectLoading,
  ScanningAnimation,
} from './LoadingStates';
import type { Device } from '@/lib/types';

type TransferStep = 'select-files' | 'select-device' | 'processing' | 'transferring' | 'complete';

export function TransferPageExample() {
  const [step, setStep] = useState<TransferStep>('select-files');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Simulate file processing
  const handleFilesSelected = async (files: File[]) => {
    setIsProcessingFiles(true);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    setSelectedFiles(files);
    setIsProcessingFiles(false);
    setStep('select-device');
  };

  // Simulate device connection
  const handleDeviceSelected = async (device: Device) => {
    setSelectedDevice(device);
    setIsConnecting(true);

    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsConnecting(false);
    setStep('transferring');

    // Simulate file transfer
    simulateTransfer();
  };

  // Simulate transfer progress
  const simulateTransfer = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setUploadProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => setStep('complete'), 500);
      }
    }, 200);
  };

  const resetTransfer = () => {
    setStep('select-files');
    setSelectedFiles([]);
    setSelectedDevice(null);
    setUploadProgress(0);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ marginBottom: '2rem' }}>File Transfer</h1>

      {/* Step 1: Select Files */}
      {step === 'select-files' && (
        <Card>
          <div style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Select Files to Transfer</h2>
            <FileDropZone
              onFilesSelected={handleFilesSelected}
              loading={isProcessingFiles}
              hasFiles={selectedFiles.length > 0}
            />

            {selectedFiles.length > 0 && !isProcessingFiles && (
              <div style={{ marginTop: '1rem' }}>
                <p>{selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected</p>
                <Button onClick={() => setStep('select-device')} style={{ marginTop: '1rem' }}>
                  Continue
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* File Processing Loading State */}
      {isProcessingFiles && (
        <Card>
          <div style={{ padding: '2rem' }}>
            <FileProcessingLoading
              {...(selectedFiles[0]?.name && { fileName: selectedFiles[0].name })}
            />
          </div>
        </Card>
      )}

      {/* Step 2: Select Device */}
      {step === 'select-device' && !isConnecting && (
        <Card>
          <div style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Select Destination Device</h2>
            <DeviceDiscovery
              selectedFiles={selectedFiles}
              onDeviceSelect={handleDeviceSelected}
            />
            <Button
              variant="outline"
              onClick={() => setStep('select-files')}
              style={{ marginTop: '1rem' }}
            >
              Back
            </Button>
          </div>
        </Card>
      )}

      {/* Room Connection Loading State */}
      {isConnecting && (
        <Card>
          <div style={{ padding: '2rem' }}>
            <RoomConnectLoading message={`Connecting to ${selectedDevice?.name}...`} />
          </div>
        </Card>
      )}

      {/* Step 3: Transferring */}
      {step === 'transferring' && (
        <Card>
          <div style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Transferring Files</h2>
            <FileProcessingLoading
              {...(selectedFiles[0]?.name && { fileName: selectedFiles[0].name })}
              progress={uploadProgress}
            />
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <ScanningAnimation />
              <p style={{ marginTop: '1rem', color: 'var(--color-text-secondary)' }}>
                Sending to {selectedDevice?.name}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Step 4: Complete */}
      {step === 'complete' && (
        <Card>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
            <h2 style={{ marginBottom: '1rem' }}>Transfer Complete!</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
              {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} transferred to {selectedDevice?.name}
            </p>
            <Button onClick={resetTransfer}>
              Transfer More Files
            </Button>
          </div>
        </Card>
      )}

      {/* Global Loading Overlay (optional) */}
      <SpinnerOverlay
        visible={false} // Set to true when needed
        label="Processing transfer..."
      />
    </div>
  );
}

/**
 * Example with Suspense Boundaries
 */
export function TransferPageWithSuspense() {
  return (
    <div>
      {/* Use React Suspense with fallbacks */}
      <Suspense fallback={<DeviceDiscoveryLoading count={3} />}>
        <DeviceListAsync />
      </Suspense>
    </div>
  );
}

// Mock async component for Suspense example
function DeviceListAsync() {
  // This would use React.use() or similar in real implementation
  return <div>Device List</div>;
}
