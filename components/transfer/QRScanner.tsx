'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { detectBarcodes } from '@/lib/utils/barcode-detector-polyfill';
import styles from './QRScanner.module.css';

type ScanState = 'idle' | 'scanning' | 'detected' | 'error' | 'permission-denied';

interface QRScannerProps {
  isOpen: boolean;
  onScan: (data: string) => void;
  onClose: () => void;
}

export function QRScanner({ isOpen, onScan, onClose }: QRScannerProps) {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [error, setError] = useState<string>('');
  const [hasFlash, setHasFlash] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Request camera permission
  const requestCameraPermission = useCallback(async () => {
    if (!isOpen) return;

    try {
      setScanState('idle');
      setError('');

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Prefer back camera
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      streamRef.current = stream;
      setHasPermission(true);

      // Attach to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Check for flash/torch capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
        if (capabilities && capabilities.torch) {
          setHasFlash(true);
        }
      }

      // Start scanning
      setScanState('scanning');
      startScanning();
    } catch (err) {
      console.error('[QRScanner] Camera permission error:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setScanState('permission-denied');
          setError('Camera permission denied. Please allow camera access to scan QR codes.');
          setHasPermission(false);
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setScanState('error');
          setError('No camera found on this device.');
        } else {
          setScanState('error');
          setError('Failed to access camera. Please try again.');
        }
      }
    }
  }, [isOpen]);

  // Toggle flash
  const toggleFlash = useCallback(async () => {
    if (!streamRef.current) return;

    try {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (!videoTrack) return;
      const newFlashState = !flashEnabled;

      await videoTrack.applyConstraints({
        // @ts-ignore - torch is not in standard types yet
        advanced: [{ torch: newFlashState }],
      });

      setFlashEnabled(newFlashState);
    } catch (err) {
      console.error('[QRScanner] Flash toggle error:', err);
    }
  }, [flashEnabled]);

  // Start scanning for QR codes
  const startScanning = useCallback(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    // Use BarcodeDetector API if available
    if ('BarcodeDetector' in window) {
      scanIntervalRef.current = setInterval(async () => {
        if (video.readyState === video.HAVE_ENOUGH_DATA && scanState === 'scanning') {
          try {
            const barcodes = await detectBarcodes(video);
            if (barcodes.length > 0) {
              const qrCode = barcodes[0];
              if (qrCode) handleScan(qrCode.rawValue);
            }
          } catch (err) {
            console.error('[QRScanner] Detection error:', err);
          }
        }
      }, 300); // Scan every 300ms
    } else {
      // Fallback: Show manual entry option
      console.log('[QRScanner] BarcodeDetector not supported, showing manual entry');
      setScanState('error');
      setError('QR scanning not supported on this browser.');
      setShowManualEntry(true);
    }
  }, [scanState]);

  // Handle successful scan
  const handleScan = useCallback((data: string) => {
    if (!data) return;

    console.log('[QRScanner] Scanned data:', data);
    setScanState('detected');

    // Extract room code from URL or use raw data
    let roomCode = data;

    // Check if it's a Tallow transfer URL
    if (data.includes('/transfer?room=')) {
      const url = new URL(data);
      roomCode = url.searchParams.get('room') || data;
    }

    // Notify parent
    onScan(roomCode);

    // Small delay before closing to show success state
    setTimeout(() => {
      stopScanning();
      onClose();
    }, 800);
  }, [onScan, onClose]);

  // Handle manual code submission
  const handleManualSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleScan(manualCode.trim().toUpperCase());
    }
  }, [manualCode, handleScan]);

  // Stop scanning and cleanup
  const stopScanning = useCallback(() => {
    // Clear animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Clear scan interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Clear video source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScanState('idle');
    setFlashEnabled(false);
  }, []);

  // Initialize camera when opened
  useEffect(() => {
    if (isOpen && hasPermission === null) {
      requestCameraPermission();
    }

    return () => {
      if (!isOpen) {
        stopScanning();
      }
    };
  }, [isOpen, hasPermission, requestCameraPermission, stopScanning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  if (!isOpen) return null;

  return (
    <div className={`${styles.overlay} ${isMobileView ? styles.overlayMobile : ''}`}>
      <div className={`${styles.modal} ${isMobileView ? styles.modalMobile : ''}`}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Scan QR Code</h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close scanner"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Permission Request State */}
        {hasPermission === null && scanState === 'idle' && (
          <div className={styles.permissionRequest}>
            <CameraIcon />
            <h3 className={styles.permissionTitle}>Camera Access Required</h3>
            <p className={styles.permissionText}>
              Allow camera access to scan QR codes for quick device pairing
            </p>
            <button
              onClick={requestCameraPermission}
              className={styles.primaryButton}
            >
              <CameraIcon />
              <span>Enable Camera</span>
            </button>
          </div>
        )}

        {/* Permission Denied State */}
        {scanState === 'permission-denied' && (
          <div className={styles.errorState}>
            <ErrorIcon />
            <h3 className={styles.errorTitle}>Camera Access Denied</h3>
            <p className={styles.errorText}>{error}</p>
            <div className={styles.errorActions}>
              <button
                onClick={requestCameraPermission}
                className={styles.secondaryButton}
              >
                Try Again
              </button>
              <button
                onClick={() => setShowManualEntry(true)}
                className={styles.primaryButton}
              >
                Enter Code Manually
              </button>
            </div>
          </div>
        )}

        {/* Error State */}
        {scanState === 'error' && (
          <div className={styles.errorState}>
            <ErrorIcon />
            <h3 className={styles.errorTitle}>Scanner Error</h3>
            <p className={styles.errorText}>{error}</p>
            <button
              onClick={() => setShowManualEntry(true)}
              className={styles.primaryButton}
            >
              Enter Code Manually
            </button>
          </div>
        )}

        {/* Scanning State */}
        {scanState === 'scanning' && (
          <div className={styles.scannerView}>
            <div className={styles.videoContainer}>
              <video
                ref={videoRef}
                className={styles.video}
                playsInline
                muted
                autoPlay
              />

              {/* Scan overlay with animated line */}
              <div className={styles.scanOverlay}>
                <div className={styles.scanFrame}>
                  <div className={styles.cornerTopLeft} />
                  <div className={styles.cornerTopRight} />
                  <div className={styles.cornerBottomLeft} />
                  <div className={styles.cornerBottomRight} />
                  <div className={styles.scanLine} />
                </div>
              </div>

              {/* Instructions */}
              <div className={styles.instructions}>
                <QRCodeIcon />
                <span>Position QR code within frame</span>
              </div>
            </div>

            {/* Controls */}
            <div className={styles.controls}>
              {hasFlash && (
                <button
                  onClick={toggleFlash}
                  className={`${styles.controlButton} ${flashEnabled ? styles.controlButtonActive : ''}`}
                  aria-label={flashEnabled ? 'Turn off flash' : 'Turn on flash'}
                >
                  {flashEnabled ? <FlashOnIcon /> : <FlashOffIcon />}
                  <span>{flashEnabled ? 'Flash On' : 'Flash Off'}</span>
                </button>
              )}
              <button
                onClick={() => setShowManualEntry(true)}
                className={styles.controlButton}
                aria-label="Enter code manually"
              >
                <KeyboardIcon />
                <span>Enter Code</span>
              </button>
            </div>
          </div>
        )}

        {/* Detected State */}
        {scanState === 'detected' && (
          <div className={styles.successState}>
            <div className={styles.successIcon}>
              <CheckIcon />
            </div>
            <h3 className={styles.successTitle}>QR Code Detected!</h3>
            <p className={styles.successText}>Connecting...</p>
          </div>
        )}

        {/* Manual Entry */}
        {showManualEntry && (
          <div className={styles.manualEntry}>
            <form onSubmit={handleManualSubmit} className={styles.manualForm}>
              <label htmlFor="manual-code" className={styles.manualLabel}>
                Enter Room Code
              </label>
              <input
                id="manual-code"
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                className={styles.manualInput}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                maxLength={16}
                autoFocus
              />
              <div className={styles.manualActions}>
                <button
                  type="button"
                  onClick={() => setShowManualEntry(false)}
                  className={styles.secondaryButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={manualCode.trim().length < 4}
                  className={styles.primaryButton}
                >
                  Connect
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// Icons
function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function QRCodeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <path d="M14 14h1M15 14v1M14 15h1M19 14h2M14 19h2M21 14v2M21 19h-2M19 21v-2" />
    </svg>
  );
}

function FlashOnIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h8l-1 8 10-12h-8z" />
    </svg>
  );
}

function FlashOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2L3 14h8l-1 8 10-12h-8z" />
      <line x1="2" y1="2" x2="22" y2="22" strokeWidth="2" />
    </svg>
  );
}

function KeyboardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="6" y1="10" x2="6.01" y2="10" />
      <line x1="10" y1="10" x2="10.01" y2="10" />
      <line x1="14" y1="10" x2="14.01" y2="10" />
      <line x1="18" y1="10" x2="18.01" y2="10" />
      <line x1="6" y1="14" x2="18" y2="14" />
    </svg>
  );
}
