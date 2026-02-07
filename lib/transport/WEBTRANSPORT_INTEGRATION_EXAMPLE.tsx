'use client';

/**
 * WebTransport Integration Example
 *
 * Demonstrates how to integrate WebTransport into Tallow's P2P file transfer system
 * with automatic fallback to WebRTC DataChannel and WebSocket.
 *
 * Features:
 * - Automatic transport selection
 * - Progressive enhancement (WebTransport → WebRTC → WebSocket)
 * - Unified transfer API regardless of transport
 * - Real-time progress tracking
 * - Connection health monitoring
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  selectBestTransport,
  selectForFileTransfer,
  type TransportProtocol,
  type TransportSelectionResult,
} from './transport-selector';
import {
  WebTransportConnection,
  connect as connectWebTransport,
  writeStream,
  readStream,
} from './webtransport';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import secureLog from '@/lib/utils/secure-logger';

// ============================================================================
// Types
// ============================================================================

interface TransferState {
  status: 'idle' | 'selecting' | 'connecting' | 'transferring' | 'complete' | 'error';
  protocol?: TransportProtocol;
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
  speed: number; // bytes per second
  error?: string;
  estimatedTimeRemaining?: number; // seconds
}

interface ConnectionMetrics {
  latency: number;
  bandwidth: number;
  packetsLost: number;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

// ============================================================================
// Unified Transfer Interface
// ============================================================================

/**
 * Abstract transport interface - works with WebTransport, WebRTC, or WebSocket
 */
interface UnifiedTransport {
  protocol: TransportProtocol;
  send(data: Uint8Array): Promise<void>;
  receive(): Promise<Uint8Array>;
  close(): void;
  getMetrics(): ConnectionMetrics;
}

/**
 * WebTransport implementation of unified interface
 */
class WebTransportAdapter implements UnifiedTransport {
  protocol: TransportProtocol = 'webtransport';
  private connection: WebTransportConnection;
  private currentStream?: {
    readable: ReadableStream<Uint8Array>;
    writable: WritableStream<Uint8Array>;
  };

  constructor(connection: WebTransportConnection) {
    this.connection = connection;
  }

  async send(data: Uint8Array): Promise<void> {
    if (!this.currentStream) {
      this.currentStream = await this.connection.createBidirectionalStream();
    }
    await writeStream(this.currentStream.writable, data);
  }

  async receive(): Promise<Uint8Array> {
    if (!this.currentStream) {
      throw new Error('No active stream');
    }
    return readStream(this.currentStream.readable);
  }

  close(): void {
    this.connection.close();
  }

  getMetrics(): ConnectionMetrics {
    const stats = this.connection.getStats();
    return {
      latency: stats.rtt,
      bandwidth: stats.estimatedBandwidth,
      packetsLost: 0, // QUIC handles this internally
      connectionQuality: stats.rtt < 20 ? 'excellent' : stats.rtt < 50 ? 'good' : 'fair',
    };
  }
}

/**
 * WebRTC DataChannel implementation (fallback)
 */
class WebRTCAdapter implements UnifiedTransport {
  protocol: TransportProtocol = 'webrtc';
  private dataChannel: RTCDataChannel;

  constructor(dataChannel: RTCDataChannel) {
    this.dataChannel = dataChannel;
  }

  async send(data: Uint8Array): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.dataChannel.readyState !== 'open') {
        reject(new Error('DataChannel not open'));
        return;
      }

      try {
        this.dataChannel.send(data);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  async receive(): Promise<Uint8Array> {
    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        this.dataChannel.removeEventListener('message', handler);
        resolve(new Uint8Array(event.data));
      };
      this.dataChannel.addEventListener('message', handler);
    });
  }

  close(): void {
    this.dataChannel.close();
  }

  getMetrics(): ConnectionMetrics {
    // In real implementation, get from RTCPeerConnection.getStats()
    return {
      latency: 30,
      bandwidth: 5_000_000,
      packetsLost: 0,
      connectionQuality: 'good',
    };
  }
}

/**
 * WebSocket implementation (final fallback)
 */
class WebSocketAdapter implements UnifiedTransport {
  protocol: TransportProtocol = 'websocket';
  private socket: WebSocket;

  constructor(socket: WebSocket) {
    this.socket = socket;
  }

  async send(data: Uint8Array): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not open'));
        return;
      }

      try {
        this.socket.send(data);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  async receive(): Promise<Uint8Array> {
    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        this.socket.removeEventListener('message', handler);
        if (event.data instanceof ArrayBuffer) {
          resolve(new Uint8Array(event.data));
        }
      };
      this.socket.addEventListener('message', handler);
    });
  }

  close(): void {
    this.socket.close();
  }

  getMetrics(): ConnectionMetrics {
    return {
      latency: 60,
      bandwidth: 1_000_000,
      packetsLost: 0,
      connectionQuality: 'fair',
    };
  }
}

// ============================================================================
// File Transfer Component
// ============================================================================

export function WebTransportFileTransfer() {
  const [transferState, setTransferState] = useState<TransferState>({
    status: 'idle',
    progress: 0,
    bytesTransferred: 0,
    totalBytes: 0,
    speed: 0,
  });

  const [transportSelection, setTransportSelection] = useState<TransportSelectionResult | null>(null);
  const [transport, setTransport] = useState<UnifiedTransport | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [serverUrl] = useState('https://relay.example.com:4433/transfer');

  /**
   * Select optimal transport protocol
   */
  const selectTransport = useCallback(async () => {
    setTransferState((prev) => ({ ...prev, status: 'selecting' }));

    try {
      const selection = await selectForFileTransfer(serverUrl);
      setTransportSelection(selection);

      secureLog.log('[WebTransport] Transport selected:', {
        protocol: selection.selected,
        reason: selection.reason,
        estimatedLatency: `${selection.estimatedLatency}ms`,
        estimatedBandwidth: `${selection.estimatedBandwidth}Mbps`,
      });

      setTransferState((prev) => ({
        ...prev,
        status: 'idle',
        protocol: selection.selected,
      }));

      if (selection.warnings.length > 0) {
        console.warn('[WebTransport] Warnings:', selection.warnings);
      }
    } catch (error) {
      setTransferState((prev) => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Transport selection failed',
      }));
    }
  }, [serverUrl]);

  /**
   * Establish connection using selected transport
   */
  const establishConnection = useCallback(async () => {
    if (!transportSelection) {
      throw new Error('No transport selected');
    }

    setTransferState((prev) => ({ ...prev, status: 'connecting' }));

    try {
      let unifiedTransport: UnifiedTransport;

      switch (transportSelection.selected) {
        case 'webtransport': {
          const wtConnection = await connectWebTransport(serverUrl);
          unifiedTransport = new WebTransportAdapter(wtConnection);
          break;
        }

        case 'webrtc': {
          // Create WebRTC DataChannel (simplified)
          const pc = new RTCPeerConnection();
          const dc = pc.createDataChannel('file-transfer');
          await new Promise((resolve) => {
            dc.onopen = resolve;
          });
          unifiedTransport = new WebRTCAdapter(dc);
          break;
        }

        case 'websocket': {
          const ws = new WebSocket(serverUrl.replace('https://', 'wss://'));
          await new Promise((resolve) => {
            ws.onopen = resolve;
          });
          unifiedTransport = new WebSocketAdapter(ws);
          break;
        }

        default:
          throw new Error(`Unsupported transport: ${transportSelection.selected}`);
      }

      setTransport(unifiedTransport);
      setTransferState((prev) => ({ ...prev, status: 'idle' }));

      secureLog.log('[WebTransport] Connection established:', unifiedTransport.protocol);
    } catch (error) {
      setTransferState((prev) => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Connection failed',
      }));
    }
  }, [transportSelection, serverUrl]);

  /**
   * Transfer file using unified transport interface
   */
  const transferFile = useCallback(async () => {
    if (!transport || !selectedFile) {
      throw new Error('Transport or file not available');
    }

    setTransferState((prev) => ({
      ...prev,
      status: 'transferring',
      progress: 0,
      bytesTransferred: 0,
      totalBytes: selectedFile.size,
    }));

    const startTime = Date.now();

    try {
      // Read file data
      const arrayBuffer = await selectedFile.arrayBuffer();
      const fileData = new Uint8Array(arrayBuffer);

      // Send in chunks for progress tracking
      const chunkSize = 16384; // 16KB chunks
      let transferred = 0;

      for (let offset = 0; offset < fileData.byteLength; offset += chunkSize) {
        const chunk = fileData.slice(offset, Math.min(offset + chunkSize, fileData.byteLength));
        await transport.send(chunk);

        transferred += chunk.byteLength;
        const progress = (transferred / fileData.byteLength) * 100;
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = transferred / elapsed;
        const remaining = (fileData.byteLength - transferred) / speed;

        setTransferState((prev) => ({
          ...prev,
          progress,
          bytesTransferred: transferred,
          speed,
          estimatedTimeRemaining: remaining,
        }));
      }

      // Wait for acknowledgment
      const ack = await transport.receive();
      secureLog.log('[WebTransport] Transfer complete, ACK received:', ack);

      setTransferState((prev) => ({
        ...prev,
        status: 'complete',
        progress: 100,
      }));
    } catch (error) {
      setTransferState((prev) => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Transfer failed',
      }));
    }
  }, [transport, selectedFile]);

  /**
   * Auto-select transport on mount
   */
  useEffect(() => {
    selectTransport();
  }, [selectTransport]);

  // ============================================================================
  // Render
  // ============================================================================

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    return `${formatBytes(bytesPerSecond)}/s`;
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
  };

  const getProtocolColor = (protocol?: TransportProtocol) => {
    switch (protocol) {
      case 'webtransport':
        return 'bg-green-500';
      case 'webrtc':
        return 'bg-blue-500';
      case 'websocket':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: TransferState['status']) => {
    switch (status) {
      case 'complete':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'transferring':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">WebTransport File Transfer Demo</h1>

      {/* Transport Selection Info */}
      {transportSelection && (
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-4">Transport Protocol</h2>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="font-medium">Selected:</span>
              <Badge className={getProtocolColor(transportSelection.selected)}>
                {transportSelection.selected.toUpperCase()}
              </Badge>
            </div>

            <div>
              <span className="font-medium">Reason:</span>
              <p className="text-sm text-gray-600 mt-1">{transportSelection.reason}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Estimated Latency:</span>
                <p className="text-gray-600">{transportSelection.estimatedLatency}ms</p>
              </div>
              <div>
                <span className="font-medium">Estimated Bandwidth:</span>
                <p className="text-gray-600">{transportSelection.estimatedBandwidth}Mbps</p>
              </div>
            </div>

            {transportSelection.fallbacks.length > 0 && (
              <div>
                <span className="font-medium">Fallbacks:</span>
                <div className="flex gap-2 mt-1">
                  {transportSelection.fallbacks.map((fallback) => (
                    <Badge key={fallback} variant="secondary">
                      {fallback.toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {transportSelection.warnings.length > 0 && (
              <div className="bg-yellow-50 p-3 rounded-md">
                <p className="text-sm font-medium text-yellow-800">Warnings:</p>
                <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside">
                  {transportSelection.warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Connection Status */}
      {transport && (
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="font-medium">Connected via {transport.protocol.toUpperCase()}</span>
            </div>

            {(() => {
              const metrics = transport.getMetrics();
              return (
                <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                  <div>
                    <span className="font-medium">Latency:</span>
                    <p className="text-gray-600">{metrics.latency}ms</p>
                  </div>
                  <div>
                    <span className="font-medium">Quality:</span>
                    <p className="text-gray-600 capitalize">{metrics.connectionQuality}</p>
                  </div>
                </div>
              );
            })()}
          </div>
        </Card>
      )}

      {/* File Selection */}
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">Select File</h2>

        <input
          type="file"
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />

        {selectedFile && (
          <div className="mt-3 text-sm text-gray-600">
            <p>
              <span className="font-medium">File:</span> {selectedFile.name}
            </p>
            <p>
              <span className="font-medium">Size:</span> {formatBytes(selectedFile.size)}
            </p>
          </div>
        )}
      </Card>

      {/* Transfer Controls */}
      <div className="flex gap-3">
        {!transport && (
          <Button
            onClick={establishConnection}
            disabled={!transportSelection || transferState.status === 'connecting'}
          >
            {transferState.status === 'connecting' ? 'Connecting...' : 'Connect'}
          </Button>
        )}

        {transport && (
          <Button
            onClick={transferFile}
            disabled={!selectedFile || transferState.status === 'transferring'}
          >
            {transferState.status === 'transferring' ? 'Transferring...' : 'Transfer File'}
          </Button>
        )}

        <Button
          variant="secondary"
          onClick={selectTransport}
          disabled={transferState.status === 'selecting'}
        >
          Re-select Transport
        </Button>
      </div>

      {/* Transfer Progress */}
      {transferState.status === 'transferring' && (
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-4">Transfer Progress</h2>

          <div className="space-y-3">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${transferState.progress}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Progress:</span>
                <p className="text-gray-600">{transferState.progress.toFixed(1)}%</p>
              </div>
              <div>
                <span className="font-medium">Speed:</span>
                <p className="text-gray-600">{formatSpeed(transferState.speed)}</p>
              </div>
              <div>
                <span className="font-medium">Transferred:</span>
                <p className="text-gray-600">
                  {formatBytes(transferState.bytesTransferred)} / {formatBytes(transferState.totalBytes)}
                </p>
              </div>
              <div>
                <span className="font-medium">Time Remaining:</span>
                <p className="text-gray-600">
                  {transferState.estimatedTimeRemaining
                    ? formatTime(transferState.estimatedTimeRemaining)
                    : '--'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Status Messages */}
      <div className={`text-center font-medium ${getStatusColor(transferState.status)}`}>
        {transferState.status === 'complete' && '✓ Transfer complete!'}
        {transferState.status === 'error' && `✗ Error: ${transferState.error}`}
      </div>
    </div>
  );
}

export default WebTransportFileTransfer;
