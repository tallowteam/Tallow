/**
 * Image Optimization Utilities
 * Helper functions for optimizing images in the application
 */

/**
 * Generate responsive image srcset
 * @param basePath - Base path to the image
 * @param sizes - Array of widths for responsive images
 * @returns srcset string
 */
export function generateSrcSet(basePath: string, sizes: number[]): string {
  return sizes.map(size => `${basePath}?w=${size} ${size}w`).join(', ');
}

/**
 * Get optimal image sizes for responsive loading
 */
export const RESPONSIVE_SIZES = {
  mobile: [320, 640],
  tablet: [768, 1024],
  desktop: [1280, 1920],
} as const;

/**
 * Image format support detection
 */
export function supportsWebP(): boolean {
  if (typeof window === 'undefined') {return false;}

  const canvas = document.createElement('canvas');
  if (!canvas.getContext?.('2d')) {return false;}

  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

/**
 * Lazy load image with IntersectionObserver
 * @param img - Image element
 * @param src - Image source
 */
export function lazyLoadImage(img: HTMLImageElement, src: string): void {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLImageElement;
          target.src = src;
          target.classList.remove('lazy');
          observer.unobserve(target);
        }
      });
    });

    observer.observe(img);
  } else {
    // Fallback for older browsers
    img.src = src;
  }
}

/**
 * Preload critical images
 * @param urls - Array of image URLs to preload
 */
export function preloadImages(urls: string[]): void {
  if (typeof window === 'undefined') {return;}

  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Convert data URL to blob for optimization
 * @param dataUrl - Data URL string
 * @returns Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const firstPart = parts[0] ?? '';
  const secondPart = parts[1] ?? '';
  const mime = firstPart.match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(secondPart);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);

  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }

  return new Blob([u8arr], { type: mime });
}

/**
 * Compress image using canvas
 * @param file - Image file
 * @param maxWidth - Maximum width
 * @param quality - JPEG quality (0-1)
 * @returns Compressed blob
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  quality: number = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    reader.readAsDataURL(file);
  });
}

/**
 * Get image dimensions without loading full image
 * @param file - Image file
 * @returns Width and height
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    reader.readAsDataURL(file);
  });
}

/**
 * Generate blur placeholder for images
 * @param src - Image source
 * @returns Base64 blurred image
 */
export async function generateBlurPlaceholder(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Small size for placeholder
      canvas.width = 10;
      canvas.height = 10;

      ctx.filter = 'blur(5px)';
      ctx.drawImage(img, 0, 0, 10, 10);

      resolve(canvas.toDataURL('image/jpeg', 0.5));
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}
