'use client';

/**
 * QR Scanner Demo & Testing Page
 *
 * Use this component to test the QR Scanner functionality.
 * Includes test QR codes, support detection, and integration examples.
 */

import { useState, useEffect } from 'react';
import { QRScanner } from './QRScanner';
import { generateEnhancedVisualCodeDataURL } from '@/lib/utils/qr-code-generator';
import { testBarcodeDetector } from '@/lib/utils/barcode-detector-polyfill';

export function QRScannerDemo() {
  const [showScanner, setShowScanner] = useState(false);
  const [scannedData, setScannedData] = useState<string[]>([]);
  const [browserSupport, setBrowserSupport] = useState<{
    supported: boolean;
    formats: string[];
    working: boolean;
  } | null>(null);

  // Test browser support on mount
  useEffect(() => {
    testBarcodeDetector().then((result) => {
      setBrowserSupport(result);
      console.log('[QRScannerDemo] Browser support:', result);
    });
  }, []);

  const handleScan = (data: string) => {
    console.log('[QRScannerDemo] Scanned:', data);
    setScannedData((prev) => [data, ...prev]);
    setShowScanner(false);
  };

  const handleClose = () => {
    setShowScanner(false);
  };

  // Test room codes
  const testRoomCodes = [
    { code: 'ABC123', url: `${typeof window !== 'undefined' ? window.location.origin : ''}/transfer?room=ABC123` },
    { code: 'XYZ789', url: `${typeof window !== 'undefined' ? window.location.origin : ''}/transfer?room=XYZ789` },
    { code: 'TEST42', url: `${typeof window !== 'undefined' ? window.location.origin : ''}/transfer?room=TEST42` },
  ];

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          QR Scanner Demo
        </h1>
        <p style={{ color: '#a1a1a1', fontSize: '1rem' }}>
          Test QR code scanning functionality with sample codes
        </p>
      </div>

      {/* Browser Support Info */}
      {browserSupport && (
        <div style={{
          padding: '1.5rem',
          background: browserSupport.working
            ? 'rgba(12, 206, 107, 0.1)'
            : 'rgba(238, 0, 0, 0.1)',
          border: browserSupport.working
            ? '1px solid rgba(12, 206, 107, 0.3)'
            : '1px solid rgba(238, 0, 0, 0.3)',
          borderRadius: '0.75rem',
          marginBottom: '2rem',
        }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.125rem', fontWeight: '600' }}>
            Browser Support
          </h3>
          <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem' }}>
            <div>
              <strong>Native BarcodeDetector:</strong>{' '}
              <span style={{ color: browserSupport.supported ? '#0cce6b' : '#ee0000' }}>
                {browserSupport.supported ? '✓ Supported' : '✗ Not Supported'}
              </span>
            </div>
            <div>
              <strong>QR Code Scanning:</strong>{' '}
              <span style={{ color: browserSupport.working ? '#0cce6b' : '#ee0000' }}>
                {browserSupport.working ? '✓ Available' : '✗ Manual Entry Only'}
              </span>
            </div>
            {browserSupport.formats.length > 0 && (
              <div>
                <strong>Supported Formats:</strong> {browserSupport.formats.join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scanner Button */}
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => setShowScanner(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '1rem 1.5rem',
            background: 'linear-gradient(135deg, #5E5CE6, #7B79FF)',
            color: 'white',
            border: 'none',
            borderRadius: '0.75rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(94, 92, 230, 0.3)',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(94, 92, 230, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(94, 92, 230, 0.3)';
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <path d="M14 14h1M15 14v1M14 15h1M19 14h2M14 19h2M21 14v2M21 19h-2M19 21v-2" />
          </svg>
          <span>Open QR Scanner</span>
        </button>
      </div>

      {/* Test QR Codes */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
          Test QR Codes
        </h2>
        <p style={{ color: '#a1a1a1', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          Scan these codes with your camera to test the scanner
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
        }}>
          {testRoomCodes.map((test) => (
            <div
              key={test.code}
              style={{
                padding: '1.5rem',
                background: 'rgba(23, 23, 23, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '1rem',
                textAlign: 'center',
              }}
            >
              <div style={{
                padding: '1rem',
                background: '#ffffff',
                borderRadius: '0.75rem',
                marginBottom: '1rem',
                display: 'inline-block',
              }}>
                <img
                  src={generateEnhancedVisualCodeDataURL(test.url, {
                    size: 200,
                    gridSize: 12,
                    colorScheme: 'monochrome',
                  })}
                  alt={`QR code for room ${test.code}`}
                  style={{
                    display: 'block',
                    width: '200px',
                    height: '200px',
                    imageRendering: 'crisp-edges',
                  }}
                />
              </div>
              <div style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                fontFamily: 'monospace',
                color: '#ededed',
                marginBottom: '0.5rem',
              }}>
                {test.code}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: '#a1a1a1',
                wordBreak: 'break-all',
              }}>
                {test.url}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scan History */}
      {scannedData.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', margin: 0 }}>
              Scan History
            </h2>
            <button
              onClick={() => setScannedData([])}
              style={{
                padding: '0.5rem 1rem',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '0.5rem',
                color: '#a1a1a1',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Clear History
            </button>
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}>
            {scannedData.map((data, index) => (
              <div
                key={index}
                style={{
                  padding: '1rem',
                  background: 'rgba(94, 92, 230, 0.1)',
                  border: '1px solid rgba(94, 92, 230, 0.3)',
                  borderRadius: '0.75rem',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  color: '#ededed',
                  wordBreak: 'break-all',
                }}
              >
                <div style={{ marginBottom: '0.25rem', color: '#a1a1a1', fontSize: '0.75rem' }}>
                  Scan #{scannedData.length - index}
                </div>
                {data}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        padding: '1.5rem',
        background: 'rgba(23, 23, 23, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '1rem',
      }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
          How to Test
        </h3>
        <ol style={{
          margin: 0,
          paddingLeft: '1.5rem',
          color: '#a1a1a1',
          fontSize: '0.875rem',
          lineHeight: '1.6',
        }}>
          <li>Click "Open QR Scanner" to launch the scanner modal</li>
          <li>Grant camera permission when prompted</li>
          <li>Point your camera at one of the test QR codes above</li>
          <li>The scanner will automatically detect and process the code</li>
          <li>View the scanned data in the "Scan History" section</li>
          <li>
            If your browser doesn't support scanning, use the "Enter Code Manually" option
            to type room codes like "ABC123"
          </li>
        </ol>
      </div>

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={showScanner}
        onScan={handleScan}
        onClose={handleClose}
      />
    </div>
  );
}

export default QRScannerDemo;
