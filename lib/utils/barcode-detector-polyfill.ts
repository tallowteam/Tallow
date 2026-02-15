/**
 * Barcode Detector Polyfill
 *
 * Provides a simplified interface for barcode detection using the native
 * BarcodeDetector API when available. Falls back to empty results if not supported.
 *
 * For production use, you could integrate a JavaScript QR code library like:
 * - jsQR (https://github.com/cozmo/jsQR)
 * - qr-scanner (https://github.com/nimiq/qr-scanner)
 * - @zxing/library (https://github.com/zxing-js/library)
 */

export interface BarcodeDetectorResult {
  rawValue: string;
  format: string;
  boundingBox?: DOMRectReadOnly;
  cornerPoints?: Array<{ x: number; y: number }>;
}

declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats: string[] }): {
        detect(
          source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
        ): Promise<BarcodeDetectorResult[]>;
      };
      getSupportedFormats(): Promise<string[]>;
    };
  }
}

/**
 * Check if BarcodeDetector is natively supported
 */
export function isBarcodeDetectorSupported(): boolean {
  return 'BarcodeDetector' in window;
}

/**
 * Get list of supported barcode formats
 */
export async function getSupportedFormats(): Promise<string[]> {
  if (!isBarcodeDetectorSupported()) {
    return [];
  }

  try {
    return await window.BarcodeDetector!.getSupportedFormats();
  } catch (err) {
    console.error('[BarcodeDetector] Failed to get supported formats:', err);
    return [];
  }
}

/**
 * Detect barcodes in an image or video element
 */
export async function detectBarcodes(
  source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
): Promise<BarcodeDetectorResult[]> {
  // Check if native API is available
  if (!isBarcodeDetectorSupported()) {
    console.warn(
      '[BarcodeDetector] BarcodeDetector API not supported in this browser.'
    );
    return [];
  }

  try {
    const detector = new window.BarcodeDetector!({ formats: ['qr_code'] });
    const results = await detector.detect(source);
    return results;
  } catch (err) {
    console.error('[BarcodeDetector] Detection error:', err);
    return [];
  }
}

/**
 * Alternative: Manual QR detection using Canvas API
 * This is a placeholder for a more robust implementation using jsQR or similar
 */
export async function detectBarcodesManual(
  video: HTMLVideoElement
): Promise<BarcodeDetectorResult[]> {
  try {
    // Create canvas to capture video frame
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Draw current video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    void imageData;

    // TODO: Implement QR decoding logic here
    // For now, this is a placeholder that returns empty results
    // You would typically use a library like jsQR:
    //
    // import jsQR from 'jsqr';
    // const code = jsQR(imageData.data, imageData.width, imageData.height);
    // if (code) {
    //   return [{
    //     rawValue: code.data,
    //     format: 'qr_code',
    //     boundingBox: code.location,
    //   }];
    // }

    console.log('[BarcodeDetector] Manual detection called but not implemented');
    return [];
  } catch (err) {
    console.error('[BarcodeDetector] Manual detection error:', err);
    return [];
  }
}

/**
 * Test if barcode detection is functional
 */
export async function testBarcodeDetector(): Promise<{
  supported: boolean;
  formats: string[];
  working: boolean;
}> {
  const supported = isBarcodeDetectorSupported();

  if (!supported) {
    return { supported: false, formats: [], working: false };
  }

  try {
    const formats = await getSupportedFormats();
    const hasQRCode = formats.includes('qr_code');

    return {
      supported: true,
      formats,
      working: hasQRCode,
    };
  } catch (err) {
    console.error('[BarcodeDetector] Test failed:', err);
    return { supported: true, formats: [], working: false };
  }
}

/**
 * Browser compatibility notes:
 *
 * BarcodeDetector API is supported in:
 * - Chrome/Edge 83+
 * - Opera 69+
 * - Chrome Android 83+
 * - WebView Android 83+
 *
 * NOT supported in:
 * - Firefox (as of 2024)
 * - Safari/iOS Safari (as of 2024)
 *
 * For broader compatibility, consider using a JavaScript library like jsQR:
 * npm install jsqr
 */
