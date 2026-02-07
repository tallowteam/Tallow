'use client';

/**
 * QR Scanner Integration Example
 *
 * This example shows how to integrate the QRScanner component
 * with the RoomCodeConnect component for quick device pairing.
 */

import { useState } from 'react';
import { QRScanner } from './QRScanner';
import { RoomCodeConnect } from './RoomCodeConnect';

export function QRScannerExample() {
  const [showScanner, setShowScanner] = useState(false);
  const [scannedRoom, setScannedRoom] = useState<string | null>(null);
  const [selectedFiles] = useState<File[]>([]);

  const handleScan = (data: string) => {
    console.log('[QRScannerExample] Scanned:', data);

    // Extract room code from URL or use raw data
    let roomCode = data;
    if (data.includes('/transfer?room=')) {
      const url = new URL(data);
      roomCode = url.searchParams.get('room') || data;
    }

    setScannedRoom(roomCode);
    setShowScanner(false);
  };

  const handleCloseScanner = () => {
    setShowScanner(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1rem' }}>QR Code Scanner Demo</h2>

      {/* Trigger button */}
      <button
        onClick={() => setShowScanner(true)}
        style={{
          padding: '12px 24px',
          background: 'linear-gradient(135deg, #5E5CE6, #7B79FF)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          marginBottom: '2rem',
        }}
      >
        Scan QR Code
      </button>

      {/* Show scanned room code */}
      {scannedRoom && (
        <div
          style={{
            padding: '1rem',
            background: 'rgba(94, 92, 230, 0.1)',
            border: '1px solid rgba(94, 92, 230, 0.3)',
            borderRadius: '8px',
            marginBottom: '2rem',
          }}
        >
          <strong>Scanned Room Code:</strong> {scannedRoom}
        </div>
      )}

      {/* Room Code Connect Component */}
      <RoomCodeConnect
        selectedFiles={selectedFiles}
        {...(scannedRoom ? { initialRoomCode: scannedRoom } : {})}
        onConnect={(roomCode) => {
          console.log('[QRScannerExample] Connected to room:', roomCode);
        }}
      />

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={showScanner}
        onScan={handleScan}
        onClose={handleCloseScanner}
      />
    </div>
  );
}

/**
 * Integration Instructions:
 *
 * 1. Add a "Scan QR" button to your RoomCodeConnect component:
 *
 * ```tsx
 * import { QRScanner } from './QRScanner';
 *
 * function RoomCodeConnect() {
 *   const [showScanner, setShowScanner] = useState(false);
 *
 *   return (
 *     <>
 *       <button onClick={() => setShowScanner(true)}>
 *         Scan QR Code
 *       </button>
 *
 *       <QRScanner
 *         isOpen={showScanner}
 *         onScan={(data) => {
 *           // Handle scanned room code
 *           setRoomCode(extractRoomCode(data));
 *           setShowScanner(false);
 *         }}
 *         onClose={() => setShowScanner(false)}
 *       />
 *     </>
 *   );
 * }
 * ```
 *
 * 2. Test browser compatibility:
 *
 * ```tsx
 * import { testBarcodeDetector } from '@/lib/utils/barcode-detector-polyfill';
 *
 * useEffect(() => {
 *   testBarcodeDetector().then((result) => {
 *     console.log('QR Scanner support:', result);
 *     if (!result.working) {
 *       // Show warning or hide scanner button
 *     }
 *   });
 * }, []);
 * ```
 *
 * 3. Handle different URL formats:
 *
 * ```tsx
 * function extractRoomCode(data: string): string {
 *   // Handle direct room codes
 *   if (!data.includes('://')) {
 *     return data.toUpperCase();
 *   }
 *
 *   // Handle URLs with room parameter
 *   try {
 *     const url = new URL(data);
 *     return url.searchParams.get('room')?.toUpperCase() || data;
 *   } catch {
 *     return data.toUpperCase();
 *   }
 * }
 * ```
 */
