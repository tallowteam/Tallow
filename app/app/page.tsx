'use client';

/**
 * Tallow Main Application Page
 *
 * This is the primary file transfer interface with:
 * - Drag-and-drop file selection
 * - Connection code generation and QR code
 * - Real-time transfer progress
 * - Device discovery
 * - Security indicators
 *
 * @module app/page
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useDeviceStore } from '@/lib/stores/device-store';
import { useTransferStore } from '@/lib/stores/transfer-store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Device } from '@/lib/types';
import styles from './page.module.css';

// Icons as inline SVG components for performance
function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatSpeed(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`;
}

function formatTime(seconds: number): string {
  if (!seconds || seconds === Infinity) return '--';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

export default function AppPage() {
  // Store state
  const connection = useDeviceStore((state) => state.connection);
  const onlineDevices = useDeviceStore((state) => state.getOnlineDevices());
  const startConnecting = useDeviceStore((state) => state.startConnecting);
  const setConnected = useDeviceStore((state) => state.setConnected);
  const disconnect = useDeviceStore((state) => state.disconnect);

  const queue = useTransferStore((state) => state.queue);
  const addToQueue = useTransferStore((state) => state.addToQueue);
  const removeFromQueue = useTransferStore((state) => state.removeFromQueue);
  const clearQueue = useTransferStore((state) => state.clearQueue);
  const isTransferring = useTransferStore((state) => state.currentTransfer.isTransferring);
  const uploadProgress = useTransferStore((state) => state.progress.uploadProgress);
  const activeTransfers = useTransferStore((state) => state.getActiveTransfers());

  // Local state
  const [connectionCode, setConnectionCode] = useState<string>('');
  const [inputCode, setInputCode] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  // Generate connection code on mount
  useEffect(() => {
    const code = generateConnectionCode();
    setConnectionCode(code);
  }, []);

  function generateConnectionCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
      if (i === 3) code += '-';
    }
    return code;
  }

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      addToQueue(files);
    }
  }, [addToQueue]);

  // File input handler
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addToQueue(Array.from(files));
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [addToQueue]);

  // Connection handlers
  const handleConnect = useCallback(() => {
    if (inputCode.trim()) {
      startConnecting(inputCode.trim(), 'Remote Device');
      // Simulate connection success after 1.5s
      setTimeout(() => {
        setConnected('p2p');
      }, 1500);
    }
  }, [inputCode, startConnecting, setConnected]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    setInputCode('');
  }, [disconnect]);

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(connectionCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  }, [connectionCode]);

  const handleDeviceClick = useCallback((device: Device) => {
    startConnecting(device.id, device.name);
    // Simulate connection
    setTimeout(() => {
      setConnected('p2p');
    }, 1500);
  }, [startConnecting, setConnected]);

  const handleSend = useCallback(() => {
    if (queue.length === 0 || connection.status !== 'connected') return;
    // In production, this would trigger the actual transfer
    console.log('Starting transfer of', queue.length, 'files');
  }, [queue, connection.status]);

  // Connection status
  const isConnected = connection.status === 'connected';
  const isConnecting = connection.status === 'connecting';
  const hasFiles = queue.length > 0;
  const totalSize = queue.reduce((acc, file) => acc + file.size, 0);

  // Get current transfer stats
  const currentTransfer = activeTransfers[0];
  const transferSpeed = currentTransfer?.speed || 0;
  const transferEta = currentTransfer?.eta || null;

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <span className={styles.logoText}>Tallow</span>
          </div>

          <div className={styles.headerRight}>
            {/* Connection Status */}
            <Badge
              variant={isConnected ? 'success' : 'neutral'}
              showDot={isConnected}
              className={styles.statusBadge}
            >
              {isConnected ? 'Connected' : 'Not Connected'}
            </Badge>

            {/* Settings Link */}
            <Link href="/app/settings" className={styles.settingsLink}>
              <SettingsIcon />
              <span className={styles.srOnly}>Settings</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.grid}>
          {/* Left Section - Send Files */}
          <div className={styles.sendSection}>
            <Card className={styles.sendCard}>
              <CardHeader>
                <h2 className={styles.cardTitle}>Send Files</h2>
                <p className={styles.cardDescription}>
                  Drag and drop files or click to browse
                </p>
              </CardHeader>

              <CardBody>
                {/* Drop Zone */}
                <div
                  className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ''} ${hasFiles ? styles.dropZoneWithFiles : ''}`}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  aria-label="Drop files here or click to browse"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className={styles.fileInput}
                    aria-hidden="true"
                  />

                  {!hasFiles ? (
                    <div className={styles.dropZoneContent}>
                      <UploadIcon />
                      <p className={styles.dropZoneText}>
                        Drop files here or click to browse
                      </p>
                      <p className={styles.dropZoneHint}>
                        Support for all file types
                      </p>
                    </div>
                  ) : null}
                </div>

                {/* Selected Files List */}
                {hasFiles && (
                  <div className={styles.filesList}>
                    <div className={styles.filesHeader}>
                      <span className={styles.filesCount}>
                        {queue.length} {queue.length === 1 ? 'file' : 'files'} ({formatBytes(totalSize)})
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearQueue}
                        aria-label="Clear all files"
                      >
                        Clear all
                      </Button>
                    </div>

                    <ul className={styles.filesItems} role="list">
                      {queue.map((file, index) => (
                        <li key={`${file.name}-${index}`} className={styles.fileItem}>
                          <div className={styles.fileInfo}>
                            <span className={styles.fileName}>{file.name}</span>
                            <span className={styles.fileSize}>{formatBytes(file.size)}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromQueue(index);
                            }}
                            className={styles.removeButton}
                            aria-label={`Remove ${file.name}`}
                          >
                            <XIcon />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardBody>

              <CardFooter>
                <Button
                  fullWidth
                  size="lg"
                  onClick={handleSend}
                  disabled={!isConnected || !hasFiles || isTransferring}
                  loading={isTransferring}
                >
                  {isTransferring ? 'Sending...' : 'Send Files'}
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Right Section - Connection */}
          <div className={styles.connectionSection}>
            {!isConnected ? (
              <Card className={styles.connectionCard}>
                <CardHeader>
                  <h2 className={styles.cardTitle}>Connection</h2>
                  <p className={styles.cardDescription}>
                    Share your code or connect to another device
                  </p>
                </CardHeader>

                <CardBody>
                  {/* Your Connection Code */}
                  <div className={styles.codeSection}>
                    <label className={styles.codeLabel}>Your Connection Code</label>
                    <div className={styles.codeDisplay}>
                      <span className={styles.codeText}>{connectionCode}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyCode}
                        aria-label="Copy connection code"
                        className={styles.copyButton}
                      >
                        {copied ? <CheckIcon /> : <CopyIcon />}
                      </Button>
                    </div>

                    {/* QR Code Placeholder */}
                    <div className={styles.qrCode} aria-label="QR code for mobile scanning">
                      <div className={styles.qrCodePlaceholder}>
                        <span className={styles.qrCodeText}>QR Code</span>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className={styles.divider}>
                    <span className={styles.dividerText}>or</span>
                  </div>

                  {/* Connect to Device */}
                  <div className={styles.connectSection}>
                    <Input
                      label="Enter Connection Code"
                      placeholder="XXXX-XXXX"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                      maxLength={9}
                      fullWidth
                      leadingIcon={<LinkIcon />}
                      disabled={isConnecting}
                    />
                    <Button
                      fullWidth
                      onClick={handleConnect}
                      disabled={!inputCode.trim() || isConnecting}
                      loading={isConnecting}
                    >
                      {isConnecting ? 'Connecting...' : 'Connect'}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ) : (
              /* Connected State */
              <Card className={styles.connectionCard} variant="highlighted">
                <CardHeader>
                  <h2 className={styles.cardTitle}>Connected Device</h2>
                </CardHeader>

                <CardBody>
                  <div className={styles.connectedDevice}>
                    <div className={styles.deviceAvatar}>
                      <span className={styles.deviceInitial}>
                        {connection.peerName?.charAt(0) || 'D'}
                      </span>
                    </div>
                    <div className={styles.deviceInfo}>
                      <h3 className={styles.deviceName}>
                        {connection.peerName || 'Remote Device'}
                      </h3>
                      <Badge variant="success" showDot>
                        {connection.connectionType === 'p2p' ? 'Direct P2P' : 'Relay'}
                      </Badge>
                    </div>
                  </div>

                  {/* Security Indicators */}
                  <div className={styles.securityIndicators}>
                    <div className={styles.securityItem}>
                      <ShieldIcon />
                      <span className={styles.securityText}>End-to-End Encrypted</span>
                    </div>
                    <div className={styles.securityItem}>
                      <ShieldIcon />
                      <span className={styles.securityText}>PQC Protected</span>
                    </div>
                  </div>
                </CardBody>

                <CardFooter>
                  <Button
                    fullWidth
                    variant="secondary"
                    onClick={handleDisconnect}
                  >
                    Disconnect
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* Discovered Devices */}
            {onlineDevices.length > 0 && !isConnected && (
              <Card className={styles.devicesCard}>
                <CardHeader>
                  <h3 className={styles.cardTitle}>Discovered Devices</h3>
                  <p className={styles.cardDescription}>
                    Local network devices
                  </p>
                </CardHeader>

                <CardBody>
                  <ul className={styles.devicesList} role="list">
                    {onlineDevices.slice(0, 5).map((device) => (
                      <li key={device.id}>
                        <button
                          className={styles.deviceButton}
                          onClick={() => handleDeviceClick(device)}
                          disabled={isConnecting}
                        >
                          <div className={styles.deviceAvatar}>
                            <span className={styles.deviceInitial}>
                              {device.name.charAt(0)}
                            </span>
                          </div>
                          <div className={styles.deviceInfo}>
                            <span className={styles.deviceName}>{device.name}</span>
                            <span className={styles.devicePlatform}>{device.platform}</span>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            )}
          </div>
        </div>

        {/* Transfer Progress (when active) */}
        {isTransferring && currentTransfer && (
          <Card className={styles.transferProgress} variant="highlighted">
            <CardBody>
              <div className={styles.progressHeader}>
                <div className={styles.progressInfo}>
                  <h3 className={styles.progressTitle}>
                    Transferring {currentTransfer.files.length}{' '}
                    {currentTransfer.files.length === 1 ? 'file' : 'files'}
                  </h3>
                  <div className={styles.progressStats}>
                    <span>{formatSpeed(transferSpeed)}</span>
                    <span className={styles.progressDot}>•</span>
                    <span>{transferEta ? formatTime(transferEta) : '--'} remaining</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Cancel transfer logic
                  }}
                >
                  Cancel
                </Button>
              </div>

              {/* Progress Bar */}
              <div className={styles.progressBarContainer}>
                <div
                  className={styles.progressBar}
                  style={{ width: `${uploadProgress}%` }}
                  role="progressbar"
                  aria-valuenow={uploadProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>

              <div className={styles.progressPercentage}>
                {uploadProgress.toFixed(0)}%
              </div>
            </CardBody>
          </Card>
        )}
      </main>
    </div>
  );
}
