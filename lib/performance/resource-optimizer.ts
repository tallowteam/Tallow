/**
 * Resource Optimization Utilities
 *
 * Tools for optimizing images, CSS, JavaScript, and critical assets
 * to improve page load performance and Core Web Vitals.
 *
 * @module lib/performance/resource-optimizer
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ImageOptimizationOptions {
  /** Enable lazy loading */
  lazyLoad?: boolean;
  /** Add width/height to prevent CLS */
  addDimensions?: boolean;
  /** Decode images asynchronously */
  asyncDecode?: boolean;
  /** Priority hint (high, low, auto) */
  fetchPriority?: 'high' | 'low' | 'auto';
}

export interface CriticalAsset {
  href: string;
  as: 'script' | 'style' | 'font' | 'image';
  type?: string;
  crossOrigin?: 'anonymous' | 'use-credentials';
}

export interface VendorChunkConfig {
  vendors: {
    name: string;
    test: RegExp;
    priority: number;
  }[];
  splitChunks?: boolean;
  minSize?: number;
  maxSize?: number;
}

// ============================================================================
// IMAGE OPTIMIZATION
// ============================================================================

/**
 * Optimize all images on the page for performance
 *
 * Adds lazy loading, dimensions, and async decoding to prevent CLS
 *
 * @example
 * optimizeImages({ lazyLoad: true, addDimensions: true });
 */
export function optimizeImages(
  options: ImageOptimizationOptions = {}
): void {
  if (typeof document === 'undefined') return;

  const {
    lazyLoad = true,
    addDimensions = true,
    asyncDecode = true,
    fetchPriority = 'auto',
  } = options;

  const images = document.querySelectorAll('img');

  images.forEach((img, index) => {
    // Skip if already optimized
    if (img.dataset.optimized === 'true') return;

    // Lazy load images below the fold
    if (lazyLoad && index > 2) {
      img.loading = 'lazy';
    }

    // Add dimensions to prevent layout shift
    if (addDimensions && !img.width && !img.height) {
      // Try to get natural dimensions
      if (img.naturalWidth && img.naturalHeight) {
        img.width = img.naturalWidth;
        img.height = img.naturalHeight;
      } else {
        // Set placeholder dimensions
        img.style.aspectRatio = '16/9';
      }
    }

    // Async decode for smoother rendering
    if (asyncDecode) {
      img.decoding = 'async';
    }

    // Set fetch priority
    if (index === 0 && fetchPriority === 'high') {
      // First image (often LCP) gets high priority
      img.fetchPriority = 'high';
    } else if (index > 5 && fetchPriority === 'auto') {
      // Images far down get low priority
      img.fetchPriority = 'low';
    }

    img.dataset.optimized = 'true';
  });
}

/**
 * Optimize specific image element
 */
export function optimizeImage(
  img: HTMLImageElement,
  options: ImageOptimizationOptions = {}
): void {
  const { lazyLoad = false, addDimensions = true, asyncDecode = true } = options;

  if (lazyLoad) {
    img.loading = 'lazy';
  }

  if (addDimensions && !img.width && !img.height) {
    if (img.naturalWidth && img.naturalHeight) {
      img.width = img.naturalWidth;
      img.height = img.naturalHeight;
    }
  }

  if (asyncDecode) {
    img.decoding = 'async';
  }
}

// ============================================================================
// CSS OPTIMIZATION
// ============================================================================

/**
 * Defer non-critical CSS loading
 *
 * Loads CSS asynchronously to avoid render blocking
 *
 * @example
 * deferNonCriticalCSS('/styles/non-critical.css');
 */
export function deferNonCriticalCSS(stylesheet: string): void {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = stylesheet;
  link.media = 'print'; // Load as print initially
  link.onload = () => {
    link.media = 'all'; // Switch to all media after load
  };

  document.head.appendChild(link);
}

/**
 * Inline critical CSS
 *
 * Extracts and inlines CSS needed for above-the-fold content
 *
 * @example
 * inlineCriticalCSS('.hero, .nav { ... }');
 */
export function inlineCriticalCSS(css: string): void {
  if (typeof document === 'undefined') return;

  const style = document.createElement('style');
  style.textContent = css;
  style.dataset.critical = 'true';

  // Insert at the beginning of <head>
  const firstLink = document.head.querySelector('link[rel="stylesheet"]');
  if (firstLink) {
    document.head.insertBefore(style, firstLink);
  } else {
    document.head.appendChild(style);
  }
}

/**
 * Remove unused CSS rules (simple detection)
 *
 * Note: This is a basic implementation. For production,
 * use PurgeCSS or similar tools during build.
 */
export function removeUnusedCSS(
  stylesheet: CSSStyleSheet
): void {
  if (typeof document === 'undefined') return;

  try {
    const rules = Array.from(stylesheet.cssRules || []);

    rules.forEach((rule, index) => {
      if (rule instanceof CSSStyleRule) {
        const selector = rule.selectorText;

        // Check if selector matches any element
        try {
          const elements = document.querySelectorAll(selector);
          if (elements.length === 0) {
            // No elements match, remove rule
            stylesheet.deleteRule(index);
          }
        } catch {
          // Invalid selector, skip
        }
      }
    });
  } catch (error) {
    console.warn('Could not remove unused CSS:', error);
  }
}

/**
 * Extract critical CSS selectors for above-the-fold content
 */
export function extractCriticalCSS(
  maxHeight = 1200
): string {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return '';
  }

  const criticalSelectors = new Set<string>();

  // Find all elements above the fold
  const elements = document.querySelectorAll('*');
  elements.forEach((element) => {
    const rect = element.getBoundingClientRect();
    if (rect.top < maxHeight) {
      // Get all classes
      element.classList.forEach((className) => {
        criticalSelectors.add(`.${className}`);
      });

      // Get ID
      if (element.id) {
        criticalSelectors.add(`#${element.id}`);
      }
    }
  });

  // Extract matching CSS rules
  const criticalCSS: string[] = [];
  const styleSheets = Array.from(document.styleSheets);

  styleSheets.forEach((sheet) => {
    try {
      const rules = Array.from(sheet.cssRules || []);
      rules.forEach((rule) => {
        if (rule instanceof CSSStyleRule) {
          const selector = rule.selectorText;
          // Check if selector is critical
          if (
            Array.from(criticalSelectors).some((critical) =>
              selector.includes(critical)
            )
          ) {
            criticalCSS.push(rule.cssText);
          }
        }
      });
    } catch {
      // Cross-origin stylesheet, skip
    }
  });

  return criticalCSS.join('\n');
}

// ============================================================================
// CRITICAL ASSET PRELOADING
// ============================================================================

/**
 * Preload critical assets
 *
 * Adds <link rel="preload"> for key resources to improve load time
 *
 * @example
 * preloadCriticalAssets([
 *   { href: '/fonts/inter.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
 *   { href: '/hero.jpg', as: 'image' }
 * ]);
 */
export function preloadCriticalAssets(
  assets: CriticalAsset[]
): void {
  if (typeof document === 'undefined') return;

  assets.forEach((asset) => {
    // Check if already preloaded
    const existing = document.head.querySelector(
      `link[rel="preload"][href="${asset.href}"]`
    );
    if (existing) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = asset.href;
    link.as = asset.as;

    if (asset.type) {
      link.type = asset.type;
    }

    if (asset.crossOrigin) {
      link.crossOrigin = asset.crossOrigin;
    }

    document.head.appendChild(link);
  });
}

/**
 * Preconnect to external origins
 *
 * Establishes early connections to improve third-party resource load time
 *
 * @example
 * preconnect(['https://fonts.googleapis.com', 'https://cdn.example.com']);
 */
export function preconnect(origins: string[]): void {
  if (typeof document === 'undefined') return;

  origins.forEach((origin) => {
    const existing = document.head.querySelector(
      `link[rel="preconnect"][href="${origin}"]`
    );
    if (existing) return;

    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    link.crossOrigin = 'anonymous';

    document.head.appendChild(link);

    // Also add dns-prefetch as fallback
    const dnsPrefetch = document.createElement('link');
    dnsPrefetch.rel = 'dns-prefetch';
    dnsPrefetch.href = origin;
    document.head.appendChild(dnsPrefetch);
  });
}

/**
 * Prefetch next-page resources
 *
 * Loads resources for likely next navigation
 *
 * @example
 * prefetchResources(['/next-page', '/api/data']);
 */
export function prefetchResources(urls: string[]): void {
  if (typeof document === 'undefined') return;

  urls.forEach((url) => {
    const existing = document.head.querySelector(
      `link[rel="prefetch"][href="${url}"]`
    );
    if (existing) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;

    document.head.appendChild(link);
  });
}

// ============================================================================
// SCRIPT OPTIMIZATION
// ============================================================================

/**
 * Defer non-critical scripts
 *
 * Loads JavaScript after page interactive
 *
 * @example
 * deferScript('/analytics.js');
 */
export function deferScript(src: string, async = false): void {
  if (typeof document === 'undefined') return;

  const script = document.createElement('script');
  script.src = src;

  if (async) {
    script.async = true;
  } else {
    script.defer = true;
  }

  document.body.appendChild(script);
}

/**
 * Load script with callback
 */
export function loadScript(
  src: string,
  callback?: () => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Document not available'));
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;

    script.onload = () => {
      callback?.();
      resolve();
    };

    script.onerror = () => {
      reject(new Error(`Failed to load script: ${src}`));
    };

    document.body.appendChild(script);
  });
}

// ============================================================================
// VENDOR CHUNK SPLITTING
// ============================================================================

/**
 * Get vendor chunk splitting configuration for Next.js
 *
 * @example
 * // In next.config.ts webpack config:
 * config.optimization.splitChunks = splitVendorChunks();
 */
export function splitVendorChunks(
  customConfig?: Partial<VendorChunkConfig>
): object {
  const defaultConfig: VendorChunkConfig = {
    vendors: [
      {
        name: 'crypto',
        test: /[\\/]node_modules[\\/](@noble|pqc-kyber|hash-wasm|tweetnacl)[\\/]/,
        priority: 30,
      },
      {
        name: 'react',
        test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
        priority: 25,
      },
      {
        name: 'ui',
        test: /[\\/]node_modules[\\/](@radix-ui|@headlessui)[\\/]/,
        priority: 20,
      },
      {
        name: 'utils',
        test: /[\\/]node_modules[\\/](date-fns|lodash|zod)[\\/]/,
        priority: 15,
      },
      {
        name: 'vendors',
        test: /[\\/]node_modules[\\/]/,
        priority: 10,
      },
    ],
    splitChunks: true,
    minSize: 20000,
    maxSize: 244000,
  };

  const config = { ...defaultConfig, ...customConfig };

  const cacheGroups: Record<string, unknown> = {};

  config.vendors.forEach((vendor) => {
    cacheGroups[vendor.name] = {
      test: vendor.test,
      name: vendor.name,
      chunks: 'all',
      priority: vendor.priority,
    };
  });

  // Common shared code
  cacheGroups.common = {
    minChunks: 2,
    priority: 5,
    reuseExistingChunk: true,
  };

  return {
    chunks: 'all',
    minSize: config.minSize,
    maxSize: config.maxSize,
    cacheGroups,
  };
}

// ============================================================================
// FONT OPTIMIZATION
// ============================================================================

/**
 * Optimize font loading
 *
 * Adds font-display and preload for better performance
 */
export function optimizeFonts(): void {
  if (typeof document === 'undefined') return;

  // Find all font face declarations
  const styleSheets = Array.from(document.styleSheets);

  styleSheets.forEach((sheet) => {
    try {
      const rules = Array.from(sheet.cssRules || []);
      rules.forEach((rule) => {
        if (rule instanceof CSSFontFaceRule) {
          // Extract font URL
          const src = rule.style.getPropertyValue('src');
          const urlMatch = src.match(/url\(['"]?([^'"]+)['"]?\)/);

          if (urlMatch) {
            const fontUrl = urlMatch[1];

            // Preload font
            preloadCriticalAssets([
              {
                href: fontUrl,
                as: 'font',
                type: 'font/woff2',
                crossOrigin: 'anonymous',
              },
            ]);
          }
        }
      });
    } catch {
      // Cross-origin stylesheet
    }
  });
}

// ============================================================================
// SERVICE WORKER INTEGRATION
// ============================================================================

/**
 * Check if service worker is supported and registered
 */
export function hasServiceWorker(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator
  );
}

/**
 * Register service worker for caching
 */
export async function registerServiceWorker(
  scriptUrl: string
): Promise<ServiceWorkerRegistration | null> {
  if (!hasServiceWorker()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(scriptUrl);
    console.log('[Resource Optimizer] Service worker registered');
    return registration;
  } catch (error) {
    console.error('[Resource Optimizer] Service worker registration failed:', error);
    return null;
  }
}

// ============================================================================
// COMPREHENSIVE OPTIMIZATION
// ============================================================================

/**
 * Apply all optimizations at once
 *
 * @example
 * optimizeAllResources({
 *   images: true,
 *   fonts: true,
 *   criticalCSS: true,
 *   preconnect: ['https://fonts.googleapis.com']
 * });
 */
export function optimizeAllResources(options: {
  images?: boolean;
  fonts?: boolean;
  criticalCSS?: boolean;
  preconnect?: string[];
  prefetch?: string[];
  serviceWorker?: string;
}): void {
  if (typeof window === 'undefined') return;

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () =>
      optimizeAllResources(options)
    );
    return;
  }

  const {
    images = true,
    fonts = true,
    criticalCSS = false,
    preconnect: preconnectUrls = [],
    prefetch: prefetchUrls = [],
    serviceWorker,
  } = options;

  // Optimize images
  if (images) {
    optimizeImages();
  }

  // Optimize fonts
  if (fonts) {
    optimizeFonts();
  }

  // Extract and inline critical CSS
  if (criticalCSS) {
    const critical = extractCriticalCSS();
    if (critical) {
      inlineCriticalCSS(critical);
    }
  }

  // Preconnect to external origins
  if (preconnectUrls.length > 0) {
    preconnect(preconnectUrls);
  }

  // Prefetch next-page resources
  if (prefetchUrls.length > 0) {
    prefetchResources(prefetchUrls);
  }

  // Register service worker
  if (serviceWorker) {
    registerServiceWorker(serviceWorker);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  optimizeImages,
  optimizeImage,
  deferNonCriticalCSS,
  inlineCriticalCSS,
  extractCriticalCSS,
  removeUnusedCSS,
  preloadCriticalAssets,
  preconnect,
  prefetchResources,
  deferScript,
  loadScript,
  splitVendorChunks,
  optimizeFonts,
  hasServiceWorker,
  registerServiceWorker,
  optimizeAllResources,
};
