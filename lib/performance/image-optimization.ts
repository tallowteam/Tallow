/**
 * Image Optimization Utilities
 *
 * Provides utilities for lazy loading images, generating placeholders,
 * and optimizing image loading strategies for better LCP and CLS.
 *
 * @module lib/performance/image-optimization
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ImageLoadOptions {
  /** Loading strategy */
  loading?: 'lazy' | 'eager';
  /** Placeholder type */
  placeholder?: 'blur' | 'empty' | 'color' | 'shimmer';
  /** Dominant color for placeholder */
  placeholderColor?: string;
  /** Blur data URL for placeholder */
  blurDataURL?: string;
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Threshold for intersection observer */
  threshold?: number;
  /** Decode image off main thread */
  decoding?: 'async' | 'sync' | 'auto';
  /** Fetch priority */
  fetchPriority?: 'high' | 'low' | 'auto';
}

export interface ResponsiveImageConfig {
  /** Image source */
  src: string;
  /** Srcset for responsive images */
  srcset?: string;
  /** Sizes attribute */
  sizes?: string;
  /** Width */
  width: number;
  /** Height */
  height: number;
  /** Alt text */
  alt: string;
}

export interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

// ============================================================================
// LAZY LOADING
// ============================================================================

const loadedImages = new Set<string>();
const imageObserver = createImageObserver();

/**
 * Create intersection observer for lazy loading images
 */
function createImageObserver(): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') {return null;}

  return new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          const srcset = img.dataset.srcset;

          if (src && !loadedImages.has(src)) {
            loadImage(img, src, srcset);
            loadedImages.add(src);
          }

          imageObserver?.unobserve(img);
        }
      }
    },
    {
      root: null,
      rootMargin: '200px',
      threshold: 0,
    }
  );
}

/**
 * Load image with fade-in animation
 */
function loadImage(
  img: HTMLImageElement,
  src: string,
  srcset?: string
): void {
  // Create a new image to preload
  const tempImg = new Image();

  tempImg.onload = () => {
    img.src = src;
    if (srcset) {
      img.srcset = srcset;
    }
    img.classList.add('loaded');
    img.removeAttribute('data-src');
    img.removeAttribute('data-srcset');
  };

  tempImg.onerror = () => {
    img.classList.add('error');
  };

  tempImg.src = src;
}

/**
 * Register image for lazy loading
 *
 * @example
 * lazyLoadImage(imageElement, {
 *   placeholder: 'blur',
 *   rootMargin: '300px'
 * });
 */
export function lazyLoadImage(
  img: HTMLImageElement,
  options: ImageLoadOptions = {}
): void {
  const { placeholder = 'empty', placeholderColor = '#f0f0f0' } = options;

  // Set placeholder
  if (placeholder === 'color') {
    img.style.backgroundColor = placeholderColor;
  } else if (placeholder === 'shimmer') {
    img.classList.add('image-shimmer');
  }

  // Set decoding
  if (options.decoding) {
    img.decoding = options.decoding;
  }

  // Observe for lazy loading
  if (imageObserver) {
    imageObserver.observe(img);
  } else {
    // Fallback - load immediately
    const src = img.dataset.src;
    if (src) {
      img.src = src;
    }
  }
}

/**
 * Preload critical images
 *
 * @example
 * preloadImages(['/hero.jpg', '/logo.svg']);
 */
export function preloadImages(
  srcs: string[],
  options: { priority?: 'high' | 'low' } = {}
): Promise<void[]> {
  return Promise.all(
    srcs.map((src) => {
      return new Promise<void>((resolve) => {
        // Use link preload for high priority
        if (options.priority === 'high' && typeof document !== 'undefined') {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'image';
          link.href = src;
          link.onload = () => resolve();
          link.onerror = () => resolve();
          document.head.appendChild(link);
        } else {
          // Use Image constructor for normal priority
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = src;
        }
      });
    })
  );
}

// ============================================================================
// PLACEHOLDER GENERATION
// ============================================================================

/**
 * Generate a low-quality image placeholder (LQIP) data URL
 * This is a simple placeholder - for real LQIP, generate at build time
 *
 * @example
 * const placeholder = generatePlaceholder({ width: 800, height: 600 }, '#3b82f6');
 */
export function generatePlaceholder(
  dimensions: ImageDimensions,
  color = '#e5e7eb'
): string {
  const { width, height } = dimensions;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="${color}"/>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg.trim())}`;
}

/**
 * Generate a shimmer placeholder SVG
 */
export function generateShimmerPlaceholder(
  dimensions: ImageDimensions
): string {
  const { width, height } = dimensions;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#f0f0f0">
            <animate attributeName="offset" values="-2;1" dur="1.5s" repeatCount="indefinite"/>
          </stop>
          <stop offset="50%" style="stop-color:#e0e0e0">
            <animate attributeName="offset" values="-1;2" dur="1.5s" repeatCount="indefinite"/>
          </stop>
          <stop offset="100%" style="stop-color:#f0f0f0">
            <animate attributeName="offset" values="0;3" dur="1.5s" repeatCount="indefinite"/>
          </stop>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#shimmer)"/>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg.trim())}`;
}

/**
 * Generate blur placeholder from image
 * Note: For real blur placeholders, generate at build time using sharp/plaiceholder
 */
export function generateBlurPlaceholder(
  dimensions: ImageDimensions,
  dominantColor = '#e5e7eb'
): string {
  return generatePlaceholder(dimensions, dominantColor);
}

// ============================================================================
// RESPONSIVE IMAGES
// ============================================================================

/**
 * Generate srcset string for responsive images
 *
 * @example
 * const srcset = generateSrcset('/images/hero', [320, 640, 1280], 'webp');
 * // Returns: "/images/hero-320.webp 320w, /images/hero-640.webp 640w, ..."
 */
export function generateSrcset(
  basePath: string,
  widths: number[],
  format = 'webp'
): string {
  return widths
    .map((width) => `${basePath}-${width}.${format} ${width}w`)
    .join(', ');
}

/**
 * Generate sizes attribute for responsive images
 *
 * @example
 * const sizes = generateSizes([
 *   { maxWidth: 640, width: '100vw' },
 *   { maxWidth: 1024, width: '50vw' },
 *   { width: '33vw' },
 * ]);
 */
export function generateSizes(
  breakpoints: Array<{ maxWidth?: number; width: string }>
): string {
  return breakpoints
    .map((bp) =>
      bp.maxWidth ? `(max-width: ${bp.maxWidth}px) ${bp.width}` : bp.width
    )
    .join(', ');
}

/**
 * Get optimal image dimensions maintaining aspect ratio
 */
export function getOptimalDimensions(
  original: ImageDimensions,
  maxWidth: number,
  maxHeight?: number
): ImageDimensions {
  let { width, height } = original;
  const aspectRatio = width / height;

  if (width > maxWidth) {
    width = maxWidth;
    height = Math.round(width / aspectRatio);
  }

  if (maxHeight && height > maxHeight) {
    height = maxHeight;
    width = Math.round(height * aspectRatio);
  }

  return { width, height, aspectRatio };
}

// ============================================================================
// IMAGE FORMATS
// ============================================================================

/**
 * Check if browser supports WebP
 */
export function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src =
      'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

/**
 * Check if browser supports AVIF
 */
export function supportsAVIF(): Promise<boolean> {
  return new Promise((resolve) => {
    const avif = new Image();
    avif.onload = avif.onerror = () => {
      resolve(avif.height === 2);
    };
    avif.src =
      'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKBzgABpAQ0AIQMxoB8AAADRAAAAIAIg==';
  });
}

/**
 * Get best supported image format
 */
export async function getBestImageFormat(): Promise<'avif' | 'webp' | 'jpg'> {
  if (await supportsAVIF()) {return 'avif';}
  if (await supportsWebP()) {return 'webp';}
  return 'jpg';
}

// ============================================================================
// IMAGE DECODING
// ============================================================================

/**
 * Decode image off main thread
 *
 * @example
 * const decoded = await decodeImage('/hero.jpg');
 * imageElement.src = decoded.src;
 */
export async function decodeImage(
  src: string
): Promise<{ src: string; width: number; height: number }> {
  const img = new Image();
  img.src = src;

  if ('decode' in img) {
    await img.decode();
  } else {
    await new Promise<void>((resolve, reject) => {
      (img as HTMLImageElement).onload = () => resolve();
      (img as HTMLImageElement).onerror = () => reject(new Error('Failed to load image'));
    });
  }

  return {
    src: img.src,
    width: img.naturalWidth,
    height: img.naturalHeight,
  };
}

// ============================================================================
// CLS PREVENTION
// ============================================================================

/**
 * Calculate aspect ratio CSS padding for CLS prevention
 *
 * @example
 * const padding = getAspectRatioPadding(16, 9);
 * // Returns "56.25%"
 */
export function getAspectRatioPadding(width: number, height: number): string {
  return `${(height / width) * 100}%`;
}

/**
 * Generate CSS for aspect ratio container
 */
export function generateAspectRatioStyle(
  width: number,
  height: number
): Record<string, string> {
  return {
    position: 'relative',
    width: '100%',
    paddingBottom: getAspectRatioPadding(width, height),
  };
}

// ============================================================================
// NATIVE IMAGE ATTRIBUTES
// ============================================================================

/**
 * Get optimized image attributes for native lazy loading
 *
 * @example
 * const attrs = getOptimizedImageAttrs({
 *   src: '/hero.jpg',
 *   width: 1200,
 *   height: 800,
 *   alt: 'Hero image',
 * }, { loading: 'lazy', fetchPriority: 'low' });
 */
export function getOptimizedImageAttrs(
  config: ResponsiveImageConfig,
  options: ImageLoadOptions = {}
): Record<string, string> {
  const attrs: Record<string, string> = {
    src: config.src,
    width: String(config.width),
    height: String(config.height),
    alt: config.alt,
    loading: options.loading || 'lazy',
    decoding: options.decoding || 'async',
  };

  if (config.srcset) {
    attrs.srcset = config.srcset;
  }

  if (config.sizes) {
    attrs.sizes = config.sizes;
  }

  if (options.fetchPriority) {
    attrs.fetchpriority = options.fetchPriority;
  }

  return attrs;
}

// ============================================================================
// CSS STYLES
// ============================================================================

/**
 * CSS for image lazy loading animations
 * Add to your global styles
 */
export const imageLoadingStyles = `
  /* Base lazy loading styles */
  img[data-src] {
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
  }

  img[data-src].loaded {
    opacity: 1;
  }

  img[data-src].error {
    opacity: 0.5;
  }

  /* Shimmer animation */
  .image-shimmer {
    background: linear-gradient(
      90deg,
      #f0f0f0 0%,
      #e0e0e0 50%,
      #f0f0f0 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
  }

  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  /* Aspect ratio container */
  .aspect-ratio-container {
    position: relative;
    width: 100%;
    overflow: hidden;
  }

  .aspect-ratio-container img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  lazyLoadImage,
  preloadImages,
  generatePlaceholder,
  generateShimmerPlaceholder,
  generateBlurPlaceholder,
  generateSrcset,
  generateSizes,
  getOptimalDimensions,
  supportsWebP,
  supportsAVIF,
  getBestImageFormat,
  decodeImage,
  getAspectRatioPadding,
  generateAspectRatioStyle,
  getOptimizedImageAttrs,
  imageLoadingStyles,
};
