'use client';

/**
 * Group Transfer Example Component
 * Demonstrates complete integration of group transfer functionality
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Users, Upload } from 'lucide-react';
import { Device } from '@/lib/types';
import { useGroupTransfer } from '@/lib/hooks/use-group-transfer';
import { RecipientSelector } from './RecipientSelector';
import { GroupTransferConfirmDialog } from './GroupTransferConfirmDialog';
import { GroupTransferProgress } from './GroupTransferProgress';
import { generateUUID } from '@/lib/utils/uuid';

interface GroupTransferExampleProps {
  availableDevices: Device[];
  onCreateDataChannel: (deviceId: string) => Promise<RTCDataChannel>;
}

/**
 * Example integration component showing how to use group transfers
 */
export function GroupTransferExample({
  availableDevices,
  onCreateDataChannel,
}: GroupTransferExampleProps) {
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showRecipientSelector, setShowRecipientSelector] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);

  const {
    isInitializing: _isInitializing,
    isTransferring,
    isCompleted,
    groupState,
    result,
    error,
    initializeGroupTransfer,
    sendToAll,
    cancel,
    reset,
    getRecipientName,
  } = useGroupTransfer({
    bandwidthLimitPerRecipient: 1024 * 1024, // 1 MB/s per recipient
    onRecipientComplete: (_recipientId, recipientName) => {
      console.log(`Transfer completed to ${recipientName}`);
    },
    onRecipientError: (_recipientId, recipientName, error) => {
      console.error(`Transfer failed to ${recipientName}:`, error);
    },
    onComplete: (result) => {
      console.log('Group transfer completed:', result);
    },
  });

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(files);
      setShowRecipientSelector(true);
    }
  }, []);

  // Handle recipient selection confirmation
  const handleRecipientSelectionConfirm = useCallback(() => {
    if (selectedDeviceIds.length > 0 && selectedFiles.length > 0) {
      setShowRecipientSelector(false);
      setShowConfirmDialog(true);
    }
  }, [selectedDeviceIds, selectedFiles]);

  // Handle transfer confirmation and start
  const handleTransferConfirm = useCallback(async () => {
    if (selectedDeviceIds.length === 0 || selectedFiles.length === 0) {return;}

    try {
      // Get selected recipients
      const recipients = availableDevices
        .filter((device) => selectedDeviceIds.includes(device.id))
        .map((device) => ({
          id: device.id,
          name: device.name,
          deviceId: device.id,
          socketId: 'example-socket-id', // In real implementation, get from discovery service
        }));

      // Initialize group transfer
      const transferId = generateUUID();
      const firstFile = selectedFiles[0]; // For now, send first file
      if (!firstFile) {
        throw new Error('No file selected');
      }
      await initializeGroupTransfer(
        transferId,
        firstFile.name,
        firstFile.size,
        recipients
      );

      // Show progress dialog
      setShowProgressDialog(true);

      // Start sending
      await sendToAll(firstFile);
    } catch (error) {
      console.error('Failed to start group transfer:', error);
    }
  }, [
    selectedDeviceIds,
    selectedFiles,
    availableDevices,
    onCreateDataChannel,
    initializeGroupTransfer,
    sendToAll,
  ]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    cancel();
    setShowProgressDialog(false);
    reset();
  }, [cancel, reset]);

  // Handle new transfer
  const handleNewTransfer = useCallback(() => {
    reset();
    setSelectedDeviceIds([]);
    setSelectedFiles([]);
    setShowProgressDialog(false);
  }, [reset]);

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" aria-hidden="true" />
              Group File Transfer
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Send files to multiple recipients simultaneously
            </p>
          </div>

          {/* File upload */}
          <div>
            <label className="cursor-pointer">
              <Button asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
                  Select Files
                </span>
              </Button>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                aria-label="Select files for group transfer"
              />
            </label>
          </div>

          {/* Selected files preview */}
          {selectedFiles.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
              to send to {selectedDeviceIds.length} recipient
              {selectedDeviceIds.length !== 1 ? 's' : ''}
            </div>
          )}

          {/* Transfer status */}
          {isTransferring && groupState && (
            <div className="space-y-2">
              <div className="text-sm font-medium">
                Transfer in progress: {groupState.totalProgress.toFixed(0)}%
              </div>
              <div className="text-xs text-muted-foreground">
                {groupState.successCount} completed, {groupState.pendingCount} in progress,{' '}
                {groupState.failureCount} failed
              </div>
              <Button variant="outline" size="sm" onClick={handleCancel}>
                Cancel Transfer
              </Button>
            </div>
          )}

          {/* Transfer completed */}
          {isCompleted && result && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-green-600">
                Transfer completed!
              </div>
              <div className="text-xs text-muted-foreground">
                {result.successfulRecipients.length} of {result.totalRecipients} transfers
                succeeded
              </div>
              <Button variant="outline" size="sm" onClick={handleNewTransfer}>
                New Transfer
              </Button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-sm text-red-600">Error: {error}</div>
          )}
        </div>
      </Card>

      {/* Recipient Selector Dialog */}
      <RecipientSelector
        open={showRecipientSelector}
        onOpenChange={setShowRecipientSelector}
        availableDevices={availableDevices}
        selectedDeviceIds={selectedDeviceIds}
        onSelectionChange={setSelectedDeviceIds}
        onConfirm={handleRecipientSelectionConfirm}
        maxRecipients={10}
      />

      {/* Confirm Dialog */}
      {selectedFiles.length > 0 && (
        <GroupTransferConfirmDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          files={selectedFiles}
          recipients={availableDevices.filter((d) =>
            selectedDeviceIds.includes(d.id)
          )}
          onConfirm={handleTransferConfirm}
          onCancel={() => setShowConfirmDialog(false)}
        />
      )}

      {/* Progress Dialog */}
      {groupState && (
        <GroupTransferProgress
          open={showProgressDialog}
          onOpenChange={setShowProgressDialog}
          groupState={groupState}
          onRecipientNameLookup={getRecipientName}
        />
      )}
    </div>
  );
}
