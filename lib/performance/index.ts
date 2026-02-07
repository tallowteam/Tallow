/**
 * Performance Optimization Utilities
 *
 * Comprehensive performance utilities for lazy loading, prefetching,
 * image optimization, font loading, and monitoring.
 *
 * @module lib/performance
 */

// Lazy Loading
export {
  lazyLoad,
  dynamicImport,
  preloadModule,
  createPreloadableComponent,
  createIntersectionLoader,
  conditionalLoad,
  loadPolyfillIfNeeded,
  namedChunk,
  createResource,
  preloadRoute,
  preloadRoutes,
  type LazyComponentOptions,
  type LazyModuleResult,
} from './lazy-load';

// Prefetching
export {
  getNetworkInfo,
  canPrefetch,
  prefetchUrl,
  prefetchUrls,
  createLinkPrefetcher,
  autoPrefetchLinks,
  addHoverPrefetch,
  prefetchLikelyRoutes,
  prefetchOnIntent,
  dnsPrefetch,
  preconnect,
  addResourceHints,
  prefetchOnIdle,
  type PrefetchOptions,
  type PrefetchLinkOptions,
  type NetworkInfo,
} from './prefetch';

// Image Optimization
export {
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
  type ImageLoadOptions,
  type ResponsiveImageConfig,
  type ImageDimensions,
} from './image-optimization';

// Font Optimization
export {
  preloadFont,
  preloadFonts,
  loadFont,
  loadFonts,
  isFontLoaded,
  waitForFont,
  waitForFontsReady,
  applyFOUTStrategy,
  applyFOITStrategy,
  fontStacks,
  fontMetrics,
  generateFontFaceCSS,
  generateFallbackFontCSS,
  unicodeRanges,
  generateCompleteFontCSS,
  getNextFontConfig,
  type FontConfig,
  type FontSubsetConfig,
  type FontLoadingState,
} from './font-optimization';

// Performance Monitoring
export {
  CORE_WEB_VITALS_THRESHOLDS,
  DEFAULT_PERFORMANCE_BUDGET,
  getMetricRating,
  initCoreWebVitals,
  onMetric,
  markStart,
  markEnd,
  measure,
  timed,
  getResourceTimings,
  getResourceSizeByType,
  getSlowestResources,
  getLargestResources,
  getNavigationTiming,
  checkBudget,
  generateReport,
  sendReport,
  observeLongTasks,
  observeLayoutShifts,
  logPerformanceSummary,
  type PerformanceMetric,
  type PerformanceBudget,
  type PerformanceReport,
  type PerformanceMark,
  type PerformanceMeasure,
  type ResourceTiming,
  type NavigationTiming,
  type BudgetViolation,
  type MetricHandler,
} from './monitoring';

// Error Boundary
export {
  ErrorBoundary,
  withErrorBoundary,
  type ErrorBoundaryProps,
  type ErrorBoundaryState,
  type ErrorContext,
  type MemoryInfo,
} from './error-boundary';

// Performance Budget
export {
  CORE_WEB_VITALS_BUDGET,
  BUNDLE_SIZE_BUDGET,
  RESOURCE_COUNT_BUDGET,
  PAGE_BUDGETS,
  checkBudgetValue,
  checkWebVitalsBudget,
  checkBundleBudget,
  formatBudgetResult,
  generateBudgetReport,
  checkBudgetCI,
  type BudgetStatus,
  type BudgetResult,
} from './budget';

// Bundle Analysis
export {
  analyzeBundleSize,
  checkBudget as checkBundleBudgets,
  getOptimizationSuggestions,
  formatBytes,
  logBundleReport,
  BUNDLE_BUDGETS,
  STRICT_BUNDLE_BUDGETS,
  RELAXED_BUNDLE_BUDGETS,
  type BundleReport,
  type RouteSize,
  type ModuleSize,
  type BundleBudgets,
  type BudgetViolation as BundleBudgetViolation,
} from './bundle-analyzer';

// Lighthouse & Core Web Vitals
export {
  checkVitals,
  logPerformanceReport,
  startMonitoring as startLighthouseMonitoring,
  LIGHTHOUSE_TARGETS,
  STRICT_LIGHTHOUSE_TARGETS,
  RELAXED_LIGHTHOUSE_TARGETS,
  type PerformanceReport as LighthouseReport,
  type CoreWebVitalsMetrics,
  type PerformanceIssue,
  type PerformanceOpportunity,
  type LighthouseTargets,
} from './lighthouse-config';

// Resource Optimization
export {
  optimizeImages,
  optimizeImage,
  deferNonCriticalCSS,
  inlineCriticalCSS,
  extractCriticalCSS,
  removeUnusedCSS,
  preloadCriticalAssets,
  preconnect as preconnectOrigins,
  prefetchResources,
  deferScript,
  loadScript,
  splitVendorChunks,
  optimizeFonts,
  hasServiceWorker,
  registerServiceWorker,
  optimizeAllResources,
  type ImageOptimizationOptions,
  type CriticalAsset,
  type VendorChunkConfig,
} from './resource-optimizer';

// Battery Awareness
export {
  getBatteryStatus,
  onBatteryChange,
  shouldReduceActivity,
  getPowerMode,
  detectCPUThrottle,
  isDeviceThrottled,
  enableAdaptivePerformance,
  applyPowerMode,
  getNetworkSettings,
  shouldDeferExpensiveOps,
  startPowerMonitoring,
  logPowerStatus,
  type BatteryStatus,
  type PowerMode,
  type PowerSettings,
  type CPUThrottle,
} from './battery-awareness';

// Memory Monitoring
export {
  getMemoryUsage,
  isMemoryPressured,
  getMemoryPressure,
  setMemoryLimit,
  clearMemoryLimit,
  getMemoryLimit,
  registerCache,
  registerBuffer,
  registerWebRTCConnection,
  performMemoryCleanup,
  autoCleanup,
  detectMemoryLeak,
  getMemoryTrend,
  startMemoryMonitoring,
  stopMemoryMonitoring,
  getMemoryStats,
  logMemoryStatus,
  withMemoryGuard,
  type MemoryUsage,
  type MemoryPressure,
  type MemoryCleanupOptions,
  type MemoryStats,
} from './memory-monitor';
