'use client';

/**
 * Group Transfer Example Component
 * Demonstrates integration of device discovery with group transfers
 */

import { useState } from 'react';
import { useGroupDiscovery } from '@/lib/hooks/use-group-discovery';
import { useGroupTransfer } from '@/lib/hooks/use-group-transfer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
    CheckCircle2,
    XCircle,
    Wifi,
    WifiOff,
    RefreshCw,
    Send,
    Users,
    Shield,
} from 'lucide-react';

export function GroupTransferExample() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isTransferring, setIsTransferring] = useState(false);

    // Device discovery hook
    const {
        discoveredDevices,
        selectedDevices,
        connectedDevices,
        isDiscovering,
        isConnecting,
        selectedCount,
        connectedCount,
        error: discoveryError,
        startDiscovery,
        refreshDevices,
        selectDevice,
        deselectDevice,
        selectAllDevices,
        clearSelection,
        connectToSelectedDevices,
        disconnectAll,
        markTransferComplete,
        isDeviceSelected,
    } = useGroupDiscovery({
        autoStart: true,
        discoveryOptions: {
            maxDevices: 10,
            requirePQC: true,
            preferRecentPartners: true,
        },
        onDevicesDiscovered: (devices) => {
            console.log('Discovered devices:', devices);
        },
        onConnectionComplete: (result) => {
            console.log('Connection result:', result);
        },
    });

    // Group transfer hook
    const {
        groupState,
        isInitializing,
        isTransferring: groupTransferring,
        result: transferResult,
        initializeGroupTransfer,
        sendToAll,
        cancel: cancelTransfer,
        reset: resetTransfer,
    } = useGroupTransfer({
        bandwidthLimitPerRecipient: 1024 * 1024 * 5, // 5 MB/s
        onRecipientComplete: (recipientId, recipientName) => {
            markTransferComplete(recipientId, true, selectedFile?.size || 0);
            toast.success(`Transfer completed to ${recipientName}`);
        },
        onRecipientError: (recipientId, recipientName, error) => {
            markTransferComplete(recipientId, false);
            toast.error(`Transfer failed to ${recipientName}: ${error}`);
        },
    });

    /**
     * Handle file selection
     */
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    /**
     * Handle send file
     */
    const handleSendFile = async () => {
        if (!selectedFile) {
            toast.error('No file selected');
            return;
        }

        if (selectedDevices.length === 0) {
            toast.error('No devices selected');
            return;
        }

        setIsTransferring(true);

        try {
            // Step 1: Connect to selected devices
            toast.info('Connecting to devices...');
            const connectionResult = await connectToSelectedDevices(30000);

            if (!connectionResult || connectionResult.successCount === 0) {
                throw new Error('Failed to connect to any devices');
            }

            // Step 2: Initialize group transfer
            toast.info('Initializing secure transfer...');
            const recipients = connectedDevices.map((device) => ({
                id: device.id,
                name: device.name,
                deviceId: device.id,
                socketId: device.socketId || device.id,
            }));

            await initializeGroupTransfer(
                crypto.randomUUID(),
                selectedFile.name,
                selectedFile.size,
                recipients
            );

            // Step 3: Send file
            toast.info('Sending file...');
            await sendToAll(selectedFile);

            toast.success('Group transfer completed!');
        } catch (error) {
            console.error('Transfer error:', error);
            toast.error('Transfer failed', {
                description: (error as Error).message,
            });
        } finally {
            setIsTransferring(false);
        }
    };

    /**
     * Get connection quality badge
     */
    const getQualityBadge = (quality?: string) => {
        const qualityColors = {
            excellent: 'bg-green-500',
            good: 'bg-white/20',
            fair: 'bg-yellow-500',
            poor: 'bg-red-500',
        };

        const color = quality ? qualityColors[quality as keyof typeof qualityColors] : 'bg-gray-500';

        return (
            <Badge className={color}>
                {quality || 'unknown'}
            </Badge>
        );
    };

    /**
     * Format bytes
     */
    const formatBytes = (bytes: number) => {
        if (bytes === 0) {return '0 B';}
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Group Transfer</h1>
                    <p className="text-muted-foreground">
                        Send files to multiple devices simultaneously
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshDevices}
                        disabled={isDiscovering}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isDiscovering ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAllDevices}
                        disabled={discoveredDevices.length === 0}
                    >
                        <Users className="h-4 w-4 mr-2" />
                        Select All
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={clearSelection}
                        disabled={selectedCount === 0}
                    >
                        Clear Selection
                    </Button>
                </div>
            </div>

            {/* Error Display */}
            {discoveryError && (
                <Card className="p-4 bg-destructive/10 border-destructive">
                    <div className="flex items-center gap-2 text-destructive">
                        <XCircle className="h-5 w-5" />
                        <span>Discovery Error: {discoveryError}</span>
                    </div>
                </Card>
            )}

            {/* Device Discovery Status */}
            <Card className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Wifi className={isDiscovering ? 'animate-pulse' : ''} />
                            <span className="font-medium">
                                {isDiscovering ? 'Discovering...' : `Found ${discoveredDevices.length} devices`}
                            </span>
                        </div>

                        {selectedCount > 0 && (
                            <Badge variant="secondary">
                                {selectedCount} selected
                            </Badge>
                        )}

                        {connectedCount > 0 && (
                            <Badge variant="default">
                                {connectedCount} connected
                            </Badge>
                        )}
                    </div>

                    {!isDiscovering && discoveredDevices.length === 0 && (
                        <Button onClick={startDiscovery} size="sm">
                            Start Discovery
                        </Button>
                    )}
                </div>
            </Card>

            {/* Device List */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {discoveredDevices.map((device) => (
                    <Card
                        key={device.id}
                        className={`p-4 cursor-pointer transition-all ${
                            isDeviceSelected(device.id)
                                ? 'ring-2 ring-primary bg-primary/5'
                                : 'hover:bg-accent'
                        }`}
                        onClick={() => {
                            if (isDeviceSelected(device.id)) {
                                deselectDevice(device.id);
                            } else {
                                selectDevice(device);
                            }
                        }}
                    >
                        <div className="space-y-3">
                            {/* Device Header */}
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="font-semibold">{device.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {device.platform}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    {device.isOnline ? (
                                        <Wifi className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <WifiOff className="h-5 w-5 text-gray-400" />
                                    )}

                                    {isDeviceSelected(device.id) && (
                                        <CheckCircle2 className="h-5 w-5 text-primary" />
                                    )}
                                </div>
                            </div>

                            {/* Capabilities */}
                            <div className="flex flex-wrap gap-2">
                                {device.capabilities?.supportsGroupTransfer && (
                                    <Badge variant="secondary" className="text-xs">
                                        <Users className="h-3 w-3 mr-1" />
                                        Group Transfer
                                    </Badge>
                                )}

                                {device.capabilities?.supportsPQC && (
                                    <Badge variant="secondary" className="text-xs">
                                        <Shield className="h-3 w-3 mr-1" />
                                        PQC
                                    </Badge>
                                )}
                            </div>

                            {/* Connection Quality */}
                            {device.connectionQuality && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Quality:</span>
                                    {getQualityBadge(device.connectionQuality)}
                                </div>
                            )}

                            {/* Last Transfer */}
                            {device.lastTransferTime && (
                                <div className="text-xs text-muted-foreground">
                                    Last transfer: {device.lastTransferTime.toLocaleTimeString()}
                                </div>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            {/* File Selection and Send */}
            <Card className="p-6">
                <div className="space-y-4">
                    <div>
                        <h2 className="text-lg font-semibold mb-2">Select File</h2>
                        <input
                            type="file"
                            onChange={handleFileSelect}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                            disabled={isTransferring || isConnecting}
                        />

                        {selectedFile && (
                            <div className="mt-2 text-sm text-muted-foreground">
                                Selected: {selectedFile.name} ({formatBytes(selectedFile.size)})
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={handleSendFile}
                            disabled={
                                !selectedFile ||
                                selectedCount === 0 ||
                                isTransferring ||
                                isConnecting ||
                                isInitializing
                            }
                            className="flex-1"
                        >
                            <Send className="h-4 w-4 mr-2" />
                            {isTransferring || isConnecting || isInitializing
                                ? 'Sending...'
                                : `Send to ${selectedCount} device${selectedCount !== 1 ? 's' : ''}`}
                        </Button>

                        {(isTransferring || groupTransferring) && (
                            <Button variant="destructive" onClick={cancelTransfer}>
                                Cancel
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            {/* Transfer Progress */}
            {groupState && (
                <Card className="p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Transfer Progress</h2>
                            <Badge variant="secondary">
                                {groupState.status}
                            </Badge>
                        </div>

                        {/* Overall Progress */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Overall Progress</span>
                                <span>{groupState.totalProgress.toFixed(1)}%</span>
                            </div>
                            <Progress value={groupState.totalProgress} />
                        </div>

                        {/* Per-Recipient Progress */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium">Recipients</h3>
                            {groupState.recipients.map((recipient) => (
                                <div key={recipient.id} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">{recipient.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span>{recipient.progress.toFixed(1)}%</span>
                                            {recipient.status === 'completed' && (
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            )}
                                            {recipient.status === 'failed' && (
                                                <XCircle className="h-4 w-4 text-red-500" />
                                            )}
                                        </div>
                                    </div>
                                    <Progress value={recipient.progress} />
                                    {recipient.speed && (
                                        <div className="text-xs text-muted-foreground">
                                            Speed: {formatBytes(recipient.speed)}/s
                                        </div>
                                    )}
                                    {recipient.error && (
                                        <div className="text-xs text-destructive">
                                            Error: {recipient.error?.message || String(recipient.error)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Summary */}
                        <div className="pt-4 border-t flex justify-between text-sm">
                            <div className="space-x-4">
                                <span className="text-green-600">
                                    ✓ {groupState.successCount} succeeded
                                </span>
                                <span className="text-red-600">
                                    ✗ {groupState.failureCount} failed
                                </span>
                                {groupState.pendingCount > 0 && (
                                    <span className="text-white">
                                        ⋯ {groupState.pendingCount} pending
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Transfer Result */}
            {transferResult && (
                <Card className="p-6">
                    <div className="space-y-3">
                        <h2 className="text-lg font-semibold">Transfer Complete</h2>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>File:</span>
                                <span className="font-medium">{transferResult.fileName}</span>
                            </div>

                            <div className="flex justify-between text-sm">
                                <span>Total Recipients:</span>
                                <span className="font-medium">{transferResult.totalRecipients}</span>
                            </div>

                            <div className="flex justify-between text-sm">
                                <span>Successful:</span>
                                <span className="font-medium text-green-600">
                                    {transferResult.successfulRecipients.length}
                                </span>
                            </div>

                            {transferResult.failedRecipients.length > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span>Failed:</span>
                                    <span className="font-medium text-red-600">
                                        {transferResult.failedRecipients.length}
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between text-sm">
                                <span>Duration:</span>
                                <span className="font-medium">
                                    {(transferResult.totalTime / 1000).toFixed(2)}s
                                </span>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            onClick={() => {
                                resetTransfer();
                                setSelectedFile(null);
                                disconnectAll();
                            }}
                            className="w-full"
                        >
                            Send Another File
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
}
