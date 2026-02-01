'use client';

/**
 * Resource Hints
 * Intelligent resource preloading and prefetching
 * React 19 and Next.js 16 optimized
 */

import { useEffect } from 'react';

export type ResourceType = 'script' | 'style' | 'font' | 'image' | 'fetch';
export type Priority = 'high' | 'low' | 'auto';

export interface ResourceHint {
  href: string;
  type: ResourceType;
  as?: string;
  crossOrigin?: 'anonymous' | 'use-credentials';
  priority?: Priority;
}

/**
 * Add preload link to document head
 */
export function preloadResource(hint: ResourceHint) {
  if (typeof document === 'undefined') {return;}

  const { href, type, as, crossOrigin, priority = 'auto' } = hint;

  // Check if already exists
  const existing = document.querySelector(`link[href="${href}"][rel="preload"]`);
  if (existing) {return;}

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  if (as) {link.as = as;}
  if (crossOrigin) {link.crossOrigin = crossOrigin;}
  if (priority !== 'auto') {link.setAttribute('fetchpriority', priority);}

  document.head.appendChild(link);

  console.debug(`[Preload] ${href} (${type}, ${priority})`);
}

/**
 * Add prefetch link to document head
 */
export function prefetchResource(href: string) {
  if (typeof document === 'undefined') {return;}

  // Check if already exists
  const existing = document.querySelector(`link[href="${href}"][rel="prefetch"]`);
  if (existing) {return;}

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;

  document.head.appendChild(link);

  console.debug(`[Prefetch Resource] ${href}`);
}

/**
 * Add DNS prefetch
 */
export function dnsPrefetch(domain: string) {
  if (typeof document === 'undefined') {return;}

  const existing = document.querySelector(`link[href="${domain}"][rel="dns-prefetch"]`);
  if (existing) {return;}

  const link = document.createElement('link');
  link.rel = 'dns-prefetch';
  link.href = domain;

  document.head.appendChild(link);

  console.debug(`[DNS Prefetch] ${domain}`);
}

/**
 * Add preconnect
 */
export function preconnect(domain: string, crossOrigin?: 'anonymous' | 'use-credentials') {
  if (typeof document === 'undefined') {return;}

  const existing = document.querySelector(`link[href="${domain}"][rel="preconnect"]`);
  if (existing) {return;}

  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = domain;
  if (crossOrigin) {link.crossOrigin = crossOrigin;}

  document.head.appendChild(link);

  console.debug(`[Preconnect] ${domain}`);
}

/**
 * Hook to preload critical resources
 */
export function usePreloadCriticalResources(resources: ResourceHint[]) {
  useEffect(() => {
    resources.forEach((resource) => {
      preloadResource(resource);
    });
  }, [resources]);
}

/**
 * Hook to prefetch resources on idle
 */
export function useIdlePrefetch(resources: string[], delay = 1000) {
  useEffect(() => {
    // Use requestIdleCallback if available
    if ('requestIdleCallback' in window) {
      const handle = requestIdleCallback(
        () => {
          resources.forEach((href) => prefetchResource(href));
        },
        { timeout: delay }
      );

      return () => cancelIdleCallback(handle);
    } else {
      // Fallback to setTimeout
      const timeout = setTimeout(() => {
        resources.forEach((href) => prefetchResource(href));
      }, delay);

      return () => clearTimeout(timeout);
    }
  }, [resources, delay]);
}

/**
 * Hook to setup DNS prefetch for external domains
 */
export function useDNSPrefetch(domains: string[]) {
  useEffect(() => {
    domains.forEach((domain) => {
      dnsPrefetch(domain);
    });
  }, [domains]);
}

/**
 * Hook to setup preconnect for external domains
 */
export function usePreconnect(
  domains: Array<{ domain: string; crossOrigin?: 'anonymous' | 'use-credentials' }>
) {
  useEffect(() => {
    domains.forEach(({ domain, crossOrigin }) => {
      preconnect(domain, crossOrigin);
    });
  }, [domains]);
}

/**
 * Preload critical fonts
 */
export function preloadFonts(fonts: Array<{ href: string; format?: string }>) {
  fonts.forEach(({ href }) => {
    preloadResource({
      href,
      type: 'font',
      as: 'font',
      crossOrigin: 'anonymous',
      priority: 'high',
    });
  });
}

/**
 * Preload critical images
 */
export function preloadImages(images: Array<{ href: string; priority?: Priority }>) {
  images.forEach(({ href, priority = 'high' }) => {
    preloadResource({
      href,
      type: 'image',
      as: 'image',
      priority,
    });
  });
}

/**
 * Prefetch data on hover
 */
export function usePrefetchOnHover(url: string, enabled = true) {
  const handleMouseEnter = () => {
    if (enabled) {
      prefetchResource(url);
    }
  };

  return { onMouseEnter: handleMouseEnter };
}

/**
 * Hook for progressive image loading
 */
export function useProgressiveImage(lowQualityUrl: string, highQualityUrl: string) {
  useEffect(() => {
    // Immediately load low quality
    preloadImages([{ href: lowQualityUrl, priority: 'high' }]);

    // Prefetch high quality on idle
    if ('requestIdleCallback' in window) {
      const handle = requestIdleCallback(() => {
        preloadImages([{ href: highQualityUrl, priority: 'low' }]);
      });

      return () => cancelIdleCallback(handle);
    }
    return undefined;
  }, [lowQualityUrl, highQualityUrl]);
}

/**
 * Smart resource loading based on connection
 */
export function useAdaptiveLoading() {
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;

      const effectiveType = connection.effectiveType;
      const saveData = connection.saveData;

      // Adjust loading strategy based on connection
      if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
        // Disable prefetching on slow connections
        console.info('[Adaptive Loading] Slow connection detected, disabling prefetch');
        return;
      }

      if (effectiveType === '3g') {
        // Limit prefetching on 3g
        console.info('[Adaptive Loading] 3G connection detected, limiting prefetch');
      }
    }
  }, []);
}

export default {
  preloadResource,
  prefetchResource,
  dnsPrefetch,
  preconnect,
  preloadFonts,
  preloadImages,
};
