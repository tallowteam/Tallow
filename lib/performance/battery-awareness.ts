/**
 * Battery Awareness and Power Management
 *
 * Adapts application behavior based on device battery status
 * and CPU capabilities to optimize power consumption.
 *
 * @module lib/performance/battery-awareness
 */

// ============================================================================
// TYPES
// ============================================================================

export interface BatteryStatus {
  /** Whether device is charging */
  charging: boolean;
  /** Battery level (0-1) */
  level: number;
  /** Time until fully charged (seconds, or Infinity) */
  chargingTime: number;
  /** Time until battery depleted (seconds, or Infinity) */
  dischargingTime: number;
  /** Battery manager available */
  supported: boolean;
}

export interface PowerMode {
  mode: 'high-performance' | 'balanced' | 'power-saver' | 'critical';
  settings: PowerSettings;
}

export interface PowerSettings {
  /** Disable animations */
  disableAnimations: boolean;
  /** Reduce polling frequency (ms) */
  pollingInterval: number;
  /** Use aggressive compression */
  aggressiveCompression: boolean;
  /** Reduce image quality */
  reduceImageQuality: boolean;
  /** Disable video autoplay */
  disableAutoplay: boolean;
  /** Reduce WebRTC quality */
  reduceWebRTCQuality: boolean;
  /** Limit concurrent connections */
  maxConnections: number;
}

export interface CPUThrottle {
  /** Throttle detected */
  throttled: boolean;
  /** Performance score (0-1) */
  performanceScore: number;
  /** Estimated CPU cores */
  cores: number;
  /** Memory available (MB) */
  memory: number;
}

// ============================================================================
// BATTERY API
// ============================================================================

let batteryManager: BatteryManager | null = null;
let batteryListeners: Array<(status: BatteryStatus) => void> = [];

/**
 * Get battery status using Battery API
 *
 * @example
 * const battery = await getBatteryStatus();
 * if (battery && battery.level < 0.2) {
 *   // Enable power saving mode
 * }
 */
export async function getBatteryStatus(): Promise<BatteryStatus | null> {
  if (typeof navigator === 'undefined' || !('getBattery' in navigator)) {
    return {
      charging: true,
      level: 1,
      chargingTime: Infinity,
      dischargingTime: Infinity,
      supported: false,
    };
  }

  try {
    // Get battery manager (cache it)
    if (!batteryManager) {
      batteryManager = await (navigator as Navigator & {
        getBattery: () => Promise<BatteryManager>;
      }).getBattery();

      // Set up event listeners
      batteryManager.addEventListener('chargingchange', notifyListeners);
      batteryManager.addEventListener('levelchange', notifyListeners);
      batteryManager.addEventListener('chargingtimechange', notifyListeners);
      batteryManager.addEventListener('dischargingtimechange', notifyListeners);
    }

    return {
      charging: batteryManager.charging,
      level: batteryManager.level,
      chargingTime: batteryManager.chargingTime,
      dischargingTime: batteryManager.dischargingTime,
      supported: true,
    };
  } catch (error) {
    console.warn('[Battery] Failed to get battery status:', error);
    return null;
  }
}

/**
 * Battery manager type definition
 */
interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
}

/**
 * Notify all battery status listeners
 */
function notifyListeners(): void {
  getBatteryStatus().then((status) => {
    if (status) {
      batteryListeners.forEach((listener) => listener(status));
    }
  });
}

/**
 * Listen for battery status changes
 *
 * @example
 * const cleanup = onBatteryChange((status) => {
 *   console.log(`Battery: ${(status.level * 100).toFixed(0)}%`);
 * });
 */
export function onBatteryChange(
  callback: (status: BatteryStatus) => void
): () => void {
  batteryListeners.push(callback);

  // Send initial status
  getBatteryStatus().then((status) => {
    if (status) callback(status);
  });

  return () => {
    batteryListeners = batteryListeners.filter((l) => l !== callback);
  };
}

// ============================================================================
// POWER MODE DETECTION
// ============================================================================

/**
 * Determine if device should reduce activity based on battery
 *
 * @example
 * if (shouldReduceActivity(0.15)) {
 *   // Battery is low, reduce animations
 * }
 */
export function shouldReduceActivity(batteryLevel: number): boolean {
  // Reduce activity if battery is below 20%
  return batteryLevel < 0.2;
}

/**
 * Get recommended power mode based on battery status
 */
export async function getPowerMode(): Promise<PowerMode> {
  const battery = await getBatteryStatus();

  if (!battery || !battery.supported) {
    return {
      mode: 'balanced',
      settings: getBalancedSettings(),
    };
  }

  // Critical: < 10% and not charging
  if (battery.level < 0.1 && !battery.charging) {
    return {
      mode: 'critical',
      settings: getCriticalSettings(),
    };
  }

  // Power saver: < 20% and not charging
  if (battery.level < 0.2 && !battery.charging) {
    return {
      mode: 'power-saver',
      settings: getPowerSaverSettings(),
    };
  }

  // High performance: > 50% or charging
  if (battery.level > 0.5 || battery.charging) {
    return {
      mode: 'high-performance',
      settings: getHighPerformanceSettings(),
    };
  }

  // Balanced: default
  return {
    mode: 'balanced',
    settings: getBalancedSettings(),
  };
}

/**
 * High performance settings
 */
function getHighPerformanceSettings(): PowerSettings {
  return {
    disableAnimations: false,
    pollingInterval: 1000,
    aggressiveCompression: false,
    reduceImageQuality: false,
    disableAutoplay: false,
    reduceWebRTCQuality: false,
    maxConnections: 10,
  };
}

/**
 * Balanced settings
 */
function getBalancedSettings(): PowerSettings {
  return {
    disableAnimations: false,
    pollingInterval: 3000,
    aggressiveCompression: false,
    reduceImageQuality: false,
    disableAutoplay: false,
    reduceWebRTCQuality: false,
    maxConnections: 6,
  };
}

/**
 * Power saver settings
 */
function getPowerSaverSettings(): PowerSettings {
  return {
    disableAnimations: true,
    pollingInterval: 10000,
    aggressiveCompression: true,
    reduceImageQuality: true,
    disableAutoplay: true,
    reduceWebRTCQuality: true,
    maxConnections: 3,
  };
}

/**
 * Critical power settings (maximum conservation)
 */
function getCriticalSettings(): PowerSettings {
  return {
    disableAnimations: true,
    pollingInterval: 30000,
    aggressiveCompression: true,
    reduceImageQuality: true,
    disableAutoplay: true,
    reduceWebRTCQuality: true,
    maxConnections: 1,
  };
}

// ============================================================================
// CPU THROTTLE DETECTION
// ============================================================================

/**
 * Detect CPU throttling using performance timing analysis
 *
 * Runs a CPU-intensive benchmark and compares against baseline
 * to detect throttling or slow devices.
 *
 * @example
 * const throttle = await detectCPUThrottle();
 * if (throttle.throttled) {
 *   // Device is throttled, reduce complexity
 * }
 */
export async function detectCPUThrottle(): Promise<CPUThrottle> {
  const cores = typeof navigator !== 'undefined'
    ? navigator.hardwareConcurrency || 4
    : 4;

  const memory = typeof performance !== 'undefined' && 'memory' in performance
    ? (performance as Performance & { memory?: { jsHeapSizeLimit: number } }).memory?.jsHeapSizeLimit || 0
    : 0;

  // Run CPU benchmark
  const score = await runCPUBenchmark();

  // Score < 0.5 indicates throttling or slow device
  const throttled = score < 0.5;

  return {
    throttled,
    performanceScore: score,
    cores,
    memory: Math.round(memory / (1024 * 1024)), // Convert to MB
  };
}

/**
 * Run simple CPU benchmark
 *
 * Returns performance score (0-1)
 */
async function runCPUBenchmark(): Promise<number> {
  if (typeof performance === 'undefined') {
    return 1.0; // Assume good performance on server
  }

  const start = performance.now();

  // CPU-intensive task: calculate primes
  let primes = 0;
  for (let i = 2; i < 10000; i++) {
    let isPrime = true;
    for (let j = 2; j <= Math.sqrt(i); j++) {
      if (i % j === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) primes++;
  }

  const duration = performance.now() - start;

  // Expected duration on fast device: ~20ms
  // Expected duration on slow device: ~100ms+
  const expectedDuration = 20;
  const score = Math.min(1, expectedDuration / duration);

  return score;
}

/**
 * Check if device is throttled (simplified check)
 */
export async function isDeviceThrottled(): Promise<boolean> {
  const throttle = await detectCPUThrottle();
  return throttle.throttled;
}

// ============================================================================
// ADAPTIVE BEHAVIOR
// ============================================================================

let currentPowerMode: PowerMode | null = null;

/**
 * Enable adaptive performance based on battery and CPU
 *
 * Automatically adjusts app behavior based on device capabilities
 *
 * @example
 * const cleanup = enableAdaptivePerformance((mode) => {
 *   if (mode.settings.disableAnimations) {
 *     document.body.classList.add('reduce-motion');
 *   }
 * });
 */
export function enableAdaptivePerformance(
  callback: (mode: PowerMode) => void
): () => void {
  // Initial check
  updatePowerMode(callback);

  // Listen for battery changes
  const cleanup = onBatteryChange(() => {
    updatePowerMode(callback);
  });

  // Periodic checks (every 60 seconds)
  const interval = setInterval(() => {
    updatePowerMode(callback);
  }, 60000);

  return () => {
    cleanup();
    clearInterval(interval);
  };
}

/**
 * Update power mode and notify callback
 */
async function updatePowerMode(
  callback: (mode: PowerMode) => void
): Promise<void> {
  const mode = await getPowerMode();

  // Only notify if mode changed
  if (!currentPowerMode || currentPowerMode.mode !== mode.mode) {
    currentPowerMode = mode;
    callback(mode);
  }
}

/**
 * Apply power mode settings to application
 */
export function applyPowerMode(mode: PowerMode): void {
  if (typeof document === 'undefined') return;

  const { settings } = mode;

  // Disable animations
  if (settings.disableAnimations) {
    document.body.classList.add('reduce-motion');
  } else {
    document.body.classList.remove('reduce-motion');
  }

  // Disable video autoplay
  if (settings.disableAutoplay) {
    const videos = document.querySelectorAll('video[autoplay]');
    videos.forEach((video) => {
      (video as HTMLVideoElement).autoplay = false;
      (video as HTMLVideoElement).pause();
    });
  }

  // Apply other settings via data attributes for CSS
  document.documentElement.dataset.powerMode = mode.mode;
}

// ============================================================================
// NETWORK OPTIMIZATION
// ============================================================================

/**
 * Get optimal network settings based on power mode
 */
export function getNetworkSettings(mode: PowerMode): {
  timeout: number;
  retries: number;
  batchSize: number;
  compressionLevel: number;
} {
  const { settings } = mode;

  return {
    timeout: settings.pollingInterval,
    retries: settings.maxConnections > 3 ? 3 : 1,
    batchSize: settings.maxConnections * 5,
    compressionLevel: settings.aggressiveCompression ? 9 : 6,
  };
}

/**
 * Check if expensive operations should be deferred
 */
export async function shouldDeferExpensiveOps(): Promise<boolean> {
  const battery = await getBatteryStatus();

  if (!battery) return false;

  // Defer if battery is low and not charging
  return battery.level < 0.15 && !battery.charging;
}

// ============================================================================
// MONITORING
// ============================================================================

/**
 * Start monitoring battery and performance
 */
export function startPowerMonitoring(
  onUpdate: (data: {
    battery: BatteryStatus | null;
    cpu: CPUThrottle;
    mode: PowerMode;
  }) => void
): () => void {
  let active = true;

  const monitor = async () => {
    if (!active) return;

    const [battery, cpu, mode] = await Promise.all([
      getBatteryStatus(),
      detectCPUThrottle(),
      getPowerMode(),
    ]);

    onUpdate({ battery, cpu, mode });

    // Check again in 30 seconds
    setTimeout(monitor, 30000);
  };

  // Start monitoring
  monitor();

  return () => {
    active = false;
  };
}

/**
 * Log power status to console
 */
export async function logPowerStatus(): Promise<void> {
  const battery = await getBatteryStatus();
  const cpu = await detectCPUThrottle();
  const mode = await getPowerMode();

  console.group('[Power Status]');

  if (battery && battery.supported) {
    console.log('Battery:');
    console.table({
      'Level': `${(battery.level * 100).toFixed(0)}%`,
      'Charging': battery.charging ? 'Yes' : 'No',
      'Time Remaining': battery.dischargingTime !== Infinity
        ? `${Math.round(battery.dischargingTime / 60)} min`
        : 'N/A',
    });
  } else {
    console.log('Battery: Not supported');
  }

  console.log('CPU:');
  console.table({
    'Throttled': cpu.throttled ? 'Yes' : 'No',
    'Performance Score': (cpu.performanceScore * 100).toFixed(0) + '%',
    'Cores': cpu.cores,
    'Memory': `${cpu.memory} MB`,
  });

  console.log(`Power Mode: ${mode.mode.toUpperCase()}`);
  console.table(mode.settings);

  console.groupEnd();
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
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
};
